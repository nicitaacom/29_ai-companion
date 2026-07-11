"use client"

import { useMemo, useState } from "react"
import { twMerge } from "tailwind-merge"
import { Loader2, Lock, Mail } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { TAPIAuthLogin } from "@/app/api/auth/login/route"
import { TAPIAuthRegister } from "@/app/api/auth/register/route"
import { AuthModalVariant, useAccountModal } from "@/app/store/ui/accountModal"
import { useToast } from "@/components/ui/use-toast"
import supabaseClient from "@/lib/supabase/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { AuthModalShell } from "./AuthModalShell"

type Variant = "login" | "register"
type Provider = "credentials" | "github" | "google"

type FormData = {
  email: string
  password: string
}

type AuthApiError = {
  error?: string
  providers?: Provider[]
}

type LoginResponse = {
  providers: Provider[] | null
}

type RegisterResponse = {
  message: string
}

const providerLabels: Record<Exclude<Provider, "credentials">, string> = {
  google: "Google",
  github: "GitHub",
}

const getCurrentRedirectPath = () =>
  typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`

const getOAuthRedirectUrl = (provider: Exclude<Provider, "credentials">) => {
  const url = new URL(`/auth/callback/oauth`, window.location.origin)
  url.searchParams.set("provider", provider)
  url.searchParams.set("next", getCurrentRedirectPath())
  return url.toString()
}

const getProviderHint = (providers: Provider[] | null | undefined) => {
  const oauthProviders = providers?.filter(p => p !== "credentials") as Exclude<Provider, "credentials">[] | undefined
  if (!oauthProviders?.length) return null
  const label = oauthProviders.map(p => providerLabels[p]).join(" or ")
  return `This email is already connected to ${label}. Continue with that provider instead.`
}

export function UserNotAuthenticatedContent({ initialVariant }: { initialVariant: AuthModalVariant }) {
  const router = useRouter()
  const { toast } = useToast()
  const closeModal = useAccountModal(state => state.closeModal)
  const [variant, setVariant] = useState<Variant>(initialVariant)
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const [providerHint, setProviderHint] = useState<Provider[] | null>(null)
  const [providerSubmitting, setProviderSubmitting] = useState<Exclude<Provider, "credentials"> | null>(null)

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: { email: "", password: "" } })

  const visibleResponseMessage = errors.email || errors.password ? null : responseMessage

  const asideContent = useMemo(
    () =>
      variant === "login"
        ? {
            title: "Welcome back to your companion workspace.",
            description: `Jump into saved chats, billing and companion settings with the same Supabase-backed account
                           across every provider.`,
          }
        : {
            title: "Create your account once, use it everywhere.",
            description: `Start with email and password or jump in with Google or GitHub. The provider list is
                           tracked in Supabase for this project.`,
          },
    [variant],
  )

  const handleVariantChange = (next: Variant) => {
    setVariant(next)
    setResponseMessage(null)
    setProviderHint(null)
  }

  const handleProviderLogin = async (provider: Exclude<Provider, "credentials">) => {
    setResponseMessage(null)
    setProviderSubmitting(provider)
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getOAuthRedirectUrl(provider) },
    })
    setProviderSubmitting(null)
    if (error) setResponseMessage(error.message)
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email } as TAPIAuthLogin),
      })
      const data: LoginResponse & AuthApiError = await res.json()

      if (!res.ok) {
        setProviderHint(data.providers ?? null)
        setResponseMessage(data.error || "Unable to sign in.")
        return
      }

      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })

      if (error) {
        setProviderHint(data.providers ?? null)
        setResponseMessage(getProviderHint(data.providers) || "Wrong email or password.")
        return
      }

      reset()
      toast({ description: "Logged in." })
      router.refresh()
      closeModal()
    } catch (error) {
      setResponseMessage(error instanceof Error ? error.message : "An unknown error occurred.")
    }
  }

  const handleSignUp = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo: getCurrentRedirectPath() } as TAPIAuthRegister),
      })
      const data: RegisterResponse & AuthApiError = await res.json()

      if (!res.ok) {
        setProviderHint(data.providers ?? null)
        setResponseMessage(data.error || "Unable to create your account.")
        return
      }

      reset()
      setProviderHint(null)
      setResponseMessage(null)
      toast({ description: data.message })
      router.refresh()
      closeModal()
    } catch (error) {
      setResponseMessage(error instanceof Error ? error.message : "An unknown error occurred.")
    }
  }

  const onSubmit = async (data: FormData) => {
    if (variant === "login") return handleSignIn(data.email, data.password)
    return handleSignUp(data.email, data.password)
  }

  const isDisabled = isSubmitting || providerSubmitting !== null
  const oauthProviderHints = providerHint?.filter(p => p !== "credentials") ?? []

  return (
    <AuthModalShell
      title={variant === "login" ? "Sign in" : "Create account"}
      description={
        variant === "login"
          ? "Use Supabase credentials or continue with one of your connected providers."
          : "Choose the provider that fits your flow. Email/password is treated as its own credentials provider."
      }
      asideTitle={asideContent.title}
      asideDescription={asideContent.description}>
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-white/[0.06] p-1">
            <button
              className={twMerge(
                "rounded-2xl px-4 py-3 text-sm font-medium transition",
                variant === "login" ? "bg-white text-slate-950 shadow-sm" : "text-white/[0.5]",
              )}
              type="button"
              onClick={() => handleVariantChange("login")}>
              Login
            </button>
            <button
              className={twMerge(
                "rounded-2xl px-4 py-3 text-sm font-medium transition",
                variant === "register" ? "bg-white text-slate-950 shadow-sm" : "text-white/[0.5]",
              )}
              type="button"
              onClick={() => handleVariantChange("register")}>
              Register
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              className="h-12 w-full min-w-0 justify-center gap-3 rounded-2xl border-white/10 bg-white/[0.06] text-white
                         hover:bg-white/10 hover:text-white"
              type="button"
              variant="outline"
              disabled={isDisabled}
              onClick={() => handleProviderLogin("google")}>
              {providerSubmitting === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image
                  className="h-[18px] w-[18px] shrink-0"
                  src="/google-icon.png"
                  alt="google"
                  width={18}
                  height={18}
                />
              )}
              Continue with Google
            </Button>

            <Button
              className="h-12 w-full min-w-0 justify-center gap-3 rounded-2xl border-white/10 bg-white/[0.06] text-white
                         hover:bg-white/10 hover:text-white"
              type="button"
              variant="outline"
              disabled={isDisabled}
              onClick={() => handleProviderLogin("github")}>
              {providerSubmitting === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  {/* eslint-disable-next-line max-len -- unbreakable SVG path data */}
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                </svg>
              )}
              Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.38]">Credentials</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]" />
                <Input
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.06] pl-11 text-white
                             placeholder:text-white/[0.28] focus-visible:ring-white/20"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  disabled={isDisabled}
                  {...register("email", {
                    required: "Email is required.",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
                  })}
                />
              </div>
              {errors.email?.message && <p className="text-sm text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]" />
                <Input
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.06] pl-11 text-white
                             placeholder:text-white/[0.28] focus-visible:ring-white/20"
                  id="password"
                  type="password"
                  placeholder={variant === "login" ? "Enter your password" : "Create a strong password"}
                  disabled={isDisabled}
                  {...register("password", {
                    required: "Password is required.",
                    minLength: { value: 8, message: "Use at least 8 characters." },
                  })}
                />
              </div>
              {errors.password?.message && <p className="text-sm text-rose-400">{errors.password.message}</p>}
            </div>

            <Button
              className="h-12 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90"
              type="submit"
              disabled={isDisabled}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : variant === "login" ? "Login" : "Register"}
            </Button>
          </form>

          {(visibleResponseMessage || oauthProviderHints.length > 0) && (
            <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
              {visibleResponseMessage && (
                <p className="text-sm leading-6 text-white/[0.72]">{visibleResponseMessage}</p>
              )}
              {oauthProviderHints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {oauthProviderHints.map(provider => (
                    <Button
                      className="rounded-full border-white/10 bg-white/[0.06] px-4 text-white hover:bg-white/10 hover:text-white"
                      key={provider}
                      type="button"
                      variant="outline"
                      disabled={isDisabled}
                      onClick={() => handleProviderLogin(provider as Exclude<Provider, "credentials">)}>
                      {providerLabels[provider as Exclude<Provider, "credentials">]}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="pt-6 text-center text-xs leading-5 text-white/[0.48]">
          Authentication now runs through Supabase with provider tracking stored in the app database.
        </p>
      </div>
    </AuthModalShell>
  )
}
