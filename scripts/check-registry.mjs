// Fails CI when a registry item's declared dependencies drift from what its files import:
// every npm import must be in `dependencies`, every @/registry import must be a registryDependency
// (directly or through one), and files that use React hooks or handlers must start with "use client".
import { readFileSync } from "node:fs"

const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const byPath = new Map(registry.items.flatMap((i) => i.files.map((f) => [f.path.replace(/\.tsx?$/, ""), i.name])))
const byName = new Map(registry.items.map((i) => [i.name, i]))
const BUILTIN = new Set(["react", "react-dom"])

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
const fail = (item, msg) => {
  console.error(`${item}: ${msg}`)
  bad++
}

for (const item of registry.items) {
  const deps = new Set(item.dependencies ?? [])
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
    if (usesClient && !/^["']use client["']/.test(src.replace(/^(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/, "").trimStart())) fail(item.name, `${f.path} uses hooks but is missing "use client"`)
    for (const d of item.dependencies ?? []) {
      if (!src.includes(`"${d}`) && item.files.length === 1) fail(item.name, `lists ${d} in dependencies but never imports it`)
    }
  }
}

if (bad) {
  console.error(`\n${bad} registry problem(s)`)
  process.exit(1)
}
console.log(`Registry check passed (${registry.items.length} items)`)
