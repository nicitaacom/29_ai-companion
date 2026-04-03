"use client"

import { MutableRefObject, useEffect, useState } from "react"

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script"
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

declare global {
  interface Window {
    turnstile?: {
      remove?: (widgetId: string) => void
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

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile can only load in the browser."))
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null

    const handleLoad = () => resolve()
    const handleError = () => {
      turnstileScriptPromise = null
      reject(new Error("Cloudflare Turnstile failed to load."))
    }

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true })
      existingScript.addEventListener("error", handleError, { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

export const useVerifyHuman = (
  turnstileRef: MutableRefObject<HTMLDivElement | null>,
  { enabled }: { enabled: boolean },
) => {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY?.trim()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setErrorMessage(null)
      setIsVerified(false)
      setToken(null)
      return
    }

    if (!siteKey) {
      setErrorMessage("Robot check is unavailable because the Turnstile site key is not configured.")
      setIsVerified(false)
      setToken(null)
      return
    }

    if (!turnstileRef.current) {
      return
    }

    let isCancelled = false
    let widgetId: string | null = null

    setErrorMessage(null)

    loadTurnstileScript()
      .then(() => {
        if (isCancelled || !turnstileRef.current || !window.turnstile) {
          return
        }

        turnstileRef.current.innerHTML = ""

        widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (nextToken: string) => {
            if (isCancelled) {
              return
            }

            setToken(nextToken)
            setIsVerified(true)
            setErrorMessage(null)
          },
          "expired-callback": () => {
            if (isCancelled) {
              return
            }

            setToken(null)
            setIsVerified(false)
            setErrorMessage("Robot check expired. Please complete it again.")
            window.turnstile?.reset(widgetId ?? undefined)
          },
          "error-callback": () => {
            if (isCancelled) {
              return
            }

            setToken(null)
            setIsVerified(false)
            setErrorMessage("Robot check could not load correctly. Please refresh and try again.")
          },
        })
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return
        }

        console.error("[TURNSTILE_LOAD]", error)
        setToken(null)
        setIsVerified(false)
        setErrorMessage("Robot check could not load correctly. Please refresh and try again.")
      })

    return () => {
      isCancelled = true

      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [enabled, siteKey, turnstileRef])

  return { errorMessage, isVerified, token }
}
