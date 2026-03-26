import { Sparkles } from "lucide-react"

import { OrganicCanvasBackground } from "./OrganicCanvasBackground"

export function AuthModalShell({
  title,
  description,
  asideTitle,
  asideDescription,
  children,
}: {
  title: string
  description: string
  asideTitle: string
  asideDescription: string
  children: React.ReactNode
}) {
  return (
    <div className="isolate grid h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#111317] text-zinc-100 shadow-[0_30px_100px_rgba(0,0,0,0.7)] lg:grid-cols-[0.92fr_1.08fr]">
      <OrganicCanvasBackground
        className="hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_44%),linear-gradient(145deg,#10131a_0%,#161a21_48%,#0d1015_100%)] lg:block"
        parentClassName="flex h-full flex-col justify-between p-8 xl:p-10"
        particleCount={7}
        color="0, 0%, 100%">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_34%)]" />
        <div className="relative flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
          <span className="rounded-full border border-white/10 bg-white/[0.06] p-2">
            <Sparkles className="h-4 w-4" />
          </span>
          Companion Access
        </div>
        <div className="relative max-w-sm space-y-5 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/[0.58]">Supabase Auth</p>
          <h2 className="text-4xl font-semibold leading-tight">{asideTitle}</h2>
          <p className="max-w-md text-sm leading-7 text-white/[0.68]">{asideDescription}</p>
        </div>
        <div className="relative flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.06] px-5 py-4 text-sm text-white/[0.72] backdrop-blur-md">
          <span>Google, GitHub and credentials</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Unified
          </span>
        </div>
      </OrganicCanvasBackground>

      <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[linear-gradient(180deg,rgba(17,19,23,0.96),rgba(13,16,20,0.96))] p-6 sm:p-8 md:p-9 lg:p-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/[0.45]">Authentication</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="max-w-xl text-sm leading-6 text-white/[0.62]">{description}</p>
        </div>
        <div className="mt-8 flex-1">{children}</div>
      </div>
    </div>
  )
}
