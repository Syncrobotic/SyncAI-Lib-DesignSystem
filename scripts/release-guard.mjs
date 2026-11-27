// Run on pull requests into main, where the package version is the release (release.yml tags it and publishes its
// CHANGELOG section): every item's version is at most the package version, so nothing reaches main untagged, and the
// package version has its own dated CHANGELOG section, not "Unreleased".
import { readFileSync } from "node:fs"

const pkg = JSON.parse(readFileSync("package.json", "utf8")).version
/** @type {{ name: string, meta?: { version?: string } }[]} */
const items = JSON.parse(readFileSync("registry.json", "utf8")).items
/** @param {string} v */
const n = (v) => v.split(".").map(Number)
/** @param {string} a @param {string} b */
const gt = (a, b) => { const [x, y] = [n(a), n(b)]; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false }
const ahead = items.flatMap((i) => (i.meta?.version && gt(i.meta.version, pkg) ? [`${i.name} ${i.meta.version}`] : []))
const log = readFileSync("CHANGELOG.md", "utf8")
const errors = []
if (ahead.length) errors.push(`package.json is ${pkg} but ${ahead.length} item(s) are ahead of it (${ahead.slice(0, 5).join(", ")}${ahead.length > 5 ? ", …" : ""}). Bump package.json and the CHANGELOG heading before main.`)
if (/^## Unreleased/m.test(log)) errors.push('CHANGELOG.md still has "## Unreleased": name it "## <version> · <date>" before main.')
if (!new RegExp(`^## ${pkg.replaceAll(".", "\\.")} · \\d{4}-\\d{2}-\\d{2}`, "m").test(log)) errors.push(`CHANGELOG.md has no dated "## ${pkg} · YYYY-MM-DD" section.`)
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  process.exit(1)
}
console.log(`Release guard passed: ${pkg}, no item ahead of it`)
