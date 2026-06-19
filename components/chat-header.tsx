"use client"

import { ChevronLeft, Edit, MessagesSquare, MoreVertical, Trash } from "lucide-react"

import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { Button, buttonVariants } from "./ui/button"
import { useRouter } from "next/navigation"
import { BotAvatar } from "@/components/bot-avatar"
import { useUser } from "@/app/hooks/useUser"
import { twMerge } from "tailwind-merge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useToast } from "./ui/use-toast"

interface ChatHeaderProps {
  companion: ICompanionDB & {
    messages: IMessage[]
    _count: {
      messages: number
    }
  }
}

export function ChatHeader({ companion }: ChatHeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()

  const handleBack = () => router.back()
  const handleEdit = () => router.push(`/companion/${companion.id}`)

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/companion/${companion.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Delete failed")

      toast({ description: "Success" })

      router.refresh()
      router.push("/")
    } catch (error) {
      toast({ description: "Something went wrong", variant: "destructive" })
    }
  }

  return (
    <div className="flex w-full items-center justify-between border-b border-primary/10 pb-4">
      <div className="flex items-center gap-x-2">
        <Button size="icon" variant="ghost" onClick={handleBack}>
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <BotAvatar src={companion.src} />
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2">
            <p className="font-bold">{companion.name}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <MessagesSquare className="w-3 h-3 m-1" />
              {companion._count.messages}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Created by {companion.username.split("@")[0]}</p>
        </div>
      </div>
      {user?.id === companion.user_id && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={twMerge(buttonVariants({ variant: "secondary", size: "icon" }))}
            aria-label="Open actions">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
