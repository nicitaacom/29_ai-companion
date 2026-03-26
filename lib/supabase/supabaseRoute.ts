import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

import { Database } from "@/app/interfaces/types_db"

export async function getSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()

  return createRouteHandlerClient<Database>({
    cookies: async () => cookieStore,
  })
}
