import { buildSearchIndex } from "@/site/search-index"

// The site search's index, written at build time: pages, foundation sections, components, blocks and icons.
export const dynamic = "force-static"

export function GET() {
  return Response.json(buildSearchIndex(), { headers: { "Cache-Control": "public, max-age=3600" } })
}
