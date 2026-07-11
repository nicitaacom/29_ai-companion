"use client"

import { useAuthOpen } from "@/app/hooks/use-auth-open"
import { useMounted } from "@/app/hooks/use-mounted"
import { useProModal } from "@/app/hooks/use-pro-modal"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/app/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function ProModal() {
  const proModal = useProModal()
  const isMounted = useMounted()
  const { toast } = useToast()
  const { user } = useUser()
  const { openAuth } = useAuthOpen()

  const onContinue = () => {
    if (!user) {
      proModal.onClose()
      openAuth("login")
      return
    }

    toast({
      description: "This app is free to use.",
    })
    proModal.onClose()
  }

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center">Free to use</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            Create
            <span className="mx-1 font-medium text-sky-500">Custom AI</span>
            Companions without a subscription.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex justify-between">
          <p className="text-2xl font-medium">
            <span className="text-sm font-normal text-muted-foreground line-through">$9.99 / mo</span>
            <span className="ml-2">0.00$ - free to use</span>
          </p>
          <Button onClick={onContinue} variant="premium">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
