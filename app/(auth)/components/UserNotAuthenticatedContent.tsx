import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import axios, { AxiosError } from "axios"
import { Lock, Mail } from "lucide-react"

import { TAPIAuthLogin, TAPIAuthLoginResponse } from "@/app/api/auth/login/route"
import { Input } from "@/components/ui/input"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import supabaseClient from "@/lib/supabase/supabaseClient"
import { TAPIAuthRegister, TAPIAuthRegisterResponse } from "@/app/api/auth/register/route"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { twMerge } from "tailwind-merge"

type Variant = "login" | "register"

interface FormData {
  email: string
  password: string
}

export function UserNotAuthenticatedContent() {
  const router = useRouter()
  const [variant, setVariant] = useState<Variant>("login")
  const [responseMessage, setResponseMessage] = useState<React.ReactNode | null>(null)
  const { toast } = useToast()

  const dialogClose = () => {
    document.getElementById("closeDialog")?.click()
  }

  //when user submit form and got response message from server
  function displayResponseMessage(message: React.ReactNode) {
    setResponseMessage(message)
  }

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>()

  async function signInWithPassword(email: string, password: string) {
    try {
      // 1. Check is user with this email doesn't exist and return providers and contact
      const response: TAPIAuthLoginResponse = await axios.post("/api/auth/login", { email: email } as TAPIAuthLogin)
      const { data: user, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      })

      // 2. Check if user with this email already exists (if user first time auth with OAuth)
      // Throw error if user with this email exist with oauth providers (only) - or wrong email/password
      if (signInError) {
        const isCredentialsProvider = response.data.providers?.includes("credentials")
        const isOnlyGoogleProvider =
          Array.isArray(response.data.providers) &&
          response.data.providers.length === 1 &&
          response.data.providers[0] === "google"
        throw new Error(
          isCredentialsProvider
            ? `Wrong email or password`
            : isOnlyGoogleProvider
              ? "You already have account with google"
              : `You already have an account with ${response.data.providers}`,
        )
      }

      if (user.user) {
        reset()
        toast({ description: "Logged in" })
        router.refresh()
        closeModal()
      } else {
        displayResponseMessage(
          <div className="text-destructive flex flex-row">
            <p>No user found - contact admin&nbsp;</p>
            <Link className="text-info" href="https://t.me/nicitaacom">
              here
            </Link>
          </div>,
        )
        return
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid login credentials") {
        displayResponseMessage(<p className="text-destructive">Wrong email or password</p>)
      } else if (error instanceof AxiosError) {
        displayResponseMessage(<p className="text-destructive">{error.response?.data.error}</p>)
      } else if (error instanceof Error) {
        if (error.message === "You already have account with google") {
          displayResponseMessage(
            <div className="flex flex-col justify-center items-center">
              <p className="text-destructive">You already have account with google</p>
              <button
                onClick={async () =>
                  await supabaseClient.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${location.origin}/auth/callback/oauth?provider=google` },
                  })
                }>
                continue with google?
              </button>
            </div>,
          )
        } else displayResponseMessage(<p className="text-destructive">{error.message}</p>)
      } else {
        displayResponseMessage(
          <div className="text-destructive flex flex-row">
            <p>An unknown error occurred - contact admin&nbsp;</p>
            <Link className="text-info" href="https://t.me/nicitaacom" target="_blank">
              here
            </Link>
          </div>,
        )
      }
    }
  }

  async function signUp(email: string, password: string) {
    try {
      // 1. Check is user exist ? error : insert row in 'auth.user' 'public.users' 'public.users_cart' tables
      const response: TAPIAuthRegisterResponse = await axios.post("/api/auth/register", {
        email: email,
        password: password,
      } as TAPIAuthRegister)

      // 3. Close modal after signUp
      toast({ description: "You created account!" })
      router.refresh()
      closeModal()
    } catch (error) {
      if (error instanceof AxiosError) {
        displayResponseMessage(<p className="text-destructive">{error.response?.data}</p>)
      } else if (error instanceof Error) {
        displayResponseMessage(<p className="text-destructive">{error.message}</p>)
      } else {
        displayResponseMessage(
          <div className="text-destructive flex flex-row">
            <p>An unknown error occurred - contact admin&nbsp;</p>
            <Link className="text-info" href="https://t.me/nicitaacom" target="_blank">
              here
            </Link>
          </div>,
        )
      }
    }
  }

  // don't display response message from server if errors with validation
  useEffect(() => {
    if (errors.email || errors.password) {
      displayResponseMessage(null)
    }
  }, [errors.email, errors.password])

  function closeModal() {
    displayResponseMessage(null)
    dialogClose()
  }

  const onSubmit = async (data: FormData) => {
    if (variant === "login") {
      await signInWithPassword(data.email, data.password)
    } else if (variant === "register") {
      await signUp(data.email, data.password)
    }
  }

  return (
    <div
      className={twMerge(
        `relative w-full h-[360px] max-w-[450px] flex flex-col justify-between transition-all duration-150 px-4`,

        // for height when responseMessage +40px
        responseMessage && "!h-[400px]",

        // for height when errors (+46px)
        variant === "register" && (errors.email || errors.password) && "!h-[406px]",
        // for height when errors x2 (+70px)
        variant === "register" && errors.email && errors.password && "!h-[430px]",
      )}>
      <DialogHeader>
        <DialogTitle className="text-center">Auth</DialogTitle>
        <DialogDescription className="text-center">
          {variant === "login" ? "Login into your" : "Register new"} account.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4 pt-4">
        <div className="relative">
          <Input {...errors} {...register("email")} id="email" placeholder="user@big.com" disabled={isSubmitting} />
          <div className="absolute right-3 top-[-10%] translate-y-[50%] text-icon-color">
            <Mail />
          </div>
        </div>

        <div className="relative">
          <Input
            {...errors}
            {...register("password")}
            type="password"
            id="password"
            placeholder="RaNd0M-password"
            disabled={isSubmitting}
          />
          <div className="absolute right-3 top-[-10%] translate-y-[50%] text-icon-color">
            <Lock />
          </div>
        </div>
        <Button variant="outline" disabled={isSubmitting} type="submit">
          {variant === "login" ? "Login" : "Register"}
        </Button>
        <Button
          className="outline-none hover:bg-none"
          variant="link"
          type="button"
          onClick={() => setVariant(variant === "login" ? "register" : "login")}>
          {variant === "login" ? "Register" : "Login"}
        </Button>
        {responseMessage && <div className="text-center">{responseMessage}</div>}
      </form>

      {/* OR CONTINUE WITH */}
      <div className="flex flex-col">
        <div className="relative w-full border-t mb-6">
          <label className="absolute left-[50%] translate-x-[-50%] translate-y-[-50%] px-4 bg-background">
            or continue with
          </label>
        </div>
        <div className="flex flex-row gap-x-2 justify-between">
          <Button className="w-[33%]" variant="outline">
            <Image className="w-[20px] h-[20px]" src="/google-icon.png" alt="google" width={32} height={32} />
          </Button>
          <Button className="w-[33%]" variant="outline">
            <Image className="w-[20px] h-[20px]" src="/google-icon.png" alt="google" width={32} height={32} />
          </Button>
          <Button className="w-[33%]" variant="outline">
            <Image className="w-[20px] h-[20px]" src="/google-icon.png" alt="google" width={32} height={32} />
          </Button>
        </div>
      </div>
    </div>
  )
}
