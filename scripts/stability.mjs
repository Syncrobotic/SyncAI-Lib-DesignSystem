// Which items can be stable, from evidence in this repository. The policy is /docs/upgrading#status and CONTRIBUTING.md.
// Promotion needs every criterion; a stable item must keep the hard ones (HARD), which lint:registry checks. Settled is
// not hard: a stable item stays stable through a breaking change made the stable way (deprecated first, then removed).
//
//   node scripts/stability.mjs                   the beta items that meet the criteria, then what holds back the rest
//   node scripts/stability.mjs --all             the stable items too
//   node scripts/stability.mjs --product <dir>   which items a product has installed (robot and model parts need one)
//   node scripts/stability.mjs --json
import { readFileSync, readdirSync } from "node:fs"
import { basename, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"
import { compareVersions, parseChangelog, scanDir } from "./adoption.mjs"

/** Releases an item must have shipped in, unbroken, before it can be stable. */
export const WINDOW = 10
export const HARD = /** @type {const} */ (["tested", "measured", "documented", "dependencies", "deprecated first"])
/** Robot and model parts: their API is proven only against a real robot or model, so they need a product that uses them. */
const DOMAIN_GROUPS = new Set(["Robotics", "AI"])
const DOMAIN_ITEMS = new Set(["ros", "use-ros", "use-long-press", "use-slide-release", "markdown", "trace"])
/** Tests that only check types, or sweep every item for one property, do not exercise an item. */
const NOT_EXERCISE = /\.types\.test\.ts$|^data-slot-coverage\./
/** Items whose docs are a page of their own (the tokens, the agent skill), not a component page. */
const OWN_PAGE = new Set(["registry:style", "registry:file"])
const MEASURED = new Set(["registry:ui", "registry:component"])

/** @typedef {import("./types.js").RegistryItem} Item */
/** @typedef {{ name: string; type: string; status: string; first: string; checks: Record<string, string | true>; candidate: boolean; hardFailures: string[]; deps: string[] }} Row */

/**
 * Item names named in the Breaking section of each release: `name`, **name** or **`name`**.
 * @param {{ version: string; lines: string[] }[]} sections
 * @param {Set<string>} names
 * @returns {Map<string, string[]>} item → the releases that broke it
 */
export function breakingByItem(sections, names) {
  /** @type {Map<string, string[]>} */
  const out = new Map()
  for (const s of sections) {
    let inBreaking = false
    for (const line of s.lines) {
      if (line.startsWith("### ")) inBreaking = /^### Breaking\b/.test(line)
      if (!inBreaking) continue
      for (const [, token] of line.matchAll(/(?:`|\*\*)([a-z0-9][a-z0-9-]*):?(?:`|\*\*)/g))
        if (names.has(token) && !out.get(token)?.includes(s.version)) out.set(token, [...(out.get(token) ?? []), s.version])
    }
  }
  return out
}

/**
 * A stable item breaks only after a release deprecated what it removes: a note starting "Breaking" after its
 * "Stable:" note needs an earlier one starting "Deprecated". Null when the rule holds.
 * @param {import("./types.js").ChangelogEntry[]} changelog newest first, as in registry.json
 */
export function deprecationProblem(changelog) {
  const oldestFirst = [...changelog].reverse()
  const stableAt = oldestFirst.findIndex((c) => c.note.startsWith("Stable:"))
  if (stableAt < 0) return null
  let deprecated = false
  for (const c of oldestFirst.slice(stableAt + 1)) {
    if (c.note.startsWith("Deprecated")) deprecated = true
    else if (c.note.startsWith("Breaking") && !deprecated) return `${c.version} breaks it with no Deprecated note in an earlier release`
  }
  return null
}

/**
 * The entries of the object `name` in `file` that have each of `fields` as a non-empty array. Entries are the keys of
 * an object literal, or the `key` property of each element of an array literal.
 * @param {string} file
 * @param {string} name
 * @param {string} key
 * @param {string[]} fields
 */
function documented(file, name, key, fields) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true)
  /** @type {Set<string>} */
  const out = new Set()
  /** @param {ts.ObjectLiteralExpression} obj @param {string} id */
  const check = (obj, id) => {
    /** @param {string} f */
    const has = (f) =>
      obj.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === f && ts.isArrayLiteralExpression(p.initializer) && p.initializer.elements.length > 0)
    if (fields.every(has)) out.add(id)
  }
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(sf) === name && node.initializer) {
      const init = node.initializer
      if (ts.isObjectLiteralExpression(init))
        for (const p of init.properties)
          if (ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.initializer)) check(p.initializer, ts.isStringLiteral(p.name) ? p.name.text : p.name.getText(sf))
      if (ts.isArrayLiteralExpression(init))
        for (const e of init.elements)
          if (ts.isObjectLiteralExpression(e)) {
            const k = e.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === key)
            if (k && ts.isPropertyAssignment(k) && ts.isStringLiteral(k.initializer)) check(e, k.initializer.text)
          }
    }
    node.forEachChild(visit)
  }
  visit(sf)
  return out
}

