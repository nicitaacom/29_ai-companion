import type { MetadataRoute } from "next"

import { getURL } from "@/app/utils/getURL"

export const dynamic = "force-dynamic"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = new URL(getURL()).origin
  const now = new Date()

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
