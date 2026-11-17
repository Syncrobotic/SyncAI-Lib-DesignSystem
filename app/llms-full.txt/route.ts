import { llmsFull } from "@/site/ai"

export const dynamic = "force-static"

/** Everything in one file: the design language, every block, every component with when to use it and agent notes. */
export function GET() {
  return new Response(llmsFull(), { headers: { "content-type": "text/plain; charset=utf-8" } })
}
