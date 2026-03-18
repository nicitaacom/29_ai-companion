"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { User } from "@supabase/supabase-js"

import { useAuthOpen } from "@/app/hooks/use-auth-open"
import { useAccountModal } from "@/app/store/ui/accountModal"
import { getRequestedAuthVariant } from "@/app/utils/auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UserAuthenticatedContent } from "./components/UserAuthenticatedContent"
import { UserNotAuthenticatedContent } from "./components/UserNotAuthenticatedContent"

export function AuthModal({ user }: { user: User | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>("")
  const searchParams = useSearchParams()
  const { getAuthUrl, isIframeMode } = useAuthOpen()
  const { closeModal, isOpen, openModal, variant } = useAccountModal()
  const search = searchParams.toString()

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
      <DialogTrigger asChild id="closeDialog">
        <Image
          className="w-[32px] h-[32px] object-cover rounded-full cursor-pointer"
          src={avatarUrl || "/placeholder.jpg"}
          alt="avatar"
          width={64}
          height={64}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {user ? <UserAuthenticatedContent /> : <UserNotAuthenticatedContent initialVariant={variant} />}
      </DialogContent>
    </Dialog>
  )
}
