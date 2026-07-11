import Link from "next/link"

import { MobileSidebar } from "./mobile-sidebar"
import { ModeToggle } from "./mode-toggle"
import { UpgradeButton } from "./upgrade-button"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { AuthModal } from "@/app/(auth)/AuthModal"

export async function Navbar({ isPro }: { isPro: boolean }) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav
      className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16"
      data-test="cypress-navbar">
      <div className="flex items-center">
        <MobileSidebar isPro={isPro} />
        <Link href="/">
          <h1 className="font-brand hidden text-xl font-bold text-primary md:block md:text-3xl">jompanion.jokik.fi</h1>
        </Link>
      </div>
      <div className="flex items-center gap-x-3">
        {!isPro && <UpgradeButton />}
        <ModeToggle />
        <AuthModal user={user || null} />
      </div>
    </nav>
  )
}
