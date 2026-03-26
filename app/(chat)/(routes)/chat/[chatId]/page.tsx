import { Database } from "@/app/interfaces/types_db"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { redirect } from "next/navigation"
import { ChatClient } from "./components/client"

export const dynamic = "force-dynamic"

type CompanionRow = Database["public"]["Tables"]["companion"]["Row"]
type MessageRow = Database["public"]["Tables"]["messages"]["Row"]

interface ChatIdPageProps {
  params: Promise<{ chatId: string }>
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { chatId } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  if (!chatId) {
    redirect("/")
  }

  // Fetch companion details
  const { data: companion, error: companionError } = await supabase
    .from("companion")
    .select("*")
    .eq("id", chatId)
    .single()

  // Fetch messages for the companion
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("companion_id", chatId)
    .order("created_at", { ascending: true })

  if (companionError) {
    console.error(25, "Error fetching companion:", companionError.message)
    redirect("/")
  }

  if (messagesError) {
    console.error(31, "Error fetching messages:", messagesError.message)
    redirect("/")
  }

  const companionData = companion as CompanionRow | null
  const messageData = (messages ?? []) as unknown as MessageRow[]

  if (!companionData || !companionData.id) {
    console.error(`Companion or messages not found \n
    companion - ${companionData}\n
    messages - ${messageData}`)

    redirect("/")
  }

  // Combine the companion and messages
  const companionWithMessages = {
    ...companionData,
    messages: messageData,
    _count: {
      messages: messageData.length,
    },
  }

  return <ChatClient companion={companionWithMessages} />
}
