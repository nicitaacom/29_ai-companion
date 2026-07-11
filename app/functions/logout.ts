import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import supabaseClient from "@/lib/supabase/supabaseClient"
import { useAccountModal } from "@/app/store/ui/accountModal"

export async function logout(router: AppRouterInstance) {
  await supabaseClient.auth.signOut()
  useAccountModal.getState().closeModal()
  router.refresh()
}
