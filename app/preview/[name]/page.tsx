import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { blockHref } from "@/site/block-types"
import { blocks, getBlock } from "@/site/blocks"
import { PreviewBack } from "@/site/preview-back"
import { PreviewWidth } from "@/site/preview-width"
import { Quiet } from "@/site/quiet"

// Bare render of one block, loaded in an iframe by the docs so breakpoints respond to the frame width.
export const dynamicParams = false
export const generateStaticParams = () => blocks.map((b) => ({ name: b.name }))
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const block = getBlock((await params).name)
  return { title: block ? `${block.title} · preview` : "Preview", robots: { index: false, follow: false } }
}

export default async function PreviewPage({ params }: { params: Promise<{ name: string }> }) {
  const block = getBlock((await params).name)
  if (!block) notFound()
  return (
    <div className="min-h-screen bg-background">
      <h1 className="sr-only">{block.title}</h1>
      {/* The docs frame measures this element so the preview is exactly as tall as the block. */}
      <Quiet />
      <PreviewWidth />
      <PreviewBack href={blockHref(block.name)} />
      <div id="block-root">{block.render()}</div>
    </div>
  )
}
