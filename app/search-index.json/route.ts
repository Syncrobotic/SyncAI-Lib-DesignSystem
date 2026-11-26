import { buildSearchIndex } from "@/site/search-index"

// The site search's index, written at build time: pages, foundation sections, components, blocks and icons.
export const dynamic = "force-static"

// The browser asks again each time a page first opens the search (a 304 while nothing changed), so a release's new
// components are found at once; an hour of max-age kept the last release's index in browsers that had opened it.
export function GET() {
  return Response.json(buildSearchIndex(), { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } })
}
