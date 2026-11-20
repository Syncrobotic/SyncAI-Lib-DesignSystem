// The Accessibility tab of a component page, from facts rather than prose written per component:
// - roles: measured in a browser (site/a11y.json, scripts/a11y.cjs), kept only when the component's own source (or a kit
//   component it uses) can produce them, so an example's surroundings (a table around a badge) are not counted;
// - patterns: the WAI-ARIA Authoring Practices pattern behind each Radix primitive or role it uses;
// - contrast: ratios computed from the shipped theme for the colour tokens its source uses, in light and dark.
import measured from "./a11y.json"
import { getItem, readSource, type Item } from "./catalog"
import { contrast, type Mode } from "./theme-tokens"

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns"

/** Radix primitive → the pattern it implements. */
const primitivePattern: Record<string, [title: string, slug: string]> = {
  Accordion: ["Accordion", "accordion"],
  AlertDialog: ["Alert dialog", "alertdialog"],
  Checkbox: ["Checkbox", "checkbox"],
  Collapsible: ["Disclosure", "disclosure"],
  Dialog: ["Dialog (modal)", "dialog-modal"],
  DropdownMenu: ["Menu button", "menu-button"],
  NavigationMenu: ["Disclosure navigation", "disclosure"],
  Popover: ["Dialog (non-modal)", "dialog-modal"],
  Progress: ["Meter / progress", "meter"],
  RadioGroup: ["Radio group", "radio"],
  Select: ["Combobox (select-only)", "combobox"],
  Slider: ["Slider", "slider"],
  Switch: ["Switch", "switch"],
  Tabs: ["Tabs", "tabs"],
  Toggle: ["Button (toggle)", "button"],
  ToggleGroup: ["Toolbar", "toolbar"],
  Tooltip: ["Tooltip", "tooltip"],
  Command: ["Combobox", "combobox"],
}
/** Role → pattern, for parts built without a primitive. */
const rolePattern: Record<string, [string, string]> = {
  tree: ["Tree view", "treeview"],
  grid: ["Grid", "grid"],
  table: ["Table", "table"],
  listbox: ["Listbox", "listbox"],
  combobox: ["Combobox", "combobox"],
  slider: ["Slider", "slider"],
  spinbutton: ["Spinbutton", "spinbutton"],
  radiogroup: ["Radio group", "radio"],
  switch: ["Switch", "switch"],
  meter: ["Meter", "meter"],
  toolbar: ["Toolbar", "toolbar"],
  tablist: ["Tabs", "tabs"],
  alert: ["Alert", "alert"],
  link: ["Link", "link"],
  button: ["Button", "button"],
  navigation: ["Landmarks", "landmarks"],
  search: ["Landmarks", "landmarks"],
}

