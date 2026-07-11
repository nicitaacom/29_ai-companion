import { NextRequest, NextResponse } from "next/server"

import { checkSubscription } from "@/lib/subscription"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ companionId: string }> }) {
  const { companionId } = await params
  const { src, name, description, prompt, seed, category_id } = (await req.json()) as API.CompanionUpdateReq
  const supabase = await supabaseServer()

  // check is companionId exist in params
  if (!companionId) {
    return new NextResponse("Companion ID is required", { status: 400 })
  }

  // Check is user authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.id || !user.email) {
    return new NextResponse("Unauthenticated", { status: 401 })
  }

  // Check is all data passed to this route properly
  if (!src || !name || !description || !prompt || !seed || !category_id) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  try {
    const isPro = await checkSubscription({ user: user })

    if (!isPro) {
      return new NextResponse("Pro subscription required", { status: 403 })
    }
    // Update companion that equals params.companionId and user.id (owner_id) who created that companion
    // so only owner of that companion may update its own companion
    const companion = await supabaseAdmin
      .from("29_companion")
      .update({
        category_id: category_id,
        user_id: user.id,
        username: user.email.split("@")[0], // show user's email without part after @
        src,
        name,
        description,
        prompt,
        seed,
      })
      .eq("id", companionId)
      .eq("user_id", user.id)

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ companionId: string }> }) {
  try {
    const { companionId } = await params
    const supabase = await supabaseServer()
    // Check is user authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthenticated", { status: 401 })
    }

    // delete companion that eq user_id (owner_id) who created that companion and eq companionId
    // so only companion owner may delete its own companion
    const companion = await supabase.from("29_companion").delete().eq("user_id", user.id).eq("id", companionId)

    return NextResponse.json(companion)
  } catch (error) {
    console.log("[COMPANION_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
