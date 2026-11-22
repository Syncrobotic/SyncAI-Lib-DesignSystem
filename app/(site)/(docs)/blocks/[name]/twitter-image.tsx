import { blocksOfType } from "@/site/blocks"
import { blockTypes, getBlockType } from "@/site/block-types"
import { site, snippet } from "@/site/config"
import { ogCard, ogSize } from "@/site/og-card"

export const alt = `Blocks of the ${site.name}`
export const size = ogSize
export const contentType = "image/png"
export const generateStaticParams = () => blockTypes.filter((t) => blocksOfType(t.slug).length > 0).map((t) => ({ name: t.slug }))

// A block type's own social card.
export default async function TwitterImage({ params }: { params: Promise<{ name: string }> }) {
  const t = getBlockType((await params).name)
  if (!t) return ogCard({ title: "Design System", line: site.tagline })
  return ogCard({ kind: "Blocks", title: `${t.title} blocks`, line: snippet(t.description) })
}
