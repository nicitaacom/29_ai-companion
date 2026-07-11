import { NextResponse } from "next/server"

import { getSupabaseRouteHandlerClient } from "@/lib/supabase/supabaseRoute"
import { TAppAuthProvider, ensureAppUser } from "@/lib/auth/ensureAppUser"

function getSafeRedirectPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) return "/"
  return nextPath
}

function getErrorRedirect(requestUrl: URL) {
  const redirectUrl = new URL(getSafeRedirectPath(requestUrl.searchParams.get("next")), requestUrl.origin)
  redirectUrl.searchParams.set("auth", "login")
  return redirectUrl
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const provider = requestUrl.searchParams.get("provider") as TAppAuthProvider | null

  if (!code || !provider || !["google", "github"].includes(provider)) return NextResponse.redirect(getErrorRedirect(requestUrl))

  const supabase = await getSupabaseRouteHandlerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) return NextResponse.redirect(getErrorRedirect(requestUrl))

  const ensureUserError = await ensureAppUser(user, provider)
  if (ensureUserError) return NextResponse.redirect(getErrorRedirect(requestUrl))

  return NextResponse.redirect(new URL(getSafeRedirectPath(requestUrl.searchParams.get("next")), requestUrl.origin))
}
