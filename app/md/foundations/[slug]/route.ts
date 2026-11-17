import { foundations } from "@/site/foundations"
import { foundationMarkdown, markdownResponse } from "@/site/ai"

// Served at /docs/foundations/<slug>.md through a rewrite in next.config.ts.
export const dynamic = "force-static"
export const dynamicParams = false
export const generateStaticParams = () => foundations.map((f) => ({ slug: f.slug }))

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  return markdownResponse(foundationMarkdown((await params).slug))
}
