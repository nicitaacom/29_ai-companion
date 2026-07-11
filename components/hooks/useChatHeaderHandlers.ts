import { useRouter } from "next/navigation"

import { useToast } from "@/components/ui/use-toast"

export function useChatHeaderHandlers(companionId: string) {
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/companion/${companionId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Delete failed")

      toast({ description: "Success" })

      router.refresh()
      router.push("/")
    } catch (_error) {
      toast({ description: "Something went wrong", variant: "destructive" })
    }
  }

  return { handleDelete }
}
