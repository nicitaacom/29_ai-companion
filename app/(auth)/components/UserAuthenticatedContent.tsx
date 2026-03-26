"use client"

import { logout } from "@/app/functions/logout"
import { Button } from "@/components/ui/button"
import { User } from "@supabase/supabase-js"
import { ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { AuthModalShell } from "./AuthModalShell"

function getProviders(user: User) {
  return Array.from(new Set(user.identities?.map(identity => identity.provider).filter(Boolean) ?? ["credentials"]))
}

export function UserAuthenticatedContent({ user }: { user: User }) {
  const router = useRouter()
  const providers = getProviders(user)

  return (
    <AuthModalShell
      title="Account settings"
      description="You are signed in with Supabase. Your session, providers and future billing access all flow through this account."
      asideTitle="Everything is connected."
      asideDescription="Your companion profile now uses the Supabase session directly, so Google, GitHub and credentials all land in one place.">
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-white ring-1 ring-white/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/[0.48]">Signed in as</p>
                <p className="text-base font-semibold text-white">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/[0.45]">Providers</p>
            <div className="flex flex-wrap gap-2">
              {providers.map(provider => (
                <span
                  key={provider}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/[0.78]">
                  {provider}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="h-12 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90" onClick={() => logout(router)}>
            Logout
          </Button>
          <p className="text-center text-xs leading-5 text-white/[0.48]">
            Signing out clears the Supabase session for this browser and refreshes the companion app state.
          </p>
        </div>
      </div>
    </AuthModalShell>
  )
}
