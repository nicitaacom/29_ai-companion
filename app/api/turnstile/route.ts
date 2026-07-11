import { NextResponse } from "next/server"

import { rateLimitTurnstileVerification } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"
import {
  TURNSTILE_VERIFIED_COOKIE_MAX_AGE,
  TURNSTILE_VERIFIED_COOKIE_NAME,
  TURNSTILE_VERIFIED_COOKIE_VALUE,
} from "@/lib/chat-session"

export const runtime = "nodejs"
export const maxDuration = 60

function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  return req.headers.get("cf-connecting-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? null
}

export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as API.TurnstileVerifyReq
    const cleanToken = token?.trim()

    if (!cleanToken) {
      return new NextResponse("Turnstile token is required", { status: 400 })
    }

    const ipAddress = getRequestIp(req)
    const rateLimitResult = await rateLimitTurnstileVerification(ipAddress)

    if (!rateLimitResult.success) {
      return new NextResponse("Rate limit exceeded", { status: 429 })
    }

    const verification = await verifyTurnstileToken({
      ip: ipAddress,
      token: cleanToken,
    })

    if (!verification.success) {
      return new NextResponse("Robot check failed. Please try again.", { status: 403 })
    }

    const response = NextResponse.json({ success: true } satisfies API.TurnstileVerifyResp)

    response.cookies.set({
      httpOnly: true,
      maxAge: TURNSTILE_VERIFIED_COOKIE_MAX_AGE,
      name: TURNSTILE_VERIFIED_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: TURNSTILE_VERIFIED_COOKIE_VALUE,
    })

    return response
  } catch (error) {
    console.error("[TURNSTILE_POST]", error)
    return new NextResponse("Robot check could not be completed right now.", { status: 500 })
  }
}
