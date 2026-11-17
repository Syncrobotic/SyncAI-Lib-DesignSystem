import { llmsTxt } from "@/site/ai"

export const dynamic = "force-static"

/** The index agents read first: what the kit is, how to install, every page with a one-line summary. */
export function GET() {
  return new Response(llmsTxt(), { headers: { "content-type": "text/plain; charset=utf-8" } })
}