/** The block → type map in site/block-types.ts (`placement`). */
function blockTypes() {
  const src = readFileSync("site/block-types.ts", "utf8")
  const body = src.slice(src.indexOf("export const placement"))
  return new Map([...body.matchAll(/^\s*"?([a-z0-9-]+)"?: \{ type: "([a-z0-9-]+)"/gm)].map((m) => [m[1], m[2]]))
}

/** Each catalog entry's group in site/catalog.ts. */
function groups() {
  const src = readFileSync("site/catalog.ts", "utf8")
  /** @type {Map<string, string>} */
  const out = new Map()
  let current = ""
  for (const line of src.split("\n")) {
    const entry = /^ {2}"?([a-z0-9-]+)"?: \{/.exec(line)
    if (entry) current = entry[1]
    const group = /\bgroup: "([^"]+)"/.exec(line)
    if (group && current && !out.has(current)) out.set(current, group[1])
  }
  return out
}

/**
 * For each item file, the test files that import it, and the names they import.
 * @returns {Map<string, { test: string; names: string[] }[]>} "registry/syncrobotic/ui/dialog" → importers
 */
function testImports() {
  /** @type {Map<string, { test: string; names: string[] }[]>} */
  const out = new Map()
  for (const f of readdirSync("tests/unit")) {
    if (!/\.test\.tsx?$/.test(f) || NOT_EXERCISE.test(f)) continue
    const src = readFileSync(`tests/unit/${f}`, "utf8")
    for (const [, names, spec] of src.matchAll(/^import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["']@\/(registry\/syncrobotic\/[^"']+)["']/gm))
      out.set(spec, [...(out.get(spec) ?? []), { test: f, names: names.match(/\b[A-Za-z_]\w*\b/g) ?? [] }])
  }
  return out
}

/**
 * @param {{ items: Item[] }} [registry]
 * @param {Map<string, string[]>} [usedBy] item → the products that installed it
 * @returns {Row[]}
 */
