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

/** @type {import("./types.js").Registry} */
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
/** @type {Map<string, string>} */
const fileToItem = new Map()
for (const i of registry.items) for (const f of i.files ?? []) fileToItem.set(path.resolve(f.path), i.name)

const files = DIRS.flatMap((d) =>
  readdirSync(d)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => path.resolve(d, f)),
)
// The repository's own tsconfig.json always parses; were it missing, reading its options below fails loudly, as it should.
const config = /** @type {ts.ParsedCommandLine} */ (ts.getParsedCommandLineOfConfigFile("tsconfig.json", {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} }))
const program = ts.createProgram(files, { ...config.options, noEmit: true })
const checker = program.getTypeChecker()
/** @param {ts.Node} decl */
const own = (decl) => {
  const f = decl.getSourceFile().fileName
  return f.startsWith(ROOT) && !f.includes("node_modules")
}
/** @param {string} s */
const clean = (s) => s.replace(/\s+/g, " ").replace(/import\("[^"]+"\)\./g, "").trim()

/**
 * A prop's JSDoc, and its @deprecated note in front of it: "Deprecated: Use `status`." A deprecated prop says so on the
 * Properties tab, not only in an editor's strikethrough.
 * @param {ts.Symbol} sym
 */
const described = (sym) => {
  const doc = clean(ts.displayPartsToString(sym.getDocumentationComment(checker)))
  const tag = sym.getJsDocTags(checker).find((t) => t.name === "deprecated")
  if (!tag) return doc
  const why = clean(ts.displayPartsToString(tag.text ?? []))
  return [`Deprecated${why ? `: ${why}` : "."}`, doc].filter(Boolean).join(" ")
}

/**
 * React's own types as a reader writes them: the checker expands ReactNode into its eight-member union.
 * @param {string} s
 */
const reactNames = (s) =>
  s
    .replace(/React\.ReactElement<unknown, string \| React\.JSXElementConstructor<any>>/g, "ReactElement")
    .replace(/React\.ElementType<any, keyof React\.JSX\.IntrinsicElements>/g, "ElementType")
    .replace(/\bReact\.(\w+)/g, "$1")
    .replace(/string \| number \| bigint \| boolean \| ReactElement \| Iterable<ReactNode> \| ReactPortal \| Promise<AwaitedReactNode>/g, "ReactNode")

/** Small local aliases (`type Tone = "a" | "b"`) are printed as what they stand for; longer ones keep their name. */
const ALIAS_MAX = 64
/** @type {Map<string, string | null>} */
const aliases = new Map()
/**
 * @param {string} name
 * @param {ts.SourceFile} sf
 */
function aliasText(name, sf) {
  const key = `${sf.fileName}#${name}`
  if (!aliases.has(key)) {
    let text = null
    for (const st of sf.statements)
      if (ts.isTypeAliasDeclaration(st) && st.name.text === name && !st.typeParameters) text = reactNames(clean(st.type.getText(sf)))
    aliases.set(key, text)
  }
  return aliases.get(key)
}

/**
 * "React.ComponentProps<typeof DialogPrimitive.Content>" → "Radix Dialog.Content"; "<button>" for elements.
 * @param {string} text
 * @param {ts.SourceFile} sf
 */
function inheritedName(text, sf) {
  let t = text.replace(/\s+/g, " ")
  /** @type {string[]} */
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

/** @typedef {{ kind: "own" } | { kind: "inherit"; text: string; sf: ts.SourceFile } | { kind: "variants"; text: string }} Part */

/**
 * Flatten the param's annotation into intersection parts, following local type aliases.
 * @param {ts.TypeNode | undefined} node
 * @param {ts.SourceFile} sf
 * @param {Set<string>} [seen]
 * @returns {Part[]}
 */
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
        /** @type {Part[]} */
        const heritage = (decl.heritageClauses ?? []).flatMap((h) => h.types.map((t) => ({ kind: "inherit", text: t.getText(decl.getSourceFile()), sf: decl.getSourceFile() })))
        return [{ kind: "own" }, ...heritage]
      }
    }
  }
  if (ts.isTypeLiteralNode(node)) return [{ kind: "own" }]
  // A discriminated union of our own shapes (`type: "single" | "multiple"`): its props are listed as the component's own.
  if (ts.isUnionTypeNode(node) && node.types.every((t) => parts(t, sf, new Set(seen)).every((p) => p.kind === "own"))) return [{ kind: "own" }]
  const text = node.getText(sf)
  if (/^VariantProps</.test(text)) return [{ kind: "variants", text }]
  return [{ kind: "inherit", text, sf }]
}

/**
 * Defaults written in the destructuring (`size = "md"`) and in a cva's defaultVariants.
 * @param {ts.FunctionDeclaration} fn
 * @param {ts.SourceFile} sf
 */
