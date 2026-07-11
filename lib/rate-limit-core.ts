import { Redis } from "@upstash/redis"

import { RATE_LIMITS } from "@/app/consts/RATE_LIMIT"
import { TRateLimiterName } from "@/classes/RateLimit/types/TRateLimiterName"
import { memoryFixedWindowGetRemaining, memoryFixedWindowLimit } from "@/lib/resilient-store"

type RateLimiterSpec = {
  maxAllowed: number
  windowSec: number
}

type RateLimitSuccessResult = {
  remaining: number
  reset: number
  resetIn: string
  resetTime: string
  success: true
}

type RateLimitErrorResult = {
  error: string
  retryAfter?: number
  status: 400 | 429
  success: false
}

export type TRateLimitExecutionResult = RateLimitSuccessResult | RateLimitErrorResult

const limiterCache = new Map<TRateLimiterName, RateLimiterSpec>()
const redis = Redis.fromEnv()

function isRateLimiterName(value: string): value is TRateLimiterName {
  return value in RATE_LIMITS
}

function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  return req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1"
}

function formatReset(reset: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(reset))

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`
}

function formatResetIn(reset: number) {
  const diffMs = Math.max(0, reset - Date.now())
  const seconds = Math.ceil(diffMs / 1000)

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`
  }

  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  const hours = Math.ceil(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }

  const days = Math.ceil(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}

function getRateLimiter(limiterName: TRateLimiterName) {
  const cachedLimiter = limiterCache.get(limiterName)
  if (cachedLimiter) {
    return cachedLimiter
  }

  const spec = RATE_LIMITS[limiterName]
  const limiter = {
    maxAllowed: spec.maxAllowed,
    windowSec: spec.windowSec,
  }

  limiterCache.set(limiterName, limiter)
  return limiter
}

function getRateLimitKey(payload: API.RateLimitRequest) {
  return RATE_LIMITS[payload.limiterName as TRateLimiterName].key({
    userId: payload.userId ?? undefined,
  })
}

function getFixedWindowRedisKey({
  fullKey,
  limiterName,
  windowSec,
}: {
  fullKey: string
  limiterName: TRateLimiterName
  windowSec: number
}) {
  const windowMs = windowSec * 1000
  const bucket = Math.floor(Date.now() / windowMs)
  const reset = (bucket + 1) * windowMs

  return {
    key: `rateLimit:${limiterName}:${fullKey}:${bucket}`,
    reset,
    windowMs,
  }
}

async function safeGetRemaining({
  fullKey,
  limiterName,
  spec,
}: {
  fullKey: string
  limiterName: TRateLimiterName
  spec: RateLimiterSpec
}) {
  const bucket = getFixedWindowRedisKey({
    fullKey,
    limiterName,
    windowSec: spec.windowSec,
  })

  try {
    const currentCount = Number((await redis.get<number | string>(bucket.key)) ?? 0)

    return {
      remaining: Math.max(0, spec.maxAllowed - currentCount),
      reset: bucket.reset,
    }
  } catch (error) {
    console.error("[RATE_LIMIT_GET_REMAINING_FALLBACK]", error)
    return memoryFixedWindowGetRemaining({
      key: `fallback:apiRateLimit:${limiterName}:${fullKey}`,
      limit: spec.maxAllowed,
      windowMs: bucket.windowMs,
    })
  }
}

async function safeRateLimit({
  fullKey,
  limiterName,
  spec,
}: {
  fullKey: string
  limiterName: TRateLimiterName
  spec: RateLimiterSpec
}) {
  const bucket = getFixedWindowRedisKey({
    fullKey,
    limiterName,
    windowSec: spec.windowSec,
  })

  try {
    const currentCount = await redis.incr(bucket.key)

    if (currentCount === 1) {
      await redis.expire(bucket.key, spec.windowSec)
    }

    return {
      remaining: Math.max(0, spec.maxAllowed - currentCount),
      reset: bucket.reset,
      success: currentCount <= spec.maxAllowed,
    }
  } catch (error) {
    console.error("[RATE_LIMIT_LIMIT_FALLBACK]", error)
    return memoryFixedWindowLimit({
      key: `fallback:apiRateLimit:${limiterName}:${fullKey}`,
      limit: spec.maxAllowed,
      windowMs: bucket.windowMs,
    })
  }
}

export async function executeRateLimitRequest(req: Request, payload: API.RateLimitRequest): Promise<TRateLimitExecutionResult> {
  const { limiterName, action, userTimezone } = payload

  if (!limiterName || !userTimezone) {
    return {
      error: `Something is missing \n limiterName: ${limiterName} \n userTimezone: ${userTimezone}`,
      status: 400,
      success: false,
    }
  }

  if (!isRateLimiterName(limiterName)) {
    return {
      error: `Unknown limiterName: ${limiterName}`,
      status: 400,
      success: false,
    }
  }

  if (action !== "getRemaining" && action !== "rateLimit") {
    return {
      error: "action not recognized - use either rateLimit or getRemaining",
      status: 400,
      success: false,
    }
  }

  if (!isValidTimeZone(userTimezone)) {
    return {
      error: `Invalid userTimezone: ${userTimezone}`,
      status: 400,
      success: false,
    }
  }

  let limiterKey: string
  try {
    limiterKey = getRateLimitKey(payload)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to build rate limit key",
      status: 400,
      success: false,
    }
  }

  const spec = getRateLimiter(limiterName)
  const fullKey = `${getRequestIp(req)}-${limiterKey}`

  if (action === "getRemaining") {
    const { remaining, reset } = await safeGetRemaining({
      fullKey,
      limiterName,
      spec,
    })

    return {
      remaining,
      reset,
      resetIn: formatResetIn(reset),
      resetTime: formatReset(reset, userTimezone),
      success: true,
    }
  }

  const result = await safeRateLimit({
    fullKey,
    limiterName,
    spec,
  })

  if (!result.success) {
    const retryAfter = Math.max(1, Math.floor((result.reset - Date.now()) / 1000))

    return {
      error: `Please try again in ${retryAfter} seconds`,
      retryAfter,
      status: 429,
      success: false,
    }
  }

  return {
    remaining: result.remaining,
    reset: result.reset,
    resetIn: formatResetIn(result.reset),
    resetTime: formatReset(result.reset, userTimezone),
    success: true,
  }
}
