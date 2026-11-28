// The Accessibility Conformance Report (/docs/accessibility/conformance and its .md twin): every WCAG 2.2 A and AA
// criterion, in the VPAT 2.5 INT WCAG table's terms. A level other than Not evaluated needs evidence this repository
// has; a criterion that needs a person stays Not evaluated with what must be done. Update `reviewed` when rows change.
import registry from "../registry.json"
import { site } from "./config"

export const reviewed = { date: "2026-11-28", version: "0.58.0" }

/** 1.2.3 as one sortable number. */
const rank = (v: string) => v.split(".").reduce((n, p) => n * 1000 + Number(p), 0)
/** The newest item version in the registry: the kit's version as shipped. */
export const kitVersion = () => registry.items.map((i) => i.meta.version).reduce((a, b) => (rank(b) > rank(a) ? b : a))

export const levels = ["Supports", "Partially supports", "Does not support", "Not applicable", "Not evaluated"] as const
export type Conformance = (typeof levels)[number]

export const evidence = {
  "axe-stories": { label: "axe on every story", detail: "axe-core with the WCAG 2.2 A/AA rules, on every Storybook story in dark and light before a release (`tests/stories.spec.ts`)" },
  "axe-site": { label: "axe on the docs site", detail: "The same rules on every docs page and block preview, dark and light, in CI (`scripts/check-site-a11y.cjs`)" },
  "a11y-data": { label: "Measured roles", detail: "Roles, Tab stops and live regions measured in a browser, compared in CI (`site/a11y.json`, `scripts/a11y.cjs`)" },
  contrast: { label: "Computed contrast", detail: "Ratios computed from the theme in light, dark and high contrast by unit tests (`tests/unit/high-contrast.test.ts`, `rules.test.ts`, `chart-palette.test.ts`) and per component (`site/a11y.ts`)" },
  "focus-lint": { label: "Focus rule", detail: "The theme draws a 2 px `--ring` outline on `:focus-visible`; `lint:rules` fails when a focus style is removed (`scripts/check-rules.mjs`)" },
  "motion-lint": { label: "Motion rule", detail: "`lint:motion` allows loops only while waiting; the theme stops them under `prefers-reduced-motion` (`scripts/check-motion.mjs`)" },
  targets: { label: "Target tokens", detail: "Controls are `--h-md` (44 px), or `--h-sm` (36 px) with a mouse only; the Accessibility foundation" },
  "unit-tests": { label: "Behaviour tests", detail: "Unit tests of focus and keys (`tests/unit/a11y-health.test.tsx` and others)" },
  "keyboard-tables": { label: "Keyboard tables", detail: "Each component's documented keys (`site/catalog.ts`), not yet verified by a person" },
  source: { label: "Source review", detail: "The component's source in `registry/`, read for this report" },
  "source-scan": { label: "Source scan", detail: "`tests/unit/acr.test.ts` scans `registry/` on every test run" },
  wrap: { label: "Phone layout check", detail: "`check:wrap` on every docs page at 375 px (`scripts/check-wrap.cjs`)" },
} as const
export type EvidenceId = keyof typeof evidence

export type Criterion = {
  id: string
  name: string
  level: "A" | "AA"
  conformance: Conformance
  evidence: EvidenceId[]
  remarks: string
  /** What a person must do before the level can change. Required when Not evaluated. */
  todo?: string
}

const SR = "Run the matrix tasks with each screen reader (/docs/accessibility/manual-testing)"

