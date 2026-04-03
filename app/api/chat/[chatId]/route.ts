import { NextResponse } from "next/server"
import OpenAI from "openai"

import { Database, TablesInsert } from "@/app/interfaces/types_db"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { rateLimit } from "@/lib/rate-limit"
import { MemoryManager } from "@/lib/memory"

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
    const { prompt }: { prompt?: string } = await req.json()
    const supabase = await supabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Check is user authenticated
    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!chatId) {
      return new NextResponse("Chat id is required", { status: 400 })
    }

    if (!prompt?.trim()) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const cleanPrompt = prompt.trim()

    const identifier = req.url + "-" + user.id
    const { success } = await rateLimit(identifier)

    // 2. Check rate limit by identifier (as I understood limit of messages in some amount of time)
    if (!success) {
      return new NextResponse("Rate Limit exeeded", { status: 429 })
    }

    // 3. Repeating this - https://github.com/AntonioErdeljac/next13-ai-companion/blob/master/app/api/chat/%5BchatId%5D/route.ts#L33-L46

    // 3.1 Select companion based on params.chatId (in fact its not chat id but companion_id) - userstand its like chat with companion id
    const { data: companion_response, error: error_selecting_companion } = await supabase
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
    const userMessages = [
      {
        companion_id: chatId,
        content: cleanPrompt,
        role: "user",
        user_id: user.id,
      },
    ] satisfies MessageInsertList

    const { error: error_inserting_new_message } = await supabase
      .from("messages")
      // @ts-ignore
      .insert(userMessages as MessageInsertList)

    if (error_inserting_new_message) {
      return new NextResponse(
        `error inserting message \n
         ${error_inserting_new_message.message}`,
      )
    }

    const name = companion.id
    const companion_file_name = name + ".txt"

    const companionKey = {
      companionName: name,
      userId: user.id,
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

    const assistantMessages = [
      {
        companion_id: chatId,
        content: response,
        role: "system",
        user_id: user.id,
      },
    ] satisfies MessageInsertList

    const { error: error_inserting_assistant_message } = await supabase
      .from("messages")
      // @ts-ignore
      .insert(assistantMessages as MessageInsertList)

    if (error_inserting_assistant_message) {
      return new NextResponse(
        `error inserting message \n
         ${error_inserting_assistant_message.message}`,
      )
    }

    return new NextResponse(response, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.log("[CHAT_POST]", error)
    return new NextResponse("Companion could not respond right now", { status: 500 })
  }
}