function defaults(fn, sf) {
  /** @type {Record<string, string>} */
  const out = {}
  const p = fn.parameters[0]
  if (p && ts.isObjectBindingPattern(p.name))
    for (const el of p.name.elements) {
      // Named once, so the identifier check narrows the very node whose text is read.
      const key = el.propertyName ?? el.name
      if (el.initializer && ts.isIdentifier(key)) out[key.text] = clean(el.initializer.getText(sf))
    }
  return out
}
/**
 * @param {string} text
 * @param {ts.SourceFile} sf
 */
function variantDefaults(text, sf) {
  const m = text.match(/typeof (\w+)/)
  if (!m) return {}
  /** @type {Record<string, string>} */
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

/**
 * The words a `labels` prop holds: each key with its type, its English default and its JSDoc, for the Localisation page.
 * Defaults are read where the component merges them (`const l = { ...defaultXLabels, k: v, ...labels }`), from a default
 * written in the destructuring (`labels = { … }`), or from a `const` typed as the labels type.
 */
const FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
/**
 * @param {ts.ObjectLiteralExpression} obj
 * @param {ts.SourceFile} sf
 * @param {Record<string, string>} [out]
 * @returns {Record<string, string>}
 */
function objectEntries(obj, sf, out = {}) {
  for (const p of obj.properties) {
    if (ts.isSpreadAssignment(p) && ts.isIdentifier(p.expression)) {
      const init = constObject(p.expression)
      if (init) objectEntries(init.node, init.sf, out)
    } else if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)) && p.name && !(p.name.getText(sf) in out))
      out[p.name.getText(sf).replace(/"/g, "")] = clean(ts.isPropertyAssignment(p) ? p.initializer.getText(sf) : p.getText(sf))
  }
  return out
}
/**
 * The object literal a `const` identifier was declared with, wherever it lives.
 * @param {ts.Identifier} id
 */
function constObject(id) {
  let sym = checker.getSymbolAtLocation(id)
  if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym)
  const d = sym?.declarations?.find(
    /** @returns {x is ts.VariableDeclaration & { initializer: ts.ObjectLiteralExpression }} */
    (x) => ts.isVariableDeclaration(x) && !!x.initializer && ts.isObjectLiteralExpression(x.initializer),
  )
  return d ? { node: d.initializer, sf: d.getSourceFile() } : undefined
}
/** @typedef {ts.Declaration & { type?: ts.TypeNode }} PropDecl */

/**
 * @param {ts.FunctionDeclaration} fn
 * @param {ts.SourceFile} sf
 * @param {PropDecl | undefined} propDecl
 * @param {ts.Type} type
 */
function labelDefaults(fn, sf, propDecl, type) {
  /** @type {Record<string, string>} */
  const out = {}
  const p = fn.parameters[0]
  let local = "labels"
  if (p && ts.isObjectBindingPattern(p.name))
    for (const el of p.name.elements) {
      if ((el.propertyName ?? el.name).getText(sf) !== "labels") continue
      if (ts.isIdentifier(el.name)) local = el.name.text
      if (el.initializer && ts.isObjectLiteralExpression(el.initializer)) objectEntries(el.initializer, sf, out)
    }
  fn.body?.forEachChild(function visit(n) {
    if (ts.isObjectLiteralExpression(n) && n.properties.some((q) => ts.isSpreadAssignment(q) && q.expression.getText(sf) === local)) objectEntries(n, sf, out)
    n.forEachChild(visit)
  })
  // labels?.decrease ?? "Decrease"
  for (const m of (fn.body?.getText(sf) ?? "").matchAll(new RegExp(`\\b${local}\\?\\.(\\w+) \\?\\? ("[^"]*")`, "g"))) out[m[1]] ??= m[2]
  if (Object.keys(out).length || !propDecl?.type) return out
  // A const typed as the labels type, in the file that declares the type (DataGridPagination passes Pagination's).
  /** @type {Set<ts.Identifier>} */
  const names = new Set()
  propDecl.type.forEachChild(function refs(n) {
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) names.add(n.typeName)
    n.forEachChild(refs)
  })
  if (ts.isTypeReferenceNode(propDecl.type) && ts.isIdentifier(propDecl.type.typeName)) names.add(propDecl.type.typeName)
  // Written as another component's prop type (`React.ComponentProps<typeof Pagination>["labels"]`): the alias it resolves to.
  const syms = [...names].map((id) => checker.getSymbolAtLocation(id))
  for (const t of [type, ...(type.aliasTypeArguments ?? [])]) if (t.aliasSymbol) syms.push(t.aliasSymbol)
  for (let sym of syms) {
    if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym)
    const decl = sym?.declarations?.[0]
    if (!decl || !own(decl)) continue
    const file = decl.getSourceFile()
    // `sym` is set here: a symbol without one has no declaration and was skipped above.
    const symbol = /** @type {ts.Symbol} */ (sym)
    file.forEachChild(function visit(n) {
      // Typed as the labels type, or an untyped `defaults` beside it (pagination.tsx).
      /** @param {ts.VariableDeclaration} v */
      const typed = (v) => (v.type ? new RegExp(`\\b${symbol.getName()}\\b`).test(v.type.getText(file)) : /^default/.test(v.name.getText(file)))
      if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer) && typed(n))
        objectEntries(n.initializer, file, out)
      n.forEachChild(visit)
    })
  }
  return out
}
/**
 * @param {ts.Type} t
 * @param {ts.ParameterDeclaration} param
 * @param {ts.FunctionDeclaration} fn
 * @param {ts.SourceFile} sf
 * @param {PropDecl | undefined} propDecl
 */
