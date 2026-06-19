import { checkSubscription } from "@/lib/subscription"
import { executeRateLimitRequest } from "@/lib/rate-limit-core"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { src, name, description, instructions, seed, category_id } = await req.json()
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check is user authenticated
  if (!user || !user.id || !user.email) {
    return new NextResponse("Unauthenticated", { status: 401 })
  }
  // Chec is all required data passesed to this API route
  if (!src || !name || !description || !instructions || !seed || !category_id) {
    return new NextResponse("Missing required fields", { status: 400 })
  }

  if (process.env.NODE_ENV === "production") {
    const rateLimitResult = await executeRateLimitRequest(req, {
      action: "rateLimit",
      limiterName: "createAICompanion",
      userId: user.id,
      userTimezone: "UTC",
    })

    if (!rateLimitResult.success) {
      return new NextResponse(rateLimitResult.error, {
        headers: rateLimitResult.retryAfter ? { "Retry-After": `${rateLimitResult.retryAfter}` } : undefined,
        status: rateLimitResult.status,
      })
    }
  }

  const isPro = await checkSubscription({ user: user })

  if (!isPro) {
    return new NextResponse("Pro subscription required", { status: 403 })
  }

  const { error: upsertError } = await supabaseAdmin
    .from("29_users")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" })

  if (upsertError) {
    console.log("[COMPANION_POST] upsert user", upsertError.message)
    return NextResponse.json({ error: "Failed to sync user profile." }, { status: 500 })
  }

  const { data: companion, error } = await supabaseAdmin
    .from("29_companion")
    .insert({
      category_id,
      user_id: user.id,
      username: user.email.split("@")[0],
      src,
      name,
      description,
      instructions,
      seed,
    })
    .select()
    .single()

  if (error) {
    console.log("[COMPANION_POST]", error.message)
    return NextResponse.json({ error: "Failed to create companion. Please try again." }, { status: 500 })
  }

  return NextResponse.json(companion)
}
