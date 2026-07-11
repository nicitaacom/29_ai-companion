import { NextResponse } from "next/server"

import { executeRateLimitRequest } from "@/lib/rate-limit-core"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const response = await executeRateLimitRequest(req, (await req.json()) as API.RateLimitReq)

  if (!response.success) {
    return NextResponse.json(
      { error: response.error } satisfies API.RateLimitErrorResp,
      {
        headers: response.retryAfter ? { "retry-after": `${response.retryAfter}` } : undefined,
        status: response.status,
      },
    )
  }

  return NextResponse.json(
    {
      remaining: response.remaining,
      resetTime: response.resetTime,
      resetIn: response.resetIn,
    } satisfies API.RateLimitResp,
    { status: 200 },
  )
}
