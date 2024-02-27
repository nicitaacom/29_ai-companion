import { Menu } from "lucide-react"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"

export function MobileSidebar({ isPro }: { isPro: boolean }) {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4" aria-label="Open menu">
        <Menu />
      </SheetTrigger>
      <SheetContent className="p-0 bg-secondary pt-10 w-32" side="left">
        <Sidebar isPro={isPro} />
      </SheetContent>
    </Sheet>
  )
}
