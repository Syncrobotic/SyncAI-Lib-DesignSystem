// Props tables, generated from the components' own types so they never drift from the source.
//
//   node scripts/props.mjs          CI: fails if site/props.json is out of date with the registry source
//   node scripts/props.mjs --write  regenerate it
//
// For every exported component (a PascalCase function or primitive alias) in registry/syncrobotic/{ui,shell}, it lists
// the props declared in this repository (name, type, default, JSDoc) and names what the rest are inherited from
// (an HTML element or a Radix part), instead of listing hundreds of DOM attributes.
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"

const WRITE = process.argv.includes("--write")
const OUT = "site/props.json"
const ROOT = process.cwd()
const DIRS = ["registry/syncrobotic/ui", "registry/syncrobotic/shell"]

const registry = JSON.parse(readFileSync("registry.json", "utf8"))
const fileToItem = new Map()
for (const i of registry.items) for (const f of i.files ?? []) fileToItem.set(path.resolve(f.path), i.name)

const files = DIRS.flatMap((d) =>
  readdirSync(d)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => path.resolve(d, f)),
)
const config = ts.getParsedCommandLineOfConfigFile("tsconfig.json", {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} })
const program = ts.createProgram(files, { ...config.options, noEmit: true })
const checker = program.getTypeChecker()
const own = (decl) => {
  const f = decl.getSourceFile().fileName
  return f.startsWith(ROOT) && !f.includes("node_modules")
}
const clean = (s) => s.replace(/\s+/g, " ").replace(/import\("[^"]+"\)\./g, "").trim()

/** "React.ComponentProps<typeof DialogPrimitive.Content>" → "Radix Dialog.Content"; "<button>" for elements. */
function inheritedName(text, sf) {
  let t = text.replace(/\s+/g, " ")
  let except = []
  const omit = t.match(/^Omit<(.+), ((?:"[^"]+"\s*\|?\s*)+)>$/)
  if (omit) {
    t = omit[1]
    except = [...omit[2].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  }
  const m = t.match(/^React\.(?:ComponentProps|ComponentPropsWithoutRef|ComponentPropsWithRef|HTMLAttributes)<(.+)>$/)
  let name = m ? m[1] : t
  const el = name.match(/^"([a-z0-9]+)"$/)
  if (el) name = `<${el[1]}>`
  const typeofPart = name.match(/^typeof (\w+)\.(\w+)$/)
  if (typeofPart) {
    const [, ns, part] = typeofPart
    const imp = sf.text.match(new RegExp(`(\\w+) as ${ns}\\b[^\\n]*from "radix-ui"`)) ?? sf.text.match(new RegExp(`import \\* as ${ns} from "@radix-ui/react-([\\w-]+)"`))
    name = imp ? `Radix ${imp[1].replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}.${part}` : `${ns}.${part}`
  }
  const typeofOwn = name.match(/^typeof (\w+)$/)
  if (typeofOwn) name = typeofOwn[1]
  return except.length ? `${name} (except ${except.join(", ")})` : name
}

/** Flatten the param's annotation into intersection parts, following local type aliases. */
function parts(node, sf, seen = new Set()) {
  if (!node) return []
  if (ts.isParenthesizedTypeNode(node)) return parts(node.type, sf, seen)
  if (ts.isIntersectionTypeNode(node)) return node.types.flatMap((t) => parts(t, sf, seen))
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && !node.typeArguments) {
    const name = node.typeName.text
    const sym = checker.getSymbolAtLocation(node.typeName)
    const decl = sym?.declarations?.[0]
    if (decl && own(decl) && !seen.has(name)) {
      seen.add(name)
      if (ts.isTypeAliasDeclaration(decl)) return parts(decl.type, decl.getSourceFile(), seen)
      if (ts.isInterfaceDeclaration(decl)) {
        const heritage = (decl.heritageClauses ?? []).flatMap((h) => h.types.map((t) => ({ kind: "inherit", text: t.getText(decl.getSourceFile()), sf: decl.getSourceFile() })))
        return [{ kind: "own" }, ...heritage]
      }
    }
  }
  if (ts.isTypeLiteralNode(node)) return [{ kind: "own" }]
  const text = node.getText(sf)
  if (/^VariantProps</.test(text)) return [{ kind: "variants", text }]
  return [{ kind: "inherit", text, sf }]
}

/** Defaults written in the destructuring (`size = "md"`) and in a cva's defaultVariants. */
function defaults(fn, sf) {
  const out = {}
  const p = fn.parameters[0]
  if (p && ts.isObjectBindingPattern(p.name))
    for (const el of p.name.elements) if (el.initializer && ts.isIdentifier(el.propertyName ?? el.name)) out[(el.propertyName ?? el.name).text] = clean(el.initializer.getText(sf))
  return out
}
function variantDefaults(text, sf) {
  const m = text.match(/typeof (\w+)/)
  if (!m) return {}
  const out = {}
  sf.forEachChild(function visit(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === m[1] && n.initializer && ts.isCallExpression(n.initializer)) {
      const cfg = n.initializer.arguments[1]
      const dv = cfg && ts.isObjectLiteralExpression(cfg) && cfg.properties.find((p) => p.name?.getText(sf) === "defaultVariants")
      if (dv && ts.isPropertyAssignment(dv) && ts.isObjectLiteralExpression(dv.initializer))
        for (const p of dv.initializer.properties) if (ts.isPropertyAssignment(p)) out[p.name.getText(sf).replace(/"/g, "")] = clean(p.initializer.getText(sf))
    }
    n.forEachChild(visit)
  })
  return out
}

const result = {}
for (const sf of program.getSourceFiles().filter((s) => files.includes(path.resolve(s.fileName)))) {
  const item = fileToItem.get(path.resolve(sf.fileName))
  if (!item) continue
  const components = []
  for (const st of sf.statements) {
    const exported = ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export
    if (!exported) continue
    // export const Dialog = DialogPrimitive.Root
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !/^[A-Z]/.test(d.name.text) || !d.initializer) continue
        if (ts.isPropertyAccessExpression(d.initializer))
          components.push({ name: d.name.text, props: [], inherits: [inheritedName(`React.ComponentProps<typeof ${d.initializer.getText(sf)}>`, sf)] })
      }
      continue
    }
    if (!ts.isFunctionDeclaration(st) || !st.name || !/^[A-Z]/.test(st.name.text)) continue
    const param = st.parameters[0]
    if (!param) {
      components.push({ name: st.name.text, props: [], inherits: [] })
      continue
    }
    const ps = parts(param.type, sf)
    const inherits = ps.filter((p) => p.kind === "inherit").map((p) => inheritedName(p.text, p.sf))
    const vdefs = Object.assign({}, ...ps.filter((p) => p.kind === "variants").map((p) => variantDefaults(p.text, sf)))
    const defs = { ...vdefs, ...defaults(st, sf) }
    const type = checker.getTypeAtLocation(param)
    const props = []
    for (const sym of checker.getPropertiesOfType(type)) {
      const decls = sym.declarations ?? []
      // Ours: declared in this repository (a cva's variants resolve to the cva config, also ours).
      if (!decls.length || !decls.some(own)) continue
      const name = sym.getName()
      if (name === "className" || name === "children" && !decls.some((d) => own(d) && d.getSourceFile() === sf)) continue
      const t = checker.getTypeOfSymbolAtLocation(sym, param)
      let typeText = clean(checker.typeToString(checker.getNonNullableType(t), param, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope))
      // cva variants come through as `"a" | "b" | null`; the null is cva's, not an option.
      typeText = typeText.replace(/ \| null$/, "")
      const optional = (sym.flags & ts.SymbolFlags.Optional) !== 0
      props.push({
        name,
        type: typeText,
        ...(defs[name] !== undefined ? { default: defs[name] } : {}),
        ...(optional ? {} : { required: true }),
        description: clean(ts.displayPartsToString(sym.getDocumentationComment(checker))),
      })
    }
    components.push({ name: st.name.text, props, inherits })
  }
  if (components.length) result[item] = [...(result[item] ?? []), ...components]
}

const sorted = Object.fromEntries(Object.keys(result).sort().map((k) => [k, result[k]]))
const text = JSON.stringify({ $description: "Props per component, generated from the registry source by scripts/props.mjs; do not edit.", ...sorted }, null, 1) + "\n"
let current = ""
try {
  current = readFileSync(OUT, "utf8")
} catch {}
if (current !== text) {
  if (WRITE) writeFileSync(OUT, text)
  else {
    console.error(`${OUT} is out of date with the registry source. Run npm run props`)
    process.exit(1)
  }
}
console.log(WRITE ? `Props written to ${OUT} (${Object.keys(sorted).length} items)` : "Props up to date")
