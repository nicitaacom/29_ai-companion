"use client"

import { AuthModalVariant } from "@/app/store/ui/accountModal"
import { buildAuthUrl, isIframeMode, openAuthModal } from "@/app/utils/auth"
import { useSearchParams } from "next/navigation"

export function useAuthOpen() {
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const iframeMode = isIframeMode(search)

  const getAuthUrl = (variant: AuthModalVariant) => buildAuthUrl({ variant })

  const openAuth = (variant: AuthModalVariant = "login") => {
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
