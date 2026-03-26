import type { MetadataRoute } from "next"

import { getURL } from "@/app/utils/getURL"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = new URL(getURL()).origin

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/callback/"],
    },
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
