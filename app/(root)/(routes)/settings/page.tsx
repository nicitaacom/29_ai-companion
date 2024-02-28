import { SubscriptionButton } from "@/components/subscription-button"
import { checkSubscription } from "@/lib/subscription"
import supabaseServer from "@/lib/supabase/supabaseServer"

const SettingsPage = async () => {
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()
  const isPro = await checkSubscription({ user: user })

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        {isPro ? "You are currently on a Pro plan." : "You are currently on a free plan."}
      </div>
      <SubscriptionButton isPro={isPro} />
    </div>
  )
}

export default SettingsPage
