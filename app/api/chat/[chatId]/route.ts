import { NextResponse } from "next/server"
import { Replicate } from "langchain/llms/replicate"
import { CallbackManager } from "langchain/callbacks"
import { StreamingTextResponse, LangChainStream } from "ai"

import { Database, TablesInsert } from "@/app/interfaces/types_db"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { rateLimit } from "@/lib/rate-limit"
import { MemoryManager } from "@/lib/memory"

type CompanionRow = Database["public"]["Tables"]["companion"]["Row"]
type MessageInsert = TablesInsert<"messages">
type MessageInsertList = MessageInsert[]

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params
    const { prompt }: { prompt: string } = await req.json()
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
        content: prompt,
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
    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey)

    // Query Pinecone

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey)

    // Right now the preamble is included in the similarity search, but that
    // shouldn't be an issue

    const similarDocs = await memoryManager.vectorSearch(recentChatHistory, companion_file_name)

    let relevantHistory = ""
    if (!!similarDocs && similarDocs.length !== 0) {
      relevantHistory = similarDocs.map(doc => doc.pageContent).join("\n")
    }
    const { handlers } = LangChainStream()
    // Call Replicate for inference
    const model = new Replicate({
      model: "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
      input: {
        max_length: 2048,
      },
      apiKey: process.env.REPLICATE_API_TOKEN,
      callbackManager: CallbackManager.fromHandlers(handlers),
    })

    // Turn verbose on for debugging
    model.verbose = true

    const resp = String(
      await model
        .call(
          `
        ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

        ${companion.instructions}

        Below are relevant details about ${companion.name}'s past and the conversation you are in.
        ${relevantHistory}


        ${recentChatHistory}\n${companion.name}:`,
        )
        .catch(console.error),
    )

    const cleaned = resp.replaceAll(",", "")
    const chunks = cleaned.split("\n")
    const response = chunks[0]

    await memoryManager.writeToHistory("" + response.trim(), companionKey)
    var Readable = require("stream").Readable

    let s = new Readable()
    s.push(response)
    s.push(null)
    if (response !== undefined && response.length > 1) {
      memoryManager.writeToHistory("" + response.trim(), companionKey)

      // 3.2 Create a new message and return data about this message (to get generated id by supabase of that message)
      const assistantMessages = [
        {
          companion_id: chatId,
          content: response.trim(),
          role: "system",
          user_id: user.id,
        },
      ] satisfies MessageInsertList

      const { error: error_inserting_new_message } = await supabase
        .from("messages")
        // @ts-ignore
        .insert(assistantMessages as MessageInsertList)

      if (error_inserting_new_message) {
        return new NextResponse(
          `error inserting message \n
         ${error_inserting_new_message.message}`,
        )
      }
    }

    return new StreamingTextResponse(s)
  } catch (error) {
    console.log("[CHAT_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
