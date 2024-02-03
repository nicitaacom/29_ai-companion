import { Navbar } from "@/components/navbar"

export default function RootLayout ({children}:{children:React.ReactNode}) {
return (
    <div className="h-full">
      <Navbar/>
      <div className="md:pl-20 pt-16 h-full">
        {children}
      N</div>
    </div>
)
}