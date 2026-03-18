import { Redis } from "@upstash/redis"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { Pinecone } from "@pinecone-database/pinecone"
import { PineconeStore } from "langchain/vectorstores/pinecone"

export type CompanionKey = {
  companionName: string
  modelName: string
  userId: string
}

export class MemoryManager {
  private static instance: MemoryManager
  private history: Redis
  private vectorDBClient: Pinecone

  public constructor() {
    this.history = Redis.fromEnv()
    this.vectorDBClient = new Pinecone({
      apiKey: this.getRequiredEnv("PINECONE_API_KEY"),
    })
  }

  public async init() {
    this.getPineconeIndex()
  }

  public async vectorSearch(recentChatHistory: string, companionFileName: string) {
    const pineconeIndex = this.getPineconeIndex()

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey: this.getRequiredEnv("OPENAI_KEY") }),
      { pineconeIndex },
    )

    const similarDocs = await vectorStore
      .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
      .catch(err => {
        console.log("WARNING: failed to get vector search results.", err)
      })
    return similarDocs
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
      await MemoryManager.instance.init()
    }
    return MemoryManager.instance
  }

  private generateRedisCompanionKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.modelName}-${companionKey.userId}`
  }

  private getPineconeIndex() {
    const name = this.getRequiredEnv("PINECONE_INDEX")
    const host = process.env.PINECONE_ENVIRONMENT?.trim()

    // Keep the existing env name for backward compatibility, but treat it as the index host for the modern SDK.
    if (host) {
      return this.vectorDBClient.index({ host, name })
    }

    return this.vectorDBClient.index({ name })
  }

  private getRequiredEnv(name: "OPENAI_KEY" | "PINECONE_API_KEY" | "PINECONE_INDEX") {
    const value = process.env[name]?.trim()

    if (!value) {
      throw new Error(`${name} is not set`)
    }

    return value
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly")
      return ""
    }

    const key = this.generateRedisCompanionKey(companionKey)
    const result = await this.history.zadd(key, {
      score: Date.now(),
      member: text,
    })

    return result
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly")
      return ""
    }

    const key = this.generateRedisCompanionKey(companionKey)
    let result = await this.history.zrange(key, 0, Date.now(), {
      byScore: true,
    })

    result = result.slice(-30).reverse()
    const recentChats = result.reverse().join("\n")
    return recentChats
  }

  public async seedChatHistory(seedContent: String, delimiter: string = "\n", companionKey: CompanionKey) {
    const key = this.generateRedisCompanionKey(companionKey)
    if (await this.history.exists(key)) {
      console.log("User already has chat history")
      return
    }

    const content = seedContent.split(delimiter)
    let counter = 0
    for (const line of content) {
      await this.history.zadd(key, { score: counter, member: line })
      counter += 1
    }
  }
}
