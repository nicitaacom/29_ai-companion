"use client"

import Image from "next/image"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UserAuthenticatedContent } from "./components/UserAuthenticatedContent"
import { UserNotAuthenticatedContent } from "./components/UserNotAuthenticatedContent"
import { useState } from "react"
import { User } from "@supabase/supabase-js"

export function AuthModal({ user }: { user: User | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>("")

  return (
    <Dialog>
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
        {user ? <UserAuthenticatedContent /> : <UserNotAuthenticatedContent />}
      </DialogContent>
    </Dialog>
  )
}
