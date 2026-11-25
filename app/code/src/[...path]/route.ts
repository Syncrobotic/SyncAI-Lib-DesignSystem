import { readSource } from "@/site/catalog"
import { codeData, langOf, sourcePaths } from "@/site/code-data"

// A source file a page lists behind a tab or a sheet, highlighted, as static JSON (site/code-data.ts).
export const dynamic = "force-static"
export const dynamicParams = false
export const generateStaticParams = () => sourcePaths().map((p) => ({ path: p.split("/") }))

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/")
  if (!sourcePaths().includes(path)) return new Response("Not found", { status: 404 })
  return Response.json(await codeData(readSource(path), langOf(path)))
}
