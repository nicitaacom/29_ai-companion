"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { User } from "@supabase/supabase-js"

import { UserAuthenticatedContent } from "./components/UserAuthenticatedContent"
import { UserNotAuthenticatedContent } from "./components/UserNotAuthenticatedContent"
import { getRequestedAuthVariant } from "@/app/utils/auth"
import { useAccountModal } from "@/app/store/ui/accountModal"
import { useAuthOpen } from "@/app/hooks/use-auth-open"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function AuthModal({ user }: { user: User | null }) {
  const searchParams = useSearchParams()
  const { getAuthUrl, isIframeMode } = useAuthOpen()
  const { closeModal, isOpen, openModal, variant } = useAccountModal()
  const search = searchParams.toString()
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.identities?.[0]?.identity_data?.avatar_url

  useEffect(() => {
    if (user) {
      return
    }

    const requestedVariant = getRequestedAuthVariant(search)

    if (requestedVariant) {
      openModal(requestedVariant)
    }
  }, [openModal, search, user])

  if (!user && isIframeMode) {
    return (
      <div className="flex items-center gap-x-2">
        <Button asChild size="sm" variant="ghost">
          <Link href={getAuthUrl("login")} rel="noreferrer" target="_blank">
            Login
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={getAuthUrl("register")} rel="noreferrer" target="_blank">
            Sign up
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => (open ? openModal() : closeModal())}>
      {user ? (
        <button
          type="button"
          onClick={() => openModal()}
          className="overflow-hidden rounded-full ring-offset-background transition hover:opacity-90
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Image
            className="h-[36px] w-[36px] rounded-full object-cover"
            src={avatarUrl || "/placeholder.jpg"}
            alt="avatar"
            width={72}
            height={72}
          />
        </button>
      ) : (
        <div className="flex items-center gap-x-2">
          <Button size="sm" variant="ghost" onClick={() => openModal("login")}>
            Login
          </Button>
          <Button size="sm" onClick={() => openModal("register")}>
            Sign up
          </Button>
        </div>
      )}
      <DialogContent
        className="w-[min(96vw,1120px)] max-w-[1120px] border-0 bg-transparent p-0 shadow-none sm:rounded-[30px]
                   [&>button]:right-5 [&>button]:top-5 [&>button]:z-50 [&>button]:rounded-full [&>button]:border
                   [&>button]:border-white/15 [&>button]:bg-black/25 [&>button]:text-white [&>button]:backdrop-blur-md
                   [&>button]:hover:bg-black/40 [&>button]:data-[state=open]:bg-black/25">
        <div className="h-[min(94dvh,760px)] overflow-hidden sm:h-[min(92dvh,780px)] lg:h-[760px]">
          {user ? (
            <UserAuthenticatedContent user={user} />
          ) : (
            <UserNotAuthenticatedContent key={variant} initialVariant={variant} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
