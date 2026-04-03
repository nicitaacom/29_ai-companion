"use client"

import { MutableRefObject, useEffect, useState } from "react"

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

export const useVerifyHuman = (turnstileRef: MutableRefObject<HTMLDivElement | null>) => {
  const [isVerified, setIsVerified] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !turnstileRef.current) {
      return
    }

    let isCancelled = false
    let intervalId: number | undefined

    const renderTurnstile = () => {
      if (isCancelled || !turnstileRef.current || !window.turnstile) {
        return false
      }

      const widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
        callback: (nextToken: string) => {
          if (isCancelled) {
            return
          }

          setToken(nextToken)
          setIsVerified(true)
        },
        "expired-callback": () => {
          if (isCancelled) {
            return
          }

          setToken(null)
          setIsVerified(false)
          window.turnstile?.reset(widgetId)
        },
        "error-callback": () => {
          if (isCancelled) {
            return
          }

          setToken(null)
          setIsVerified(false)
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
      isCancelled = true

      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [turnstileRef])

  return { isVerified, token }
}
