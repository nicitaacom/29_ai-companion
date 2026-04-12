import { Navbar } from "@/components/navbar"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Hot Delivery - utm stats",
  description: "Dashboard for utm stats on hot-delivery.net - we deliver you order as fresh as possible",
}

export default async function UTMLayout({ children }: { children: React.ReactNode }) {
  // it is protected route and only ADMIN role has access to this route
  const { data: role_response, error: anonymous_user } = await supabaseServer().from("").select("roles").single()

  // Allow ADMIN to visit this page
  if (!role_response?.roles.includes("ADMIN") || anonymous_user) {
    redirect("/")
  }

  return (
    <>
      <Navbar isPro={true} />
      {children}
    </>
  )
}
