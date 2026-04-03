import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

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

  const [burstLimit, usageLimit] = await Promise.all([
    chatBurstRateLimit.limit(burstIdentifier),
    usageLimiter.limit(`participant:${participantId}`),
  ])

  const failedLimit = [burstLimit, usageLimit].find(result => !result.success)

  return {
    reset: failedLimit?.reset ?? null,
    success: !failedLimit,
  }
}
