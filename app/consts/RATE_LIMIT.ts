type RateLimitKeyParams = { userId?: string; accountId?: string }

export const RATE_LIMITS = {
  createAICompanion: {
    windowSec: 86400,
    maxAllowed: 5,
    key: ({ userId }: RateLimitKeyParams) => {
      if (!userId) throw new Error("userId is required for createAICompanion")
      return `companion:create:${userId}`
    },
  },
  newChatMessage: {
    windowSec: 86400,
    maxAllowed: 20,
    key: ({ userId }: RateLimitKeyParams) => {
      if (!userId) throw new Error("userId is required for newChatMessage")
      return `chat:new-message:${userId}`
    },
  },
  generateMedia: {
    windowSec: 3600,
    maxAllowed: 10,
    key: ({ userId }: RateLimitKeyParams) => {
      if (!userId) throw new Error("userId is required for generateMedia")
      return `generate:media:${userId}`
    },
  },
} as const
