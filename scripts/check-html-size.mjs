// A size budget for the docs site's prerendered pages, run after `npm run build` (npm run lint:html-size).
//
// A page's HTML carries its markup and its React payload (the self.__next_f chunks), and every byte of the payload is
// parsed and hydrated on the visitor's main thread. 0.35's chart page was 2.2 MB, most of it code listings behind tabs
// nobody had opened; those are fetched on open now (site/code-data.ts). This keeps a page from growing back unnoticed.
//
// The payload repeats the server-rendered tree, so a long list pays for its markup twice. In 0.38 the last eight pages
// left their ceilings that way: code listings carry eight colour classes, not a style on every word (ROS 423 KB to 309,
// Next.js 516 to 373); repeated utilities written once as a class (the icon tiles, 507 to 376); a component's Patterns
// drawn as each block nears the screen (chart 740 to 391); a token table is one table that CSS lays out for a phone, its rows without classes (Colour 431 KB to
// 310 KB); a long list a page draws from data is a client component given the strings, so the payload carries those and
// not the elements (Upgrading 896 to 296, the Components cards 561 to 321); and a catalog few readers open is static JSON
// fetched after the page shows (Localisation's labels, 1,978 to 302).
//
//   npm run build && npm run lint:html-size        fails when a page is over the limit, and lists the largest pages
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = ".next/server/app"
/** The limit in KB. After 0.38 the median page is about 210 KB and the largest 392 KB (the chart page). */
const LIMIT_KB = Number(process.env.HTML_LIMIT_KB ?? 400)

/**
 * Pages allowed over the limit for what they show, each with its reason. Since 0.38 there are none: adding one is a
 * decision, with its reason here.
 * @type {Record<string, { kb: number, why: string }>}
 */
const ceilings = {
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
