import { logout } from "@/app/functions/logout"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export function UserAuthenticatedContent() {
  const router = useRouter()

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-center">Account settings</DialogTitle>
        <DialogDescription className="text-center">Manage your account</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col justify-center items-center">
        <h1 className="py-8 text-center text-xl">Some content to manage user account</h1>
        <Button onClick={() => logout(router)}>Logout</Button>
      </div>
    </div>
  )
}
