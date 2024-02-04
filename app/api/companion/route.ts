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

  // TODO - check for subscription
  const companion = await supabaseAdmin.from("companion").insert({ categoryid, user_id: auth?.value })

  try {
  } catch (error) {
    console.log("[COMPANION POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
