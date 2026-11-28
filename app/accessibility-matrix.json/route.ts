import { matrix } from "@/site/a11y-manual"

// The manual test matrix at /docs/accessibility/manual-testing, as static JSON (site/manual-matrix.tsx): each stable
// component's tasks and result cells, fetched after the page shows instead of sent twice in its HTML.
export const dynamic = "force-static"

export function GET() {
  return Response.json(matrix())
}
