"use client"

import { ChatRequestOptions } from "ai"
import { SendHorizonal } from "lucide-react"
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface ChatFormProps {
  input: string
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void
  isHumanVerified: boolean
  onSubmit: (e: FormEvent<HTMLFormElement>, chatRequestOptions?: ChatRequestOptions | undefined) => void
  isLoading: boolean
}

export function ChatForm({ input, handleInputChange, isHumanVerified, onSubmit, isLoading }: ChatFormProps) {
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

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
    <form ref={formRef} onSubmit={handleFormSubmit} className="shrink-0 border-t border-primary/10 pt-4">
      <div
        className="flex items-end gap-3 rounded-[28px] border border-white/10 bg-zinc-800/95 px-3 py-3
                   shadow-[0_16px_40px_-30px_rgba(0,0,0,0.85)] transition duration-200 hover:border-white/20
                   hover:bg-zinc-800 focus-within:border-sky-400/50 focus-within:bg-zinc-800
                   focus-within:shadow-[0_0_0_4px_rgba(56,189,248,0.12),0_16px_40px_-30px_rgba(0,0,0,0.85)]">
        <textarea
          ref={textareaRef}
          autoFocus
          rows={1}
          disabled={isLoading}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message your companion..."
          className="min-h-[56px] max-h-40 w-full resize-none border-0 bg-transparent px-4 py-4 text-base text-zinc-100
                     placeholder:text-zinc-400 focus:outline-none leading-relaxed"
        />
        <div className="flex shrink-0 items-center gap-2 pb-1.5">
          <kbd
            className="rounded-lg bg-white/8 border border-white/10 px-1.5 py-1 font-mono text-[10px] text-zinc-500
                       leading-none select-none">
            Ctrl+↵
          </kbd>
          <Button disabled={isLoading || !isHumanVerified} type="submit" className="h-12 rounded-full px-5">
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
