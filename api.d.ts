declare global {
  namespace API {
    type RateLimitRequest = {
      limiterName: string
      action: "getRemaining" | "rateLimit"
      userId: string | null
      userTimezone: string
    }

    type RateLimitResponse = {
      remaining: number
      resetTime: string
      resetIn: string
    }

    type RateLimitErrorResponse = {
      error: string
    }

    type RateLimitRouteResponse = RateLimitResponse | RateLimitErrorResponse
  }
}

export {}
