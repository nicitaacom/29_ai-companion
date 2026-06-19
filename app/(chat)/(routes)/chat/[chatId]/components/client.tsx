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
import { FullscreenTurnstileGate } from "@/components/fullscreen-turnstile-gate"

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

export function ChatClient({ chatId, initialTurnstileVerified }: ChatClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const [companion, setCompanion] = useState<ChatCompanion | null>(null)
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isChatLoading, setIsChatLoading] = useState(true)
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

  const { input, isLoading, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${chatId}`,
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
      setMessages(current => current.filter(message => !message.id?.startsWith("pending-user-")))
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

  return (
    <div className="flex h-full flex-col space-y-2 p-4">
      {shouldRenderChallenge && !isHumanVerified ? (
        <FullscreenTurnstileGate
          errorMessage={errorMessage}
          onRetry={resetTurnstileFn}
          status={status}
          turnstileRef={turnstileRef}
        />
      ) : null}
      <ChatHeader companion={companionWithLiveCount} />
      <ChatMessages companion={companionWithLiveCount} isLoading={isLoading} messages={messages} />
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
