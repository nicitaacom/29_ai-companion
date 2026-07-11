import { SubscriptionButton } from "@/components/subscription-button"

export const dynamic = "force-dynamic"

function SettingsPage() {
  return (
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">You are currently on a free plan.</div>
      <SubscriptionButton />
    </div>
  )
}

export default SettingsPage
