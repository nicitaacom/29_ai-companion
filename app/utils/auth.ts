import { useAccountModal } from "@/app/store/ui/accountModal"
import { TAuthModalVariant } from "@/app/store/ui/types/TAuthModalVariant"

const AUTH_QUERY_KEY = "auth"
const IFRAME_QUERY_KEY = "is_iframe"

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"))
  } catch {
    return value
  }
}

function normalizeQueryValue(value: string) {
  return safeDecode(value).trim().toLowerCase()
}

function getNormalizedQueryEntries(search: string) {
  const trimmedSearch = search.startsWith("?") ? search.slice(1) : search

  if (!trimmedSearch) {
    return []
  }

  return trimmedSearch
    .split("&")
    .filter(Boolean)
    .map(entry => {
      const [rawKey, ...rawValueParts] = entry.split("=")

      return [normalizeQueryValue(rawKey ?? ""), normalizeQueryValue(rawValueParts.join("="))] as const
    })
}

export function getNormalizedQueryValue(search: string, key: string) {
  const normalizedKey = normalizeQueryValue(key)

  for (const [entryKey, entryValue] of getNormalizedQueryEntries(search)) {
    if (entryKey === normalizedKey) {
      return entryValue
    }
  }

  return null
}

export function getRequestedAuthVariant(search: string): TAuthModalVariant | null {
  const variant = getNormalizedQueryValue(search, AUTH_QUERY_KEY)

  if (variant === "login" || variant === "register") {
    return variant
  }

  return null
}

export function isIframeMode(search: string) {
  return getNormalizedQueryValue(search, IFRAME_QUERY_KEY) === "true"
}

export function buildAuthUrl({ variant, origin }: { variant: TAuthModalVariant; origin?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || origin || ""

  if (!baseUrl) {
    return `/?auth=${variant}`
  }

  const url = new URL("/", baseUrl)
  url.searchParams.set(AUTH_QUERY_KEY, variant)

  return url.toString()
}

export function openAuthModal(variant: TAuthModalVariant = "login") {
  useAccountModal.getState().openModal(variant)
}
