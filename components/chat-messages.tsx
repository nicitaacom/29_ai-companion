"use client"

import { ElementRef, useEffect, useRef, useState } from "react"

import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import { ChatMessage, ChatMessageProps } from "./chat-message"

interface ChatMessagesProps {
  messages: ChatMessageProps[]
  isLoading: boolean
  companion: ICompanionDB
  fontSize: number
  streamingContent: string
}

export function ChatMessages({ messages, isLoading, companion, fontSize, streamingContent }: ChatMessagesProps) {
  const scrollRef = useRef<ElementRef<"div">>(null)
  const [fakeLoading, setFakeLoading] = useState(messages.length === 0 ? true : false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFakeLoading(false)
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] shadow-inner">
      <ChatMessage
        isLoading={fakeLoading}
        src={companion.src}
        role="system"
        content={`Hello, I am ${companion.name}, ${companion.description}`}
        fontSize={fontSize}
      />
      {messages.map(message => (
        <ChatMessage
          key={message.id ?? `${message.role}-${message.content ?? "empty"}`}
          src={companion.src}
          content={message.content}
          role={message.role}
          fontSize={fontSize}
        />
      ))}
      {isLoading && (
        <ChatMessage
          src={companion.src}
          role="system"
          isLoading={!streamingContent}
          content={streamingContent || undefined}
          fontSize={fontSize}
        />
      )}
      <div ref={scrollRef} />
    </div>
  )
}
