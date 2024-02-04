"use client"

import { twMerge } from "tailwind-merge"
import { useRouter, useSearchParams } from "next/navigation"
import qs from "query-string"

import { ICategoryDB } from "@/app/interfaces/ICategoryDB"

interface CategoriesProps {
  data: ICategoryDB[]
}

export function Categories({ data }: CategoriesProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get("categoryId")

  const onClick = (id: string | undefined) => {
    const query = { category: id }

    const url = qs.stringifyUrl({ url: window.location.href, query }, { skipNull: true })

    router.push(url)
  }

  return (
    <div className="w-full overflow-x-auto space-x-2 flex p-1">
      <button
        className={twMerge(
          "flex items-center text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 rounded-md bg-primary/10 hover:opacity-75 transition",
        )}
        onClick={() => onClick(undefined)}>
        Newest
      </button>
      {data.map(item => (
        <button
          className={twMerge(
            "flex items-center text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 rounded-md bg-primary/10 hover:opacity-75 transition",
          )}
          onClick={() => onClick(item.id)}
          key={item.id}>
          {item.name}
        </button>
      ))}
    </div>
  )
}
