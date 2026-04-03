"use client"

import { RefObject, useEffect, useState } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          callback: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          sitekey?: string
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

export const useVerifyHuman = (turnstileRef: RefObject<HTMLDivElement | null>) => {
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !turnstileRef.current || !process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY) {
      return
    }

    let cancelled = false
    let intervalId: number | undefined

    const renderTurnstile = () => {
      if (!turnstileRef.current || !window.turnstile) {
        return false
      }

      window.turnstile.render(turnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
        callback: async (token: string) => {
          try {
            const response = await fetch("/api/turnstile", {
              body: JSON.stringify({ token }),
              headers: {
                "Content-Type": "application/json",
              },
              method: "POST",
            })

            if (!response.ok) {
              setIsVerified(false)
              return
            }

            if (!cancelled) {
              setIsVerified(true)
            }
          } catch (_error) {
            if (!cancelled) {
              setIsVerified(false)
            }
          }
        },
        "error-callback": () => {
          if (!cancelled) {
            setIsVerified(false)
          }
        },
        "expired-callback": () => {
          if (!cancelled) {
            setIsVerified(false)
          }
        },
      })

      return true
    }

    if (!renderTurnstile()) {
      intervalId = window.setInterval(() => {
        if (renderTurnstile() && intervalId) {
          window.clearInterval(intervalId)
        }
      }, 250)
    }

    return () => {
      cancelled = true

      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isVerified }
}
