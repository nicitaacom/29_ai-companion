import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { src, name, description, instructions, seed, categoryId } = await req.json()

  const auth = cookies().get("sb-vahemcbozzowgcadavfm-auth-token")

  if (!auth?.value) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (!src || !name || !description || !instructions || !seed || !categoryId) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  try {
    // TODO - check for subscription
    // TODO - replace with actuall user id and username
    const companion = await supabaseAdmin.from("companion").insert({
      category_id: categoryId,
      user_id: "e832568a-c1cc-45a7-8386-9de84d6967d3",
      username: "icpcsenondaryemail",
      src,
      name,
      description,
      instructions,
      seed,
    })

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}