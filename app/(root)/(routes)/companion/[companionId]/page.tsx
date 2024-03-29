import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { CompanionForm } from "./components/companion-form"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { redirect } from "next/navigation"
import { checkSubscription } from "@/lib/subscription"

interface CompanionIdPageProps {
  params: {
    companionId: string
  }
}

export default async function CompanionIdPage({ params }: CompanionIdPageProps) {
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()
  const isPro = await checkSubscription({ user: user })
  if (!isPro) {
    redirect("/")
  }

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
