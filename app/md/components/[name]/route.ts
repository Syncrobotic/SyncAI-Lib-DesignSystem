import { items } from "@/site/catalog"
import { componentMarkdown, markdownResponse } from "@/site/ai"

// Served at /docs/components/<name>.md through a rewrite in next.config.ts.
export const dynamic = "force-static"
export const dynamicParams = false
export const generateStaticParams = () => items.map((i) => ({ name: i.name }))

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  return markdownResponse(componentMarkdown((await params).name))
}
