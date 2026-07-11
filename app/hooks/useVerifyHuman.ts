"use client"

import { RefObject, useCallback, useEffect, useRef, useState } from "react"

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
          theme?: "auto" | "dark" | "light"
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface UseVerifyHumanOptions {
  initialVerified?: boolean
  isEnabled?: boolean
}

export const useVerifyHuman = (
  turnstileRef: RefObject<HTMLDivElement | null>,
  { initialVerified = false, isEnabled = true }: UseVerifyHumanOptions = {},
) => {
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY
  const isBypassed = process.env.NODE_ENV !== "production" || !siteKey || !isEnabled
  const [isVerified, setIsVerified] = useState(false)
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resolvedIsVerified = isBypassed || initialVerified || isVerified
  const resolvedStatus = isBypassed || initialVerified ? "verified" : status

  const clearVerificationFn = useCallback(() => {
    if (isBypassed) {
      setIsVerified(true)
      setStatus("verified")
      setErrorMessage(null)
      return
    }

    setIsVerified(false)
    setStatus("idle")
    setErrorMessage(null)
  }, [isBypassed])

  const resetTurnstileFn = useCallback(() => {
    clearVerificationFn()

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [clearVerificationFn])

  useEffect(() => {
    if (initialVerified || isBypassed || !siteKey) {
      return
    }

    let cancelled = false
    let intervalId: number | undefined
    let mountedNode: HTMLDivElement | null = null

    const renderTurnstile = () => {
      const turnstileNode = turnstileRef.current
      if (!window.turnstile || !turnstileNode || widgetIdRef.current) {
        return false
      }

      mountedNode = turnstileNode
      turnstileNode.innerHTML = ""
      widgetIdRef.current = window.turnstile.render(turnstileNode, {
        sitekey: siteKey,
        theme: "dark",
        callback: async (token: string) => {
          setStatus("verifying")
          setErrorMessage(null)

          try {
            const response = await fetch("/api/turnstile", {
              body: JSON.stringify({ token }),
              headers: {
                "Content-Type": "application/json",
              },
              method: "POST",
            })

            if (!response.ok) {
              if (!cancelled) {
                setIsVerified(false)
                setStatus("error")
                setErrorMessage("Robot check failed. Please try again.")
                window.turnstile?.reset(widgetIdRef.current ?? undefined)
              }
              return
            }

            if (!cancelled) {
              setIsVerified(true)
              setStatus("verified")
            }
          } catch (_error) {
            if (!cancelled) {
              setIsVerified(false)
              setStatus("error")
              setErrorMessage("Robot check could not be completed right now.")
              window.turnstile?.reset(widgetIdRef.current ?? undefined)
            }
          }
        },
        "error-callback": () => {
          if (!cancelled) {
            setIsVerified(false)
            setStatus("error")
            // eslint-disable-next-line local-rules/no-banned-words -- natural English user-facing copy, not a naming choice
            setErrorMessage("Cloudflare Turnstile could not load correctly. Please try again.")
          }
        },
        "expired-callback": () => {
          if (!cancelled) {
            setStatus("idle")
            setErrorMessage("Challenge expired. Please complete it again.")
            setIsVerified(false)
            window.turnstile?.reset(widgetIdRef.current ?? undefined)
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

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }

      if (mountedNode) mountedNode.innerHTML = ""
    }
  }, [initialVerified, isBypassed, siteKey, turnstileRef])

  return {
    errorMessage,
    isVerified: resolvedIsVerified,
    resetTurnstileFn,
    shouldRenderChallenge: !isBypassed && !initialVerified,
    status: resolvedStatus,
  }
}
