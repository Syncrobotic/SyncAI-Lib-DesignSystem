import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

// Every button, link and field a kit component draws carries a data-slot, so a product's check for hand-made controls
// (a computed-style sweep, an e2e spec, an audit) can tell the kit's parts from its own (#317, #329, #333, #340).
// A static scan of the TSX, so it is fast and deterministic: each <button>, <a>, <input>, <textarea>, <select> and
// router link (the component's `linkAs`) must have a data-slot attribute, take one from a spread object that sets it,
// or be the child of an `asChild` part, which hands it that part's slot.

const ROOTS = ["registry/syncrobotic/ui", "registry/syncrobotic/blocks"]
const TAGS = new Set(["button", "a", "input", "textarea", "select"])

/**
 * Justified exceptions, as "file › tag › first words of its attributes". Each needs a reason; a fixed one must leave
 * the list (the test fails on a stale entry), so the list only shrinks.
 */
const ALLOW: Record<string, string> = {
  // ShellSearch's two buttons (the wide field and the narrow icon). Its slot, "shell-search", comes with the app-shell
  // search change in flight (#317, #331); remove these once app-shell has it.
  'blocks/app-shell.tsx › button › type="button" onClick={() => setOpen(true)}': "ShellSearch field, pending #331",
  'blocks/app-shell.tsx › button › type="button" aria-label="Search"': "ShellSearch icon button, pending #331",
}

type Miss = { key: string; line: number }

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    return d.isDirectory() ? files(p) : p.endsWith(".tsx") ? [p] : []
  })

function scan(file: string): Miss[] {
  const src = readFileSync(file, "utf8")
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  // Names the component gives its router link: `linkAs: Link = "a"`.
  const links = new Set<string>()
  // Objects in this file that set a data-slot, for `{...props}` spreads.
  const slotted = new Set<string>()
  const visitDecl = (n: ts.Node) => {
    if (ts.isBindingElement(n) && n.propertyName && ts.isIdentifier(n.propertyName) && n.propertyName.text === "linkAs" && ts.isIdentifier(n.name))
      links.add(n.name.text)
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
      const has = n.initializer.properties.some((p) => p.name && ts.isStringLiteral(p.name) && p.name.text === "data-slot")
      if (has) slotted.add(n.name.text)
    }
    ts.forEachChild(n, visitDecl)
  }
  visitDecl(sf)

  const misses: Miss[] = []
  const check = (el: ts.JsxOpeningElement | ts.JsxSelfClosingElement) => {
    const tag = el.tagName.getText(sf)
    if (!TAGS.has(tag) && !links.has(tag)) return
    const attrs = el.attributes.properties
    const ok = attrs.some((a) =>
      ts.isJsxAttribute(a)
        ? a.name.getText(sf) === "data-slot"
        : ts.isJsxSpreadAttribute(a) && ts.isIdentifier(a.expression) && slotted.has(a.expression.text),
    )
    if (ok) return
    // The child of an asChild part takes that part's slot (Radix Slot merges it in), also through `{cond ? <a/> : …}`.
    let up: ts.Node = ts.isJsxOpeningElement(el) ? el.parent.parent : el.parent
    while (ts.isJsxExpression(up) || ts.isParenthesizedExpression(up) || ts.isConditionalExpression(up) || ts.isBinaryExpression(up)) up = up.parent
    if (ts.isJsxElement(up) && up.openingElement.attributes.properties.some((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === "asChild")) return
    const words = attrs
      .slice(0, 2)
      .map((a) => a.getText(sf).replace(/\s+/g, " ").slice(0, 40))
      .join(" ")
    const rel = file.replace(/^registry\/syncrobotic\//, "")
    misses.push({ key: `${rel} › ${tag} › ${words}`, line: sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1 })
  }
  const visit = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) check(n)
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return misses
}

const all = ROOTS.flatMap(files).flatMap(scan)

describe("data-slot on every control a kit component draws", () => {
  it("has no button, link or field without one, outside the allowlist", () => {
    const missing = all.filter((m) => !(m.key in ALLOW)).map((m) => `${m.key} (line ${m.line})`)
    expect(missing).toEqual([])
  })

  it("wraps every Radix trigger or close it exports, rather than exporting the bare primitive (#329)", () => {
    // `export const DialogTrigger = DialogPrimitive.Trigger` draws a button with no slot whenever it is used without asChild.
    const bare = ROOTS.flatMap(files).flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/^export const (\w+) = \w+\.(Trigger|Close|Action|Cancel)$/gm)].map((m) => `${f}: ${m[1]}`),
    )
    expect(bare).toEqual([])
  })

  it("keeps no stale allowlist entries", () => {
    const found = new Set(all.map((m) => m.key))
    expect(Object.keys(ALLOW).filter((k) => !found.has(k))).toEqual([])
  })
})
