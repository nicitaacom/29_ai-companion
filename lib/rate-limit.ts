import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { memorySlidingWindowLimit } from "@/lib/resilient-store"

const redis = Redis.fromEnv()

const chatBurstRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:chat:burst",
})

const chatAuthenticatedUsageRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 h"),
  analytics: true,
  prefix: "ratelimit:chat:usage:authenticated",
})

const chatGuestUsageRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "1 h"),
  analytics: true,
  prefix: "ratelimit:chat:usage:guest",
})

const turnstileVerificationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 m"),
  analytics: true,
  prefix: "ratelimit:turnstile:verify",
})

async function safeLimit({
  fallbackKey,
  fallbackLimit,
  fallbackWindowMs,
  limiter,
  identifier,
}: {
  fallbackKey: string
  fallbackLimit: number
  fallbackWindowMs: number
  identifier: string
  limiter: Ratelimit
}) {
  try {
    return await limiter.limit(identifier)
  } catch (error) {
    console.error("[RATE_LIMIT_FALLBACK]", error)
    return memorySlidingWindowLimit({
      key: fallbackKey,
      limit: fallbackLimit,
      windowMs: fallbackWindowMs,
    })
  }
}

export async function rateLimitChatRequest({
  ipAddress,
  isAuthenticated,
  participantId,
}: {
  ipAddress?: string | null
  isAuthenticated: boolean
  participantId: string
}) {
  const usageLimiter = isAuthenticated ? chatAuthenticatedUsageRateLimit : chatGuestUsageRateLimit
  const burstIdentifier = ipAddress?.trim() ? `ip:${ipAddress.trim()}` : `participant:${participantId}`
  const usageIdentifier = `participant:${participantId}`

  const [burstLimit, usageLimit] = await Promise.all([
    safeLimit({
      fallbackKey: `fallback:chat:burst:${burstIdentifier}`,
      fallbackLimit: 10,
      fallbackWindowMs: 60_000,
      identifier: burstIdentifier,
      limiter: chatBurstRateLimit,
    }),
    safeLimit({
      fallbackKey: `fallback:chat:usage:${isAuthenticated ? "authenticated" : "guest"}:${usageIdentifier}`,
      fallbackLimit: isAuthenticated ? 120 : 40,
      fallbackWindowMs: 60 * 60 * 1000,
      identifier: usageIdentifier,
      limiter: usageLimiter,
    }),
  ])

  const failedLimit = [burstLimit, usageLimit].find(result => !result.success)

  return {
    reset: failedLimit?.reset ?? null,
    success: !failedLimit,
  }
}

export async function rateLimitTurnstileVerification(ipAddress?: string | null) {
  const identifier = ipAddress?.trim() ? `ip:${ipAddress.trim()}` : "ip:unknown"
  return safeLimit({
    fallbackKey: `fallback:turnstile:${identifier}`,
    fallbackLimit: 20,
    fallbackWindowMs: 10 * 60 * 1000,
    identifier,
    limiter: turnstileVerificationRateLimit,
  })
}
