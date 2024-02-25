"use client"

import { useCompletion } from "ai/react"
import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { IMessage } from "@/app/interfaces/IMessageDB"
import { ChatHeader } from "@/components/chat-header"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
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

export function ChatClient({ companion }: ChatClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages)

  const { input, isLoading, handleInputChange, handleSubmit, setInput } = useCompletion({
    api: `/api/chat/${companion.id}`,
    onFinish(_prompt, completion) {
      const systemMessage: ChatMessageProps = {
        role: "system",
        content: completion,
      }

      setMessages(current => [...current, systemMessage])
      setInput("")

      router.refresh()
    },
  })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const userMessage: ChatMessageProps = {
      role: "user",
      content: input,
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
