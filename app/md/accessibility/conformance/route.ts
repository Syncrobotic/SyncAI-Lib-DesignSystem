import { acrMarkdown, kitVersion } from "@/site/acr"
import { markdownResponse } from "@/site/ai"

// Served at /docs/accessibility/conformance.md through a rewrite in next.config.ts: the report as a table to paste.
export const dynamic = "force-static"

export function GET() {
  return markdownResponse(acrMarkdown(kitVersion()))
}
