import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { src, name, description, instructions, seed, category_id } = await req.json()

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
    const companion = await supabaseAdmin.from("companion").insert({
      category_id: category_id,
      user_id: user.id,
      username: user.email,
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
