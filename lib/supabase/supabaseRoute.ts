import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

import { Database } from "@/app/interfaces/types_db"

export async function getSupabaseRouteHandlerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  cookieStore.getAll()

  return createRouteHandlerClient({
    cookies: (() => cookieStore) as unknown as typeof cookies,
  }) as SupabaseClient<Database>
}
