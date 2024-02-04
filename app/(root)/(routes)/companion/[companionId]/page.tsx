import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { CompanionForm } from "./components/companion-form"

interface CompanionIdPageProps {
  params: {
    companionId: string
  }
}

export default async function CompanionIdPage({ params }: CompanionIdPageProps) {
  // TODO - check subscription

  const companion = await supabaseAdmin.from("companion").select().eq("id", params.companionId).single()

  const categories = await supabaseAdmin.from("category").select()

  return <CompanionForm initialData={companion.data} categories={categories.data ?? []} />
}
