import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { companionId: string } }) {
  const { src, name, description, instructions, seed, category_id } = await req.json()

  if (!params.companionId) {
    return new NextResponse("Companion ID is required", { status: 400 })
  }

  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  if (!user || !user.id || !user.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (!src || !name || !description || !instructions || !seed || !category_id) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  try {
    // TODO - check for subscription
    // TODO - replace with actuall user id and username
    const companion = await supabaseAdmin
      .from("companion")
      .update({
        category_id: category_id,
        user_id: user.id,
        username: "icpcsenondaryemail",
        src,
        name,
        description,
        instructions,
        seed,
      })
      .eq("id", params.companionId)
      .eq("user_id", user.id)

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { companionId: string } }) {
  try {
    const {
      data: { user },
    } = await supabaseServer().auth.getUser()

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const companion = await supabaseServer()
      .from("companion")
      .delete()
      .eq("user_id", user.id)
      .eq("id", params.companionId)

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