export function evaluate(registry = JSON.parse(readFileSync("registry.json", "utf8")), usedBy = new Map()) {
  const sections = parseChangelog(readFileSync("CHANGELOG.md", "utf8"))
  const broke = breakingByItem(sections, new Set(registry.items.map((i) => i.name)))
  const windowStart = sections.slice(0, WINDOW).at(-1)?.version ?? "0.0.0"
  const a11y = JSON.parse(readFileSync("site/a11y.json", "utf8"))
  const docs = documented("site/overview.ts", "overviews", "", ["use", "instead"])
  const typeDocs = documented("site/block-types.ts", "blockTypes", "slug", ["use", "instead"])
  const placement = blockTypes()
  const imports = testImports()
  const groupOf = groups()
  const statusOf = new Map(registry.items.map((i) => [i.name, i.meta?.status ?? "stable"]))

  const rows = registry.items.map((item) => {
    const changelog = item.meta?.changelog ?? []
    const first = changelog.at(-1)?.version ?? "0.0.0"
    const status = item.meta?.status ?? "stable"
    const block = item.type === "registry:block"
    /** @type {Record<string, string | true>} */
    const checks = {}

    // Settled: shipped through the whole window, and no release in it (or after it, unreleased) broke it.
    const recent = (broke.get(item.name) ?? []).filter((v) => compareVersions(v, windowStart) >= 0)
    const marked = changelog.filter((c) => compareVersions(c.version, windowStart) >= 0 && c.note.startsWith("Breaking")).map((c) => c.version)
    if (compareVersions(first, windowStart) > 0) checks.settled = `first released in ${first}, inside the last ${WINDOW} releases`
    else if (recent.length || marked.length) checks.settled = `breaking change in ${[...new Set([...recent, ...marked])].join(", ")}`
    else checks.settled = true

    const importers = item.files.flatMap((f) => imports.get(f.path.replace(/\.tsx?$/, "")) ?? [])
    if (OWN_PAGE.has(item.type)) checks.tested = true
    else if (block) checks.tested = importers.some((t) => t.names.some((n) => n.endsWith("Content"))) ? true : "no unit test renders its Content export from props"
    else checks.tested = importers.length ? true : "no unit test imports it"

    checks.measured = !MEASURED.has(item.type) || a11y[item.name] ? true : "no data in site/a11y.json"

    if (OWN_PAGE.has(item.type)) checks.documented = true
    else if (block) {
      const type = placement.get(item.name)
      checks.documented = type && typeDocs.has(type) ? true : `its block type ${type ?? "(none)"} has no use and instead`
    } else checks.documented = docs.has(item.name) ? true : "no use and instead in site/overview.ts"

    const deps = (item.registryDependencies ?? []).map((d) => d.replace("@syncrobotic/", "")).filter((d) => statusOf.get(d) === "beta")
    checks.dependencies = deps.length ? `depends on beta ${deps.join(", ")}` : true

    if (block) checks.controlled = item.meta?.wiring === "controlled" ? true : "demo data: not wired from props"
    if (DOMAIN_GROUPS.has(groupOf.get(item.name) ?? "") || DOMAIN_ITEMS.has(item.name))
      checks.proven = usedBy.has(item.name) ? true : "a robot or model part no product has installed"

    checks["deprecated first"] = (status === "stable" && deprecationProblem(changelog)) || true

    const hardFailures = status === "stable" ? HARD.filter((h) => checks[h] !== true).map((h) => `${h}: ${checks[h]}`) : []
    return { name: item.name, type: item.type, status, first, checks, candidate: false, hardFailures, deps }
  })

  // A beta dependency that is itself a candidate goes stable in the same release: settle that to a fixed point.
  const ready = new Set(rows.filter((r) => Object.entries(r.checks).every(([k, v]) => v === true || k === "dependencies")).map((r) => r.name))
  for (let changed = true; changed; ) {
    changed = false
    for (const r of rows)
      if (ready.has(r.name) && r.deps.some((d) => !ready.has(d))) {
        ready.delete(r.name)
        changed = true
      }
  }
  for (const r of rows) r.candidate = r.status === "beta" && ready.has(r.name)
  return rows
}

function main() {
  const argv = process.argv.slice(2)
  const products = argv.flatMap((a, i) => (argv[i - 1] === "--product" ? [resolve(a)] : []))
  /** @type {Map<string, string[]>} */
  const usedBy = new Map()
  for (const dir of products) for (const f of scanDir(dir)) usedBy.set(f.name, [...new Set([...(usedBy.get(f.name) ?? []), basename(dir)])])

  const rows = evaluate(undefined, usedBy)
  if (argv.includes("--json")) {
    console.log(JSON.stringify(rows.map((r) => ({ ...r, usedBy: usedBy.get(r.name) ?? [] })), null, 2))
    return
  }
  /** @param {string} n */
  const used = (n) => (usedBy.has(n) ? `  (installed in ${usedBy.get(n)?.join(", ")})` : "")
  const candidates = new Set(rows.filter((r) => r.candidate).map((r) => r.name))
  const beta = rows.filter((r) => r.status === "beta")
  console.log(`Criteria: settled (${WINDOW} releases, none breaking), tested, measured, documented, dependencies stable, controlled (blocks), proven (robot and model parts)\n`)
  console.log(`Candidates for stable (${candidates.size} of ${beta.length} beta):`)
  for (const r of beta.filter((r) => r.candidate)) console.log(`  ${r.name}${used(r.name)}`)
  console.log(`\nHeld back:`)
  for (const r of beta.filter((r) => !r.candidate)) {
    const why = Object.entries(r.checks).filter(([k, v]) => v !== true && !(k === "dependencies" && r.deps.every((d) => candidates.has(d))))
    console.log(`  ${r.name}${used(r.name)}: ${why.map(([k, v]) => `${k}: ${v}`).join("; ") || "a dependency is held back"}`)
  }
  if (argv.includes("--all")) {
    console.log(`\nStable (${rows.length - beta.length}):`)
    for (const r of rows.filter((r) => r.status === "stable")) console.log(`  ${r.name}${used(r.name)}${r.hardFailures.length ? `: ${r.hardFailures.join("; ")}` : ""}`)
  }
  const broken = rows.filter((r) => r.hardFailures.length)
  if (broken.length) {
    console.error(`\n${broken.length} stable item(s) no longer meet the hard criteria:`)
    for (const r of broken) console.error(`  ${r.name}: ${r.hardFailures.join("; ")}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main()
