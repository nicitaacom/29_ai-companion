import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { CompanionForm } from "./components/companion-form"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { redirect } from "next/navigation"

interface CompanionIdPageProps {
  params: {
    companionId: string
  }
}

export default async function CompanionIdPage({ params }: CompanionIdPageProps) {
  // TODO - check subscription

  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  if (!user || !user.id || !user.email) {
    redirect("/")
  }

  const companion = await supabaseAdmin
    .from("companion")
    .select()
    .eq("id", params.companionId)
    .eq("user_id", user.id)
    .single()

  const categories = await supabaseAdmin.from("category").select()

  return <CompanionForm initialData={companion.data} categories={categories.data ?? []} />
}