export const criteria: Criterion[] = [
  { id: "1.1.1", name: "Non-text Content", level: "A", conformance: "Not evaluated", evidence: ["axe-stories", "axe-site", "a11y-data"], remarks: "axe finds no unnamed image, icon-only button or SVG. Status glyphs are hidden beside the word they repeat.", todo: `${SR}: confirm each name says what the control or image is.` },
  { id: "1.2.1", name: "Audio-only and Video-only (Prerecorded)", level: "A", conformance: "Not applicable", evidence: ["source"], remarks: "The kit ships no recorded media. Media player plays what a product supplies; its alternatives are the product's." },
  { id: "1.2.2", name: "Captions (Prerecorded)", level: "A", conformance: "Not applicable", evidence: ["source"], remarks: "No recorded media in the kit. Media player shows WebVTT captions or subtitles a product passes in `tracks`; not yet checked with assistive technology." },
  { id: "1.2.3", name: "Audio Description or Media Alternative (Prerecorded)", level: "A", conformance: "Not applicable", evidence: ["source"], remarks: "No recorded media in the kit." },
  { id: "1.2.4", name: "Captions (Live)", level: "AA", conformance: "Not applicable", evidence: ["source"], remarks: "No live audio in the kit. Camera feeds are video without sound." },
  { id: "1.2.5", name: "Audio Description (Prerecorded)", level: "AA", conformance: "Not applicable", evidence: ["source"], remarks: "No recorded media in the kit." },
  { id: "1.3.1", name: "Info and Relationships", level: "A", conformance: "Not evaluated", evidence: ["axe-stories", "axe-site", "a11y-data"], remarks: "axe finds no unlabelled field, broken list or table structure. Roles are measured; field hints and errors use `aria-describedby`.", todo: `${SR}: headings, lists, tables and labels are read with what they belong to.` },
  { id: "1.3.2", name: "Meaningful Sequence", level: "A", conformance: "Not evaluated", evidence: ["a11y-data"], remarks: "No check reads the order content is announced in.", todo: `${SR}: the reading order matches the visual order.` },
  { id: "1.3.3", name: "Sensory Characteristics", level: "A", conformance: "Not evaluated", evidence: [], remarks: "Default labels and docs were not reviewed for shape, position or colour words.", todo: "Review every default label and instruction for words that rely on shape, position or colour alone." },
  { id: "1.3.4", name: "Orientation", level: "AA", conformance: "Supports", evidence: ["source-scan"], remarks: "Nothing in the kit locks the orientation or hides content in one orientation." },
  { id: "1.3.5", name: "Identify Input Purpose", level: "AA", conformance: "Not evaluated", evidence: ["source"], remarks: "Password and one-time-code fields set `autoComplete`; fields about the user in the account and sign-in blocks were not reviewed.", todo: "Check each field that collects the user's own data for its autocomplete token." },
  { id: "1.4.1", name: "Use of Color", level: "A", conformance: "Not evaluated", evidence: ["axe-stories", "contrast"], remarks: "Kit rule: status is a shape and a word. Chart series differ by line style as well as colour (tested). No check covers every state.", todo: "Review each component's states in greyscale." },
  { id: "1.4.2", name: "Audio Control", level: "A", conformance: "Not evaluated", evidence: ["source"], remarks: "Feedback cues play alarm tones when a product calls them.", todo: "Check that a tone stops within 3 s or can be silenced." },
  { id: "1.4.3", name: "Contrast (Minimum)", level: "AA", conformance: "Supports", evidence: ["contrast", "axe-stories", "axe-site"], remarks: "Text and status colours reach 4.5:1 on every surface in light and dark (7:1 in high contrast) and every component's contrast table passes, tested on every run; axe finds no contrast failure. Not measured: text over a product's video or map imagery." },
  { id: "1.4.4", name: "Resize Text", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "Not tested at 200 % text size.", todo: "Zoom text to 200 % in each browser and check nothing is cut off or overlaps." },
  { id: "1.4.5", name: "Images of Text", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "No check for text drawn as an image.", todo: "Review components that draw images (thumbnail, media, maps) for text in pixels; the logo is exempt." },
  { id: "1.4.10", name: "Reflow", level: "AA", conformance: "Not evaluated", evidence: ["wrap"], remarks: "Docs pages are checked at 375 px, not at 320 px (400 % zoom). Tables, charts and maps may scroll in two directions.", todo: "Check each component at 320 CSS px." },
  { id: "1.4.11", name: "Non-text Contrast", level: "AA", conformance: "Supports", evidence: ["contrast"], remarks: "Field edges, the focus ring, bars on their track and chart marks reach 3:1 in every theme, tested on every run. Card and divider edges are below 3:1 on purpose: they identify no control." },
  { id: "1.4.12", name: "Text Spacing", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "Not tested with wider line, letter and word spacing.", todo: "Apply the WCAG text-spacing bookmarklet to each component's examples." },
  { id: "1.4.13", name: "Content on Hover or Focus", level: "AA", conformance: "Not evaluated", evidence: ["keyboard-tables"], remarks: "Tooltip and hover card are Radix primitives; `Esc` hides a tooltip (documented).", todo: "Check each is dismissible, hoverable and persistent." },
  { id: "2.1.1", name: "Keyboard", level: "A", conformance: "Not evaluated", evidence: ["keyboard-tables", "a11y-data", "unit-tests"], remarks: "Every component documents its keys; Tab stops are measured; hold gestures have a held `Enter` or `Space`. Unit tests cover some keys.", todo: "Run the keyboard column of the matrix." },
  { id: "2.1.2", name: "No Keyboard Trap", level: "A", conformance: "Not evaluated", evidence: ["keyboard-tables"], remarks: "Modal overlays hold focus by design and release it on `Esc`.", todo: "Run the keyboard column of the matrix." },
  { id: "2.1.4", name: "Character Key Shortcuts", level: "A", conformance: "Not evaluated", evidence: ["source"], remarks: "`use-hotkeys` ignores keys typed in a field and has `enabled`; a product that binds single keys must let people turn them off or remap them.", todo: "Check each product screen that binds single-character keys." },
  { id: "2.2.1", name: "Timing Adjustable", level: "A", conformance: "Not evaluated", evidence: ["source"], remarks: "Toasts close on their own after a time a product sets; Radix pauses them while hovered or focused. Alarms never close on their own.", todo: "Check toasts can be paused and read before they go." },
  { id: "2.2.2", name: "Pause, Stop, Hide", level: "A", conformance: "Not evaluated", evidence: ["motion-lint"], remarks: "Animations loop only while waiting. Live data (streaming charts, telemetry) updates as a product feeds it.", todo: "Check each auto-updating component can be paused or is essential." },
  { id: "2.3.1", name: "Three Flashes or Below Threshold", level: "A", conformance: "Supports", evidence: ["motion-lint", "source-scan"], remarks: "The only endless animations are the skeleton's 1.2 s breath and the one-time-code caret at 1 Hz (scanned), and the spinner turns; alarms never blink. All stop under reduced motion." },
  { id: "2.4.1", name: "Bypass Blocks", level: "A", conformance: "Supports", evidence: ["unit-tests", "axe-site"], remarks: "Each app shell's first Tab stop is a Skip to content link that moves focus to main (tested). A layout a product builds itself needs its own." },
  { id: "2.4.2", name: "Page Titled", level: "A", conformance: "Not applicable", evidence: [], remarks: "The product titles its pages." },
  { id: "2.4.3", name: "Focus Order", level: "A", conformance: "Not evaluated", evidence: ["unit-tests"], remarks: "Tests cover focus hand-off (stop to release and back) and focus returning when some overlays close.", todo: "Run the keyboard column of the matrix." },
  { id: "2.4.4", name: "Link Purpose (In Context)", level: "A", conformance: "Not evaluated", evidence: ["axe-stories"], remarks: "axe finds no link without a name.", todo: `${SR}: each link's name with its context says where it goes.` },
  { id: "2.4.5", name: "Multiple Ways", level: "AA", conformance: "Not applicable", evidence: [], remarks: "A set of pages is the product's." },
  { id: "2.4.6", name: "Headings and Labels", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "Whether a heading or label describes its content needs a person.", todo: "Review default labels and headings." },
  { id: "2.4.7", name: "Focus Visible", level: "AA", conformance: "Supports", evidence: ["focus-lint", "contrast"], remarks: "Every focusable element shows a 2 px ring with a 2 px offset; the ring reaches 3:1 in every theme and the lint refuses a removed focus style." },
  { id: "2.4.11", name: "Focus Not Obscured (Minimum)", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "Sticky bars, the dock and toasts could cover focus.", todo: "Tab through each shell and block with sticky parts." },
  { id: "2.5.1", name: "Pointer Gestures", level: "A", conformance: "Not evaluated", evidence: ["source"], remarks: "Slide to release (beta) is a path gesture with a held key as its alternative; maps pan and zoom.", todo: "Check each path or multi-finger gesture has a single-pointer alternative." },
  { id: "2.5.2", name: "Pointer Cancellation", level: "A", conformance: "Not evaluated", evidence: [], remarks: "Which components act on the down event was not reviewed; the emergency stop may need to (essential).", todo: "Review pointer handlers in the registry." },
  { id: "2.5.3", name: "Label in Name", level: "A", conformance: "Not evaluated", evidence: [], remarks: "axe's rule for this is experimental and not run.", todo: "Check that a visible label starts each control's accessible name." },
  { id: "2.5.4", name: "Motion Actuation", level: "A", conformance: "Not applicable", evidence: ["source-scan"], remarks: "Nothing in the kit is operated by moving the device." },
  { id: "2.5.7", name: "Dragging Movements", level: "AA", conformance: "Partially supports", evidence: ["source"], remarks: "Sortable is reordered by dragging and Resizable by dragging its handle; each has a keyboard alternative but no single-pointer one. A product can add Move up and Move down actions." },
  { id: "2.5.8", name: "Target Size (Minimum)", level: "AA", conformance: "Supports", evidence: ["targets", "axe-stories", "axe-site"], remarks: "Controls are 44 px, or 36 px with a mouse only, above the 24 px minimum; axe's target-size rule passes on every story and docs page." },
  { id: "3.1.1", name: "Language of Page", level: "A", conformance: "Not applicable", evidence: [], remarks: "The product sets `lang` on its pages." },
  { id: "3.1.2", name: "Language of Parts", level: "AA", conformance: "Not applicable", evidence: [], remarks: "Components hold no text in another language; a product translates their labels." },
  { id: "3.2.1", name: "On Focus", level: "A", conformance: "Not evaluated", evidence: [], remarks: "Not reviewed.", todo: "Run the keyboard column: focus alone never submits, navigates or opens a new view." },
  { id: "3.2.2", name: "On Input", level: "A", conformance: "Not evaluated", evidence: [], remarks: "Not reviewed.", todo: "Check that changing a setting never navigates or submits without warning." },
  { id: "3.2.3", name: "Consistent Navigation", level: "AA", conformance: "Not applicable", evidence: [], remarks: "Navigation across pages is the product's." },
  { id: "3.2.4", name: "Consistent Identification", level: "AA", conformance: "Not applicable", evidence: [], remarks: "Across a set of pages, the product's. The kit's default labels name each function the same way everywhere." },
  { id: "3.2.6", name: "Consistent Help", level: "A", conformance: "Not applicable", evidence: [], remarks: "Help is the product's." },
  { id: "3.3.1", name: "Error Identification", level: "A", conformance: "Not evaluated", evidence: ["source"], remarks: "Field marks an error with `aria-invalid` and reads it with `aria-describedby`.", todo: `${SR}: the error is read with its field.` },
  { id: "3.3.2", name: "Labels or Instructions", level: "A", conformance: "Not evaluated", evidence: ["axe-stories"], remarks: "axe finds no field without a label.", todo: "Review that labels and hints tell people what to enter." },
  { id: "3.3.3", name: "Error Suggestion", level: "AA", conformance: "Not evaluated", evidence: [], remarks: "Kit rule: errors say how to fix them. The wording is the product's.", todo: "Review default error messages." },
  { id: "3.3.4", name: "Error Prevention (Legal, Financial, Data)", level: "AA", conformance: "Not applicable", evidence: [], remarks: "Transactions are the product's; Alert dialog and the step-up dialog are there to confirm them." },
  { id: "3.3.7", name: "Redundant Entry", level: "A", conformance: "Not applicable", evidence: [], remarks: "Multi-step processes are the product's." },
  { id: "3.3.8", name: "Accessible Authentication (Minimum)", level: "AA", conformance: "Not evaluated", evidence: ["source"], remarks: "Sign-in blocks (beta) allow paste and password managers; one-time codes set `autoComplete`.", todo: "Check each sign-in block with a password manager and paste." },
  { id: "4.1.2", name: "Name, Role, Value", level: "A", conformance: "Not evaluated", evidence: ["axe-stories", "axe-site", "a11y-data"], remarks: "axe finds no ARIA error; roles are measured and follow WAI-ARIA patterns (Radix).", todo: `${SR}: names, roles and state changes are announced.` },
  { id: "4.1.3", name: "Status Messages", level: "AA", conformance: "Not evaluated", evidence: ["a11y-data", "source"], remarks: "Components that update use live regions (measured); toasts, copy and sortable announce without moving focus.", todo: `${SR}: each update is read once, without focus moving.` },
]

