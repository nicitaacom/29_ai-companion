"use client"

import { useSearchParams } from "next/navigation"

import { TAuthModalVariant } from "@/app/store/ui/types/TAuthModalVariant"
import { buildAuthUrl, isIframeMode, openAuthModal } from "@/app/utils/auth"

export function useAuthOpen() {
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const iframeMode = isIframeMode(search)

  const getAuthUrl = (variant: TAuthModalVariant) => buildAuthUrl({ variant })

  const openAuth = (variant: TAuthModalVariant = "login") => {
    if (iframeMode) {
      window.open(buildAuthUrl({ variant, origin: window.location.origin }), "_blank", "noopener,noreferrer")
      return
    }

    openAuthModal(variant)
  }

  return {
    getAuthUrl,
    isIframeMode: iframeMode,
    openAuth,
  }
}
