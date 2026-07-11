"use client"

import { Avatar, AvatarImage } from "./ui/avatar"
import { useUser } from "@/app/hooks/useUser"

export function UserAvatar() {
  const { user } = useUser()

  return (
    <Avatar className="w-9 h-9 ring-2 ring-white/10 shadow-md">
      <AvatarImage
        src={
          user?.user_metadata.avatar_url ||
          user?.identities![0]?.identity_data?.avatar_url ||
          user?.identities![1]?.identity_data?.avatar_url ||
          "/placeholder.jpg"
        }
      />
    </Avatar>
  )
}
