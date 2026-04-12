import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { Categories } from "@/components/categories"
import { SearchInput } from "@/components/search-input"
import { Companions } from "@/components/companions"

export const dynamic = "force-dynamic"

interface RootPageProps {
  searchParams: Promise<{
    categoryId?: string
  }>
}

export default async function RootPage({ searchParams }: RootPageProps) {
  const { categoryId } = await searchParams

  // 1. Fetch categories
  const { data: categories_data, error: categories_error } = await supabaseAdmin.from("category").select("*")
  if (categories_error) console.log(6, "categories_error - ", categories_error)

  let companions
  if (categoryId) {
    // 2. Fetch Companions
    const { data: companions_response, error: companions_error } = await supabaseAdmin
      .from("companion")
      .select()
      .eq("category_id", categoryId) // if categoryId - select *
      .order("created_at", { ascending: false })
    if (companions_error) console.log(7, "companions_error - ", companions_error)
    companions = companions_response
  } else {
    const { data: companions_response, error: companions_error } = await supabaseAdmin
      .from("companion")
      .select()
      .order("created_at", { ascending: false })
    if (companions_error) console.log(8, "companions_error - ", companions_error)
    companions = companions_response
  }

  // 3. Fetch Message Count for Each Companion
  const companionsWithMessageCount = companions
    ? await Promise.all(
        companions.map(async companion => {
          const { data: messages, error: messagesError } = await supabaseAdmin
            .from("29_messages")
            .eq("companion_id", companion.id)

          if (messagesError) {
            console.error(45, "Error fetching messages:", messagesError)
          }

          return messages ? messages.length : 0
        }),
      )
    : null

  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories_data ?? []} />
      <Companions data={companions ?? []} messages={companionsWithMessageCount ?? []} />
    </div>
  )
}
