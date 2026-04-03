"use client"

import { useCompletion } from "ai/react"
import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { useVerifyHuman } from "@/app/hooks/useVerifyHuman"
import { ChatHeader } from "@/components/chat-header"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState } from "react"
import { ChatForm } from "@/components/chat-form"
import { ChatMessages } from "@/components/chat-messages"
import { ChatMessageProps } from "@/components/chat-message"
import { useToast } from "@/components/ui/use-toast"

interface ChatClientProps {
  companion: ICompanionDB & {
    messages: IMessage[]
    _count: {
      messages: number
    }
  }
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

export function ChatClient({ companion, initialTurnstileVerified }: ChatClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessageProps[]>(mapCompanionMessages(companion.messages))
  const turnstileRef = useRef<HTMLDivElement>(null)
  const { isVerified, token } = useVerifyHuman(turnstileRef)
  const requiresHumanVerification = process.env.NODE_ENV === "production"
  const isHumanVerified = !requiresHumanVerification || initialTurnstileVerified || isVerified

  useEffect(() => {
    setMessages(mapCompanionMessages(companion.messages))
  }, [companion.messages])

  const { input, isLoading, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${companion.id}`,
    body: token
      ? {
          turnstileToken: token,
        }
      : undefined,
    onFinish(_prompt, completion) {
      const systemMessage: ChatMessageProps = {
        id: crypto.randomUUID(),
        role: "system",
        content: completion,
      }

      setMessages(current => [...current, systemMessage])
      setInput("")

      router.refresh()
    },
    onError() {
      setMessages(current => current.filter(message => !message.id?.startsWith("pending-user-")))
      toast({
        description: "Message could not be sent. If the robot check is visible, complete it and try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isHumanVerified) {
      toast({
        description: "Complete the robot check before sending a message.",
        variant: "destructive",
      })
      return
    }

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) {
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

  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <ChatHeader companion={companion} />
      <ChatMessages companion={companion} isLoading={isLoading} messages={messages} />
      <ChatForm
        handleInputChange={handleInputChange}
        input={input}
        isHumanVerified={isHumanVerified}
        isLoading={isLoading}
        onSubmit={onSubmit}
        showTurnstile={requiresHumanVerification}
        turnstileRef={turnstileRef}
      />
    </div>
  )
}