export const counts = () => Object.fromEntries(levels.map((l) => [l, criteria.filter((c) => c.conformance === l).length])) as Record<Conformance, number>

const md = (s: string) => s.replace(/\|/g, "\\|")

/** The report as Markdown, for a VPAT document or a buyer's questionnaire. */
export function acrMarkdown(kitVersion: string): string {
  const c = counts()
  return [
    `# ${site.name}: Accessibility Conformance Report`,
    "",
    `- Report based on: VPAT 2.5 INT, WCAG 2.2 table (Level A and AA)`,
    `- Product: ${site.name}, components version ${kitVersion}`,
    `- Rows reviewed: ${reviewed.date}, against ${reviewed.version}`,
    `- Evaluation: automated checks and source review in the repository. No manual assistive-technology testing has been recorded yet.`,
    `- Summary: ${levels.map((l) => `${l} ${c[l]}`).join(", ")}`,
    `- Online: ${site.url}/docs/accessibility/conformance`,
    "",
    "| Criterion | Level | Conformance | Remarks | Evidence | To do |",
    "| --- | --- | --- | --- | --- | --- |",
    ...criteria.map(
      (r) => `| ${r.id} ${r.name} | ${r.level} | ${r.conformance} | ${md(r.remarks)} | ${md(r.evidence.map((e) => evidence[e].label).join(", ") || "None")} | ${md(r.todo ?? "")} |`,
    ),
    "",
    "## Evidence",
    "",
    ...Object.values(evidence).map((e) => `- ${e.label}: ${e.detail}`),
    "",
  ].join("\n")
}
