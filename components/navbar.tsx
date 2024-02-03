"use client"

import { Menu, Sparkles } from "lucide-react"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { twMerge } from "tailwind-merge"

import { Button } from "./ui/button"

const font = Poppins({ weight: "600", subsets: ["latin"] })

export function Navbar() {
  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary">
      <div className="flex items-center">
        <Menu className="block md:hidden" />
        <Link href="" />
        <h1 className={twMerge("hidden md:block text-xl md:text-3xl font-bold text-primary", font.className)}>
          companion.ai
        </h1>
      </div>
      <div className="flex items-center gap-x-3">
        <Button variant="premium" size="sm">
          Upgrade <Sparkles className="w-4 h-4 fill-white text-white" />
        </Button>
        Avatar
      </div>
    </div>
  )
}
