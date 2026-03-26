"use client"

import { Button } from "./ui/button"

export function UpgradeButton() {
  return (
    <Button variant="default" size="sm" disabled className="cursor-default">
      0.00$ - free to use
    </Button>
  )
}
