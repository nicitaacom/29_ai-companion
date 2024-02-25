import supabaseClient from "@/lib/supabase/supabaseClient"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export async function logout(router: AppRouterInstance) {
  await supabaseClient.auth.signOut()
  dialogClose()
  router.refresh()
}

const dialogClose = () => {
  document.getElementById("closeDialog")?.click()
}
