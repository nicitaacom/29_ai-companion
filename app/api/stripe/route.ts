import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "This app is free to use." } satisfies API.StripeInfoResp)
}
