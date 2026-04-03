import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"

import type { Database } from "@/app/interfaces/types_db"
import { GUEST_VISITOR_COOKIE_MAX_AGE, GUEST_VISITOR_COOKIE_NAME } from "@/lib/chat-session"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  await supabase.auth.getSession()

  if (!req.cookies.get(GUEST_VISITOR_COOKIE_NAME)?.value) {
    res.cookies.set({
      httpOnly: true,
      maxAge: GUEST_VISITOR_COOKIE_MAX_AGE,
      name: GUEST_VISITOR_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: crypto.randomUUID(),
    })
  }

  return res
}
