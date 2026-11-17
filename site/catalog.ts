import { readFileSync } from "node:fs"
import { join } from "node:path"
import registry from "../registry.json"

// Where each registry item's live examples come from. Stories are the single source of the states.
export type StoryFile =
  | "stop-button"
  | "slide-to-release"
  | "dock"
  | "island"
  | "list"
  | "actions"
  | "inputs"
  | "display"
  | "feedback"
  | "navigation"
  | "overlays"
  | "charts"
/** Stories whose export name starts with `prefix` (or exactly `only`). Overlay stories ending in "Open" are for visual tests and skipped. */
type Examples = { file: StoryFile; prefix?: string; only?: string[] }

export const groups = ["Actions", "Inputs", "Display", "Charts", "Feedback", "Navigation", "Overlays", "Robot shell", "Hooks"] as const
export type Group = (typeof groups)[number]

type Entry = {
  group: Group
  examples?: Examples
  /** Examples use the card's full width (charts). */
  wide?: boolean
  /** Usage rules shown after the examples. */
  rules?: string[]
  /** Keys and what they do, shown as a table. Only what this component adds beyond Tab and focus. */
  keyboard?: [keys: string, action: string][]
}

// Shared by every Radix overlay that traps focus.
const overlayKeys: [string, string][] = [
  ["Esc", "Close and return focus to the control that opened it"],
  ["Tab / Shift+Tab", "Move between controls inside; focus stays inside until it closes"],
]

