// The manual screen-reader and keyboard matrix (/docs/accessibility/manual-testing): one row per stable component, one
// column per assistive technology. Each row's tasks are derived from the same facts as its Accessibility tab (measured
// roles, Tab stops, live regions, keyboard table), so they follow the component. Results are recorded by people in
// site/a11y-manual.json; a cell with no result is "not tested".
import recorded from "./a11y-manual.json"
import { a11yOf } from "./a11y"
import { items, type Item } from "./catalog"

export const assistiveTech = [
  { id: "keyboard", reader: "Keyboard only", browser: "Chrome or Firefox", os: "Windows or macOS", touch: false, how: "No screen reader. Every task by keyboard: focus order, a visible ring, every key in the table." },
  { id: "nvda-firefox", reader: "NVDA", browser: "Firefox", os: "Windows", touch: false, how: "Read with the arrow keys in browse mode; Tab and the component's keys switch to focus mode where the role asks for it." },
  { id: "nvda-chrome", reader: "NVDA", browser: "Chrome", os: "Windows", touch: false, how: "As with Firefox. Chrome builds its accessibility tree differently, so names and states can differ." },
  { id: "jaws-chrome", reader: "JAWS", browser: "Chrome", os: "Windows", touch: false, how: "Read with the virtual cursor (arrow keys); Tab and the component's keys enter forms mode where the role asks for it." },
  { id: "voiceover-macos", reader: "VoiceOver", browser: "Safari", os: "macOS", touch: false, how: "VO+arrows to read, Tab to move focus, VO+Space to activate; Quick Nav off." },
  { id: "voiceover-ios", reader: "VoiceOver", browser: "Safari", os: "iOS", touch: true, how: "Swipe right to read and to reach controls, double-tap to activate, swipe up or down on an adjustable control. Keys with no gesture (F8) are not part of a touch pass." },
  { id: "talkback-android", reader: "TalkBack", browser: "Chrome", os: "Android", touch: true, how: "Swipe right to read and to reach controls, double-tap to activate, volume keys on a slider. Keys with no gesture are not part of a touch pass." },
] as const

export type AtId = (typeof assistiveTech)[number]["id"]
export type ManualStatus = "not tested" | "pass" | "fail"
/** One recorded run of a row's tasks with one assistive technology. The newest per component and column is shown. */
export type ManualResult = {
  component: string
  at: AtId
  status: "pass" | "fail"
  tester: string
  /** YYYY-MM-DD */
  date: string
  /** The component's version when tested (its page shows it). */
  version: string
  /** Screen reader, browser and OS versions, "NVDA 2025.3 · Firefox 146 · Windows 11". */
  atVersion: string
  /** What was heard when it differed, and the issue link for a fail. */
  notes?: string
}
export type Cell = { status: ManualStatus } & Partial<Omit<ManualResult, "component" | "at" | "status">>
export type Step = { task: string; expect: string }
export type MatrixRow = {
  name: string
  title: string
  group: string
  version: string
  roles: string[]
  patterns: { title: string; href: string }[]
  steps: Step[]
  cells: Record<AtId, Cell>
}

export const results = recorded.results as ManualResult[]

/** What a reader says for a role, in words testers can match. Roles that only structure (row, cell) are left out. */
const hear: Record<string, string> = {
  button: "“button” (a toggle also says pressed or not pressed)",
  link: "“link”",
  checkbox: "“checkbox”, checked or not checked",
  radiogroup: "the group's label on entering it",
  radio: "“radio button”, checked or not, and its position",
  switch: "“switch”, on or off",
  slider: "“slider” and its value",
  spinbutton: "“spin button” and its value",
  textbox: "the label, then “edit” or “text field”",
  searchbox: "the label, then “search”",
  combobox: "“combo box”, collapsed or expanded",
  listbox: "“list box” and the selected option",
  tablist: "“tab”, selected or not, and its position",
  tabpanel: "the panel's content after its tab",
  dialog: "“dialog” and its title",
  alertdialog: "“alert dialog”, its title and its message",
  menu: "“menu”, and each item with its checked state",
  tooltip: "the tooltip text after the control's name",
  table: "“table” with its rows and columns; the column header as you move across cells",
  grid: "“grid”; arrow keys move between cells",
  tree: "“tree”, and each item's level and expanded or collapsed",
  progressbar: "“progress bar” and its value",
  meter: "its label and value",
  heading: "“heading” and its level",
  navigation: "a “navigation” landmark",
  region: "a landmark or “region” with its name",
  search: "a “search” landmark",
  list: "“list” and how many items",
  img: "“image” or “graphic” and its text alternative",
  group: "the group's name",
  figure: "“figure” and its caption",
  toolbar: "“toolbar”",
  log: "“log”; new lines are read as they arrive",
}
const liveRoles = ["status", "alert", "log"]

