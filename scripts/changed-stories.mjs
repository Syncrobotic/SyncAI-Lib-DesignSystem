// The stories a pull request can change: those in a changed stories file or one that imports a changed registry file
// (directly or not), and, when the theme or cn changed, the first story of every file. Prints a Playwright --grep
// pattern, or nothing. Runs after build-storybook (it reads storybook-static/index.json). CI runs them twice into dev
// (see ci.yml, stories-changed).
//   node scripts/changed-stories.mjs origin/dev
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"

const base = process.argv[2] ?? "origin/dev"
const changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).split("\n").filter(Boolean)

/** @type {Set<string>} */
const files = new Set(changed.filter((f) => /^stories\/.*\.stories\.tsx$/.test(f)))
const storyFiles = readdirSync("stories").filter((f) => f.endsWith(".stories.tsx"))

// A change to what every story wears (the theme's tokens and styles, cn) can move any of them: one story from each
// stories file, a smoke set, rather than the whole suite, which stage runs anyway.
const global = changed.some((f) => /^registry\/syncrobotic\/styles\/|^lib\/utils\.ts$|^app\/globals\.css$|^\.storybook\//.test(f))

// A changed registry file reaches the stories that import it, and those that import anything importing it: walk the
// registry's imports backwards from what changed, so a button change reaches the dialog's stories too.
const toModule = (/** @type {string} */ f) => f.replace(/\.tsx?$/, "").replace(/^registry\//, "@/registry/")
const registryFiles = execFileSync("git", ["ls-files", "registry/syncrobotic"], { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.tsx?$/.test(f))
/** @type {Map<string, string[]>} module → the modules that import it */
const importers = new Map()
for (const f of registryFiles) {
  for (const m of readFileSync(f, "utf8").matchAll(/from "(@\/registry\/[^"]+)"/g))
    importers.set(m[1], [...(importers.get(m[1]) ?? []), toModule(f)])
}
const reached = new Set(changed.filter((f) => /^registry\/syncrobotic\/.*\.tsx?$/.test(f)).map(toModule))
for (const queue = [...reached]; queue.length; ) {
  for (const up of importers.get(/** @type {string} */ (queue.pop())) ?? []) {
    if (reached.has(up)) continue
    reached.add(up)
    queue.push(up)
  }
}
if (reached.size)
  for (const f of storyFiles) {
    const src = readFileSync(`stories/${f}`, "utf8")
    if ([...reached].some((m) => src.includes(`"${m}"`))) files.add(`stories/${f}`)
  }

/** @type {{ entries: Record<string, { id: string; type: string; importPath: string }> }} */
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8"))
const stories = Object.values(index.entries).filter((e) => e.type === "story")
/** @type {Set<string>} */
const firstOfFile = new Set()
const picked = stories.filter((e) => {
  const file = e.importPath.replace(/^\.\//, "")
  if (files.has(file)) return true
  if (!global || firstOfFile.has(file)) return false
  firstOfFile.add(file)
  return true
})
const ids = picked.map((e) => e.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
if (ids.length) process.stdout.write(`(?:${ids.join("|")}) · `)
