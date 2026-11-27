// Fails CI on comments that break the "Comments and docs" rules in CONTRIBUTING.md: a block of more than 8 lines
// (consecutive `//` lines, or one `/* */` or `{/* */}`), or history (HISTORY below) that belongs in CHANGELOG.md.
// Escape: `history-ok:` on the line, for an upstream fact such as another library's version.
//
//   node scripts/check-comments.mjs [dirs or files…]   default: ROOTS
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["registry", "scripts", "site", "app", "stories"]
const MAX_LINES = 8
const HISTORY = /\b((?<!\b(?:is|are|be|been|being|gets?) )used to|previously|was changed|no longer|before \d+\.\d+|since \d+\.\d+|the \d+\.\d+ audit)\b/i

/** @type {(path: string) => string[]} */
const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((f) => (f === "node_modules" ? [] : walk(join(path, f))))
    : /\.(tsx?|[cm]?js|css)$/.test(path)
      ? [path]
      : []

let bad = 0
/** @type {(file: string, line: number, msg: string) => void} */
const fail = (file, line, msg) => {
  console.error(`${file}:${line}  ${msg}`)
  bad++
}

/** @param {string} file */
export function check(file) {
  const lines = readFileSync(file, "utf8").split("\n")
  /** @type {{ start: number, text: string[] }[]} */
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith("//")) {
      const start = i
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("//")) i++
      blocks.push({ start, text: lines.slice(start, i + 1) })
    } else if (/^(\{\s*)?\/\*/.test(t)) {
      const start = i
      while (!lines[i].includes("*/") && i + 1 < lines.length) i++
      blocks.push({ start, text: lines.slice(start, i + 1) })
    }
  }
  for (const { start, text } of blocks) {
    if (text.length > MAX_LINES) fail(file, start + 1, `comment block of ${text.length} lines (max ${MAX_LINES}): say why, not what, or move it to the docs`)
    text.forEach((l, j) => {
      const m = l.match(HISTORY)
      if (m && !/history-ok:/.test(l)) fail(file, start + j + 1, `"${m[0]}" narrates history: put it in CHANGELOG.md and keep the rule (or mark an upstream fact \`history-ok:\`)`)
    })
  }
}

const args = process.argv.slice(2)
for (const file of (args.length ? args : ROOTS).flatMap(walk)) check(file)

if (bad) {
  console.error(`\n${bad} comment problem(s)`)
  process.exit(1)
}
console.log("Comments check passed")
