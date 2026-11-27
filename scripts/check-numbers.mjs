// Fails CI on a number written outside the kit's one number path (@syncrobotic/format-number):
//  1. `.toLocaleString(` follows the runtime's locale when given none, so the server's "1,234.5" and a German browser's
//     "1.234,5" differ at hydration; with a locale it still skips the kit's fallback and count rounding.
//     Use `formatCount(n, { locale })` for a count, `formatNumber(n, { locale, ...options })` for any other number.
//  2. `new Intl.NumberFormat(` builds a second formatter cache and locale rule: use `formatNumber` or `numberFormat`.
// Dates and times are clock-time's business. Comment lines are skipped; a file that truly needs either goes in ALLOW.
//
//   node scripts/check-numbers.mjs [dirs…]   default: registry/syncrobotic
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, sep } from "node:path"

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ["registry/syncrobotic"]
/** The number path itself. */
const HOME = ["registry", "syncrobotic", "lib", "format-number.ts"].join(sep)
/** @type {Record<string, string>} file (from the repo root) → why it may write a number its own way */
const ALLOW = {}

/** @type {(dir: string) => string[]} */
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts|mjs|js)$/.test(p) ? [p] : []
  })

const RULES = [
  { re: /\.toLocaleString\(/, msg: "toLocaleString: use formatCount (a count) or formatNumber (any other number) from @syncrobotic/format-number" },
  { re: /new Intl\.NumberFormat\(/, msg: "Intl.NumberFormat: use formatNumber or numberFormat from @syncrobotic/format-number" },
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
console.log("Number check passed: every number goes through format-number")
