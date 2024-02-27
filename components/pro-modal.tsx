"use client"

import { useEffect, useState } from "react"
import axios from "axios"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProModal } from "@/app/hooks/use-pro-modal"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/app/hooks/useUser"
import { checkSubscription } from "@/lib/subscription"

export const ProModal = () => {
  const proModal = useProModal()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    async function checkIsPro() {
      const isPro = await checkSubscription()
      if (isPro) {
        proModal.onClose()
      }
    }
    checkIsPro()
  }, [proModal, user])

  const onSubscribe = async () => {
    try {
      setIsLoading(true)
      if (!user) {
        document.getElementById("closeDialog")?.click()
        return
      }

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

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            Create
            <span className="text-sky-500 mx-1 font-medium">Custom AI</span>
            Companions!
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex justify-between">
          <p className="text-2xl font-medium">
            $9<span className="text-sm font-normal">.99 / mo</span>
          </p>
          <Button onClick={onSubscribe} disabled={isLoading} variant="premium">
            Subscribe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
