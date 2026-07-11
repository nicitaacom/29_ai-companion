import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

import { Database } from "@/app/interfaces/types_db"

export default async function supabaseServer(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  cookieStore.getAll()

  return createServerComponentClient({
    cookies: (() => cookieStore) as unknown as typeof cookies,
  }) as SupabaseClient<Database>
}
