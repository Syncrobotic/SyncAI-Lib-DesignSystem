// Fails CI when a registry item's declared dependencies drift from what its files import:
// every npm import must be in `dependencies`, every @/registry import must be a registryDependency
// (directly or through one), every direct registryDependency must be imported by one of the item's files (a dependency
// nothing imports only installs files the product never uses), every npm dependency must name a version range, and files
// that use React hooks or handlers must start with "use client". Also the text limits in CONTRIBUTING.md ("Comments and
// docs"): a description of at most 200 characters, a changelog note of at most 300 (notes after NOTE_LIMIT_AFTER).
// And one source for what an item is: its description. A line in site/overview.ts or site/catalog.ts that repeats it fails;
// an item's doc must open with it, word for word.
import { readFileSync } from "node:fs"
import ts from "typescript"
import { evaluate } from "./stability.mjs"

/** @type {import("./types.js").Registry} */
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const byPath = new Map(registry.items.flatMap((i) => i.files.map((f) => [f.path.replace(/\.tsx?$/, ""), i.name])))
const byName = new Map(registry.items.map((i) => [i.name, i]))
const BUILTIN = new Set(["react", "react-dom"])
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
/** @param {string} v */
const minor = (v) => v.split(".").slice(0, 2).join(".")
/** @type {(a: string, b: string) => boolean} a is a newer x.y.z than b */
const newer = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number))
  const i = x.findIndex((n, k) => n !== y[k])
  return i >= 0 && x[i] > y[i]
}
const MAX_DESCRIPTION = 200
const MAX_NOTE = 300
// Notes up to here are released history, kept as written.
const NOTE_LIMIT_AFTER = "0.50.1"

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
  /** @type {Set<string>} The registry items this item's own files import, by name. */
  const imported = new Set()
  for (const f of item.files) {
    if (!/\.tsx?$/.test(f.path)) continue
    const src = readFileSync(f.path, "utf8")
    // Static imports, and dynamic ones (a part loaded on first use is still a dependency).
    for (const [, spec] of [...src.matchAll(/^import[^"']*["']([^"']+)["']/gm), ...src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)]) {
      if (spec.startsWith("@/lib/utils")) {
        if (!reach.has("cn")) fail(item.name, `imports @/lib/utils but does not depend on @syncrobotic/cn`)
      } else if (spec.startsWith("@/registry/")) {
        const target = byPath.get(spec.replace("@/", ""))
        if (target) imported.add(target)
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

  // The reverse: a direct registryDependency none of the item's files imports. `cn` is exempt: it is the utils every
  // item gets, imported as @/lib/utils.
  for (const d of item.registryDependencies ?? []) {
    const n = d.replace("@syncrobotic/", "")
    if (n !== "cn" && byName.has(n) && !imported.has(n)) fail(item.name, `lists ${d} in registryDependencies but none of its files imports it`)
  }
  // A range on every npm dependency ("cmdk@^1"): without one, `shadcn add` installs whatever is latest, a major the item
  // was never built against.
  for (const d of item.dependencies ?? []) if (!/.@./.test(d)) fail(item.name, `"${d}" in dependencies has no version range: write "${d}@^<major>"`)

  // Status: "beta" (the API may still change in a minor release) or "stable"; absent means stable. A new item starts in
  // beta: one first released in the current minor must say so explicitly, so nothing is stable by omission. A block (or
  // pattern) always declares its status and its wiring: "controlled" (renders only from props) or "demo" (sample data).
  const description = item.description ?? ""
  if (description.length > MAX_DESCRIPTION)
    fail(item.name, `description is ${description.length} characters (max ${MAX_DESCRIPTION}): say what it is and when to use it; details go to the docs`)
  for (const { version, note } of item.meta?.changelog ?? [])
    if (newer(version, NOTE_LIMIT_AFTER) && note.length > MAX_NOTE)
      fail(item.name, `changelog note for ${version} is ${note.length} characters (max ${MAX_NOTE}): what changed and why; the rest goes to CHANGELOG.md or the docs`)

  const status = item.meta?.status
  if (status !== undefined && !["beta", "stable"].includes(status)) fail(item.name, `meta.status must be "beta" or "stable", not "${status}"`)
  if (item.type === "registry:block") {
    if (status === undefined) fail(item.name, `a block sets meta.status ("beta" or "stable")`)
    const wiring = item.meta?.wiring
    if (wiring !== "demo" && wiring !== "controlled") fail(item.name, `a block sets meta.wiring: "controlled" or "demo" (CONTRIBUTING.md, "Controlled blocks"), not ${JSON.stringify(wiring)}`)
  }
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

// What an item is, said once. Normalised: lowercase, backticks and punctuation dropped, spaces collapsed.
/** @param {string} t */
const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
/** @param {string} t */
const firstSentence = (t) => (t.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? t).trim()
/** @param {string} t */
const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter((x) => norm(x))
const STOP = new Set("the and for with its into from that this than then when what which who whose are was not nor but per one".split(" "))
/** @param {string} t Content words: three letters or more, not a STOP word. */
const words = (t) => new Set(norm(t).split(" ").filter((w) => w.length > 2 && !STOP.has(w)))
/**
 * Why one sentence of a docs line repeats the description, or null. Near-exact: equal once normalised; one inside the
 * other (the shorter at least six words); the same first six words; or, with `byWords`, 75 % of the sentence's content
 * words (at least six) already in the description, so it adds nothing.
 * @param {string} line
 * @param {string} description
 * @param {boolean} [byWords] false for a keyboard table's cells, which name the same keys as any description of them
 */
export function repeats(line, description, byWords = true) {
  const d = norm(description)
  const dWords = words(description)
  for (const sentence of sentences(line)) {
    const x = norm(sentence)
    if (sentences(description).some((s) => norm(s) === x) || x === d) return `"${sentence}" is the description's own words`
    const xs = x.split(" ")
    const ds = d.split(" ")
    if (Math.min(xs.length, ds.length) >= 6 && (d.includes(x) || x.includes(d))) return `"${sentence}" contains or is contained in it`
    if (xs.length >= 6 && ds.length >= 6 && xs.slice(0, 6).join(" ") === ds.slice(0, 6).join(" ")) return `"${sentence}" opens with its first six words`
    const own = words(sentence)
    const shared = [...own].filter((w) => dWords.has(w)).length
    if (byWords && own.size >= 6 && shared / own.size >= 0.75) return `${shared} of the ${own.size} words in "${sentence}" are already in it`
  }
  return null
}

/**
 * Every string under each key of the object literal `name` in `file`, with its line, except the keys in `skip`.
 * @param {string} file
 * @param {string} name
 * @param {string[]} skip
 */
function docStrings(file, name, skip) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true)
  /** @type {{ item: string; text: string; line: number }[]} */
  const out = []
  /** @type {(node: ts.Node, item: string) => void} */
  const collect = (node, item) => {
    if (ts.isPropertyAssignment(node) && skip.includes(node.name.getText(sf))) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      out.push({ item, text: node.text, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 })
    node.forEachChild((c) => collect(c, item))
  }
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(sf) === name && node.initializer && ts.isObjectLiteralExpression(node.initializer))
      for (const p of node.initializer.properties)
        if (ts.isPropertyAssignment(p)) collect(p.initializer, ts.isStringLiteral(p.name) ? p.name.text : p.name.getText(sf))
    node.forEachChild(visit)
  }
  visit(sf)
  return out
}

const docs = [
  ...docStrings("site/overview.ts", "overviews", []).map((s) => ({ ...s, file: "site/overview.ts", keys: false })),
  ...docStrings("site/catalog.ts", "entries", ["group", "examples", "wide"]).map((s) => ({ ...s, file: "site/catalog.ts", keys: false })),
  ...docStrings("site/catalog.ts", "keyboard", []).map((s) => ({ ...s, file: "site/catalog.ts", keys: true })),
]
for (const { item, text, line, file, keys } of docs) {
  const description = byName.get(item)?.description
  if (!description) continue
  const why = repeats(text, description, !keys)
  if (why)
    fail(`${file}:${line}`, `repeats ${item}'s registry.json description: ${why}. The description says what the item is (it is the page's lead); say here only when to use it, what instead, or a rule it does not state.\n    description: ${description}`)
}

// The component JSDoc ships in the installed source, so it stays; its first sentence should be the description's.
// The doc where itemDoc finds it must open with the description.
/** @param {string} n */
const pascal = (n) => n.replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase())
/** @type {string[]} */
const differs = []
let documented = 0
/** @param {string} c The summary of a comment: up to the first blank line or list. */
const summary = (c) => c.split(/\n\s*\n|\n\s*[-*\d]+[.)]?\s/)[0].replace(/\s+/g, " ").trim()
/**
 * Where an item says what it is, as [comment text, position]: the JSDoc of the export named for it (page-header →
 * PageHeader, use-now → useNow); else the module's header, the first comment after the banner that no statement owns
 * (a lib or hook of several exports); else the JSDoc of the first export that has one (auth-2fa → AuthTwoFactor).
 * @param {{ name: string, title?: string }} item
 * @param {ts.SourceFile} sf
 * @returns {[string, number] | undefined}
 */
