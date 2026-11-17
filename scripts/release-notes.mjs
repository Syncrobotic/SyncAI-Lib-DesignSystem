// Prints the CHANGELOG section for one version ("## 0.8.0 · 2026-11-17" up to the next "## "), for the GitHub Release body.
// Usage: node scripts/release-notes.mjs 0.8.0
import { readFileSync } from "node:fs"

const version = process.argv[2]
const lines = readFileSync("CHANGELOG.md", "utf8").split("\n")
const start = lines.findIndex((l) => l.startsWith(`## ${version} `) || l === `## ${version}`)
if (start === -1) {
  console.error(`CHANGELOG.md has no "## ${version}" section`)
  process.exit(1)
}
const end = lines.findIndex((l, i) => i > start && l.startsWith("## "))
console.log(lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim())
