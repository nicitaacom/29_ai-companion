"use client"

import { useUser } from "@/app/hooks/useUser"
import { Avatar, AvatarImage } from "./ui/avatar"

export function UserAvatar() {
  const { user } = useUser()

  return (
    <Avatar className="w-12 h-12">
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
