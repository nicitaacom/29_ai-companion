import { NextResponse } from "next/server"

import { executeRateLimitRequest } from "@/lib/rate-limit-core"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const result = await executeRateLimitRequest(req, (await req.json()) as API.RateLimitRequest)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error } satisfies API.RateLimitErrorResponse,
      {
        headers: result.retryAfter ? { "retry-after": `${result.retryAfter}` } : undefined,
        status: result.status,
      },
    )
  }

  return NextResponse.json(
    {
      remaining: result.remaining,
      resetTime: result.resetTime,
      resetIn: result.resetIn,
    } satisfies API.RateLimitResponse,
    { status: 200 },
  )
}
