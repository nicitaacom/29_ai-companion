import "./globals.css"
import type { Metadata } from "next"
import Script from "next/script"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ProModal } from "@/components/pro-modal"
import { getURL } from "@/app/utils/getURL"

const siteUrl = new URL(getURL())
const siteTitle = "jompanion.jokik.fi"
const siteDescription = "Build, chat with, and manage AI companions in a clean Supabase-powered workspace."

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  applicationName: siteTitle,
  authors: [{ name: siteTitle }],
  creator: siteTitle,
  publisher: siteTitle,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: ["AI companion", "Supabase", "chat app", "Next.js", "free AI tools"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-secondary font-sans antialiased">
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProModal />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
