import { codeData, storyKeys } from "@/site/code-data"
import { storySource } from "@/site/story-source"

// An example's code, as its Code sheet shows it, highlighted, as static JSON (site/code-data.ts).
export const dynamic = "force-static"
export const dynamicParams = false
export const generateStaticParams = () => storyKeys()

export async function GET(_: Request, { params }: { params: Promise<{ file: string; name: string }> }) {
  const { file, name } = await params
  if (!storyKeys().some((k) => k.file === file && k.name === name)) return new Response("Not found", { status: 404 })
  return Response.json(await codeData(storySource(file, name), "tsx"))
}
