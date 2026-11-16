import type { MetadataRoute } from "next"
import { items } from "@/site/catalog"
import { site } from "@/site/config"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1 },
    { path: "/docs/installation", priority: 0.8 },
    { path: "/docs/foundations", priority: 0.8 },
    ...items.map((i) => ({ path: `/docs/components/${i.name}`, priority: 0.6 })),
  ]
  return pages.map((p) => ({ url: `${site.url}${p.path}`, changeFrequency: "weekly", priority: p.priority }))
}
