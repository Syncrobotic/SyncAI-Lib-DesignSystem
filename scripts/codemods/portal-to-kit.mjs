// Moves a product's local look-alikes of kit components (the LocalMind Portal's components/common) to the kit: the
// imports, the renamed props and the props with no equivalent. What it cannot decide it leaves in place and lists, by
// file and line. Guide: /docs/migrating-from-local-components. Dry run by default: it prints a diff and writes nothing.
//
//   node scripts/codemods/portal-to-kit.mjs <dir|file …> [--write] [--ui @/components/ui] [--components @/components]
//                                           [--link-from @/i18n/routing]
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

/** @typedef {{ ui: string; components: string; linkFrom: string; utils: string }} Options */
/** @typedef {{ line: number; kind: "todo" | "dropped"; message: string }} Note */
/** @typedef {{ start: number; end: number; text: string }} Edit */

/** @type {Options} */
export const DEFAULTS = { ui: "@/components/ui", components: "@/components", linkFrom: "@/i18n/routing", utils: "@/lib/utils" }

const GUIDE = "/docs/migrating-from-local-components"

/** The local modules it moves, each export's kit name, and where the kit item installs. */
const MOVES = {
  "@/components/common/page-header": { item: "page-header", dir: "ui", names: { PageHeader: "PageHeader" } },
  "@/components/common/metric-card": { item: "metric-card", dir: "ui", names: { MetricCard: "MetricCard" } },
  "@/components/common/section-header": { item: "section-header", dir: "ui", names: { SectionHeader: "SectionHeader", SubsectionHeader: "SectionHeader", Section: "SectionHeader" } },
  "@/components/common/empty-state": { item: "empty-state", dir: "ui", names: { EmptyState: "EmptyState" } },
  "@/components/ui/status-dot": { item: "status-glyph", dir: "components", names: { StatusDot: "StatusGlyph" } },
}

/** Local modules it leaves alone: their kit counterpart has another shape. */
const MANUAL = {
  "@/components/common/detail-field": `DetailField: collect one grid's fields into a DescriptionList's items (${GUIDE}#detail-field)`,
  "@/components/common/confirm-dialog": `ConfirmDialog: compose AlertDialog, or keep the adapter in the guide (${GUIDE}#confirm-dialog)`,
  "@/components/common/date-range-field": `DateRangeField: DateRangePicker takes a { from, to } of Dates (${GUIDE}#date-range-field)`,
}

/** StatusDot's statuses as StatusGlyph's (the Colour foundation's decision record). */
export const DOT_TO_GLYPH = { online: "normal", pending: "warning", error: "danger", info: "active", offline: "offline" }

/**
 * Per component: props renamed, props dropped (no equivalent, nothing to keep), props it keeps and lists (no
 * equivalent, but their content matters).
 * @type {Record<string, { rename?: Record<string, string>; drop?: Record<string, string>; manual?: Record<string, string> }>}
 */
const PROPS = {
  PageHeader: {
    rename: { badge: "badges" },
    drop: {
      icon: "the kit's header has no page icon",
      avatar: "the kit's header has no avatar",
      avatarUrl: "the kit's header has no avatar",
      avatarFallback: "the kit's header has no avatar",
      colorTheme: "colour is for what is abnormal",
    },
    manual: {
      back: "pass a Breadcrumb with the parent page as `breadcrumb`",
      actions: "`actions` takes the buttons themselves: render `primary` and `secondary` as Buttons",
    },
  },
  MetricCard: {
    rename: { description: "caption", isLoading: "loading" },
    drop: { icon: "the kit's card has no icon", compact: "MetricGrid sizes the row" },
    manual: {
      href: "the kit's `href` opens in the same tab: link to a page of your own, or keep an external link in `caption`",
      footer: "a sparkline is `series={[…]}`; anything else has no slot",
      onClick: "a card is a link or nothing: put a Button in `caption`, or link to a page",
      valueClassName: "a status goes in `tone` (warning, danger) with the reason in `caption`",
    },
  },
  SectionHeader: { rename: { action: "actions" } },
  SubsectionHeader: {
    drop: {
      icon: "a surface heading has no icon",
      tone: "a heading is never coloured: say the state in words",
      iconClassName: "a surface heading has no icon",
      align: "the heading aligns to its first line",
    },
  },
  EmptyState: { drop: { eyebrow: "the kit's empty state has no eyebrow" } },
  StatusDot: { drop: { size: "the glyph is 12 px (`size-3`)", pulse: "loops are only for waiting (Spinner)" } },
}

