"use client"

import { ChangeEventHandler, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import qs from "query-string"

import { Input } from "./ui/input"
import { useDebounce } from "@/app/hooks/use-debounce"

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const categoryId = searchParams.get("categoryId")
  const name = searchParams.get("name")

  const [value, setValue] = useState(name || "")
  const debouncedValue = useDebounce<string>(value, 500)

  const onChange: ChangeEventHandler<HTMLInputElement> = e => {
    setValue(e.target.value)
  }

  useEffect(() => {
    const query = { name: debouncedValue, categoryId: categoryId }

    const url = qs.stringifyUrl(
      {
        url: window.location.href,
        query,
      },
      { skipEmptyString: true, skipNull: true },
    )

    router.push(url)
  }, [debouncedValue, router, categoryId])

  return (
    <div className="relative">
      <Search className="absolute w-4 h-4 top-3 left-4 text-muted-foreground" />
      <Input className="pl-10 bg-primary/10" value={value} onChange={onChange} placeholder="Search..." />
    </div>
  )
}
