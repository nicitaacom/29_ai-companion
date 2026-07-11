import { redirect } from "next/navigation"

import { CompanionForm } from "./components/companion-form"
import { checkSubscription } from "@/lib/subscription"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"

export const dynamic = "force-dynamic"

interface CompanionIdPageProps {
  params: Promise<{
    companionId: string
  }>
}

export default async function CompanionIdPage({ params }: CompanionIdPageProps) {
  const { companionId } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isPro = await checkSubscription({ user: user })
  if (!isPro) {
    redirect("/")
  }

  if (!user || !user.id || !user.email) {
    redirect("/")
  }

  const companion = await supabaseAdmin
    .from("29_companion")
    .select()
    .eq("id", companionId)
    .eq("user_id", user.id)
    .single()

  const categories = await supabaseAdmin.from("29_category").select()

  return <CompanionForm initialData={companion.data} categories={categories.data ?? []} />
}