/**
 * The StatusDot statuses an expression can take, when every value it can take is written in it ("online", or
 * `live ? "online" : "offline"`); null when one comes from elsewhere (a variable, a lookup).
 * @param {ts.Expression} e
 * @returns {ts.StringLiteral[] | null}
 */
function statusLiterals(e) {
  if (ts.isParenthesizedExpression(e)) return statusLiterals(e.expression)
  if (ts.isStringLiteral(e)) return e.text in DOT_TO_GLYPH ? [e] : null
  if (ts.isConditionalExpression(e)) {
    const [a, b] = [statusLiterals(e.whenTrue), statusLiterals(e.whenFalse)]
    return a && b ? [...a, ...b] : null
  }
  return null
}

/**
 * The attribute's value as an expression's source: `"x"` for a string, the inner expression for `{…}`, `true` for none.
 * @param {ts.JsxAttribute} a
 */
const attrExpr = (a) => {
  const init = a.initializer
  if (!init) return "true"
  if (ts.isStringLiteral(init)) return init.getText()
  if (ts.isJsxExpression(init) && init.expression) return init.expression.getText()
  return init.getText()
}

/**
 * Moves one file. Returns the new source (the same string when nothing applies) and the notes for what is left to do.
 * @param {string} source
 * @param {string} [fileName]
 * @param {Partial<Options>} [options]
 */
