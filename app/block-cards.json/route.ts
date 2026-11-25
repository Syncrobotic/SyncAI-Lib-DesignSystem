import { blockCards } from "@/site/blocks"

// The /blocks cards and how each picture is framed, for scripts/thumbs.mjs (npm run thumbs -- --blocks), which takes the
// pictures from the running site and cannot import the site's TypeScript.
export const dynamic = "force-static"

export function GET() {
  return Response.json(blockCards().map(({ name, width, height, fit, view }) => ({ name, width, height, fit, view: view ?? null })))
}