function itemDoc(item, sf) {
  const src = sf.text
  const names = [pascal(item.name), pascal(item.name).replace(/^Use/, "use"), String(item.title ?? "").replace(/[^A-Za-z0-9]/g, "")]
  /** @param {ts.Statement} st */
  const declOf = (st) => {
    const decl = ts.isVariableStatement(st) ? st.declarationList.declarations[0] : st
    return ts.isVariableDeclaration(decl) || ts.isFunctionDeclaration(decl) || ts.isClassDeclaration(decl) ? decl : undefined
  }
  /** @param {ts.Node} decl @returns {[string, number] | undefined} */
  const jsdoc = (decl) => {
    const doc = ts.getJSDocCommentsAndTags(decl).filter(ts.isJSDoc).at(-1)
    const text = doc && ts.getTextOfJSDocComment(doc.comment)
    return text ? [text, doc.getStart(sf)] : undefined
  }
  const named = sf.statements.map(declOf).find((d) => d && names.includes(d.name?.getText(sf) ?? ""))
  if (named) return jsdoc(named)
  // The header: comments before the first statement that is not an import or a directive, line comments in a run
  // taken as one, minus the banner and the comments that sit on that statement with no blank line between.
  const first = sf.statements.find((st) => !ts.isImportDeclaration(st) && !(ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)))
  /** @type {{ pos: number, end: number }[]} */
  const blocks = []
  for (const st of sf.statements) {
    for (const c of ts.getLeadingCommentRanges(src, st.getFullStart()) ?? []) {
      const last = blocks.at(-1)
      if (last && c.kind === ts.SyntaxKind.SingleLineCommentTrivia && src[last.pos + 1] === "/" && !src.startsWith("// @syncrobotic/", last.pos) && /^[ \t]*\n[ \t]*$/.test(src.slice(last.end, c.pos))) last.end = c.end
      else blocks.push({ pos: c.pos, end: c.end })
    }
    if (st === first) break
  }
  while (blocks.length && first && !/\n[ \t]*\n/.test(src.slice(blocks.at(-1)?.end ?? 0, first.getStart(sf)))) blocks.pop()
  const header = blocks.find((b) => !src.startsWith("// @syncrobotic/", b.pos))
  if (header) {
    const raw = src.slice(header.pos, header.end).replace(/^\/\*\*?|\*\/$/g, "")
    return [raw.split("\n").map((l) => l.replace(/^\s*(?:\/\/|\*(?!\/))?\s?/, "")).join("\n"), header.pos]
  }
  for (const st of sf.statements) {
    const decl = declOf(st)
    const doc = decl && ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Export ? jsdoc(decl) : undefined
    if (doc) return doc
  }
}

