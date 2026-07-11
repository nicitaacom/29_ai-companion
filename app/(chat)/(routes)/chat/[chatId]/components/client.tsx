"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useCompletion } from "@ai-sdk/react"
import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { ChatHeader } from "@/components/chat-header"
import { ChatForm } from "@/components/chat-form"
import { ChatMessages } from "@/components/chat-messages"
import { ChatMessageProps } from "@/components/chat-message"
import { useToast } from "@/components/ui/use-toast"
import { useVerifyHuman } from "@/app/hooks/useVerifyHuman"
import { FullscreenTurnstileGate } from "@/components/turnstile/fullscreen-turnstile-gate"

interface ChatCompanion extends ICompanionDB {
  messages: IMessage[]
  _count: {
    messages: number
  }
}

interface ChatClientProps {
  chatId: string
  initialTurnstileVerified: boolean
}

function mapCompanionMessages(messages: IMessage[]): ChatMessageProps[] {
  return messages
    .filter(message => {
      const content = message.content?.trim()
      return Boolean(content) && content?.toLowerCase() !== "undefined" && content?.toLowerCase() !== "null"
    })
    .map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }))
}

const FONT_SIZES = [13, 14, 15, 16, 17, 18, 20] as const
const FONT_SIZE_DEFAULT_IDX = 2

export function ChatClient({ chatId, initialTurnstileVerified }: ChatClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const [companion, setCompanion] = useState<ChatCompanion | null>(null)
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isChatLoading, setIsChatLoading] = useState(true)
  const [isFullWidth, setIsFullWidth] = useState(false)
  const [fontSizeIdx, setFontSizeIdx] = useState(FONT_SIZE_DEFAULT_IDX)

  const { errorMessage, isVerified, resetTurnstileFn, shouldRenderChallenge, status } = useVerifyHuman(turnstileRef, {
    initialVerified: initialTurnstileVerified,
  })
  const isHumanVerified = process.env.NODE_ENV !== "production" || initialTurnstileVerified || isVerified

  useEffect(() => {
    const abortController = new AbortController()

    const loadChat = async () => {
      try {
        setIsChatLoading(true)

        const response = await fetch(`/api/chat/${chatId}`, {
          cache: "no-store",
          signal: abortController.signal,
        })

        if (!response.ok) {
          if (response.status === 404) {
            router.replace("/")
            return
          }

          throw new Error(`Failed to load chat (${response.status})`)
        }

        const data = (await response.json()) as {
          companion: ChatCompanion
        }

        setCompanion(data.companion)
        setMessages(mapCompanionMessages(data.companion.messages))
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        console.error("[CHAT_CLIENT_LOAD]", error)
        toast({
          description: "Chat could not be loaded right now.",
          variant: "destructive",
        })
        router.replace("/")
      } finally {
        if (!abortController.signal.aborted) {
          setIsChatLoading(false)
        }
      }
    }

    loadChat()

    return () => {
      abortController.abort()
    }
  }, [chatId, router, toast])

  const { input, isLoading, completion, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${chatId}`,
    streamProtocol: "text",
    onFinish(_prompt, completion) {
      const systemMessage: ChatMessageProps = {
        id: crypto.randomUUID(),
        role: "system",
        content: completion,
      }

      setMessages(current => [...current, systemMessage])
      setInput("")
    },
    onError(error) {
      const failedMessage = messages.find(message => message.id?.startsWith("pending-user-"))
      setMessages(current => current.filter(message => !message.id?.startsWith("pending-user-")))
      if (failedMessage?.content) setInput(failedMessage.content)
      toast({
        description:
          error.message || "Message could not be sent. If the robot check is visible, complete it and try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading || isChatLoading || !companion || !isHumanVerified) {
      return
    }

    const userMessage: ChatMessageProps = {
      id: `pending-user-${crypto.randomUUID()}`,
      role: "user",
      content: trimmedInput,
    }
    setMessages(current => [...current, userMessage])

    handleSubmit(e)
    setInput("")
  }

  if (isChatLoading || !companion) {
    return <div className="flex h-full items-center justify-center p-4 text-sm text-zinc-400">Loading chat...</div>
  }

  const companionWithLiveCount: ChatCompanion = {
    ...companion,
    _count: {
      messages: messages.length,
    },
  }

  const fontSize = FONT_SIZES[fontSizeIdx]

  return (
    <div
      className="flex h-full flex-col gap-3 p-4 mx-auto w-full transition-all duration-500 ease-in-out"
      style={{ fontSize: `${fontSize}px`, maxWidth: isFullWidth ? "100%" : "56rem" }}>
      {shouldRenderChallenge ? (
        <FullscreenTurnstileGate
          errorMessage={errorMessage}
          onRetry={resetTurnstileFn}
          status={status}
          turnstileRef={turnstileRef}
          hidden={isHumanVerified}
        />
      ) : null}
      <ChatHeader
        companion={companionWithLiveCount}
        isFullWidth={isFullWidth}
        onToggleFullWidth={() => setIsFullWidth(currentIsFullWidth => !currentIsFullWidth)}
        fontSize={fontSize}
        onFontIncrease={() => setFontSizeIdx(currentIndex => Math.min(currentIndex + 1, FONT_SIZES.length - 1))}
        onFontDecrease={() => setFontSizeIdx(currentIndex => Math.max(currentIndex - 1, 0))}
      />
      <ChatMessages
        companion={companionWithLiveCount}
        isLoading={isLoading}
        messages={messages}
        fontSize={fontSize}
        streamingContent={completion}
      />
      <ChatForm
        handleInputChange={handleInputChange}
        input={input}
        isHumanVerified={isHumanVerified}
        isLoading={isLoading || isChatLoading}
        onSubmit={onSubmit}
      />
    </div>
  )
}
