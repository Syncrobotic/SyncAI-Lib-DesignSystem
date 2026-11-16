import { readFileSync } from "node:fs"
import { join } from "node:path"
import registry from "../registry.json"

// Where each registry item's live examples come from. Stories are the single source of the states.
type Examples = { file: StoryFile; only?: string[] }
export type StoryFile = "stop-button" | "slide-to-release" | "dock" | "island" | "list"

type Entry = {
  group: "Components" | "Hooks"
  examples?: Examples
  /** Usage rules shown above the examples. */
  rules?: string[]
}

const entries: Record<string, Entry> = {
  "stop-button": {
    group: "Components",
    examples: { file: "stop-button" },
    rules: [
      "UI only: it takes `state` and calls onStop, onStopAll or onWake. Sending the command, waiting for the dog and falling back to Bluetooth after 1.5 s belong to the app, which passes the result back as `state`.",
      "Solid red is reserved for the emergency stop. Other destructive actions use the danger outline and text.",
      "Fixed at 56 px (--h-stop), the only button in the system at that height.",
      "Every string can be replaced through `labels` (WakeButton: `label` and `reason`) to localise.",
    ],
  },
  "slide-to-release": {
    group: "Components",
    examples: { file: "slide-to-release" },
    rules: [
      "Letting go past 85% releases; short of that the thumb springs back in 200 ms.",
      "Viewers can see it but cannot release.",
      "Keyboard and switch control: hold Enter or Space for 2 s.",
    ],
  },
  dock: {
    group: "Components",
    examples: { file: "dock" },
    rules: [
      "Three tiers, top to bottom: state action, this page's primary action, navigation.",
      "Actions in the lower tiers are never solid white, so they do not compete with the stop.",
    ],
  },
  island: {
    group: "Components",
    examples: { file: "island" },
    rules: [
      "Name, device status and notifications each expand on their own.",
      "Failure notices stay until handled. Persistent states (offline, stopped) change the tray edge colour.",
    ],
  },
  list: { group: "Components", examples: { file: "list", only: ["GroupedList"] } },
  "status-glyph": {
    group: "Components",
    examples: { file: "list", only: ["StatusShapes"] },
    rules: [
      "Status is shape plus colour, so it reads without colour vision: filled circle in progress, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
    ],
  },
  "status-eyebrow": { group: "Components", examples: { file: "list", only: ["StatusShapes"] } },
  skeleton: {
    group: "Components",
    examples: { file: "list", only: ["LoadingSkeleton"] },
    rules: [
      "Show what is already known; only unknown values get a skeleton.",
      "The whole group breathes over 1.2 s with no diagonal shimmer, and stops under reduced motion.",
    ],
  },
  tray: {
    group: "Components",
    rules: ["The shared frame of the island and the dock: radius 24 = inner radius 16 + padding 8. See Dock and Dynamic island for examples."],
  },
  "use-long-press": {
    group: "Hooks",
    rules: ["Returns hold progress from 0 to 1. The emergency stop uses it for hold-to-stop-all."],
  },
  "use-slide-release": { group: "Hooks", rules: ["Drag, threshold and spring-back logic behind Slide to release."] },
}

export type Item = (typeof registry.items)[number] & Entry

export const items: Item[] = registry.items.filter((i) => i.name in entries).map((i) => ({ ...i, ...entries[i.name] }))

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
