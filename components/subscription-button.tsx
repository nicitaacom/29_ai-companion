"use client"

import axios from "axios"
import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export const SubscriptionButton = ({ isPro = false }: { isPro: boolean }) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const onClick = async () => {
    try {
      setIsLoading(true)

      const response = await axios.get("/api/stripe")

      window.location.href = response.data.url
    } catch (error) {
      toast({
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button size="sm" variant={isPro ? "default" : "premium"} disabled={isLoading} onClick={onClick}>
      {isPro ? "Manage Subscription" : "Upgrade"}
      {!isPro && <Sparkles className="w-4 h-4 ml-2 fill-white" />}
    </Button>
  )
}
