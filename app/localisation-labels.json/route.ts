import { labelGroups } from "@/site/label-catalog-data"

// The catalog of every component's labels at the end of /docs/localisation, as static JSON (site/label-catalog.tsx): 700-odd
// rows that were most of that page's HTML, sent twice (markup and React payload), are fetched after it shows.
export const dynamic = "force-static"

export function GET() {
  return Response.json(labelGroups())
}
