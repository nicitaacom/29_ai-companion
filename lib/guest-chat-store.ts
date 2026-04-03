import { Redis } from "@upstash/redis"

import { buildGuestChatStoreKey, buildGuestParticipantId } from "@/lib/chat-session"
import { memoryListPush, memoryListRange } from "@/lib/resilient-store"

type GuestChatRole = "user" | "system"

type StoredGuestChatMessage = {
  companion_id: string
  content: string
  created_at: string
  id: string
  role: GuestChatRole
  updated_at: string
  user_id: string
}

const GUEST_CHAT_TTL_SECONDS = 60 * 60 * 24 * 30
const guestChatRedis = Redis.fromEnv()

export async function getGuestChatMessages({
  companionId,
  guestId,
}: {
  companionId: string
  guestId: string
}): Promise<StoredGuestChatMessage[]> {
  const key = buildGuestChatStoreKey(companionId, guestId)
  let storedMessages: string[]

  try {
    storedMessages = (await guestChatRedis.lrange(key, 0, -1)) as string[]
  } catch (error) {
    console.error("[GUEST_CHAT_READ_FALLBACK]", error)
    storedMessages = memoryListRange(key, 0, -1)
  }

  return storedMessages
    .map(message => {
      try {
        return JSON.parse(message) as StoredGuestChatMessage
      } catch (_error) {
        return null
      }
    })
    .filter((message): message is StoredGuestChatMessage => Boolean(message))
}

export async function appendGuestChatMessage({
  companionId,
  content,
  guestId,
  role,
}: {
  companionId: string
  content: string
  guestId: string
  role: GuestChatRole
}) {
  const key = buildGuestChatStoreKey(companionId, guestId)
  const timestamp = new Date().toISOString()
  const message: StoredGuestChatMessage = {
    companion_id: companionId,
    content,
    created_at: timestamp,
    id: crypto.randomUUID(),
    role,
    updated_at: timestamp,
    user_id: buildGuestParticipantId(guestId),
  }

  const serializedMessage = JSON.stringify(message)

  try {
    await guestChatRedis.rpush(key, serializedMessage)
    await guestChatRedis.expire(key, GUEST_CHAT_TTL_SECONDS)
  } catch (error) {
    console.error("[GUEST_CHAT_WRITE_FALLBACK]", error)
    memoryListPush(key, serializedMessage)
  }

  return message
}
