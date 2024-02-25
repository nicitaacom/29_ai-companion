import supabaseClient from "@/lib/supabase/supabaseClient"
import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        setUser(user)
      } catch (error) {
        if (error instanceof Error) {
          console.log(13, "error getting user - ", error.message)
        }
      }
    }
    fetchUser()
  }, [])
  return { user }
}
