import type { MetadataRoute } from "next"
import { items } from "@/site/catalog"
import { site } from "@/site/config"
import { blocksOfType } from "@/site/blocks"
import { blockTypes } from "@/site/block-types"
import { foundations } from "@/site/foundations"
import { hasA11y, hasProps } from "@/site/component-tabs-data"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1 },
    { path: "/docs/installation", priority: 0.8 },
    { path: "/docs/robotics", priority: 0.9 },
    { path: "/docs/ros", priority: 0.8 },
    { path: "/docs/nextjs", priority: 0.7 },
    { path: "/docs/localisation", priority: 0.7 },
    { path: "/docs/tokens", priority: 0.7 },
    { path: "/docs/upgrading", priority: 0.7 },
    { path: "/docs/upgrading/0-40", priority: 0.6 },
    { path: "/docs/upgrading/0-42", priority: 0.6 },
    { path: "/docs", priority: 0.9 },
    ...foundations.map((f) => ({ path: `/docs/foundations/${f.slug}`, priority: 0.8 })),
    { path: "/docs/components", priority: 0.9 },
    { path: "/icons", priority: 0.7 },
    { path: "/brand", priority: 0.6 },
    { path: "/icons/lucide", priority: 0.5 },
    ...items.map((i) => ({ path: `/docs/components/${i.name}`, priority: 0.6 })),
    ...items.filter((i) => hasProps(i.name)).map((i) => ({ path: `/docs/components/${i.name}/properties`, priority: 0.5 })),
    ...items.filter((i) => hasA11y(i.name)).map((i) => ({ path: `/docs/components/${i.name}/accessibility`, priority: 0.5 })),
    { path: "/blocks", priority: 0.8 },
    ...blockTypes.filter((t) => !t.home && blocksOfType(t.slug).length > 0).map((t) => ({ path: `/blocks/${t.slug}`, priority: 0.6 })),
  ]
  return pages.map((p) => ({ url: `${site.url}${p.path}`, changeFrequency: "weekly", priority: p.priority }))
}