export function transform(source, fileName = "file.tsx", options = {}) {
  const o = { ...DEFAULTS, ...options }
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX)
  /** @type {Edit[]} */
  const edits = []
  /** @type {Note[]} */
  const notes = []
  /** @param {ts.Node} at @param {string} message @param {Note["kind"]} [kind] */
  const note = (at, message, kind = "todo") => notes.push({ line: sf.getLineAndCharacterOfPosition(at.getStart()).line + 1, kind, message })
  /** @param {number} start @param {number} end @param {string} text */
  const edit = (start, end, text) => edits.push({ start, end, text })

  /** Local name → the Portal component it is, and the name it is written with after the move. */
  /** @type {Map<string, { portal: string; name: string }>} */
  const local = new Map()
  /** Imports to add, module → names. */
  /** @type {Map<string, Set<string>>} */
  const need = new Map()
  /** @param {string} from @param {string} name */
  const require_ = (from, name) => need.set(from, (need.get(from) ?? new Set()).add(name))
  /** Identifiers a dropped prop used: their imports go if nothing else uses them. */
  /** @type {Set<string>} */
  const orphans = new Set()

  // ---------- imports ----------
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue
    const from = st.moduleSpecifier.text
    if (from in MANUAL) note(st, MANUAL[/** @type {keyof typeof MANUAL} */ (from)])
    if (!(from in MOVES)) continue
    const move = MOVES[/** @type {keyof typeof MOVES} */ (from)]
    const bindings = st.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings) || st.importClause?.name) {
      note(st, `${from}: only named imports are moved`)
      continue
    }
    /** @type {string[]} */
    const kept = []
    /** The names with no kit equivalent stay imported from the local module until they are replaced by hand. */
    /** @type {string[]} */
    const left = []
    for (const el of bindings.elements) {
      const imported = (el.propertyName ?? el.name).text
      const kit = /** @type {Record<string, string>} */ (move.names)[imported]
      if (!kit || el.isTypeOnly || st.importClause?.isTypeOnly) {
        note(el, `${imported} has no kit equivalent: replace its uses by hand (${GUIDE})`)
        left.push(el.getText())
        continue
      }
      // An alias stays; otherwise the kit's name replaces the local one (StatusDot → StatusGlyph).
      const name = el.propertyName ? el.name.text : kit
      local.set(el.name.text, { portal: imported, name })
      const spec = name === kit ? kit : `${kit} as ${name}`
      if (!kept.includes(spec)) kept.push(spec)
    }
    const target = `${move.dir === "ui" ? o.ui : o.components}/${move.item}`
    const semi = st.getText().trimEnd().endsWith(";") ? ";" : ""
    const lines = [
      kept.length ? `import { ${kept.join(", ")} } from "${target}"${semi}` : "",
      left.length ? `import ${st.importClause?.isTypeOnly ? "type " : ""}{ ${left.join(", ")} } from "${from}"${semi}` : "",
    ]
    edit(st.getStart(), st.end, lines.filter(Boolean).join("\n"))
  }
  if (!local.size) return { code: source, notes, changed: false }


  // ---------- JSX ----------
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const found = local.get(opening.tagName.getText())
      if (found) jsx(node, opening, found.portal, found.name)
    }
    ts.forEachChild(node, visit)
  }

  /**
   * @param {ts.JsxElement | ts.JsxSelfClosingElement} node
   * @param {ts.JsxOpeningElement | ts.JsxSelfClosingElement} opening
   * @param {string} portal
   * @param {string} tag the name it is written with after the move
   */
  function jsx(node, opening, portal, tag) {
    const attrs = opening.attributes.properties
    const by = new Map(attrs.filter(ts.isJsxAttribute).map((a) => [a.name.getText(), a]))
    if (attrs.some(ts.isJsxSpreadAttribute)) note(opening, `${portal}: spread props are not checked: compare them with the kit's props by hand`)
    const spec = PROPS[portal] ?? {}
    /** @param {ts.JsxAttribute} a */
    const remove = (a) => {
      edit(a.getFullStart(), a.end, "")
      collect(a)
    }
    /** @param {ts.Node} n */
    const collect = (n) => {
      if (ts.isIdentifier(n)) orphans.add(n.text)
      ts.forEachChild(n, collect)
    }
    /** @param {string} text */
    const append = (text) => edit(opening.attributes.end, opening.attributes.end, ` ${text}`)

    for (const a of attrs.filter(ts.isJsxAttribute)) {
      const name = a.name.getText()
      if (spec.rename?.[name]) edit(a.name.getStart(), a.name.end, spec.rename[name])
      else if (spec.drop?.[name]) {
        remove(a)
        note(a, `${portal}: dropped \`${name}\`, ${spec.drop[name]}`, "dropped")
      } else if (spec.manual?.[name]) note(a, `${portal}: \`${name}\` has no equivalent, ${spec.manual[name]}`)
    }

    // A renamed component (StatusDot → StatusGlyph, SubsectionHeader → SectionHeader) is renamed where it is written.
    if (tag !== opening.tagName.getText() && portal !== "Section") {
      edit(opening.tagName.getStart(), opening.tagName.end, portal === "SubsectionHeader" ? `${tag} variant="surface"` : tag)
      if (ts.isJsxElement(node)) edit(node.closingElement.tagName.getStart(), node.closingElement.tagName.end, tag)
    } else if (portal === "SubsectionHeader") edit(opening.tagName.end, opening.tagName.end, ' variant="surface"')

    if (portal === "StatusDot") {
      const status = by.get("status")
      const init = status?.initializer
      const literals = !init ? null : ts.isStringLiteral(init) ? [init] : ts.isJsxExpression(init) && init.expression ? statusLiterals(init.expression) : null
      if (literals) for (const l of literals) edit(l.getStart(), l.end, `"${DOT_TO_GLYPH[/** @type {keyof typeof DOT_TO_GLYPH} */ (l.text)]}"`)
      else if (status) note(status, `StatusGlyph: map this status yourself: ${Object.entries(DOT_TO_GLYPH).map(([k, v]) => `${k} → ${v}`).join(", ")}`)
      note(opening, "StatusGlyph is hidden from screen readers: say the status in words beside it (InlineStatus draws both)")
    }

    if (portal === "MetricCard") {
      const internal = by.get("internalHref")
      if (internal) {
        edit(internal.name.getStart(), internal.name.end, "href")
        append("linkAs={Link}")
        require_(o.linkFrom, "Link")
      }
    }

    if (portal === "EmptyState") {
      const [label, href, onAction] = [by.get("actionLabel"), by.get("actionHref"), by.get("onAction")]
      if (label && (href || onAction)) {
        for (const a of [label, href, onAction]) if (a) edit(a.getFullStart(), a.end, "")
        const action = href ? `<Button asChild><Link href={${attrExpr(href)}}>{${attrExpr(label)}}</Link></Button>` : `<Button onClick={${attrExpr(/** @type {ts.JsxAttribute} */ (onAction))}}>{${attrExpr(label)}}</Button>`
        append(`action={${action}}`)
        require_(`${o.ui}/button`, "Button")
        if (href) require_(o.linkFrom, "Link")
      } else if (label) note(label, "EmptyState: `actionLabel` without `actionHref` or `onAction` renders nothing; pass `action` yourself")
      if (!by.has("icon")) note(opening, "EmptyState: the Portal drew a Box icon by default; the kit draws none unless you pass `icon`")
    }

    if (portal === "Section") section(node, opening, by, tag)
  }

  /**
   * `<Section title… action…>children</Section>` → `<section className="flex flex-col gap-3"><SectionHeader title… actions… />children</section>`.
   * @param {ts.JsxElement | ts.JsxSelfClosingElement} node
   * @param {ts.JsxOpeningElement | ts.JsxSelfClosingElement} opening
   * @param {Map<string, ts.JsxAttribute>} by
   * @param {string} header
   */
  function section(node, opening, by, header) {
    const action = by.get("action")
    if (action) edit(action.name.getStart(), action.name.end, "actions")
    if (!ts.isJsxElement(node)) {
      edit(opening.tagName.getStart(), opening.tagName.end, header)
      return
    }
    const cls = by.get("className")
    let classes = `"flex flex-col gap-3"`
    if (cls) {
      edit(cls.getFullStart(), cls.end, "")
      const init = cls.initializer
      if (init && ts.isStringLiteral(init)) classes = `"flex flex-col gap-3 ${init.text}"`
      else {
        classes = `{cn("flex flex-col gap-3", ${attrExpr(cls)})}`
        require_(o.utils, "cn")
      }
    }
    const indent = " ".repeat(sf.getLineAndCharacterOfPosition(opening.getStart()).character)
    edit(opening.tagName.getStart(), opening.tagName.end, `section className=${classes}>\n${indent}  <${header}`)
    edit(opening.end - 1, opening.end, " />")
    edit(node.closingElement.tagName.getStart(), node.closingElement.tagName.end, "section")
  }

  visit(sf)

  // ---------- new imports ----------
  const existing = new Map(
    sf.statements
      .filter(ts.isImportDeclaration)
      .filter((s) => ts.isStringLiteral(s.moduleSpecifier))
      .map((s) => [/** @type {ts.StringLiteral} */ (s.moduleSpecifier).text, s]),
  )
  const lastImport = [...sf.statements].reverse().find(ts.isImportDeclaration)
  for (const [from, names] of need) {
    const st = existing.get(from)
    const bindings = st?.importClause?.namedBindings
    const have = new Set(bindings && ts.isNamedImports(bindings) ? bindings.elements.map((e) => e.name.text) : [])
    const add = [...names].filter((n) => !have.has(n) && !(from in MOVES))
    if (!add.length) continue
    if (st && bindings && ts.isNamedImports(bindings) && !(from in MOVES)) {
      const last = bindings.elements[bindings.elements.length - 1]
      edit(last.end, last.end, `, ${add.join(", ")}`)
    } else edit(lastImport?.end ?? 0, lastImport?.end ?? 0, `\nimport { ${add.join(", ")} } from "${from}"${lastImport?.getText().trimEnd().endsWith(";") ? ";" : ""}`)
  }

  let code = apply(source, edits)
  code = pruneImports(code, fileName, orphans)
  return { code, notes: notes.sort((a, b) => a.line - b.line), changed: code !== source }
}

