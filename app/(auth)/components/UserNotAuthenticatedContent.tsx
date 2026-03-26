"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Github, Loader2, Lock, Mail } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { TAPIAuthLogin } from "@/app/api/auth/login/route"
import { TAPIAuthRegister } from "@/app/api/auth/register/route"
import { AuthModalVariant, useAccountModal } from "@/app/store/ui/accountModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import supabaseClient from "@/lib/supabase/supabaseClient"

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

function getCurrentRedirectPath() {
  if (typeof window === "undefined") {
    return "/"
  }

  return `${window.location.pathname}${window.location.search}`
}

function getOAuthRedirectUrl(provider: Exclude<Provider, "credentials">) {
  const url = new URL(`/auth/callback/oauth`, window.location.origin)
  url.searchParams.set("provider", provider)
  url.searchParams.set("next", getCurrentRedirectPath())
  return url.toString()
}

function getProviderHint(providers: Provider[] | null | undefined) {
  if (!providers?.length || providers.includes("credentials")) {
    return null
  }

  const oauthProviders = providers.filter(provider => provider !== "credentials") as Exclude<Provider, "credentials">[]

  if (!oauthProviders.length) {
    return null
  }

  const label = oauthProviders.map(provider => providerLabels[provider]).join(" or ")
  return `This email is already connected to ${label}. Continue with that provider instead.`
}

export function UserNotAuthenticatedContent({ initialVariant }: { initialVariant: AuthModalVariant }) {
  const router = useRouter()
  const { toast } = useToast()
  const closeModal = useAccountModal(state => state.closeModal)
  const [variant, setVariant] = useState<Variant>("login")
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const [providerHint, setProviderHint] = useState<Provider[] | null>(null)
  const [providerSubmitting, setProviderSubmitting] = useState<Exclude<Provider, "credentials"> | null>(null)

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    setVariant(initialVariant)
    setResponseMessage(null)
    setProviderHint(null)
  }, [initialVariant])

  useEffect(() => {
    if (errors.email || errors.password) {
      setResponseMessage(null)
    }
  }, [errors.email, errors.password])

  const asideContent = useMemo(
    () =>
      variant === "login"
        ? {
            title: "Welcome back to your companion workspace.",
            description:
              "Jump into saved chats, billing and companion settings with the same Supabase-backed account across every provider.",
          }
        : {
            title: "Create your account once, use it everywhere.",
            description:
              "Start with email and password or jump in with Google or GitHub. The provider list is tracked in Supabase for this project.",
          },
    [variant],
  )

  async function continueWithProvider(provider: Exclude<Provider, "credentials">) {
    setResponseMessage(null)
    setProviderSubmitting(provider)

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectUrl(provider),
      },
    })

    setProviderSubmitting(null)

    if (error) {
      setResponseMessage(error.message)
    }
  }

  async function signInWithPassword(email: string, password: string) {
    try {
      const response = await axios.post<LoginResponse>("/api/auth/login", { email } as TAPIAuthLogin)
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const hint = getProviderHint(response.data.providers)
        setProviderHint(response.data.providers)
        setResponseMessage(hint || "Wrong email or password.")
        return
      }

      reset()
      toast({ description: "Logged in." })
      router.refresh()
      closeModal()
    } catch (error) {
      if (axios.isAxiosError<AuthApiError>(error)) {
        setProviderHint(error.response?.data?.providers ?? null)
        setResponseMessage(error.response?.data?.error || "Unable to sign in.")
        return
      }

      if (error instanceof Error) {
        setResponseMessage(error.message)
        return
      }

      setResponseMessage("An unknown error occurred.")
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const response = await axios.post<RegisterResponse>("/api/auth/register", {
        email,
        password,
        redirectTo: getCurrentRedirectPath(),
      } as TAPIAuthRegister)

      reset()
      setProviderHint(null)
      setResponseMessage(null)
      toast({ description: response.data.message })
      router.refresh()
      closeModal()
    } catch (error) {
      if (axios.isAxiosError<AuthApiError>(error)) {
        setProviderHint(error.response?.data?.providers ?? null)
        setResponseMessage(error.response?.data?.error || "Unable to create your account.")
        return
      }

      if (error instanceof Error) {
        setResponseMessage(error.message)
        return
      }

      setResponseMessage("An unknown error occurred.")
    }
  }

  const onSubmit = async (data: FormData) => {
    if (variant === "login") {
      await signInWithPassword(data.email, data.password)
      return
    }

    await signUp(data.email, data.password)
  }

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
              type="button"
              onClick={() => {
                setVariant("login")
                setResponseMessage(null)
                setProviderHint(null)
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                variant === "login" ? "bg-white text-slate-950 shadow-sm" : "text-white/[0.5]"
              }`}>
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setVariant("register")
                setResponseMessage(null)
                setProviderHint(null)
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                variant === "register" ? "bg-white text-slate-950 shadow-sm" : "text-white/[0.5]"
              }`}>
              Register
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full min-w-0 justify-center gap-3 rounded-2xl border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
              onClick={() => continueWithProvider("google")}
              disabled={isSubmitting || providerSubmitting !== null}>
              {providerSubmitting === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Image
                  src="/google-icon.png"
                  alt="google"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] shrink-0"
                />
              )}
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full min-w-0 justify-center gap-3 rounded-2xl border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
              onClick={() => continueWithProvider("github")}
              disabled={isSubmitting || providerSubmitting !== null}>
              {providerSubmitting === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/[0.38]">Credentials</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.35]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.06] pl-11 text-white placeholder:text-white/[0.28] focus-visible:ring-white/20"
                  disabled={isSubmitting || providerSubmitting !== null}
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Enter a valid email address.",
                    },
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
                  id="password"
                  type="password"
                  placeholder={variant === "login" ? "Enter your password" : "Create a strong password"}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.06] pl-11 text-white placeholder:text-white/[0.28] focus-visible:ring-white/20"
                  disabled={isSubmitting || providerSubmitting !== null}
                  {...register("password", {
                    required: "Password is required.",
                    minLength: {
                      value: 8,
                      message: "Use at least 8 characters.",
                    },
                  })}
                />
              </div>
              {errors.password?.message && <p className="text-sm text-rose-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90"
              disabled={isSubmitting || providerSubmitting !== null}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : variant === "login" ? "Login" : "Register"}
            </Button>
          </form>

          {(responseMessage || providerHint?.length) && (
            <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
              {responseMessage && <p className="text-sm leading-6 text-white/[0.72]">{responseMessage}</p>}
              {!!providerHint?.filter(provider => provider !== "credentials").length && (
                <div className="flex flex-wrap gap-2">
                  {providerHint
                    .filter(provider => provider !== "credentials")
                    .map(provider => (
                      <Button
                        key={provider}
                        type="button"
                        variant="outline"
                        className="rounded-full border-white/10 bg-white/[0.06] px-4 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => continueWithProvider(provider as Exclude<Provider, "credentials">)}
                        disabled={providerSubmitting !== null || isSubmitting}>
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