function labelKeys(t, param, fn, sf, propDecl) {
  const lt = checker.getNonNullableType(t)
  const defs = labelDefaults(fn, sf, propDecl, lt)
  return checker.getPropertiesOfType(lt).map((k) => {
    const kt = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(k, param))
    const name = k.getName()
    return {
      name,
      type: reactNames(clean(checker.typeToString(kt, param, FLAGS))),
      ...(defs[name] !== undefined ? { default: defs[name] } : {}),
      description: clean(ts.displayPartsToString(k.getDocumentationComment(checker))),
    }
  })
}

/** @typedef {{ name: string; props: Record<string, unknown>[]; inherits: string[] }} ComponentProps */
/** @type {Record<string, ComponentProps[]>} */
const result = {}
for (const sf of program.getSourceFiles().filter((s) => files.includes(path.resolve(s.fileName)))) {
  const item = fileToItem.get(path.resolve(sf.fileName))
  if (!item) continue
  /** @type {ComponentProps[]} */
  const components = []
  for (const st of sf.statements) {
    // Every statement kind carries modifier flags; the checker's signature asks for a declaration only by its type.
    const exported = ts.getCombinedModifierFlags(/** @type {ts.Declaration} */ (/** @type {ts.Node} */ (st))) & ts.ModifierFlags.Export
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
    /** @type {Record<string, unknown>[]} */
    const props = []
    for (const sym of checker.getPropertiesOfType(type)) {
      /** @type {PropDecl[]} */
      const decls = sym.declarations ?? []
      // Ours: declared in this repository (a cva's variants resolve to the cva config, also ours).
      if (!decls.length || !decls.some(own)) continue
      const name = sym.getName()
      if (name === "className" || name === "children" && !decls.some((d) => own(d) && d.getSourceFile() === sf)) continue
      const t = checker.getTypeOfSymbolAtLocation(sym, param)
      let typeText = clean(checker.typeToString(checker.getNonNullableType(t), param, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope))
      // cva variants come through as `"a" | "b" | null`; the null is cva's, not an option.
      typeText = reactNames(typeText.replace(/ \| null$/, ""))
      if (/^\w+$/.test(typeText)) {
        // Follow the prop's own annotation to the alias, through an import if there is one.
        const ref = decls.find(own)?.type
        let target = ref && ts.isTypeReferenceNode(ref) && ts.isIdentifier(ref.typeName) ? checker.getSymbolAtLocation(ref.typeName) : undefined
        if (target && target.flags & ts.SymbolFlags.Alias) target = checker.getAliasedSymbol(target)
        const decl = target?.declarations?.find((d) => ts.isTypeAliasDeclaration(d) && own(d))
        const expanded = decl ? aliasText(typeText, decl.getSourceFile()) : aliasText(typeText, sf)
        if (expanded && expanded.length <= ALIAS_MAX) typeText = expanded
      }
      // A `| null` the prop declares itself (`value?: number | null`, where null means empty) is part of its type: it is
      // written back after the rest. Only an optional prop's `| undefined` goes, which the "required" column says.
      const ownNull = decls.some((d) => own(d) && !!d.type && ts.isUnionTypeNode(d.type) && d.type.types.some((x) => ts.isLiteralTypeNode(x) && x.literal.kind === ts.SyntaxKind.NullKeyword))
      if (ownNull && !/\bnull$/.test(typeText)) typeText = `${typeText} | null`
      const optional = (sym.flags & ts.SymbolFlags.Optional) !== 0
      props.push({
        name,
        type: typeText,
        ...(defs[name] !== undefined ? { default: defs[name] } : {}),
        ...(optional ? {} : { required: true }),
        description: described(sym),
        // The words a labels prop holds, one by one, for the Localisation page.
        ...(name === "labels" ? { keys: labelKeys(t, param, st, sf, decls.find(own)) } : {}),
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
