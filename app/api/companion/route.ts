import { checkSubscription } from "@/lib/subscription"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { src, name, description, instructions, seed, category_id } = await req.json()

  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  // Check is user authenticated
  if (!user || !user.id || !user.email) {
    return new NextResponse("Unauthenticated", { status: 401 })
  }
  // Chec is all required data passesed to this API route
  if (!src || !name || !description || !instructions || !seed || !category_id) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  const isPro = await checkSubscription()

  if (!isPro) {
    return new NextResponse("Pro subscription required", { status: 403 })
  }
  try {
    // Insert companion in 'companion' table
    const companion = await supabaseAdmin.from("companion").insert({
      category_id: category_id,
      user_id: user.id, // user_id - its owner_id (companion owner/creator)
      username: user.email.split("@")[0],
      src,
      name,
      description,
      instructions,
      seed,
    })

    return NextResponse.json(companion)
  } catch (error) {
    if (error instanceof Error) {
      console.log("[COMPANION_POST]", error.message)
      return new NextResponse("Internal error", { status: 500 })
    }
  }
}
