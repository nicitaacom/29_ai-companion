"use client"

import { useProModal } from "@/app/hooks/use-pro-modal"
import { Button } from "./ui/button"
import { Sparkles } from "lucide-react"

export function UpgradeButton() {
  const proModal = useProModal()

  return (
    <Button onClick={proModal.onOpen} variant="premium" size="sm">
      Upgrade <Sparkles className="w-4 h-4 fill-white text-white" />
    </Button>
  )
}
