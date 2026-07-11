import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import { memorySlidingWindowLimit } from "@/lib/resilient-store"

const redis = Redis.fromEnv()

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
