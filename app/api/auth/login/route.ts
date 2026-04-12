import { AxiosResponse } from "axios"
import { NextResponse } from "next/server"

import supabaseAdmin from "@/lib/supabase/supabaseAdmin"

export type TAPIAuthLogin = {
  email: string
}

export interface IResponse {
  providers: string[] | null
}

export type TAPIAuthLoginResponse = AxiosResponse<IResponse>

/* This route fired when user click 'login' button */

export async function POST(req: Request) {
  const { email } = (await req.json()) as TAPIAuthLogin

  if (!email) return NextResponse.json({ error: "email missing" }, { status: 400 })

  const { data: user, error } = await supabaseAdmin
    .from("29_users")
    .select("providers")
    .eq("email", email)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!user) return NextResponse.json({ error: "User with this email doesn't exist" }, { status: 400 })

  return NextResponse.json({ providers: user.providers ?? null })
}
