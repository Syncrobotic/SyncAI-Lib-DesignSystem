// Every rendered component has a measured entry in site/a11y.json (scripts/a11y.cjs writes it from a running site).
import { readFileSync } from "node:fs"

/** @type {import("./types.js").Registry} */
const reg = JSON.parse(readFileSync("registry.json", "utf8"))
/** @type {Record<string, unknown>} */
const data = JSON.parse(readFileSync("site/a11y.json", "utf8"))
const missing = reg.items
  .filter((i) => (i.type === "registry:ui" || i.type === "registry:component") && i.meta?.examples !== false)
  .filter((i) => !(i.name in data))
// An item with no examples on its page (a file of icons) has nothing to measure; the catalog says which have examples.
const catalog = readFileSync("site/catalog.ts", "utf8")
const real = missing.filter((i) => new RegExp(`\\b"?${i.name}"?: \\{[^}]*examples`).test(catalog))
if (real.length) {
  console.error(`site/a11y.json has no entry for: ${real.map((i) => i.name).join(", ")}.\nRun the site and SITE=… node scripts/a11y.cjs.`)
  process.exit(1)
}
// With --measured <file> (CI writes one from the built site), the committed data must equal what the browser measures now.
const at = process.argv.indexOf("--measured")
if (at > 0) {
  /** @type {Record<string, unknown>} */
  const now = JSON.parse(readFileSync(process.argv[at + 1], "utf8"))
  const names = [...new Set([...Object.keys(data), ...Object.keys(now)])].sort()
  const stale = names.filter((n) => JSON.stringify(data[n]) !== JSON.stringify(now[n]))
  if (stale.length) {
    for (const n of stale) console.error(`${n}\n  committed: ${JSON.stringify(data[n] ?? null)}\n  measured:  ${JSON.stringify(now[n] ?? null)}`)
    console.error(`\nsite/a11y.json is out of date for ${stale.length} component(s). Run the site and npm run a11y, or take the measured file from this run's artifact.`)
    process.exit(1)
  }
}
console.log(`A11y data check passed (${Object.keys(data).length} components)`)
