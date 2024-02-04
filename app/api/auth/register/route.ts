import { NextResponse } from "next/server"

import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { User, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { AxiosResponse } from "axios"

export type TAPIAuthRegister = {
  email: string
  password: string
}

export interface IResponse {
  user: User
}

export type TAPIAuthRegisterResponse = AxiosResponse<IResponse>

export async function POST(req: Request) {
  const { email, password }: TAPIAuthRegister = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // 1. Check if user with this email already exists
    const { data: email_response } = await supabaseAdmin.from("users").select("email").eq("email", email).single()
    if (email_response?.email === email) {
      return new NextResponse(`User with this email already exists`, { status: 400 })
    }

    /* Insert row in 'users' table for a new user */
    // 2. Sign up to add row in 'auth.users'
    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    if (signUpError) {
      console.log(`api/auth/register/route.ts ${signUpError}`)
      return new NextResponse(`${signUpError}`, { status: 400 })
    }

    // 3. Insert row in 'public.users' 'public.users_cart' tables (if user exist throw error)
    if (user && user.user?.id) {
      await supabaseAdmin.from("users").insert({ id: user.user.id, email: email, providers: ["credentials"] })
      await supabaseAdmin.from("users_cart").insert({ id: user.user.id })
    } else {
      return new NextResponse(`${`After signUp - user doesnt exist - try again`}`, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof Error) {
      console.log(90, "REGISTER_NEW_USER_ERROR\n (supabase) \n", error.message)
      return new NextResponse(`/api/auth/register/route.ts error \n ${error}`, {
        status: 500,
      })
    }
  }
}