for (const item of registry.items) {
  const path = item.files[0]?.path
  if (!path || !/\.tsx?$/.test(path) || !item.description) continue
  const sf = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true)
  const found = itemDoc(item, sf)
  // The summary ends at the first blank line or list, whichever comes before the first full stop.
  const text = found && summary(found[0])
  if (!found || !text) {
    differs.push(`${path}  ${item.name}: no JSDoc on the export named for it, no header comment, no documented export`)
    continue
  }
  documented++
  const own = firstSentence(text)
  const ownWords = words(own)
  const descWords = words(item.description)
  const apart = [...ownWords].filter((w) => descWords.has(w)).length < Math.min(ownWords.size, descWords.size) / 3
  if (norm(own) !== norm(firstSentence(item.description)))
    differs.push(`${path}:${sf.getLineAndCharacterOfPosition(found[1]).line + 1}  ${item.name}${apart ? "  (under a third of the words shared)" : ""}\n    jsdoc:       ${own}\n    description: ${item.description}`)
}
for (const d of differs) console.error(d)
if (differs.length) {
  console.error(`${differs.length} of ${documented} item docs do not open with the item's registry.json description, word for word`)
  bad += differs.length
}

// A stable item keeps the evidence it was promoted on (scripts/stability.mjs, /docs/upgrading#status).
for (const r of evaluate(registry))
  for (const f of r.hardFailures) fail(r.name, `is stable but fails "${f}": restore it, or demote the item to beta in a release that says so`)

if (bad) {
  console.error(`\n${bad} registry problem(s)`)
  process.exit(1)
}
console.log(`Registry check passed (${registry.items.length} items)`)
