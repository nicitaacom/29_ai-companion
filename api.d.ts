declare global {
  namespace API {
    type RateLimitReq = {
      limiterName: string
      action: "getRemaining" | "rateLimit"
      userId: string | null
      userTimezone: string
    }

    type RateLimitResp = {
      remaining: number
      resetTime: string
      resetIn: string
    }

    type RateLimitErrorResp = {
      error: string
    }

    type RateLimitRouteResp = RateLimitResp | RateLimitErrorResp
  }
}

export {}
