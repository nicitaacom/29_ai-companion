import supabaseAdmin from "./supabase/supabaseAdmin"
import supabaseServer from "./supabase/supabaseServer"

const DAY_IN_MS = 86_400_000

export const checkSubscription = async () => {
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()
  if (!user) {
    return false
  }

  const { data: user_subscription_response } = await supabaseAdmin
    .from("user_subscription")
    .select()
    .eq("user_id", user.id)
    .single()

  if (!user_subscription_response || !user_subscription_response.stripe_current_period_end) {
    return false
  }

  // Parse stripe_current_period_end string to a Date object
  const stripeCurrentPeriodEnd = new Date(user_subscription_response.stripe_current_period_end)

  const isValid =
    user_subscription_response.stripe_price_id && stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now()

  return !!isValid
}
