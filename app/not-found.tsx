import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist or has been moved.",
}

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111317] p-8 text-center text-zinc-100 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/[0.45]">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-white/[0.62]">
          The route you requested does not exist. You can go back to the homepage and continue from there.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild className="h-11 rounded-2xl px-5">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
