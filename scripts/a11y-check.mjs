// Every rendered component has a measured entry in site/a11y.json (scripts/a11y.cjs writes it from a running site).
import { readFileSync } from "node:fs"

const reg = JSON.parse(readFileSync("registry.json", "utf8"))
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
console.log(`A11y data check passed (${Object.keys(data).length} components)`)
