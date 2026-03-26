import { User } from "@supabase/supabase-js"

export const checkSubscription = async ({ user }: { user: User | null }) => {
  if (!user) {
    return false
  }

  // The app is free to use for every authenticated user.
  return true
}
