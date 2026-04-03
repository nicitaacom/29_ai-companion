import { Database } from "@/app/interfaces/types_db"
import { getChatVisitor, hasVerifiedHumanCookie } from "@/lib/chat-visitor"
import { getGuestChatMessages } from "@/lib/guest-chat-store"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
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
  const visitor = await getChatVisitor(user)

  if (!chatId) {
    redirect("/")
  }

  // Fetch companion details
  const { data: companion, error: companionError } = await supabaseAdmin
    .from("companion")
    .select("*")
    .eq("id", chatId)
    .single()

  if (companionError) {
    console.error(25, "Error fetching companion:", companionError.message)
    redirect("/")
  }

  const companionData = companion as CompanionRow | null
  let messages: MessageRow[] = []

  if (visitor.isAuthenticated) {
    const { data: dbMessages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("companion_id", chatId)
      .eq("user_id", visitor.participantId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error(31, "Error fetching messages:", messagesError.message)
      redirect("/")
    }

    messages = (dbMessages ?? []) as MessageRow[]
  } else if (visitor.guestId) {
    messages = (await getGuestChatMessages({
      companionId: chatId,
      guestId: visitor.guestId,
    })) as unknown as MessageRow[]
  }

  const messageData = messages.filter(message => {
    const content = message.content?.trim()
    return Boolean(content) && content?.toLowerCase() !== "undefined" && content?.toLowerCase() !== "null"
  })
  const initialTurnstileVerified = await hasVerifiedHumanCookie()

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

  return <ChatClient companion={companionWithMessages} initialTurnstileVerified={initialTurnstileVerified} />
}
