import { redirect } from "next/navigation"

import { ChatClient } from "./components/client"
import { hasVerifiedHumanCookie } from "@/lib/chat-visitor"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ChatIdPageProps {
  params: Promise<{ chatId: string }>
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { chatId } = await params

  if (!chatId) {
    redirect("/")
  }

  const initialTurnstileVerified = await hasVerifiedHumanCookie()

  return <ChatClient chatId={chatId} initialTurnstileVerified={initialTurnstileVerified} />
}
