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

interface ChatClientProps {
  companion: ICompanionDB & {
    messages: IMessage[]
    _count: {
      messages: number
    }
  }
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

export function ChatClient({ companion }: ChatClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageProps[]>(mapCompanionMessages(companion.messages))

  useEffect(() => {
    setMessages(mapCompanionMessages(companion.messages))
  }, [companion.messages])

  const { input, isLoading, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${companion.id}`,
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
    },
  })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

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
      <ChatForm isLoading={isLoading} input={input} handleInputChange={handleInputChange} onSubmit={onSubmit} />
    </div>
  )
}
