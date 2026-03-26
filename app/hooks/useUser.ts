import supabaseClient from "@/lib/supabase/supabaseClient"
import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let isActive = true

    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()

        if (isActive) {
          setUser(user)
        }
      } catch (error) {
        if (error instanceof Error) {
          console.log(13, "error getting user - ", error.message)
        }
      }
    }

    fetchUser()
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  return { user }
}
