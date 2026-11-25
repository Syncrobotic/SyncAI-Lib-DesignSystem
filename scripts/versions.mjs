// Per-item versions. Components install as source, so each file carries a header naming its item and version;
// a project (and the adoption scanner) can read what it has installed.
//
//   node scripts/versions.mjs          CI: fails if a file changed without a version bump, or headers/lock are stale
//   node scripts/versions.mjs --write  after bumping meta.version in registry.json: write headers and the lock
//
// Rules: the version lives in registry.json (items[].meta.version), with one changelog line per version
// (items[].meta.changelog). The lock (registry/versions.lock.json) records the content hash each version shipped with.
//
// Finding a version's source: an item at vX.Y.Z is in the kit tag vX.Y.Z, unless registry/kit-tags.json names
// another tag for it ("slider@0.21.1": "v0.24.0", the first kit release that shipped it). A version that is neither
// a kit release (a dated CHANGELOG section) nor in that map fails here once it is released, so every header stays
// findable at a tag.
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

const WRITE = process.argv.includes("--write")
const LOCK = "registry/versions.lock.json"
/** @type {import("./types.js").Registry} */
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
/** @type {import("./types.js").VersionsLock} */
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {}

const KIT_TAGS = "registry/kit-tags.json"
/** @type {Record<string, string>} */
const kitTags = existsSync(KIT_TAGS) ? JSON.parse(readFileSync(KIT_TAGS, "utf8")) : {}
/** @param {string} v */
const semver = (v) => v.split(".").map(Number)
/** @param {string} a @param {string} b */
const after = (a, b) => {
  const [x, y] = [semver(a), semver(b)]
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]
  return false
}
const releases = new Set([...readFileSync("CHANGELOG.md", "utf8").matchAll(/^## (\d+\.\d+\.\d+) · /gm)].map((m) => m[1]))
const latestRelease = [...releases].reduce((a, b) => (after(b, a) ? b : a), "0.0.0")

const HEADER = /^(\/\/ @syncrobotic\/\S+ v\S+.*\n|\/\* @syncrobotic\/\S+ v\S+.*\*\/\n)/
/**
 * @param {string} file
 * @param {string} name
 * @param {string} version
 */
const header = (file, name, version) => {
  // Markdown (the agent skill) carries no header: a skill file must start with its frontmatter. Its version is in the lock.
  if (file.endsWith(".md")) return ""
  const text = `@syncrobotic/${name} v${version} · update: npx shadcn add @syncrobotic/${name} --overwrite`
  return file.endsWith(".css") ? `/* ${text} */\n` : `// ${text}\n`
}
/** @param {string} src */
const body = (src) => src.replace(HEADER, "")
/** @param {import("./types.js").RegistryItem} item */
const hash = (item) =>
  createHash("sha256")
    .update(item.files.map((f) => `${f.path}\n${body(readFileSync(f.path, "utf8"))}`).join("\n"))
    .digest("hex")
    .slice(0, 16)

/** @type {string[]} */
const errors = []
/** @type {import("./types.js").VersionsLock} */
const nextLock = {}
for (const item of registry.items) {
  const version = item.meta?.version
  if (!version) {
    errors.push(`${item.name}: no meta.version in registry.json`)
    continue
  }
  if (!item.meta?.changelog?.some((c) => c.version === version)) errors.push(`${item.name}: no meta.changelog entry for ${version}`)

  // Not yet released (newer than every dated CHANGELOG section): it ships, and is tagged, with the next release.
  if (!releases.has(version) && !kitTags[`${item.name}@${version}`] && !after(version, latestRelease))
    errors.push(`${item.name}@${version}: no kit release is called ${version}. Add "${item.name}@${version}": "v<the release that ships it>" to ${KIT_TAGS}`)

  const h = hash(item)
  const was = lock[item.name]
  if (was && was.hash !== h && was.version === version) errors.push(`${item.name}: files changed but version is still ${version}. Bump meta.version and add a changelog line, then run npm run versions`)
  nextLock[item.name] = { version, hash: h }

  for (const f of item.files) {
    const src = readFileSync(f.path, "utf8")
    const want = header(f.path, item.name, version)
    if (src.startsWith(want)) continue
    if (WRITE) writeFileSync(f.path, want + body(src))
    else errors.push(`${f.path}: header should be ${want.trim()}. Run npm run versions`)
  }
  if (!WRITE && (!was || was.hash !== h || was.version !== version)) errors.push(`${item.name}: ${LOCK} is stale. Run npm run versions`)
}

// The kit's own version: package.json and package-lock.json move together (npm version <x> --no-git-tag-version).
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const pkgLock = existsSync("package-lock.json") ? JSON.parse(readFileSync("package-lock.json", "utf8")) : null
if (pkgLock && (pkgLock.version !== pkg.version || pkgLock.packages?.[""]?.version !== pkg.version))
  errors.push(`package-lock.json says ${pkgLock.version}, package.json ${pkg.version}. Run npm version ${pkg.version} --no-git-tag-version --allow-same-version`)

// --write refuses to record a change that skipped its bump, so the lock can never hide one.
const unbumped = errors.filter((e) => e.includes("files changed but version"))
if (WRITE && unbumped.length === 0 && errors.every((e) => !e.includes("meta."))) {
  writeFileSync(LOCK, JSON.stringify(nextLock, null, 2) + "\n")
  console.log(`Versions written (${Object.keys(nextLock).length} items)`)
  process.exit(0)
}
if (errors.length) {
  console.error(errors.join("\n"))
  console.error(`\n${errors.length} problem(s)`)
  process.exit(1)
}
console.log(`Versions check passed (${registry.items.length} items)`)
