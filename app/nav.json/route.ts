import { allAreaNav } from "@/site/scopes"

// The drawer's areas, written at build time: each area's pages without their sections (the drawer shows none).
export const dynamic = "force-static"

// Asked again on each first load (a 304 while nothing changed), so a release's new pages show at once, as the search does.
export function GET() {
  return Response.json(allAreaNav(), { headers: { "Cache-Control": "public, max-age=0, must-revalidate" } })
}
