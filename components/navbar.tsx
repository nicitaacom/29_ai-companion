import { Poppins } from "next/font/google"
import Link from "next/link"
import { twMerge } from "tailwind-merge"

import { ModeToggle } from "./mode-toggle"
import { MobileSidebar } from "./mobile-sidebar"
import { AuthModal } from "@/app/(auth)/AuthModal"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { UpgradeButton } from "./upgrade-button"

const font = Poppins({ weight: "600", subsets: ["latin"] })

export async function Navbar({ isPro }: { isPro: boolean }) {
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  return (
    <nav
      className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16"
      data-test="cypress-navbar">
      <div className="flex items-center">
        <MobileSidebar isPro={isPro} />
        <Link href="/" />
        <h1 className={twMerge("hidden md:block text-xl md:text-3xl font-bold text-primary", font.className)}>
          companion.ai
        </h1>
      </div>
      <div className="flex items-center gap-x-3">
        {!isPro && <UpgradeButton />}
        <ModeToggle />
        <AuthModal user={user || null} />
      </div>
    </nav>
  )
}
