import { NextResponse } from "next/server"

import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export async function POST(req: Request) {
  const body = (await req.json()) as API.CategoryCreateReq
  const categoryName = normalizeCategoryName(body?.name ?? "")
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthenticated" } satisfies API.CategoryCreateResp, { status: 401 })
  }

  if (!categoryName) {
    return NextResponse.json({ error: "Category name is required." } satisfies API.CategoryCreateResp, { status: 400 })
  }

  const { data: existingCategory, error: existingCategoryError } = await supabaseAdmin
    .from("29_category")
    .select("id, name")
    .ilike("name", categoryName)
    .maybeSingle()

  if (existingCategoryError) {
    return NextResponse.json({ error: "Unable to check category name." } satisfies API.CategoryCreateResp, { status: 500 })
  }

  if (existingCategory) {
    return NextResponse.json(
      { error: "Category already exists.", category: existingCategory } satisfies API.CategoryCreateResp,
      { status: 409 },
    )
  }

  const { data: category, error } = await supabaseAdmin
    .from("29_category")
    .insert({ name: categoryName })
    .select("id, name")
    .single()

  if (error || !category) {
    return NextResponse.json({ error: "Unable to create category." } satisfies API.CategoryCreateResp, { status: 500 })
  }

  return NextResponse.json({ category } satisfies API.CategoryCreateResp)
}