const entries: Record<string, Entry> = {
  // Actions
  button: {
    group: "Actions",
    examples: { file: "actions", prefix: "Button" },
    rules: [
      "One primary button per view. Primary is neutral high contrast, never blue or red.",
      "Destructive is a danger outline and text. Solid red belongs to the emergency stop alone.",
      "44 px is the default. 36 px only inside cards; 48 px for a page's main action.",
      "Name the result (“Delete route”), not the mechanism (“OK”, “Submit”).",
    ],
  },
  "segmented-control": {
    group: "Actions",
    examples: { file: "actions", prefix: "SegmentedControl" },
    rules: ["For two to four views of the same data. For sections of a page, use Tabs.", "The selected segment is inverted, per the selected-state rule."],
  },
  "copy-button": {
    group: "Actions",
    examples: { file: "actions", prefix: "CopyButton" },
    rules: [
      "The icon becomes a check for 1.5 s and the label says Copied: the swap pattern, never a toast.",
      "Icon-only needs a label that names what is copied (Copy reference).",
    ],
  },
  toggle: {
    group: "Actions",
    examples: { file: "actions", prefix: "Toggle" },
    rules: [
      "On/off for one thing, such as an image or map layer. On is inverted.",
      "For one choice among several, use Segmented control; for a setting that applies at once, use Switch.",
    ],
  },
  // Inputs
  input: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Input" },
    rules: [
      "Wrap it in Field for the label, hint and error.",
      "Text is 16 px so iOS does not zoom on focus.",
      "An error is a state change: the edge turns danger and 2 px at --motion-fast, the message appears with an icon in the hint's place. Never shake; on submit, move focus to the first field in error.",
    ],
  },
  "input-group": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "InputGroup" },
    rules: [
      "For an icon, a unit or a button inside the field's edge. Use it instead of positioning icons by hand.",
      "Units are text after the value, so “120 m” reads as one; icons are decorative and hidden from screen readers.",
      "Buttons inside (clear, show password) need an aria-label and stay 36 px.",
    ],
  },
  "number-field": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "NumberField" },
    rules: [
      'For a number with a range and a unit: speed, thresholds, intervals. For a free number with no range, Input with inputMode="numeric" is enough.',
      "Never block typing. The value is kept in range when the field loses focus, and the hint says the range.",
      "↑↓ step, Shift or PageUp/PageDown step by largeStep, Home/End go to the limits. The buttons are for touch and skip the Tab order.",
    ],
  },
  textarea: { group: "Inputs", examples: { file: "inputs", prefix: "Textarea" } },
  label: { group: "Inputs", examples: { file: "inputs", prefix: "Label" } },
  field: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Field" },
    rules: [
      "The error replaces the hint in the same line, so the layout does not jump.",
      "Say how to fix it (“At least 8 characters”), not just that it is wrong.",
    ],
  },
  checkbox: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Checkbox" },
    rules: ["Keep the whole 44 px row tappable by pairing it with its Label.", "Changes apply on save. For settings that apply immediately, use Switch."],
  },
  "radio-group": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "RadioGroup" },
    rules: ["For two to five options that all fit on screen. Longer lists use Select."],
  },
  switch: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Switch" },
    rules: ["Takes effect immediately; no save button.", "On is success green, per the colour rules."],
  },
  "choice-field": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "ChoiceField" },
    rules: [
      "The whole row is the target, at least 44 px: a tap on the label toggles the control.",
      "Checkboxes and radios at the start; a switch, which acts at once, at the end.",
      "Group choices under one question with FieldSet and a legend; its hint or error sits under the group.",
    ],
  },
  select: { group: "Inputs", examples: { file: "inputs", prefix: "Select" } },
  slider: { group: "Inputs", examples: { file: "inputs", prefix: "Slider" }, rules: ["Always show the current value in the label next to it."] },
  // Display
  badge: {
    group: "Display",
    examples: { file: "display", prefix: "Badge" },
    rules: ["Counts and short states. In list rows prefer Status eyebrow's InlineStatus."],
  },
  card: { group: "Display", examples: { file: "display", prefix: "Card" }, rules: ["Never nest cards. Group rows inside one card with separators."] },
  avatar: { group: "Display", examples: { file: "display", prefix: "Avatar" } },
  separator: { group: "Display", examples: { file: "display", prefix: "Separator" } },
  progress: {
    group: "Display",
    examples: { file: "display", prefix: "Progress" },
    rules: ["Blue means in progress. Use another tone only when the value itself is a status, like battery."],
  },
  spinner: {
    group: "Display",
    examples: { file: "display", prefix: "Spinner" },
    rules: [
      "Waits 300 ms before it appears. Work that finishes sooner never flashes a spinner.",
      "Prefer Skeleton when you know the shape of what is loading.",
    ],
  },
  meter: {
    group: "Display",
    examples: { file: "display", prefix: "Meter" },
    rules: [
      "For a level in a known range (battery, storage). For work under way, use Progress.",
      "Neutral while normal; warning past `low`, danger past `critical`. Colour only when something is wrong, and the value is always written.",
      "`inline` in table cells; the label is still read by screen readers.",
    ],
  },
  "description-list": {
    group: "Display",
    examples: { file: "display", prefix: "DescriptionList" },
    rules: ["Label above value, value in medium weight with tabular numbers.", "`tiles` only for the few numbers that matter most; everything else plain."],
  },
  "empty-state": { group: "Display", examples: { file: "display", prefix: "EmptyState" } },
  table: { group: "Display", examples: { file: "display", prefix: "Table" }, rules: ["Right-align numbers. Numbers are tabular by default."] },
  list: { group: "Display", examples: { file: "list", only: ["GroupedList"] } },
  "status-glyph": {
    group: "Display",
    examples: { file: "list", only: ["StatusShapes"] },
    rules: [
      "Status is shape plus colour, so it reads without colour vision: filled circle in progress, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
    ],
  },
  "status-eyebrow": { group: "Display", examples: { file: "list", only: ["StatusShapes"] } },
  skeleton: {
    group: "Display",
    examples: { file: "list", only: ["LoadingSkeleton"] },
    rules: [
      "Show what is already known; only unknown values get a skeleton.",
      "The whole group breathes over 1.2 s with no diagonal shimmer, and stops under reduced motion.",
    ],
  },
  // Feedback, most urgent first. The Alarms foundation explains which one to use.
  alarm: {
    group: "Feedback",
    examples: { file: "feedback", prefix: "Alarm" },
    rules: [
      "Only for an abnormal condition that needs an operator to act. No action, no alarm: log it instead.",
      "Three priorities, each with its own shape, colour and word: critical (act now), high (act within minutes), low (act when convenient).",
      "Stays until the condition clears and someone acknowledges it. Acknowledging records that it was seen; it does not clear it.",
      "Never auto-dismissed, never a toast, never blinking: the bar and the word “Unacknowledged” carry the state; only critical alarms are also tinted.",
      "One alarm per root cause. If the robot is offline, do not also raise camera lost and lidar lost.",
    ],
  },
  alert: {
    group: "Feedback",
    examples: { file: "display", prefix: "Alert" },
    rules: [
      "A condition on this page that stays while it is true (a licence about to expire, a form that cannot be sent). No acknowledge.",
      "If the operator must act on the robot, it is an alarm instead.",
    ],
  },
  toast: {
    group: "Feedback",
    examples: { file: "feedback", prefix: "Toast" },
    rules: [
      "The result of what the user just did, or a minor event. Web and dashboard use Toast; the control app uses the island's notices, with the same timings.",
      "4 s; 8 s when it offers an action such as Undo; failures stay until dismissed. Hovering or focusing pauses the timer.",
      "At most three on screen. Never use a toast for an alarm.",
    ],
  },
  // Navigation
  breadcrumb: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Breadcrumb" },
    rules: ["Each level is a link; the current page is last and is not.", "In an app shell, pass it as `breadcrumb`: the top bar's title is the current page."],
  },
  pagination: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Pagination" },
    rules: [
      "Say the range (1–10 of 48) so people know how much there is.",
      "Previous and next disable at the ends. Numbered pages only for long lists people jump around in.",
    ],
  },
  tabs: { group: "Navigation", examples: { file: "navigation", prefix: "Tabs" } },
  accordion: { group: "Navigation", examples: { file: "navigation", prefix: "Accordion" } },
  // Overlays: the docs show the closed trigger; the *Open stories are for visual tests.
  dialog: { group: "Overlays", examples: { file: "overlays", prefix: "Dialog" }, rules: ["A short decision. On phones prefer Sheet for anything longer."] },
  "alert-dialog": {
    group: "Overlays",
    examples: { file: "overlays", prefix: "AlertDialog" },
    rules: ["Only for actions that cannot be undone.", "The confirm names the consequence (“Delete 38 GB”); the cancel names what is kept."],
  },
  sheet: { group: "Overlays", examples: { file: "overlays", prefix: "Sheet" } },
  popover: { group: "Overlays", examples: { file: "overlays", prefix: "Popover" } },
  tooltip: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Tooltip" },
    rules: ["Touch screens never show tooltips. Never put information the operator needs in one."],
  },
  chart: {
    group: "Charts",
    wide: true,
    examples: { file: "charts", prefix: "Chart" },
    rules: [
      "Colour is the series' identity, not its rank: slots --chart-1…5 in a fixed order, kept with the series when others are filtered out. Never a status colour as a series.",
      "Two series or more: a legend above the plot. One series: no legend; the title names it.",
      "Every chart offers its numbers as a table (ChartTable), for exact values and for anyone who cannot tell two hues apart.",
      "One y axis. Two measures on different scales are two charts.",
      "Lines 2 px; bars with 4 px rounded data ends and a 2 px gap; a horizontal hairline grid; no axis lines.",
      "The chart fades in when it mounts (--motion-base); marks do not animate, because Recharts cannot use the motion tokens. Nothing moves under reduced motion.",
    ],
  },
  command: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Command" },
    rules: [
      "One palette per tool, opened by ⌘K / Ctrl+K and by the search field in the top bar (AppShell `search`).",
      "Group results by kind (robots, pages, actions) and show a detail on the right, such as the robot's state.",
      "The empty state says what was searched and what to try, not just “No results”.",
    ],
  },
  "dropdown-menu": { group: "Overlays", examples: { file: "overlays", prefix: "DropdownMenu" }, rules: ["Destructive items go last, after a separator."] },
  // Robot shell
  "stop-button": {
    group: "Robot shell",
    examples: { file: "stop-button" },
    rules: [
      "UI only: it takes `state` and calls onStop, onStopAll or onWake. Sending the command, waiting for the dog and falling back to Bluetooth after 1.5 s belong to the app, which passes the result back as `state`.",
      "Solid red is reserved for the emergency stop. Other destructive actions use the danger outline and text.",
      "Fixed at 56 px (--h-stop), the only button in the system at that height.",
      "Works the same for every input: touch or click stops; Enter or Space stops; holding any of them for 2 s stops all; a screen-reader or switch-control activation stops.",
      "Every string can be replaced through `labels` (WakeButton: `label` and `reason`) to localise.",
    ],
  },
  "slide-to-release": {
    group: "Robot shell",
    examples: { file: "slide-to-release" },
    rules: [
      "Letting go past 85% releases; short of that the thumb springs back in 200 ms.",
      "Viewers can see it but cannot release.",
      "Keyboard and switch control: hold Enter or Space for 2 s.",
    ],
  },
  dock: {
    group: "Robot shell",
    examples: { file: "dock" },
    rules: [
      "Three tiers, top to bottom: state action, this page's primary action, navigation.",
      "Actions in the lower tiers are never solid white, so they do not compete with the stop.",
    ],
  },
  island: {
    group: "Robot shell",
    examples: { file: "island" },
    rules: [
      "Name, device status and notifications each expand on their own.",
      "Failure notices stay until handled. Persistent states (offline, stopped) change the tray edge colour.",
      "IslandAlarm shows the most urgent unacknowledged alarm above any notice, from the same data as AlarmList. The edge follows it: critical danger, high warning.",
    ],
  },
  tray: {
    group: "Robot shell",
    rules: ["The shared frame of the island and the dock: radius 24 = inner radius 16 + padding 8. See Dock and Dynamic island for examples."],
  },
  // Hooks
  "use-long-press": { group: "Hooks", rules: ["Returns hold progress from 0 to 1. The emergency stop uses it for hold-to-stop-all."] },
  "use-slide-release": { group: "Hooks", rules: ["Drag, threshold and spring-back logic behind Slide to release."] },
}

