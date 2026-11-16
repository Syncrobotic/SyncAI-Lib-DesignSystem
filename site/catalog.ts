import { readFileSync } from "node:fs"
import { join } from "node:path"
import registry from "../registry.json"

// Where each registry item's live examples come from. Stories are the single source of the states.
export type StoryFile = "stop-button" | "slide-to-release" | "dock" | "island" | "list" | "actions" | "inputs" | "display" | "navigation" | "overlays"
type Examples = { file: StoryFile; only?: string[] }

export const groups = ["Actions", "Inputs", "Display", "Navigation", "Overlays", "Robot shell", "Hooks"] as const
export type Group = (typeof groups)[number]

type Entry = {
  group: Group
  examples?: Examples
  /** Usage rules shown above the examples. */
  rules?: string[]
}

const entries: Record<string, Entry> = {
  // Actions
  button: {
    group: "Actions",
    examples: { file: "actions", only: ["ButtonVariants", "ButtonSizes", "ButtonWithIcon", "ButtonStates"] },
    rules: [
      "One primary button per view. Primary is neutral high contrast, never blue or red.",
      "Destructive is a danger outline and text. Solid red belongs to the emergency stop alone.",
      "44 px is the default. 36 px only inside cards; 48 px for a page's main action.",
      "Name the result (“Delete route”), not the mechanism (“OK”, “Submit”).",
    ],
  },
  "segmented-control": {
    group: "Actions",
    examples: { file: "actions", only: ["SegmentedControlDefault"] },
    rules: ["For two to four views of the same data. For sections of a page, use Tabs.", "The selected segment is inverted, per the selected-state rule."],
  },
  // Inputs
  input: {
    group: "Inputs",
    examples: { file: "inputs", only: ["InputStates"] },
    rules: ["Wrap it in Field for the label, hint and error.", "Text is 16 px so iOS does not zoom on focus."],
  },
  textarea: { group: "Inputs", examples: { file: "inputs", only: ["TextareaDefault"] } },
  label: { group: "Inputs", examples: { file: "inputs", only: ["CheckboxDefault"] } },
  field: {
    group: "Inputs",
    examples: { file: "inputs", only: ["InputStates"] },
    rules: ["The error replaces the hint in the same line, so the layout does not jump.", "Say how to fix it (“At least 8 characters”), not just that it is wrong."],
  },
  checkbox: {
    group: "Inputs",
    examples: { file: "inputs", only: ["CheckboxDefault"] },
    rules: ["Keep the whole 44 px row tappable by pairing it with its Label.", "Changes apply on save. For settings that apply immediately, use Switch."],
  },
  "radio-group": { group: "Inputs", examples: { file: "inputs", only: ["RadioGroupDefault"] }, rules: ["For two to five options that all fit on screen. Longer lists use Select."] },
  switch: { group: "Inputs", examples: { file: "inputs", only: ["SwitchDefault"] }, rules: ["Takes effect immediately; no save button.", "On is success green, per the colour rules."] },
  select: { group: "Inputs", examples: { file: "inputs", only: ["SelectDefault"] } },
  slider: { group: "Inputs", examples: { file: "inputs", only: ["SliderDefault"] }, rules: ["Always show the current value in the label next to it."] },
  // Display
  badge: { group: "Display", examples: { file: "display", only: ["BadgeTones"] }, rules: ["Counts and short states. In list rows prefer Status eyebrow's InlineStatus."] },
  card: { group: "Display", examples: { file: "display", only: ["CardDefault"] }, rules: ["Never nest cards. Group rows inside one card with separators."] },
  avatar: { group: "Display", examples: { file: "display", only: ["AvatarDefault"] } },
  separator: { group: "Display", examples: { file: "display", only: ["CardDefault"] } },
  progress: { group: "Display", examples: { file: "display", only: ["ProgressDefault"] }, rules: ["Blue means in progress. Use another tone only when the value itself is a status, like battery."] },
  spinner: {
    group: "Display",
    examples: { file: "display", only: ["SpinnerDefault"] },
    rules: ["Waits 300 ms before it appears. Work that finishes sooner never flashes a spinner.", "Prefer Skeleton when you know the shape of what is loading."],
  },
  alert: { group: "Display", examples: { file: "display", only: ["AlertTones"] }, rules: ["For a condition on this page. Transient events go to the island's notices."] },
  "empty-state": { group: "Display", examples: { file: "display", only: ["EmptyStateDefault"] } },
  table: { group: "Display", examples: { file: "display", only: ["TableDefault"] }, rules: ["Right-align numbers. Numbers are tabular by default."] },
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
    rules: ["Show what is already known; only unknown values get a skeleton.", "The whole group breathes over 1.2 s with no diagonal shimmer, and stops under reduced motion."],
  },
  // Navigation
  tabs: { group: "Navigation", examples: { file: "navigation", only: ["TabsDefault"] } },
  accordion: { group: "Navigation", examples: { file: "navigation", only: ["AccordionDefault"] } },
  // Overlays: the docs show the closed trigger; the *Open stories are for visual tests.
  dialog: { group: "Overlays", examples: { file: "overlays", only: ["DialogDefault"] }, rules: ["A short decision. On phones prefer Sheet for anything longer."] },
  "alert-dialog": {
    group: "Overlays",
    examples: { file: "overlays", only: ["AlertDialogDefault"] },
    rules: ["Only for actions that cannot be undone.", "The confirm names the consequence (“Delete 38 GB”); the cancel names what is kept."],
  },
  sheet: { group: "Overlays", examples: { file: "overlays", only: ["SheetDefault"] } },
  popover: { group: "Overlays", examples: { file: "overlays", only: ["PopoverDefault"] } },
  tooltip: {
    group: "Overlays",
    examples: { file: "overlays", only: ["TooltipDefault"] },
    rules: ["Touch screens never show tooltips. Never put information the operator needs in one."],
  },
  "dropdown-menu": { group: "Overlays", examples: { file: "overlays", only: ["DropdownMenuDefault"] }, rules: ["Destructive items go last, after a separator."] },
  // Robot shell
  "stop-button": {
    group: "Robot shell",
    examples: { file: "stop-button" },
    rules: [
      "UI only: it takes `state` and calls onStop, onStopAll or onWake. Sending the command, waiting for the dog and falling back to Bluetooth after 1.5 s belong to the app, which passes the result back as `state`.",
      "Solid red is reserved for the emergency stop. Other destructive actions use the danger outline and text.",
      "Fixed at 56 px (--h-stop), the only button in the system at that height.",
      "Every string can be replaced through `labels` (WakeButton: `label` and `reason`) to localise.",
    ],
  },
  "slide-to-release": {
    group: "Robot shell",
    examples: { file: "slide-to-release" },
    rules: ["Letting go past 85% releases; short of that the thumb springs back in 200 ms.", "Viewers can see it but cannot release.", "Keyboard and switch control: hold Enter or Space for 2 s."],
  },
  dock: {
    group: "Robot shell",
    examples: { file: "dock" },
    rules: ["Three tiers, top to bottom: state action, this page's primary action, navigation.", "Actions in the lower tiers are never solid white, so they do not compete with the stop."],
  },
  island: {
    group: "Robot shell",
    examples: { file: "island" },
    rules: ["Name, device status and notifications each expand on their own.", "Failure notices stay until handled. Persistent states (offline, stopped) change the tray edge colour."],
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

export const items: Item[] = registry.items
  .filter((i) => i.name in entries)
  .map((i) => ({ ...i, ...entries[i.name] }))
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
  return ex.only ? names.filter((n) => ex.only!.includes(n)) : names
}

/** "ThreeTiersWithPageAction" -> "Three tiers with page action", as Storybook shows it. */
export const storyTitle = (name: string) => {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(" ")
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(" ")
}
