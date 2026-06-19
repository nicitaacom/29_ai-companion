import { Avatar, AvatarImage } from "./ui/avatar"

interface BotAvatarProps {
  src: string
}

export function BotAvatar({ src }: BotAvatarProps) {
  return (
    <Avatar className="w-9 h-9 ring-2 ring-white/10 shadow-md">
      <AvatarImage src={src} />
    </Avatar>
  )
}