export type Item = (typeof registry.items)[number] & Entry

// What each component does with the keyboard beyond Tab. Radix supplies most of it; these tables say so out loud.
const keyboard: Record<string, [string, string][]> = {
  button: [["Enter / Space", "Activate"]],
  "segmented-control": [
    ["← / →", "Move to the previous or next segment"],
    ["Enter / Space", "Select the focused segment"],
  ],
  toggle: [["Enter / Space", "Turn on or off"]],
  "number-field": [
    ["↑ / ↓", "Step up or down"],
    ["Shift+↑ / Shift+↓", "Step by the large step"],
    ["PageUp / PageDown", "Step by the large step"],
    ["Home / End", "Go to the minimum or maximum"],
    ["Enter", "Keep the typed value (kept in range)"],
  ],
  checkbox: [["Space", "Check or uncheck"]],
  "radio-group": [["↑ ↓ / ← →", "Move to and select the previous or next option"]],
  switch: [["Enter / Space", "Turn on or off"]],
  select: [
    ["Enter / Space / ↓", "Open the list"],
    ["↑ / ↓", "Move between options"],
    ["Type a letter", "Jump to the first option starting with it"],
    ["Enter", "Choose"],
    ["Esc", "Close without changing"],
  ],
  slider: [
    ["← → / ↑ ↓", "Step down or up"],
    ["PageUp / PageDown", "Step by 10%"],
    ["Home / End", "Go to the minimum or maximum"],
  ],
  tabs: [
    ["← / →", "Move to and open the previous or next tab"],
    ["Home / End", "First or last tab"],
  ],
  accordion: [
    ["Enter / Space", "Open or close the section"],
    ["↑ / ↓", "Move between section headers"],
    ["Home / End", "First or last header"],
  ],
  dialog: overlayKeys,
  "alert-dialog": [
    ["Esc", "Cancel"],
    ["Tab / Shift+Tab", "Move between the actions; Cancel has focus first"],
  ],
  sheet: overlayKeys,
  popover: [["Esc", "Close and return focus"]],
  tooltip: [
    ["Focus", "Show"],
    ["Esc", "Hide"],
  ],
  command: [
    ["⌘K / Ctrl+K", "Open or close the palette"],
    ["↑ / ↓", "Move between results"],
    ["Enter", "Run the highlighted result"],
    ["Esc", "Close and return focus"],
  ],
  pagination: [
    ["Tab", "Move between previous, the pages and next"],
    ["Enter / Space", "Go to that page"],
  ],
  breadcrumb: [
    ["Tab", "Move between the levels"],
    ["Enter", "Open that level"],
  ],
  "choice-field": [
    ["Space", "Toggle the focused checkbox or switch"],
    ["↑ ↓", "Move between radio options"],
  ],
  "copy-button": [["Enter / Space", "Copy"]],
  "dropdown-menu": [
    ["Enter / Space / ↓", "Open the menu"],
    ["↑ / ↓", "Move between items"],
    ["Enter", "Run the item"],
    ["Esc", "Close and return focus"],
  ],
  toast: [
    ["F8", "Move focus to the notifications"],
    ["Esc", "Dismiss the focused notification"],
  ],
  "stop-button": [
    ["Enter / Space", "Stop this robot"],
    ["Hold Enter / Space 2 s", "Stop all robots"],
  ],
  "slide-to-release": [["Hold Enter / Space 2 s", "Release"]],
}

