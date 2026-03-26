import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

import { Database } from "@/app/interfaces/types_db"

export default async function supabaseServer() {
  const cookieStore = await cookies()

  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
}
