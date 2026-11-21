// Per-item versions. Components install as source, so each file carries a header naming its item and version;
// a project (and the adoption scanner) can read what it has installed.
//
//   node scripts/versions.mjs          CI: fails if a file changed without a version bump, or headers/lock are stale
//   node scripts/versions.mjs --write  after bumping meta.version in registry.json: write headers and the lock
//
// Rules: the version lives in registry.json (items[].meta.version), with one changelog line per version
// (items[].meta.changelog). The lock (registry/versions.lock.json) records the content hash each version shipped with.
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

const WRITE = process.argv.includes("--write")
const LOCK = "registry/versions.lock.json"
/** @type {import("./types.js").Registry} */
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
/** @type {import("./types.js").VersionsLock} */
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {}

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
