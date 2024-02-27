import supabaseServer from "@/lib/supabase/supabaseServer"
import { redirect } from "next/navigation"
import { ChatClient } from "./components/client"

interface ChatIdPageProps {
  params: { chatId: string }
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const {
    data: { user },
  } = await supabaseServer().auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Fetch companion details
  const { data: companion } = await supabaseServer().from("companion").select("*").eq("id", params.chatId).single()

  // Fetch messages for the companion
  const { data: messages, error } = await supabaseServer()
    .from("messages")
    .select("*")
    .eq("id", params.chatId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error(31, "Error fetching messages:", error.message)
    redirect("/")
  }
  if (!companion || !companion.id || !messages) {
    console.error(`Companion or messages not found \n
    companion - ${companion}\n
    messages - ${messages}`)

    redirect("/")
  }

  // Combine the companion and messages
  const companionWithMessages = {
    ...companion,
    messages: messages ?? [],
    _count: {
      messages: messages?.length ?? 0,
    },
  }

  return <ChatClient companion={companionWithMessages} />
}
