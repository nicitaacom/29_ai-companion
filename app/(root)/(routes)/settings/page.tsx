import { SubscriptionButton } from "@/components/subscription-button"
import supabaseServer from "@/lib/supabase/supabaseServer"

const SettingsPage = async () => {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">You are currently on a free plan.</div>
      <SubscriptionButton />
    </div>
  )
}

export default SettingsPage
