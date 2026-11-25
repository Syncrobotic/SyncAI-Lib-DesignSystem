// A size budget for the docs site's prerendered pages, run after `npm run build` (npm run lint:html-size).
//
// A page's HTML carries its markup and its React payload (the self.__next_f chunks), and every byte of the payload is
// parsed and hydrated on the visitor's main thread. 0.35's chart page was 2.2 MB, most of it code listings behind tabs
// nobody had opened; those are fetched on open now (site/code-data.ts). This keeps a page from growing back unnoticed.
//
//   npm run build && npm run lint:html-size        fails when a page is over the limit, and lists the largest pages
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = ".next/server/app"
/** The limit in KB. After 0.36 the median page is 211 KB and all but eight are under 360 KB. */
const LIMIT_KB = Number(process.env.HTML_LIMIT_KB ?? 400)

/**
 * Pages over the limit for what they show, not for anything hidden, each held to its 0.36 size plus about a tenth. Lower a
 * ceiling when a page shrinks; raising one is a decision, with its reason here.
 * @type {Record<string, { kb: number, why: string }>}
 */
const ceilings = {
  "/docs/localisation": { kb: 2150, why: "1,953 KB: every label of the kit with its zh-TW text, as a table and as a phone list" },
  "/docs/upgrading": { kb: 980, why: "888 KB: the whole changelog" },
  "/docs/components/chart": { kb: 850, why: "771 KB: seven chart examples drawn as SVG and 21 chart patterns, each a live preview" },
  "/docs/components": { kb: 620, why: "561 KB: a card for every component" },
  "/docs/nextjs": { kb: 570, why: "515 KB: 13 code listings shown on the page" },
  "/icons": { kb: 560, why: "507 KB: every robot icon drawn" },
  "/docs/foundations/color": { kb: 480, why: "430 KB: every colour token with its contrast" },
  "/docs/ros": { kb: 470, why: "423 KB: the ROS guide with its listings" },
}

/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : f.endsWith(".html") ? [join(dir, f)] : []))

let pages
try {
  pages = walk(ROOT)
} catch {
  console.error(`No ${ROOT}: run npm run build first.`)
  process.exit(1)
}
const sizes = pages
  .map((p) => ({ page: p.slice(ROOT.length).replace(/\.html$/, "").replace(/^\/index$/, "/") || "/", kb: statSync(p).size / 1024 }))
  .sort((a, b) => b.kb - a.kb)
const limit = (/** @type {string} */ page) => ceilings[page]?.kb ?? LIMIT_KB
const over = sizes.filter((s) => s.kb > limit(s.page))
const row = (/** @type {{ page: string, kb: number }} */ s) => `  ${s.kb.toFixed(0).padStart(5)} KB  ${s.page}${ceilings[s.page] ? ` (ceiling ${limit(s.page)} KB)` : ""}`

console.log(`Largest prerendered pages (limit ${LIMIT_KB} KB):\n${sizes.slice(0, 12).map(row).join("\n")}`)
const stale = Object.keys(ceilings).filter((p) => !sizes.some((s) => s.page === p))
if (stale.length) {
  console.error(`\nCeilings for pages that no longer exist: ${stale.join(", ")}`)
  process.exit(1)
}
if (over.length) {
  console.error(`\n${over.length} page(s) over budget:\n${over.map(row).join("\n")}`)
  console.error("\nMove what is hidden until opened (a tab, a sheet) out of the page, as site/lazy-code.tsx does for code.")
  process.exit(1)
}
console.log(`\nHTML size check passed (${sizes.length} pages, the largest ${sizes[0].kb.toFixed(0)} KB)`)
