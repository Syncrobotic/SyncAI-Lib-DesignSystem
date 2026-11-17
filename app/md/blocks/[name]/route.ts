import { blockMarkdown, blockNames, markdownResponse } from "@/site/ai"

// Served at /blocks/<name>.md through a rewrite in next.config.ts.
export const dynamic = "force-static"
export const dynamicParams = false
export const generateStaticParams = () => blockNames().map((name) => ({ name }))

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  return markdownResponse(blockMarkdown((await params).name))
}
