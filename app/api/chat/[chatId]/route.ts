import { StreamingTextResponse } from "ai"
import { CallbackManager } from "langchain/callbacks"
import { Replicate } from "langchain/llms/replicate"
import { NextResponse } from "next/server"

import { MemoryManager } from "@/lib/memory"
import { Ratelimit } from "@upstash/ratelimit"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { prompt } = await req.json()
    const {
      data: { user },
    } = await supabaseServer().auth.getUser()

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const identifier = req.url + "-" + user.id
    const { success } = await rateLimit(identifier)

    if (!success) {
      return new NextResponse("Rate Limit exeeded", { status: 429 })
    }

    // Create a new message
    const { data: newMessage, error: error_inserting_new_message } = await supabaseServer()
      .from("messages")
      .insert([{ companion_id: params.chatId, content: prompt, role: "user", user_id: user.id }])
      .select()
    console.log(34, "message - ", newMessage)

    if (error_inserting_new_message) {
      console.log("Error inserting new message: ", error_inserting_new_message)
      return new NextResponse("Error instering message", { status: 404 })
    }

    const name = params.chatId
    const companion_file_name = name + ".txt"

    const companionKey = { companionName: name, userId: user.id, modelName: "llama2-13b" }

    const memoryManager = await MemoryManager.getInstance()

    const records = await memoryManager.readLatestHistory(companionKey)

    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed)
    }
  } catch (error) {
    console.log("[CHAT_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
