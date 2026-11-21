import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const dynamic = "force-static"

import type { LucideNode } from "@/site/lucide-node"

/**
 * Every Lucide icon as `[name, nodes]`, for the "All Lucide" tab of /icons. Built once at build time from the installed
 * lucide-react, so the list matches the version the kit ships with, and only that tab downloads it.
 * Each icon file of lucide-react 1.x declares `const __iconData = { name: "kebab-name", size, node: [...], aliases? }`.
 * Alias files (old names re-exporting a current icon) have no `__iconData` of their own and are skipped.
 */
export function GET() {
  const dir = join(process.cwd(), "node_modules/lucide-react/dist/esm/icons")
  const out: [string, LucideNode][] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
    const m = readFileSync(join(dir, file), "utf8").match(/const __iconData = (\{[\s\S]*?\n\});/)
    if (!m) continue
    // The object is a plain literal of names, numbers, tags and string attributes; it is JSON once its bare keys are quoted.
    const data = JSON.parse(m[1].replace(/([{,]\s*)([A-Za-z][\w-]*):/g, '$1"$2":')) as { name: string; node: [string, Record<string, string>][] }
    out.push([pascal(data.name), data.node.map(([tag, { key: _key, ...attrs }]) => [tag, attrs])])
  }
  return Response.json(out, { headers: { "cache-control": "public, max-age=86400" } })
}

/** The name lucide-react exports the icon under ("arrow-down-0-1" is ArrowDown01), which is what the gallery shows and copies. */
function pascal(kebab: string) {
  return kebab.replace(/(^|-)(\w)/g, (_, _dash: string, c: string) => c.toUpperCase())
}
