import { cookies } from "next/headers"

import {
  buildGuestParticipantId,
  GUEST_VISITOR_COOKIE_NAME,
  TURNSTILE_VERIFIED_COOKIE_NAME,
  TURNSTILE_VERIFIED_COOKIE_VALUE,
} from "@/lib/chat-session"

type AuthLikeUser = {
  id?: string | null
} | null

export async function getGuestVisitorId() {
  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_VISITOR_COOKIE_NAME)?.value?.trim()

  return guestId || null
}

export async function hasVerifiedHumanCookie() {
  const cookieStore = await cookies()

  return cookieStore.get(TURNSTILE_VERIFIED_COOKIE_NAME)?.value === TURNSTILE_VERIFIED_COOKIE_VALUE
}

export async function getChatVisitor(user: AuthLikeUser) {
  if (user?.id) {
    return {
      guestId: null,
      isAuthenticated: true,
      isFreeUser: false,
      participantId: user.id,
      userId: user.id,
    }
  }

  const getGuestVisitorIdResp = await getGuestVisitorId()

  return {
    guestId: getGuestVisitorIdResp,
    isAuthenticated: false,
    isFreeUser: true,
    participantId: getGuestVisitorIdResp ? buildGuestParticipantId(getGuestVisitorIdResp) : "guest:anonymous",
    userId: null,
  }
}
