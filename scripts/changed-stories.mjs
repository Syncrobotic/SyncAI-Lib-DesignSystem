// The stories a pull request can change: those in a changed stories file, and those in a stories file that imports a
// changed registry file directly. Prints a Playwright --grep pattern for their tests, or nothing when there are none.
// Run after build-storybook (it reads storybook-static/index.json):
//   node scripts/changed-stories.mjs origin/dev
// CI runs these stories twice on a pull request into dev, the second time against the first one's pictures: a story
// that does not draw the same picture twice (a thumb caught halfway, a clock that moved) fails there, not at stage.
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"

const base = process.argv[2] ?? "origin/dev"
const changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).split("\n").filter(Boolean)

/** @type {Set<string>} */
const files = new Set(changed.filter((f) => /^stories\/.*\.stories\.tsx$/.test(f)))
const modules = changed
  .filter((f) => /^registry\/syncrobotic\/.*\.tsx?$/.test(f))
  .map((f) => f.replace(/\.tsx?$/, "").replace(/^registry\//, "@/registry/"))
if (modules.length)
  for (const f of readdirSync("stories")) {
    if (!f.endsWith(".stories.tsx")) continue
    const src = readFileSync(`stories/${f}`, "utf8")
    if (modules.some((m) => src.includes(`"${m}"`))) files.add(`stories/${f}`)
  }

/** @type {{ entries: Record<string, { id: string; type: string; importPath: string }> }} */
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8"))
const ids = Object.values(index.entries)
  .filter((e) => e.type === "story" && files.has(e.importPath.replace(/^\.\//, "")))
  .map((e) => e.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
if (ids.length) process.stdout.write(`(?:${ids.join("|")}) · `)
