"use client"

import { useCompletion } from "ai/react"
import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { ChatHeader } from "@/components/chat-header"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { ChatForm } from "@/components/chat-form"
import { ChatMessages } from "@/components/chat-messages"
import { ChatMessageProps } from "@/components/chat-message"
import { useToast } from "@/components/ui/use-toast"

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
  const [companion, setCompanion] = useState<ChatCompanion | null>(null)
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isChatLoading, setIsChatLoading] = useState(true)

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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading || isChatLoading || !companion) {
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
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader companion={companionWithLiveCount} />
      <ChatMessages companion={companionWithLiveCount} isLoading={isLoading} messages={messages} />
      <ChatForm
        handleInputChange={handleInputChange}
        initialTurnstileVerified={initialTurnstileVerified}
        input={input}
        isLoading={isLoading || isChatLoading}
        onSubmit={onSubmit}
      />
    </div>
  )
}