/**
 * Applies edits from the end, so earlier offsets hold. An import line emptied by the move takes its line break with it.
 * @param {string} source
 * @param {Edit[]} edits
 */
function apply(source, edits) {
  let out = source
  for (const e of [...edits].sort((a, b) => b.start - a.start || b.end - a.end)) {
    let end = e.end
    if (e.text === "" && out[end] === "\n" && (e.start === 0 || out[e.start - 1] === "\n")) end++
    out = out.slice(0, e.start) + e.text + out.slice(end)
  }
  return out
}

/**
 * Removes the import of each name a dropped prop used (an icon passed to PageHeader) when nothing else uses it.
 * @param {string} code
 * @param {string} fileName
 * @param {Set<string>} names
 */
function pruneImports(code, fileName, names) {
  if (!names.size) return code
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, fileName.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX)
  /** @type {Edit[]} */
  const edits = []
  for (const st of sf.statements) {
    const bindings = ts.isImportDeclaration(st) ? st.importClause?.namedBindings : undefined
    if (!ts.isImportDeclaration(st) || !bindings || !ts.isNamedImports(bindings) || st.importClause?.name) continue
    const unused = bindings.elements.filter((e) => names.has(e.name.text) && (code.match(new RegExp(`\\b${e.name.text}\\b`, "g")) ?? []).length === 1)
    if (!unused.length) continue
    const keep = bindings.elements.filter((e) => !unused.includes(e)).map((e) => e.getText())
    if (keep.length) edits.push({ start: bindings.getStart(), end: bindings.end, text: `{ ${keep.join(", ")} }` })
    else edits.push({ start: st.getStart(), end: st.end, text: "" })
  }
  return apply(code, edits)
}

