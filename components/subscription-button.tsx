"use client"

import { Button } from "@/components/ui/button"

export const SubscriptionButton = () => {
  return (
    <Button size="sm" variant="default" disabled className="cursor-default">
      <span className="line-through opacity-50">$9.99 / mo</span>
      <span className="ml-2">0.00$ - free to use</span>
    </Button>
  )
}
