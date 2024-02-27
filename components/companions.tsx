import { ICompanionDB } from "@/app/interfaces/ICompanionDB"
import Image from "next/image"
import { Card, CardFooter, CardHeader } from "./ui/card"
import Link from "next/link"
import { MessagesSquare } from "lucide-react"

interface CompanionsProps {
  data: ICompanionDB[]
  messages: number[]
}

export function Companions({ data, messages }: CompanionsProps) {
  if (data?.length === 0) {
    return (
      <div className="pt-10 flex flex-col justify-center items-center space-y-3">
        <div className="relative w-60 h-60">
          <Image className="grayscale" src="/empty.png" alt="Empty" fill />
        </div>
        <p className="text-sm text-muted-foreground">No companions found.</p>
      </div>
    )
  }
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-10"
      data-test="companions">
      {data.map(item => (
        <Card className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0" key={item.id}>
          <Link href={`/chat/${item.id}`}>
            <CardHeader className="flex justify-center items-center text-center text-muted-foreground">
              <div className="relative w-32 h-32">
                <Image className="rounded-xl object-cover" alt="Companion" src={item.src} width={256} height={256} />
              </div>
              <p className="font-bold">{item.name}</p>
              <p className="text-sm">{item.description}</p>
            </CardHeader>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
              <p className="lowercase">@{item.username.split("@")[0]}</p>
              <div className="flex items-center">
                <MessagesSquare className="w-3 h-3 mr-1" />
                {messages}
              </div>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  )
}
