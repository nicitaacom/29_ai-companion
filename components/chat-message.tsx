"use client"

import { BeatLoader } from "react-spinners"
import { twMerge } from "tailwind-merge"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useToast } from "./ui/use-toast"
import { BotAvatar } from "./bot-avatar"
import { UserAvatar } from "./user-avatar"
import { Button } from "./ui/button"
import { Copy } from "lucide-react"
import { useTheme } from "./theme-provider"

export interface ChatMessageProps {
  id?: string
  role: "system" | "user"
  content?: string
  isLoading?: boolean
  src?: string
  fontSize?: number
}

export function ChatMessage({ role, content, isLoading, src, fontSize }: ChatMessageProps) {
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()

  const onCopy = () => {
    if (!content) return
    navigator.clipboard.writeText(content)
    toast({ description: "Message copied to clipboard" })
  }

  const isBot = role !== "user"

  return (
    <div className={twMerge("group flex items-end gap-x-3 py-2 w-full", !isBot && "justify-end")}>
      {isBot && src && (
        <div className="shrink-0 mb-1">
          <BotAvatar src={src} />
        </div>
      )}

      <div
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
        className={twMerge(
          "px-5 py-3.5 leading-relaxed",
          isBot
            ? [
                "flex-1 min-w-0",
                "rounded-3xl rounded-bl-md",
                "bg-white/[0.07] dark:bg-white/[0.06]",
                "border border-white/[0.09]",
                "shadow-[0_2px_16px_0_rgba(0,0,0,0.12)]",
                "backdrop-blur-md",
                "text-foreground/90",
              ].join(" ")
            : [
                "max-w-[70%]",
                "rounded-3xl rounded-br-md",
                "bg-white/[0.13] dark:bg-white/[0.11]",
                "border border-white/[0.15]",
                "shadow-[0_2px_16px_0_rgba(0,0,0,0.18)]",
                "backdrop-blur-md",
                "text-foreground",
              ].join(" "),
        )}>
        {isLoading ? (
          <BeatLoader size={5} color={resolvedTheme === "light" ? "#555" : "#aaa"} />
        ) : (
          <div
            style={{ fontSize: "inherit" }}
            className="break-words prose dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:rounded-xl
                       prose-pre:bg-black/30 prose-pre:p-4 prose-code:before:content-none prose-code:after:content-none
                       prose-code:bg-black/20 prose-code:rounded prose-code:px-1 prose-code:py-0.5
                       prose-code:text-[0.85em]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="shrink-0 mb-1">
          <UserAvatar />
        </div>
      )}

      {isBot && !isLoading && (
        <Button
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl hover:bg-white/10 mb-1 shrink-0"
          size="icon"
          variant="ghost"
          onClick={onCopy}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}
