import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { blocks, getBlock } from "@/site/blocks"

// Bare render of one block, loaded in an iframe by the docs so breakpoints respond to the frame width.
export const dynamicParams = false
export const generateStaticParams = () => blocks.map((b) => ({ name: b.name }))
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PreviewPage({ params }: { params: Promise<{ name: string }> }) {
  const block = getBlock((await params).name)
  if (!block) notFound()
  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">{block.title}</h1>
      {block.render()}
    </main>
  )
}
