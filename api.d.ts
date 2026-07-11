import type { User } from "@supabase/supabase-js"

import type { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import type { IMessage } from "@/app/interfaces/IMessageDB"

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

    type AuthLoginReq = {
      email: string
    }

    type AuthLoginResp = {
      providers: string[] | null
    }

    type AuthRegisterReq = {
      email: string
      password: string
      redirectTo?: string
    }

    type AuthRegisterResp = {
      user: User
      message: string
    }

    type CategoryCreateReq = {
      name: string
    }

    type CategoryCreateResp = {
      category?: { id: string; name: string }
      error?: string
    }

    type CompanionCreateReq = {
      src: string
      name: string
      description: string
      prompt: string
      seed: string
      category_id: string
    }

    type CompanionUpdateReq = CompanionCreateReq

    type TurnstileVerifyReq = {
      token: string
    }

    type TurnstileVerifyResp = {
      success: true
    }

    type StripeInfoResp = {
      message: string
    }

    type ChatCompanion = ICompanionDB & {
      messages: IMessage[]
      _count: { messages: number }
    }

    type ChatGetResp = {
      companion: ChatCompanion
    }

    type ChatPostReq = {
      prompt?: string
    }

    type WebhookSubscriptionInsert = {
      user_id: string
      stripe_subscription_id: string
      stripe_customer_id: string
      stripe_price_id: string
      stripe_current_period_end: string
    }

    type WebhookSubscriptionUpdate = Pick<WebhookSubscriptionInsert, "stripe_price_id" | "stripe_current_period_end">
  }
}

export {}
