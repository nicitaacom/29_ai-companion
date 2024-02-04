import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { companionId: string } }) {
  const { src, name, description, instructions, seed, categoryId } = await req.json()

  if (!params.companionId) {
    return new NextResponse("Companion ID is required", { status: 400 })
  }

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
    const companion = await supabaseAdmin
      .from("companion")
      .update({
        category_id: categoryId,
        user_id: "e832568a-c1cc-45a7-8386-9de84d6967d3",
        username: "icpcsenondaryemail",
        src,
        name,
        description,
        instructions,
        seed,
      })
      .eq("id", params.companionId)

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
