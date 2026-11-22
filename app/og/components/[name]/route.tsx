import { getItem, items } from "@/site/catalog"
import { snippet } from "@/site/config"
import { ogCard } from "@/site/og-card"

// A component's social card (pageMeta's `image` on its page and the Properties and Accessibility pages), built at build time.
export const dynamicParams = false
export const generateStaticParams = () => items.map((i) => ({ name: i.name }))

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const item = getItem((await params).name)!
  const kind = item.group === "Hooks & libraries" ? "React hook" : `React component · ${item.group}`
  return ogCard({ kind, title: item.title, line: snippet(item.description ?? "") })
}
