import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { Categories } from "@/components/categories"
import { SearchInput } from "@/components/search-input"
import { ICategoryDB } from "@/app/interfaces/ICategoryDB"

export default async function Home() {
  const { data: categories_data, error: categories_error } = await supabaseAdmin.from("category").select("*")
  if (categories_error) console.log(6, "categories_error - ", categories_error)
  return (
    <div className="h-full p-4 space-y-2">
      <SearchInput />
      <Categories data={categories_data ?? []} />
    </div>
  )
}
