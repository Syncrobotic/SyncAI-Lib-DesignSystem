import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const dynamic = "force-static"

import type { LucideNode } from "@/site/lucide-node"

/**
 * Every Lucide icon as `[name, nodes]`, for the "All Lucide" tab of /icons. Built once at build time from the installed
 * lucide-react, so the list matches the version the kit ships with, and only that tab downloads it.
 * Alias files (old names re-exporting a current icon) have no drawing of their own and are skipped.
 */
export function GET() {
  const dir = join(process.cwd(), "node_modules/lucide-react/dist/esm/icons")
  const out: [string, LucideNode][] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
    const m = readFileSync(join(dir, file), "utf8").match(/createLucideIcon\("(\w+)", (\[[\s\S]*?\])\);/)
    if (!m) continue
    // The array is a plain literal of tags and string attributes; JSON after quoting its keys.
    const nodes = JSON.parse(m[2].replace(/(\w+):/g, '"$1":')) as [string, Record<string, string>][]
    out.push([m[1], nodes.map(([tag, { key: _key, ...attrs }]) => [tag, attrs])])
  }
  return Response.json(out, { headers: { "cache-control": "public, max-age=86400" } })
}