/** Roles each native element (or kit part) in a source can give. */
const tagRoles: [RegExp, string[]][] = [
  // The element written as a tag, or as a string for a polymorphic `Comp` ("button", "a").
  [/<button\b|["']button["']|<Button\b|Trigger\b|<CopyButton\b/, ["button"]],
  [/<a\b|["']a["']|href=|linkAs|<Link\b/, ["link"]],
  [/<input\b|["']input["']|<Input\b/, ["textbox", "searchbox", "checkbox", "radio", "spinbutton", "slider", "combobox"]],
  [/<textarea\b/, ["textbox"]],
  [/<table\b|<Table\b/, ["table", "row", "rowgroup", "cell", "columnheader", "rowheader"]],
  [/<ul\b|<ol\b/, ["list"]],
  [/<li\b/, ["listitem"]],
  [/<h[1-6]\b|<CardTitle\b/, ["heading"]],
  [/<nav\b/, ["navigation"]],
  [/<section\b/, ["region"]],
  [/<figure\b/, ["figure"]],
  [/<img\b|<svg\b[^>]*role="img"|<AvatarPrimitive\.Image/, ["img"]],
  [/<progress\b/, ["progressbar"]],
  [/<meter\b/, ["meter"]],
  [/<output\b/, ["status"]],
  [/<hr\b|Separator/, ["separator"]],
  [/<search\b/, ["search"]],
]
/** Roles a primitive gives. */
const primitiveRoles: Record<string, string[]> = {
  Accordion: ["button", "heading", "region"],
  AlertDialog: ["alertdialog", "button"],
  Checkbox: ["checkbox"],
  Collapsible: ["button", "region"],
  Dialog: ["dialog", "button", "heading"],
  DropdownMenu: ["menu", "menuitem", "menuitemcheckbox", "menuitemradio", "button", "group", "separator"],
  NavigationMenu: ["navigation", "button", "link", "list", "listitem"],
  Popover: ["dialog", "button"],
  Progress: ["progressbar"],
  RadioGroup: ["radiogroup", "radio"],
  Select: ["combobox", "listbox", "option", "group"],
  Slider: ["slider"],
  Switch: ["switch"],
  Tabs: ["tablist", "tab", "tabpanel"],
  Toggle: ["button"],
  ToggleGroup: ["group", "radiogroup", "radio", "button", "toolbar"],
  Tooltip: ["tooltip"],
  Toast: ["status", "region", "list", "listitem"],
  Avatar: ["img"],
  Separator: ["separator"],
  Command: ["combobox", "listbox", "option", "group"],
}

/** The component's own source plus the kit components it installs, a level at a time. */
function sources(name: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return []
  seen.add(name)
  const item = getItem(name)
  if (!item) return []
  const deps = (("registryDependencies" in item && item.registryDependencies) || []).map((d) => d.replace("@syncrobotic/", ""))
  return [...item.files.map((f) => readSource(f.path)), ...deps.flatMap((d) => sources(d, seen))]
}

const primitivesIn = (src: string) => [...new Set([...src.matchAll(/\b(\w+) as \w+Primitive\b/g)].map((m) => m[1]))]

type Measured = { roles: string[]; tabStops: number; live: boolean }

export type ContrastRow = { label: string; applies: string; need: string; light: number; dark: number; pass: boolean; wcag: [string, string][] }

const SC_TEXT: [string, string] = ["1.4.3 Contrast (Minimum)", "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"]
const SC_NONTEXT: [string, string] = ["1.4.11 Non-text Contrast", "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"]

/** Colour pairs the component uses, found by the token classes in its own files. */
const contrastRules: { test: RegExp; label: string; applies: string; fg: string; bg: string[]; need: number | null; wcag: [string, string][] }[] = [
  { test: /./, label: "Text", applies: "Labels, values, body", fg: "foreground", bg: ["background", "card"], need: 4.5, wcag: [SC_TEXT] },
  { test: /text-muted-foreground/, label: "Secondary text", applies: "Hints, meta, captions", fg: "muted-foreground", bg: ["background", "card"], need: 4.5, wcag: [SC_TEXT] },
  { test: /bg-primary\b/, label: "Primary fill", applies: "Text on the primary action", fg: "primary-foreground", bg: ["primary"], need: 4.5, wcag: [SC_TEXT] },
  { test: /text-danger\b/, label: "Danger text", applies: "Errors, worse-than-before figures", fg: "danger", bg: ["background", "card"], need: 4.5, wcag: [SC_TEXT] },
  { test: /(border|ring)-input\b/, label: "Control edge", applies: "The outline that shows where to type or press", fg: "input", bg: ["background", "card"], need: 3, wcag: [SC_NONTEXT] },
  // The theme draws every :focus-visible outline (2 px, --ring), so this row is added for anything that takes focus.
  { test: /$^/, label: "Keyboard focus ring", applies: "Focus visible, on every control in it", fg: "ring", bg: ["background", "card"], need: 3, wcag: [SC_NONTEXT] },
  { test: /text-disabled|disabled:/, label: "Disabled", applies: "Disabled controls (the kit still keeps 3:1)", fg: "disabled", bg: ["background", "card"], need: null, wcag: [SC_TEXT, SC_NONTEXT] },
]

function worst(fg: string, bgs: string[], mode: Mode) {
  const r = bgs.map((b) => contrast(fg, b, mode)).filter((x): x is number => x !== null)
  return r.length ? Math.min(...r) : NaN
}

export type A11y = {
  roles: string[]
  patterns: { title: string; href: string }[]
  tabStops: number
  live: boolean
  keyboard: Item["keyboard"]
  contrast: ContrastRow[]
}

/** Null for hooks and anything that renders nothing of its own. */
export function a11yOf(name: string): A11y | null {
  const item = getItem(name)
  if (!item || item.group === "Hooks") return null
  const own = item.files.map((f) => readSource(f.path)).join("\n")
  const all = sources(name).join("\n")
  const m = (measured as Record<string, Measured>)[name] ?? { roles: [], tabStops: 0, live: false }

  // A role counts when something in the component (or a kit part it installs) can produce it.
  const possible = new Set<string>([
    ...[...all.matchAll(/role="(\w+)"/g)].map((x) => x[1]),
    ...tagRoles.filter(([re]) => re.test(all)).flatMap(([, r]) => r),
    ...primitivesIn(all).flatMap((p) => primitiveRoles[p] ?? []),
  ])
  const ownPrimitives = primitivesIn(own)
  // Roles of a primitive that only shows when opened (a dialog, a menu) are part of it even if the examples were closed.
  const roles = [...new Set([...m.roles.filter((r) => possible.has(r)), ...ownPrimitives.flatMap((p) => primitiveRoles[p] ?? []).filter((r) => r !== "button")])].sort()

  const patterns = new Map<string, string>()
  for (const p of ownPrimitives) if (primitivePattern[p]) patterns.set(primitivePattern[p][0], `${APG}/${primitivePattern[p][1]}/`)
  for (const r of roles) if (rolePattern[r] && ![...patterns.keys()].some((k) => k.startsWith(rolePattern[r][0]))) patterns.set(rolePattern[r][0], `${APG}/${rolePattern[r][1]}/`)
  // A component that is a button or a link also contains one: name the main pattern first and drop generic ones when a
  // composite pattern is already there.
  if (patterns.size > 1) for (const g of ["Button", "Link", "Landmarks"]) patterns.delete(g)

  const contrastRows: ContrastRow[] = contrastRules
    .filter((r) => r.test.test(own) || (r.label === "Keyboard focus ring" && (m.tabStops > 0 || !!item.keyboard?.length)))
    .map((r) => {
      const light = worst(r.fg, r.bg, "light")
      const dark = worst(r.fg, r.bg, "dark")
      const need = r.need
      return {
        label: r.label,
        applies: r.applies,
        need: need === null ? "Not required" : `${need}:1`,
        light,
        dark,
        pass: need === null ? true : Math.min(light, dark) >= need,
        wcag: r.wcag,
      }
    })

  // Status pairs: a tone's text on its own tint ("bg-warning-subtle text-warning"), the way badges, alerts and chips use them.
  for (const tone of [...new Set([...own.matchAll(/bg-(\w+)-subtle\b[^"`]*?\btext-\1\b/g)].map((x) => x[1]))]) {
    const light = contrast(tone, `${tone}-subtle`, "light") ?? NaN
    const dark = contrast(tone, `${tone}-subtle`, "dark") ?? NaN
    contrastRows.push({
      label: `${tone[0].toUpperCase()}${tone.slice(1)} on its tint`,
      applies: `Text in the ${tone} tone, on the ${tone} tint`,
      need: "4.5:1",
      light,
      dark,
      pass: Math.min(light, dark) >= 4.5,
      wcag: [SC_TEXT],
    })
  }

  return {
    roles,
    patterns: [...patterns].map(([title, href]) => ({ title, href })),
    tabStops: m.tabStops,
    live: m.live,
    keyboard: item.keyboard,
    contrast: contrastRows,
  }
}

/** Plain-text version for the page's markdown twin. */
export function a11yMarkdown(name: string): string[] {
  const a = a11yOf(name)
  if (!a) return []
  const out = ["", "## Accessibility", ""]
  if (a.roles.length) out.push(`- Roles: ${a.roles.map((r) => `\`${r}\``).join(", ")}`)
  if (a.patterns.length) out.push(`- WAI-ARIA patterns: ${a.patterns.map((p) => `[${p.title}](${p.href})`).join(", ")}`)
  if (a.live) out.push("- Announces changes through a live region.")
  if (!a.keyboard?.length) out.push(a.tabStops ? `- Keyboard: no keys of its own; Tab reaches each control.` : "- Keyboard: nothing in it takes focus.")
  if (a.contrast.length)
    out.push("", "| Contrast | Applies to | Needs | Light | Dark |", "| --- | --- | --- | --- | --- |", ...a.contrast.map((c) => `| ${c.label} | ${c.applies} | ${c.need} | ${c.light.toFixed(1)}:1 | ${c.dark.toFixed(1)}:1 |`))
  return out
}
