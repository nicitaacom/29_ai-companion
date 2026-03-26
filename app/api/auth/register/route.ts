import { NextResponse } from "next/server"
import { User } from "@supabase/supabase-js"
import { AxiosResponse } from "axios"

import { ensureAppUser } from "@/lib/auth/ensureAppUser"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { getSupabaseRouteHandlerClient } from "@/lib/supabase/supabaseRoute"

export type TAPIAuthRegister = {
  email: string
  password: string
  redirectTo?: string
}

export interface IResponse {
  user: User
  message: string
}

export type TAPIAuthRegisterResponse = AxiosResponse<IResponse>

async function selectExistingUserProviders(email: string) {
  const { data, error } = await supabaseAdmin.from("users").select("providers").eq("email", email).maybeSingle()
  if (error) return error.message
  return data?.providers ?? null
}

export async function POST(req: Request) {
  const { email, password, redirectTo } = (await req.json()) as TAPIAuthRegister

  if (!email || !password) return NextResponse.json({ error: "email or password missing" }, { status: 400 })

  const existingProviders = await selectExistingUserProviders(email)
  if (typeof existingProviders === "string") return NextResponse.json({ error: existingProviders }, { status: 400 })

  if (existingProviders) {
    const providerList = existingProviders.join(", ") || "another provider"
    const errorMessage = existingProviders.includes("credentials")
      ? "User with this email already exists"
      : `You already have an account with ${providerList}`

    return NextResponse.json({ error: errorMessage, providers: existingProviders }, { status: 400 })
  }

  const requestUrl = new URL(req.url)
  const callbackUrl = new URL("/auth/callback/credentials", requestUrl.origin)
  if (redirectTo && redirectTo.startsWith("/")) callbackUrl.searchParams.set("next", redirectTo)

  const supabase = await getSupabaseRouteHandlerClient()
  const {
    data: { user, session },
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  })

  if (signUpError) return NextResponse.json({ error: signUpError.message }, { status: 400 })
  if (!user) return NextResponse.json({ error: "After sign up no user was returned" }, { status: 400 })

  const ensureUserError = await ensureAppUser(user, "credentials")
  if (ensureUserError) return NextResponse.json({ error: ensureUserError }, { status: 400 })

  return NextResponse.json({
    user,
    message: session ? "Account created successfully." : "Check your email to finish creating your account.",
  })
}
