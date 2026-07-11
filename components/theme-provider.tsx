"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  attribute?: "class"
}

type ThemeProviderValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "theme"
const THEME_CHANGE_EVENT = "theme-provider:change"

const ThemeContext = createContext<ThemeProviderValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme === "system") {
    return enableSystem ? getSystemTheme() : "light"
  }

  return theme
}

function subscribeToStoredTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
  }
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  mediaQuery.addEventListener("change", onStoreChange)

  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

export const ThemeProvider = ({ children, defaultTheme = "system", enableSystem = true }: ThemeProviderProps) => {
  const storedTheme = useSyncExternalStore(
    subscribeToStoredTheme,
    () => {
      const value = window.localStorage.getItem(STORAGE_KEY)
      return isTheme(value) ? value : defaultTheme
    },
    () => defaultTheme,
  )

  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, (): ResolvedTheme => "light")

  const resolvedTheme =
    storedTheme === "system" ? (enableSystem ? systemTheme : "light") : resolveTheme(storedTheme, enableSystem)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((theme: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, theme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  const value = useMemo(
    () => ({
      theme: storedTheme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, storedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}