export const items: Item[] = registry.items
  .filter((i) => i.name in entries)
  .map((i) => ({ ...i, ...entries[i.name], keyboard: keyboard[i.name] }))
  .sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group))

export const getItem = (name: string) => items.find((i) => i.name === name)

const root = process.cwd()

export function readSource(path: string) {
  return readFileSync(join(/*turbopackIgnore: true*/ root, path), "utf8")
}

/** Story export names in the order they are written, so the page follows the author's order. */
export function storyNames(ex: Examples) {
  const src = readSource(`stories/${ex.file}.stories.tsx`)
  const names = [...src.matchAll(/^export const ([^\s:=]+)\s*[:=]/gm)].map((m) => m[1])
  const picked = ex.only ? names.filter((n) => ex.only!.includes(n)) : ex.prefix ? names.filter((n) => n.startsWith(ex.prefix!) && !n.endsWith("Open")) : names
  // Fail the build rather than publish a component page with its examples silently missing.
  if (picked.length === 0) throw new Error(`No stories in stories/${ex.file}.stories.tsx match ${ex.prefix ?? ex.only?.join(", ")}`)
  return picked
}

/** "ThreeTiersWithPageAction" -> "Three tiers with page action", as Storybook shows it. */
export const storyTitle = (name: string) => {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(" ")
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(" ")
}
