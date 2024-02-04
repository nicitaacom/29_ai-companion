"use client"

import Image from "next/image"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { User } from "@supabase/supabase-js"
import { UserAuthenticatedContent } from "./components/UserAuthenticatedContent"
import { UserNotAuthenticatedContent } from "./components/UserNotAuthenticatedContent"
import { useEffect, useState } from "react"
import supabaseClient from "@/lib/supabase/supabaseClient"

export function AuthModal({ auth }: { auth: string | undefined }) {
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
        {auth ? <UserAuthenticatedContent /> : <UserNotAuthenticatedContent />}
      </DialogContent>
    </Dialog>
  )
}