/** Tasks a component needs beyond what its roles and keys say, from its source. */
const extra: Record<string, Step[]> = {
  field: [
    { task: "Move to a field with a hint, then one with an error", expect: "The label, then the hint or the error (`aria-describedby`); the error field is “invalid”" },
  ],
  sortable: [
    { task: "Tab to a handle", expect: "How to reorder: Space, the arrow keys, Space again, or Escape" },
    { task: "Press `Space`, then `↓`", expect: "“Picked up <item>. Position 1 of N”, then “<item> moved to position 2 of N”" },
  ],
  toast: [{ task: "Show a notification, as an example does", expect: "Its text is read once, without focus moving; `F8` then moves focus to it" }],
  "alert-dialog": [{ task: "Open it, then press `Esc`", expect: "Focus lands on the safe action; closing returns focus to the control that opened it" }],
  "copy-button": [{ task: "Activate it", expect: "“Copied” is read without focus moving" }],
}

const stableComponent = (i: Item) => (i.type === "registry:ui" || i.type === "registry:component") && i.meta?.status === "stable"

/** The stable components the matrix covers: every stable item with its own UI. */
export const matrixNames = () => items.filter((i) => stableComponent(i) && a11yOf(i.name)).map((i) => i.name)

/** A row's tasks, in the order a tester runs them. */
export function stepsFor(name: string): Step[] {
  const a = a11yOf(name)
  if (!a) return []
  if (a.hidden) return [{ task: "Read the example with the reading cursor (swipe on touch)", expect: "The mark itself is skipped; the word written beside it is read" }]
  const heard = [...new Set(a.roles.map((r) => (r === "tab" ? "tablist" : r)).filter((r) => hear[r]).map((r) => hear[r]))]
  const steps: Step[] = [
    {
      task: "Read the first example with the reading cursor (swipe on touch)",
      expect: heard.length ? `Each part's name and role: ${heard.join("; ")}` : "Its text, in order; it has no role of its own",
    },
  ]
  if (a.tabStops > 0)
    steps.push({ task: "Tab through it (swipe on touch)", expect: `Focus moves in reading order with a visible ring, each control read with its name and role (${a.tabStops} in the measured example)` })
  if (a.roles.some((r) => r === "dialog" || r === "alertdialog") && !extra[name])
    steps.push({ task: "Open it", expect: "Focus moves inside and its title is read" })
  // A cell that starts with a key is pressed; one that starts with words ("Type a letter", "Hold `Enter`") says what to do.
  for (const [keys, action] of a.keyboard ?? []) steps.push({ task: keys.startsWith("`") ? `Press ${keys}` : keys, expect: action })
  steps.push(...(extra[name] ?? []))
  if (!extra[name] && (a.live || a.roles.some((r) => liveRoles.includes(r))))
    steps.push({ task: "Make it change, as an example does", expect: "The change is read without focus moving" })
  return steps
}

/** The newest recorded result for each component and column. */
function cellsFor(name: string): Record<AtId, Cell> {
  const out = Object.fromEntries(assistiveTech.map((t) => [t.id, { status: "not tested" } as Cell])) as Record<AtId, Cell>
  for (const r of [...results].sort((a, b) => a.date.localeCompare(b.date)))
    if (r.component === name) out[r.at] = { status: r.status, tester: r.tester, date: r.date, version: r.version, atVersion: r.atVersion, notes: r.notes }
  return out
}

export function matrix(): MatrixRow[] {
  return matrixNames().map((name) => {
    const i = items.find((x) => x.name === name)!
    const a = a11yOf(name)!
    return {
      name,
      title: i.title,
      group: i.group,
      version: i.meta.version,
      roles: a.roles,
      patterns: a.patterns,
      steps: stepsFor(name),
      cells: cellsFor(name),
    }
  })
}
