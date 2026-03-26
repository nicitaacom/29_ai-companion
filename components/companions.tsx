import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import Image from "next/image"
import Link from "next/link"
import { MessagesSquare } from "lucide-react"

interface CompanionsProps {
  data: ICompanionDB[]
  messages: number[]
}

export function Companions({ data, messages }: CompanionsProps) {
  if (data?.length === 0) {
    return (
      <div data-test="companions-data-0" className="pt-10 flex flex-col justify-center items-center space-y-3">
        <div className="relative w-60 h-60">
          <Image className="grayscale" src="/empty.png" alt="Empty" fill sizes="240px" loading="eager" />
        </div>
        <p className="text-sm text-muted-foreground">No companions found.</p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 pb-10 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      data-test="companions">
      {data.map((item, index) => {
        const messageCount = messages[index] ?? 0
        const username = item.username.split("@")[0]

        return (
          <article
            className="group overflow-hidden rounded-[22px] border border-white/5 bg-zinc-800/90 shadow-[0_16px_40px_-32px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-zinc-800"
            key={item.id}>
            <Link href={`/chat/${item.id}`} className="flex h-full flex-col p-2.5">
              <div className="relative aspect-[4/4.35] overflow-hidden rounded-[16px] bg-zinc-700">
                <Image
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  alt={item.name}
                  src={item.src}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                  AI companion
                </div>
              </div>
              <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold tracking-tight text-zinc-50">{item.name}</p>
                    <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-zinc-400">{item.description}</p>
                    <p className="mt-3 truncate text-xs text-zinc-300">@{username}</p>
                  </div>
                  <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-zinc-300">
                    Live chat
                  </div>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/5 px-1 py-3 text-xs text-zinc-400">
                <span className="truncate">Open conversation</span>
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-300">
                  <MessagesSquare className="h-3.5 w-3.5" />
                  <span>{messageCount}</span>
                </div>
              </div>
            </Link>
          </article>
        )
      })}
    </div>
  )
}
