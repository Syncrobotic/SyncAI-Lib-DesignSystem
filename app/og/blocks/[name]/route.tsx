import { blocksOfType } from "@/site/blocks"
import { blockTypes, getBlockType } from "@/site/block-types"
import { snippet } from "@/site/config"
import { ogCard } from "@/site/og-card"

// A block type's social card (pageMeta's `image` on its page), built at build time.
export const dynamicParams = false
export const generateStaticParams = () => blockTypes.filter((t) => blocksOfType(t.slug).length > 0).map((t) => ({ name: t.slug }))

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const t = getBlockType((await params).name)!
  return ogCard({ kind: `Blocks · ${t.group}`, title: `${t.title} blocks`, line: snippet(t.description) })
}