// ---------- diff ----------

/**
 * A unified-style diff of two texts, for the dry run: changed lines with two lines of context.
 * @param {string} a
 * @param {string} b
 */
export function diff(a, b) {
  const [x, y] = [a.split("\n"), b.split("\n")]
  const n = x.length
  const m = y.length
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  /** @type {{ kind: " " | "-" | "+"; text: string; line: number }[]} */
  const ops = []
  let [i, j] = [0, 0]
  while (i < n || j < m) {
    if (i < n && j < m && x[i] === y[j]) ops.push({ kind: " ", text: x[i++], line: j++ })
    else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) ops.push({ kind: "-", text: x[i++], line: j })
    else ops.push({ kind: "+", text: y[j], line: j++ })
  }
  const show = ops.map((op, k) => op.kind !== " " || ops.slice(Math.max(0, k - 2), k + 3).some((p) => p.kind !== " "))
  /** @type {string[]} */
  const out = []
  ops.forEach((op, k) => {
    if (!show[k]) return
    if (k === 0 || !show[k - 1]) out.push(`@@ line ${op.line + 1}`)
    out.push(`${op.kind}${op.text}`)
  })
  return out.join("\n")
}

// ---------- CLI ----------

const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"])

/** @param {string} path @returns {string[]} */
const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((f) => (SKIP.has(f) ? [] : walk(join(path, f))))
    : /\.(tsx|ts)$/.test(path) && !path.endsWith(".d.ts")
      ? [path]
      : []

function main() {
  const argv = process.argv.slice(2)
  /** @type {Partial<Options>} */
  const options = {}
  /** @type {string[]} */
  const paths = []
  let write = false
  const flags = { "--ui": "ui", "--components": "components", "--link-from": "linkFrom", "--utils": "utils" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--write") write = true
    else if (a in flags) options[/** @type {keyof Options} */ (flags[/** @type {keyof typeof flags} */ (a)])] = argv[++i]
    else if (a.startsWith("-")) {
      console.error(`Unknown option ${a}`)
      process.exit(2)
    } else paths.push(a)
  }
  if (!paths.length) {
    console.error("Usage: node scripts/codemods/portal-to-kit.mjs <dir|file …> [--write] [--ui <alias>] [--components <alias>] [--link-from <module>]")
    process.exit(2)
  }
  let changed = 0
  let todo = 0
  let dropped = 0
  for (const file of paths.flatMap((p) => walk(resolve(p)))) {
    const source = readFileSync(file, "utf8")
    const { code, notes, changed: did } = transform(source, file, options)
    const name = relative(process.cwd(), file)
    if (did) {
      changed++
      if (write) writeFileSync(file, code)
      else console.log(`--- ${name}\n+++ ${name}\n${diff(source, code)}\n`)
    }
    for (const n of notes) console.log(`${name}:${n.line}  ${n.kind}: ${n.message}`)
    todo += notes.filter((n) => n.kind === "todo").length
    dropped += notes.filter((n) => n.kind === "dropped").length
  }
  console.log(`\n${changed} file(s) ${write ? "changed" : "would change"}; ${dropped} prop(s) dropped; ${todo} to finish by hand.${write ? "" : " Run with --write to apply."}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main()
