import { separation } from "./palette-check"

// The status decision record (Colour foundation, #healthy-is-grey) and the migration guide read these, so the two pages
// cannot disagree. scripts/codemods/portal-to-kit.mjs carries the same dot map; a unit test keeps them equal.

/** A six-tone status scheme (the LocalMind Portal's status-tone.ts) to the kit's StatusGlyph. */
export const toneToStatus: { tone: string; usedFor: string; kit: string }[] = [
  { tone: "`success` (lime)", usedFor: "Online, active, approved, healthy", kit: "`normal`: a hollow circle in the ink colour" },
  { tone: "`success` (lime)", usedFor: "Just done: saved, sent, accepted", kit: "A Toast or Alert with `success`, which comes and goes" },
  { tone: "`warning` (amber)", usedFor: "Degraded, expiring soon, waiting for a review", kit: "`warning`: a triangle in `--warning`" },
  { tone: "`danger` (red)", usedFor: "Failed, revoked, expired", kit: "`danger`: a square in `--danger`" },
  { tone: "`info` (sky)", usedFor: "Running, syncing, in progress", kit: "`active`: a filled circle in the ink colour; `--info` only on the Progress or Spinner being waited on" },
  { tone: "`neutral` (grey)", usedFor: "Offline, inactive, disabled", kit: "`offline`: a slashed circle, grey" },
  { tone: "`neutral` (grey)", usedFor: "Not applicable, never reported (an air-gapped device)", kit: "`none`: a dashed circle, grey, never a fault" },
  { tone: "`brand` (primary)", usedFor: "A role, a plan, a fixed attribute", kit: "Not a state: a `Badge` with `tone=\"outline\"`" },
]

/** The Portal's StatusDot statuses to StatusGlyph's. */
export const dotToGlyph = { online: "normal", pending: "warning", error: "danger", info: "active", offline: "offline" } as const

// Tailwind's lime and amber at the steps the Portal's dots and its text use.
// tokens-ok: the product's palette being measured, not a colour the kit uses
const lime = { dot: "#84cc16", text: "#4d7c0f" }
// tokens-ok: the product's palette being measured, not a colour the kit uses
const amber = { dot: "#f59e0b", text: "#b45309" }

/** ΔE (OKLab ×100) between healthy and degraded, as dots and as text, to normal and colour-blind eyes. */
export const limeAmber = { dot: separation(lime.dot, amber.dot), text: separation(lime.text, amber.text) }
