import { NextResponse } from "next/server"
import OpenAI from "openai"

import { Database, TablesInsert } from "@/app/interfaces/types_db"
import { getChatVisitor, hasVerifiedHumanCookie } from "@/lib/chat-visitor"
import { appendGuestChatMessage, getGuestChatMessages } from "@/lib/guest-chat-store"
import { getSupabaseRouteHandlerClient } from "@/lib/supabase/supabaseRoute"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { rateLimitChatRequest } from "@/lib/rate-limit"
import { MemoryManager } from "@/lib/memory"

type CompanionRow = Database["public"]["Tables"]["companion"]["Row"]
type MessageInsert = TablesInsert<"messages">
type MessageInsertList = MessageInsert[]
type MessageRow = Database["public"]["Tables"]["messages"]["Row"]

export const runtime = "nodejs"
export const maxDuration = 60

function sanitizeHistory(history: string) {
  return history
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.toLowerCase() !== "undefined" && line.toLowerCase() !== "null")
    .join("\n")
}

function filterValidMessages(messages: MessageRow[]) {
  return messages.filter(message => {
    const content = message.content?.trim()
    return Boolean(content) && content?.toLowerCase() !== "undefined" && content?.toLowerCase() !== "null"
  })
}

async function getChatRequestContext() {
  const supabase = await getSupabaseRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const visitor = await getChatVisitor(user)
  const hasHumanVerification = await hasVerifiedHumanCookie()

  return {
    hasHumanVerification,
    visitor,
  }
}

async function getCompanion(chatId: string) {
  const { data: companion, error } = await supabaseAdmin.from("companion").select("*").eq("id", chatId).maybeSingle()

  if (error) {
    throw new Error(`Error fetching companion: ${error.message}`)
  }

  if (!companion) {
    return null
  }

  return companion as CompanionRow
}

async function getMessagesForVisitor({
  chatId,
  visitor,
}: {
  chatId: string
  visitor: Awaited<ReturnType<typeof getChatVisitor>>
}) {
  if (visitor.isAuthenticated) {
    const { data: dbMessages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("companion_id", chatId)
      .eq("user_id", visitor.participantId)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Error fetching messages: ${error.message}`)
    }

    return (dbMessages ?? []) as MessageRow[]
  }

  if (!visitor.guestId) {
    return [] as MessageRow[]
  }

  return (await getGuestChatMessages({
    companionId: chatId,
    guestId: visitor.guestId,
  })) as MessageRow[]
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  return req.headers.get("cf-connecting-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? null
}

export async function GET(_req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params

    if (!chatId) {
      return new NextResponse("Chat id is required", { status: 400 })
    }

    const [{ visitor }, companion] = await Promise.all([getChatRequestContext(), getCompanion(chatId)])

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 })
    }

    const messages = filterValidMessages(await getMessagesForVisitor({ chatId, visitor }))

    return NextResponse.json({
      companion: {
        ...companion,
        messages,
        _count: {
          messages: messages.length,
        },
      },
    })
  } catch (error) {
    console.error("[CHAT_GET]", error)
    return new NextResponse("Chat could not be loaded right now", { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params
    const { prompt }: { prompt?: string } = await req.json()
    const { hasHumanVerification, visitor } = await getChatRequestContext()

    if (!chatId) {
      return new NextResponse("Chat id is required", { status: 400 })
    }

    if (!prompt?.trim()) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const cleanPrompt = prompt.trim()
    const ipAddress = getRequestIp(req)

    if (process.env.NODE_ENV === "production") {
      const { reset, success } = await rateLimitChatRequest({
        ipAddress,
        isAuthenticated: visitor.isAuthenticated,
        participantId: visitor.participantId,
      })

      if (!success) {
        return new NextResponse("Rate limit exceeded", {
          headers: reset
            ? {
                "Retry-After": Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
              }
            : undefined,
          status: 429,
        })
      }
    }

    if (process.env.NODE_ENV === "production" && !hasHumanVerification) {
      return new NextResponse("Complete the robot check before sending a message.", { status: 403 })
    }

    const companion = await getCompanion(chatId)

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 })
    }

    // 3.2 Create a new message and return data about this message (to get generated id by supabase of that message)
    if (visitor.isAuthenticated && visitor.userId) {
      const userMessages = [
        {
          companion_id: chatId,
          content: cleanPrompt,
          role: "user",
          user_id: visitor.userId,
        },
      ] satisfies MessageInsertList

      const { error: error_inserting_new_message } = await supabaseAdmin
        .from("messages")
        // @ts-ignore
        .insert(userMessages as MessageInsertList)

      if (error_inserting_new_message) {
        return new NextResponse(
          `error inserting message \n
         ${error_inserting_new_message.message}`,
        )
      }
    } else if (visitor.guestId) {
      await appendGuestChatMessage({
        companionId: chatId,
        content: cleanPrompt,
        guestId: visitor.guestId,
        role: "user",
      })
    }

    const name = companion.id
    const companion_file_name = name + ".txt"

    const companionKey = {
      companionName: name,
      userId: visitor.participantId,
      modelName: "llama2-13b",
    }
    const memoryManager = await MemoryManager.getInstance()

    const records = await memoryManager.readLatestHistory(companionKey)
    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey)
    }
    await memoryManager.writeToHistory(`Human: ${cleanPrompt}`, companionKey)

    // Query Pinecone

    const recentChatHistory = sanitizeHistory(await memoryManager.readLatestHistory(companionKey))

    // Right now the preamble is included in the similarity search, but that
    // shouldn't be an issue

    const similarDocs = await memoryManager.vectorSearch(recentChatHistory, companion_file_name)

    let relevantHistory = ""
    if (!!similarDocs && similarDocs.length !== 0) {
      relevantHistory = sanitizeHistory(similarDocs.map(doc => doc.pageContent).join("\n"))
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are ${companion.name}. Reply as this companion, staying in character.

Only generate plain sentences without prefixes like "${companion.name}:" or "Assistant:".

Character instructions:
${companion.instructions}

Relevant past details:
${relevantHistory || "No additional relevant history."}

Conversation so far:
${recentChatHistory || "No prior conversation."}`,
        },
        {
          role: "user",
          content: cleanPrompt,
        },
      ],
    })

    const response = completion.choices[0]?.message?.content?.trim()

    if (!response) {
      return new NextResponse("Model returned an empty response", { status: 502 })
    }

    await memoryManager.writeToHistory(`${companion.name}: ${response}`, companionKey)

    if (visitor.isAuthenticated && visitor.userId) {
      const assistantMessages = [
        {
          companion_id: chatId,
          content: response,
          role: "system",
          user_id: visitor.userId,
        },
      ] satisfies MessageInsertList

      const { error: error_inserting_assistant_message } = await supabaseAdmin
        .from("messages")
        // @ts-ignore
        .insert(assistantMessages as MessageInsertList)

      if (error_inserting_assistant_message) {
        return new NextResponse(
          `error inserting message \n
         ${error_inserting_assistant_message.message}`,
        )
      }
    } else if (visitor.guestId) {
      await appendGuestChatMessage({
        companionId: chatId,
        content: response,
        guestId: visitor.guestId,
        role: "system",
      })
    }

    return new NextResponse(response, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("[CHAT_POST]", error)
    return new NextResponse("Companion could not respond right now", { status: 500 })
  }
}
