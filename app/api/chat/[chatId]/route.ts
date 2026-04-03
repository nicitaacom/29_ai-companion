import { NextResponse } from "next/server"
import OpenAI from "openai"

import { Database, TablesInsert } from "@/app/interfaces/types_db"
import {
  buildRateLimitIdentifier,
  TURNSTILE_VERIFIED_COOKIE_MAX_AGE,
  TURNSTILE_VERIFIED_COOKIE_NAME,
  TURNSTILE_VERIFIED_COOKIE_VALUE,
} from "@/lib/chat-session"
import { getChatVisitor, hasVerifiedHumanCookie } from "@/lib/chat-visitor"
import { appendGuestChatMessage } from "@/lib/guest-chat-store"
import supabaseServer from "@/lib/supabase/supabaseServer"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"
import { rateLimit } from "@/lib/rate-limit"
import { MemoryManager } from "@/lib/memory"
import { verifyTurnstileToken } from "@/lib/turnstile"

type CompanionRow = Database["public"]["Tables"]["companion"]["Row"]
type MessageInsert = TablesInsert<"messages">
type MessageInsertList = MessageInsert[]

function sanitizeHistory(history: string) {
  return history
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.toLowerCase() !== "undefined" && line.toLowerCase() !== "null")
    .join("\n")
}

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params
    const {
      prompt,
      turnstileToken,
    }: {
      prompt?: string
      turnstileToken?: string
    } = await req.json()
    const supabase = await supabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const visitor = await getChatVisitor(user)
    const hasHumanVerification = await hasVerifiedHumanCookie()
    let shouldSetHumanVerificationCookie = false

    if (!chatId) {
      return new NextResponse("Chat id is required", { status: 400 })
    }

    if (!prompt?.trim()) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const cleanPrompt = prompt.trim()

    if (process.env.NODE_ENV === "production" && !hasHumanVerification) {
      const cleanTurnstileToken = turnstileToken?.trim()

      if (!cleanTurnstileToken) {
        return new NextResponse("Complete the robot check before sending a message.", { status: 403 })
      }

      const forwardedFor = req.headers.get("x-forwarded-for")
      const ipAddress = req.headers.get("cf-connecting-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? null
      const verification = await verifyTurnstileToken({
        ip: ipAddress,
        token: cleanTurnstileToken,
      })

      if (!verification.success) {
        return new NextResponse("Robot check failed. Please try again.", { status: 403 })
      }

      shouldSetHumanVerificationCookie = true
    }

    if (visitor.isFreeUser) {
      const identifier = buildRateLimitIdentifier(chatId, visitor.participantId)
      const { success } = await rateLimit(identifier)

      if (!success) {
        return new NextResponse("Rate limit exceeded", { status: 429 })
      }
    }

    // 3. Repeating this - https://github.com/AntonioErdeljac/next13-ai-companion/blob/master/app/api/chat/%5BchatId%5D/route.ts#L33-L46

    // 3.1 Select companion based on params.chatId (in fact its not chat id but companion_id) - userstand its like chat with companion id
    const { data: companion_response, error: error_selecting_companion } = await supabaseAdmin
      .from("companion")
      .select()
      .eq("id", chatId)
      .single()
    if (error_selecting_companion) {
      return new NextResponse(
        `error selecting companion \n
        chatId !eq id (companion id) ${error_selecting_companion.message}`,
      )
    }

    const companion = companion_response as CompanionRow | null

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

    const nextResponse = new NextResponse(response, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })

    if (shouldSetHumanVerificationCookie) {
      nextResponse.cookies.set({
        httpOnly: true,
        maxAge: TURNSTILE_VERIFIED_COOKIE_MAX_AGE,
        name: TURNSTILE_VERIFIED_COOKIE_NAME,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        value: TURNSTILE_VERIFIED_COOKIE_VALUE,
      })
    }

    return nextResponse
  } catch (error) {
    console.log("[CHAT_POST]", error)
    return new NextResponse("Companion could not respond right now", { status: 500 })
  }
}
