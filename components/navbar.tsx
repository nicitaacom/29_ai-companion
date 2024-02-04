import { Sparkles } from "lucide-react"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { twMerge } from "tailwind-merge"

import { Button } from "./ui/button"
import { ModeToggle } from "./mode-toggle"
import { MobileSidebar } from "./mobile-sidebar"
import { AuthModal } from "@/app/(auth)/AuthModal"
import supabaseClient from "@/lib/supabase/supabaseClient"
import { cookies } from "next/headers"

const font = Poppins({ weight: "600", subsets: ["latin"] })

export async function Navbar() {
  // to fix this issue - https://github.com/supabase/supabase/issues/6764
  // if I supabase.auth.getUser() - it doesn't work
  const auth = cookies().get("sb-vahemcbozzowgcadavfm-auth-token")

  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16">
      <div className="flex items-center">
        <MobileSidebar />
        <Link href="/" />
        <h1 className={twMerge("hidden md:block text-xl md:text-3xl font-bold text-primary", font.className)}>
          companion.ai
        </h1>
      </div>
      <div className="flex items-center gap-x-3">
        <Button variant="premium" size="sm">
          Upgrade <Sparkles className="w-4 h-4 fill-white text-white" />
        </Button>
        <ModeToggle />
        <AuthModal auth={auth?.value || undefined} />
      </div>
    </div>
  )
}
