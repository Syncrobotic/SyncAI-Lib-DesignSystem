// Fails CI on a number written outside the kit's one number path (@syncrobotic/format-count). The 0.40 audit found five
// ways of writing numbers in the registry, and two of them broke the rule:
//
//  1. `.toLocaleString(` follows the runtime's locale when it is given none (or `undefined`): the server writes "1,234.5",
//     a browser set to German "1.234,5", and React finds the two renders differ. With a locale it still skips the
//     kit's fallback for a tag Intl cannot read, and a count written this way is not rounded like every other count.
//     Use `formatCount(n, { locale })` for a count and `formatNumber(n, { locale, ...options })` for any other number.
//  2. `new Intl.NumberFormat(` outside format-count builds a second formatter cache and a second locale rule. Use
//     `formatNumber` (any Intl.NumberFormat option goes through it) or `numberFormat(locale, options)` for the formatter.
//
// Dates and times are not numbers here: toLocaleDateString and toLocaleTimeString are clock-time's business.
// A line that is a comment is skipped. A file that truly needs either goes in ALLOW with its reason.
//
//   node scripts/check-numbers.mjs [dirs…]   default: registry/syncrobotic
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, sep } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry/syncrobotic"]
/** The number path itself. */
const HOME = ["registry", "syncrobotic", "lib", "format-count.ts"].join(sep)
/** @type {Record<string, string>} file (from the repo root) → why it may write a number its own way */
const ALLOW = {}

/** @type {(dir: string) => string[]} */
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts|mjs|js)$/.test(p) ? [p] : []
  })

const RULES = [
  { re: /\.toLocaleString\(/, msg: "toLocaleString: use formatCount (a count) or formatNumber (any other number) from @syncrobotic/format-count" },
  { re: /new Intl\.NumberFormat\(/, msg: "Intl.NumberFormat: use formatNumber or numberFormat from @syncrobotic/format-count" },
]

let bad = 0
for (const root of ROOTS)
  for (const file of walk(root)) {
    if (file === HOME || ALLOW[file.split(sep).join("/")]) continue
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        const code = line.trimStart()
        if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*")) return
        for (const r of RULES)
          if (r.re.test(line)) {
            console.error(`${file}:${i + 1}  ${r.msg}`)
            bad++
          }
      })
  }

if (bad) {
  console.error(`\n${bad} number(s) written outside the number path. See scripts/check-numbers.mjs.`)
  process.exit(1)
}
console.log("Number check passed: every number goes through format-count")
