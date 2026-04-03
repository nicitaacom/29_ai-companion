export const GUEST_VISITOR_COOKIE_NAME = "companion_guest_id"
export const GUEST_VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const TURNSTILE_VERIFIED_COOKIE_NAME = "companion_human_verified"
export const TURNSTILE_VERIFIED_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const TURNSTILE_VERIFIED_COOKIE_VALUE = "verified"

export function buildGuestParticipantId(guestId: string) {
  return `guest:${guestId}`
}

export function buildGuestChatStoreKey(companionId: string, guestId: string) {
  return `chat:guest:${guestId}:${companionId}:messages`
}

export function buildRateLimitIdentifier(companionId: string, participantId: string) {
  return `chat:${companionId}:${participantId}`
}
