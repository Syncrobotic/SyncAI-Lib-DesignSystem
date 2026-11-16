import type { MetadataRoute } from "next"
import { site } from "@/site/config"

export default function robots(): MetadataRoute.Robots {
  if (!site.public) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/r/", "/preview/"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
