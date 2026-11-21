// Fails CI when a registry item's declared dependencies drift from what its files import:
// every npm import must be in `dependencies`, every @/registry import must be a registryDependency
// (directly or through one), and files that use React hooks or handlers must start with "use client".
import { readFileSync } from "node:fs"

/** @type {import("./types.js").Registry} */
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const byPath = new Map(registry.items.flatMap((i) => i.files.map((f) => [f.path.replace(/\.tsx?$/, ""), i.name])))
const byName = new Map(registry.items.map((i) => [i.name, i]))
const BUILTIN = new Set(["react", "react-dom"])
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
/** @param {string} v */
const minor = (v) => v.split(".").slice(0, 2).join(".")

/**
 * @param {string} name
 * @param {Set<string>} [seen]
 * @returns {Set<string>}
 */
function closure(name, seen = new Set()) {
  for (const d of byName.get(name)?.registryDependencies ?? []) {
    const n = d.replace("@syncrobotic/", "")
    if (!seen.has(n)) {
      seen.add(n)
      closure(n, seen)
    }
  }
  return seen
}

let bad = 0
/**
 * @param {string} item
 * @param {string} msg
 */
const fail = (item, msg) => {
  console.error(`${item}: ${msg}`)
  bad++
}

for (const item of registry.items) {
  // A dependency may carry a version range ("react-day-picker@^9"); compare by package name.
  /** @param {string} d */
  const pkgName = (d) => d.replace(/(?<=.)@.*$/, "")
  const deps = new Set((item.dependencies ?? []).map(pkgName))
  const reach = closure(item.name)
  for (const f of item.files) {
    if (!/\.tsx?$/.test(f.path)) continue
    const src = readFileSync(f.path, "utf8")
    for (const [, spec] of src.matchAll(/^import[^"']*["']([^"']+)["']/gm)) {
      if (spec.startsWith("@/lib/utils")) {
        if (!reach.has("cn")) fail(item.name, `imports @/lib/utils but does not depend on @syncrobotic/cn`)
      } else if (spec.startsWith("@/registry/")) {
        const target = byPath.get(spec.replace("@/", ""))
        if (!target) fail(item.name, `imports ${spec}, which is not a registry item`)
        else if (target !== item.name && !reach.has(target)) fail(item.name, `imports ${spec} but does not depend on @syncrobotic/${target}`)
      } else if (!spec.startsWith(".")) {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
        if (!BUILTIN.has(pkg) && !deps.has(pkg)) fail(item.name, `imports ${pkg} but does not list it in dependencies`)
      }
    }
    const usesClient = /\bReact\.use(State|Effect|Ref|Id|Callback|Memo|LayoutEffect)\b|\buse(LongPress|SlideRelease)\(/.test(src)
    if (usesClient && !/^["']use client["']/.test(src.replace(/^(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/, "").trimStart()))
      fail(item.name, `${f.path} uses hooks but is missing "use client"`)
    for (const d of (item.dependencies ?? []).map(pkgName)) {
      if (!src.includes(`"${d}`) && item.files.length === 1) fail(item.name, `lists ${d} in dependencies but never imports it`)
    }
  }

  // Status: "beta" (the API may still change in a minor release) or "stable"; absent means stable. Blocks and patterns
  // are templates you copy and edit, so they carry none. A new item starts in beta: one first released in the current
  // minor must say so explicitly, so nothing is stable by omission.
  const status = item.meta?.status
  if (status !== undefined && !["beta", "stable"].includes(status)) fail(item.name, `meta.status must be "beta" or "stable", not "${status}"`)
  if (status !== undefined && item.type === "registry:block") fail(item.name, `blocks carry no meta.status`)
  const first = item.meta?.changelog?.at(-1)?.version
  if (item.type !== "registry:block" && first && status === undefined && minor(first) === minor(pkg.version))
    fail(item.name, `first released in ${first}: set meta.status ("beta" until a product has used it)`)
}

// One package, one version range across the registry: items installed together must not ask for different majors
// ("recharts" in one item and "recharts@^3" in another let a project end up with either).
/** @type {Map<string, Map<string, string[]>>} */
const ranges = new Map()
for (const item of registry.items)
  for (const d of item.dependencies ?? []) {
    const name = d.replace(/(?<=.)@.*$/, "")
    ranges.set(name, (ranges.get(name) ?? new Map()).set(d, [...(ranges.get(name)?.get(d) ?? []), item.name]))
  }
for (const [name, specs] of ranges)
  if (specs.size > 1) fail(name, `declared as ${[...specs].map(([d, items]) => `"${d}" (${items.join(", ")})`).join(" and ")}: use one range`)

if (bad) {
  console.error(`\n${bad} registry problem(s)`)
  process.exit(1)
}
console.log(`Registry check passed (${registry.items.length} items)`)
