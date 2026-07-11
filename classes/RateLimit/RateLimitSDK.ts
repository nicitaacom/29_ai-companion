import { TRateLimiterName } from "./types/TRateLimiterName"
import useUserTimezone from "@/widgets/TimezonePicker/useUserTimeZone"
import useUser from "@/store/useUser"
import { RATE_LIMITS } from "@/app/consts/RATE_LIMIT"

type Action = API.RateLimitRequest["action"]

function validateRequiredScope(limiterName: TRateLimiterName) {
  const { userId } = useUser.getState()

  RATE_LIMITS[limiterName].key({
    userId: userId ?? undefined,
  })
}

export class RateLimitSDK {
  async rateLimit(limiterName: TRateLimiterName): Promise<API.RateLimitResponse> {
    return this.requestFn("rateLimit", limiterName)
  }

  async getRemaining(limiterName: TRateLimiterName): Promise<API.RateLimitResponse> {
    return this.requestFn("getRemaining", limiterName)
  }

  private async requestFn(action: Action, limiterName: TRateLimiterName): Promise<API.RateLimitResponse> {
    const { userId } = useUser.getState()
    const { userTimezone } = useUserTimezone.getState()

    validateRequiredScope(limiterName)

    const response = await fetch("/api/rateLimit", {
      body: JSON.stringify({
        action,
        limiterName,
        userTimezone,
        userId,
      } satisfies API.RateLimitRequest),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    const data = (await response.json()) as API.RateLimitRouteResponse

    if (response.status === 429) {
      throw new Error("Rate limit exceeded")
    }

    if (!response.ok) {
      throw new Error("Rate limit request failed")
    }

    if ("error" in data) {
      throw new Error(`Rate limit request failed with error: ${data.error}`)
    }

    return data
  }
}
