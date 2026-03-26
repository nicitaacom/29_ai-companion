"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

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

const ThemeContext = createContext<ThemeProviderValue | null>(null)

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

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  enableSystem = true,
}: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(defaultTheme, enableSystem))

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setThemeState(storedTheme)
      setResolvedTheme(resolveTheme(storedTheme, enableSystem))
      return
    }

    setThemeState(defaultTheme)
    setResolvedTheme(resolveTheme(defaultTheme, enableSystem))
  }, [defaultTheme, enableSystem])

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(theme, enableSystem)
    const root = document.documentElement

    root.classList.remove("light", "dark")
    root.classList.add(nextResolvedTheme)

    setResolvedTheme(nextResolvedTheme)
    window.localStorage.setItem(STORAGE_KEY, theme)

    if (!enableSystem || theme !== "system") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      const updatedTheme = mediaQuery.matches ? "dark" : "light"
      root.classList.remove("light", "dark")
      root.classList.add(updatedTheme)
      setResolvedTheme(updatedTheme)
    }

    mediaQuery.addEventListener("change", handleSystemChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange)
    }
  }, [enableSystem, theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
    }),
    [resolvedTheme, theme],
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
