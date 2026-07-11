"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Edit, MessagesSquare, MoreVertical, Trash, Maximize2, Minimize2 } from "lucide-react"
import { twMerge } from "tailwind-merge"

import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { Button, buttonVariants } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useChatHeaderHandlers } from "@/components/hooks/useChatHeaderHandlers"
import { useUser } from "@/app/hooks/useUser"
import { BotAvatar } from "@/components/bot-avatar"

interface ChatHeaderProps {
  companion: ICompanionDB & {
    messages: IMessage[]
    _count: {
      messages: number
    }
  }
  isFullWidth: boolean
  onToggleFullWidth: () => void
  fontSize: number
  onFontIncrease: () => void
  onFontDecrease: () => void
}

export function ChatHeader({
  companion,
  isFullWidth,
  onToggleFullWidth,
  fontSize,
  onFontIncrease,
  onFontDecrease,
}: ChatHeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const { handleDelete } = useChatHeaderHandlers(companion.id)

  const handleBack = () => router.back()
  const handleEdit = () => router.push(`/companion/${companion.id}`)

  return (
    <div
      className="shrink-0 flex w-full items-center justify-between rounded-2xl bg-white/5 backdrop-blur-md border
                 border-white/10 px-4 py-3 shadow-lg">
      <div className="flex items-center gap-x-3">
        <Button size="icon" variant="ghost" onClick={handleBack} className="rounded-xl hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <BotAvatar src={companion.src} />
        <div className="flex flex-col gap-y-0.5">
          <div className="flex items-center gap-x-2">
            <p className="font-semibold text-sm">{companion.name}</p>
            <div className="flex items-center gap-x-1 text-xs text-muted-foreground bg-white/10 rounded-full px-2 py-0.5">
              <MessagesSquare className="w-3 h-3" />
              {companion._count.messages}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Created by {companion.username.split("@")[0]}</p>
        </div>
      </div>

      <div className="flex items-center gap-x-1">
        {/* Font size controls */}
        <div className="flex items-center gap-x-0.5 rounded-xl bg-white/5 border border-white/10 px-1 py-1 mr-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onFontDecrease}
            className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground"
            title="Decrease font size">
            <span className="text-[11px] font-medium leading-none">A</span>
          </Button>
          <span className="text-xs text-muted-foreground w-6 text-center tabular-nums">{fontSize}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={onFontIncrease}
            className="h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground"
            title="Increase font size">
            <span className="text-[15px] font-medium leading-none">A</span>
          </Button>
        </div>

        {/* Full width toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleFullWidth}
          className="rounded-xl hover:bg-white/10 text-muted-foreground"
          title={isFullWidth ? "Collapse width" : "Expand to full width"}>
          {isFullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {user?.id === companion.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={twMerge(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl hover:bg-white/10")}
              aria-label="Open actions">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-white/10 bg-zinc-900/80 backdrop-blur-md z-50">
              <DropdownMenuItem onClick={handleEdit} className="rounded-lg">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="rounded-lg">
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
