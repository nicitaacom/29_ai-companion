import { NextResponse } from "next/server"

import { ensureAppUser } from "@/lib/auth/ensureAppUser"
import { getSupabaseRouteHandlerClient } from "@/lib/supabase/supabaseRoute"

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

  if (!code) return NextResponse.redirect(getErrorRedirect(requestUrl))

  const supabase = await getSupabaseRouteHandlerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) return NextResponse.redirect(getErrorRedirect(requestUrl))

  const ensureUserError = await ensureAppUser(user, "credentials")
  if (ensureUserError) return NextResponse.redirect(getErrorRedirect(requestUrl))

  return NextResponse.redirect(new URL(getSafeRedirectPath(requestUrl.searchParams.get("next")), requestUrl.origin))
}
