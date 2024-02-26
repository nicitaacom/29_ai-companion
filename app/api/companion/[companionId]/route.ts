import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { companionId: string } }) {
  const { src, name, description, instructions, seed, category_id } = await req.json()

  // check is companionId exist in params
  if (!params.companionId) {
    return new NextResponse("Companion ID is required", { status: 400 })
  }

  // Check is user authenticated
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  if (!user || !user.id || !user.email) {
    return new NextResponse("Unauthenticated", { status: 401 })
  }

  // Check is all data passed to this route properly
  if (!src || !name || !description || !instructions || !seed || !category_id) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  try {
    // TODO - check for subscription

    // Update companion that equals params.companionId and user.id (owner_id) who created that companion
    // so only owner of that companion may update its own companion
    const companion = await supabaseAdmin
      .from("companion")
      .update({
        category_id: category_id,
        user_id: user.id,
        username: user.email.split("@")[0], // show user's email without part after @
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
    // Check is user authenticated
    const {
      data: { user },
    } = await supabaseServer().auth.getUser()

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthenticated", { status: 401 })
    }

    // delete companion that eq user_id (owner_id) who created that companion and eq companionId
    // so only companion owner may delete its own companion
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
