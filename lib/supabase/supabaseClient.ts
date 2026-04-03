import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/app/interfaces/types_db"

const supabaseClient = createClientComponentClient() as SupabaseClient<Database>

export default supabaseClient
