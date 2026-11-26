// The components whose site/a11y.json entries a pull request can change, for the quick check on a pull request into dev:
// a component's own files, and the components whose examples a changed stories file holds. Prints a comma list, or "all"
// when the data or the way it is measured changed. Stage measures every component, so a dependent this misses (a
// button change seen in a dialog's entry) is still caught before a release.
//   node scripts/a11y-affected.mjs origin/dev
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const base = process.argv[2] ?? "origin/dev"
const changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).split("\n").filter(Boolean)

if (changed.some((f) => /^(site\/a11y\.|scripts\/a11y)/.test(f))) {
  process.stdout.write("all")
  process.exit(0)
}

/** @type {{ items: { name: string; type: string; files?: { path: string }[] }[] }} */
const reg = JSON.parse(readFileSync("registry.json", "utf8"))
const measured = new Set(Object.keys(JSON.parse(readFileSync("site/a11y.json", "utf8"))))

// Which stories file holds each component's examples, from site/catalog.ts (examples: { file: "…" }).
const catalog = readFileSync("site/catalog.ts", "utf8")
/** @type {Map<string, string[]>} */
const byStories = new Map()
for (const m of catalog.matchAll(/\n {2}"?([\w-]+)"?: \{\n(?:[^\n]*\n){0,4}?\s+examples: \{ file: "([\w-]+)"/g))
  byStories.set(m[2], [...(byStories.get(m[2]) ?? []), m[1]])

const names = new Set()
for (const f of changed) {
  for (const i of reg.items) if (i.files?.some((x) => x.path === f)) names.add(i.name)
  const story = /^stories\/(.+)\.stories\.tsx$/.exec(f)?.[1]
  if (story) for (const n of byStories.get(story) ?? [story]) names.add(n)
}
process.stdout.write([...names].filter((n) => measured.has(n) || reg.items.some((i) => i.name === n && i.type === "registry:ui")).join(","))
