"use client"

import { ChatRequestOptions } from "ai"
import { SendHorizonal } from "lucide-react"
import { ChangeEvent, FormEvent, useEffect, useRef } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useVerifyHuman } from "@/app/hooks/useVerifyHuman"

interface ChatFormProps {
  input: string
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void
  initialTurnstileVerified: boolean
  onSubmit: (e: FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions | undefined) => void
  isLoading: boolean
}

export function ChatForm({ input, handleInputChange, initialTurnstileVerified, onSubmit, isLoading }: ChatFormProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const { isVerified } = useVerifyHuman(turnstileRef)
  const isHumanVerified = process.env.NODE_ENV !== "production" || initialTurnstileVerified || isVerified

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isHumanVerified) {
      event.preventDefault()
      toast({
        description: "Complete the robot check before sending your first message.",
        variant: "destructive",
      })
      return
    }

    onSubmit(event)
  }

  return (
    <form onSubmit={handleFormSubmit} className="border-t border-primary/10 py-4">
      {process.env.NODE_ENV === "production" && !isHumanVerified && (
        <div className="relative px-2 pb-3">
          <div ref={turnstileRef} className="cf-turnstile"></div>
          <p className="pt-3 text-xs text-zinc-500">Complete the robot check before sending your first message.</p>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-[28px] border border-white/10 bg-zinc-800/95 px-3 py-3 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.85)] transition duration-200 hover:border-white/20 hover:bg-zinc-800 focus-within:border-sky-400/50 focus-within:bg-zinc-800 focus-within:shadow-[0_0_0_4px_rgba(56,189,248,0.12),0_16px_40px_-30px_rgba(0,0,0,0.85)]">
        <Input
          ref={inputRef}
          autoFocus
          disabled={isLoading}
          value={input}
          onChange={handleInputChange}
          placeholder="Message your companion..."
          className="h-14 border-0 bg-transparent px-4 text-base text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button disabled={isLoading || !isHumanVerified} type="submit" className="h-12 rounded-full px-5">
          <SendHorizonal className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <p className="px-2 pt-2 text-xs text-zinc-500">Press Enter to send and keep the conversation flowing.</p>
    </form>
  )
}
