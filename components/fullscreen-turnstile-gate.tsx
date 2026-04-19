"use client"

import { RefObject } from "react"

import { Button } from "@/components/ui/button"

interface FullscreenTurnstileGateProps {
  errorMessage?: string | null
  onRetry: () => void
  status: "idle" | "verifying" | "verified" | "error"
  turnstileRef: RefObject<HTMLDivElement>
}

export function FullscreenTurnstileGate({
  errorMessage,
  onRetry,
  status,
  turnstileRef,
}: FullscreenTurnstileGateProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/90 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.16),transparent_28%)]" />
      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-zinc-900/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:p-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/75">Security Check</p>
          <h1 className="text-3xl font-semibold text-white">Verify before chatting</h1>
          <p className="text-sm leading-6 text-zinc-300">
            Complete the Cloudflare Turnstile challenge in full screen to unlock the chat.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div ref={turnstileRef} className="min-h-[70px]" />
          </div>

          {status === "verifying" ? <p className="text-center text-sm text-sky-200">Verifying challenge...</p> : null}
          {status === "verified" ? <p className="text-center text-sm text-emerald-300">Verification complete.</p> : null}
          {errorMessage ? <p className="text-center text-sm text-rose-300">{errorMessage}</p> : null}
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onRetry} type="button" variant="outline">
            Retry challenge
          </Button>
        </div>
      </div>
    </div>
  )
}
