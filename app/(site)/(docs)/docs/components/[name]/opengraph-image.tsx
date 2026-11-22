import { getItem, items } from "@/site/catalog"
import { site, snippet } from "@/site/config"
import { ogCard, ogSize } from "@/site/og-card"

export const alt = `A component of the ${site.name}`
export const size = ogSize
export const contentType = "image/png"
export const generateStaticParams = () => items.map((i) => ({ name: i.name }))

// The component's own social card, for its page and the Properties and Accessibility pages under it.
export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const item = getItem((await params).name)
  if (!item) return ogCard({ title: "Design System", line: site.tagline })
  const kind = item.group === "Hooks & libraries" ? "React hook" : `React component · ${item.group}`
  return ogCard({ kind, title: item.title, line: snippet(item.description ?? "") })
}
