import { describe, expect, it } from "vitest"
import { contrast } from "@/site/theme-tokens"

// High contrast is a promise in numbers: these are the pairs that appear on screen.
const text: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ...["info", "success", "warning", "danger", "neutral"].flatMap((t): [string, string][] => [
    [t, "background"],
    [t, "card"],
    [t, `${t}-subtle`],
  ]),
]
const edges: [string, string][] = [
  ["border", "background"],
  ["border", "card"],
  ["input", "background"],
  ["input", "card"],
]

describe("high contrast", () => {
  for (const mode of ["light-hc", "dark-hc"] as const) {
    it(`${mode}: text and status reach 7:1 on every surface`, () => {
      for (const [fg, bg] of text) expect(contrast(fg, bg, mode), `${fg} on ${bg}`).toBeGreaterThanOrEqual(7)
    })
    it(`${mode}: edges reach 3:1, so a field shows without its fill`, () => {
      for (const [fg, bg] of edges) expect(contrast(fg, bg, mode), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3)
    })
    // 18 px bold is under WCAG's large text (24 px, or 18.66 px bold); high contrast promises 7:1 for text, the stop included,
    // on the stop and on the deep red its hold fill, a delivered-over-Bluetooth stop and slide to release are drawn in.
    it(`${mode}: the stop label reaches 7:1 on --stop and --stop-deep`, () => {
      expect(contrast("white", "stop", mode)).toBeGreaterThanOrEqual(7)
      expect(contrast("white", "stop-deep", mode)).toBeGreaterThanOrEqual(7)
    })
    it(`${mode}: the hold fill (--stop-deep) still shows on the stop`, () => {
      expect(contrast("stop", "stop-deep", mode)).toBeGreaterThanOrEqual(1.5)
    })
  }
})

const modes = ["light", "dark", "light-hc", "dark-hc"] as const

describe("disabled text", () => {
  for (const mode of modes) {
    // Disabled segments, toggles and tabs sit on a muted track; a disabled field is filled with --muted.
    it(`${mode}: readable (3:1 on the page, cards and a muted track) and lighter than secondary text`, () => {
      for (const bg of ["background", "card", "muted", "secondary", "accent"]) {
        expect(contrast("disabled", bg, mode), `disabled on ${bg}`).toBeGreaterThanOrEqual(3)
      }
      expect(contrast("disabled", "background", mode)!).toBeLessThan(contrast("muted-foreground", "background", mode)!)
    })
    // A disabled field, the wake button and the stop's reason: muted text on the muted fill is still body text.
    it(`${mode}: words on a disabled fill (muted text on --muted) reach 4.5:1`, () => {
      expect(contrast("muted-foreground", "muted", mode)).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe("status words on every fill", () => {
  for (const mode of modes) {
    // A status word or a destructive item keeps 4.5:1 on whatever it sits on: the page, a card, the current row or page
    // (--muted) and a hovered row or menu item (--accent). Darkening --accent in 0.35 once took red under 4:1 in dark.
    it(`${mode}: success, warning, danger, info and destructive reach 4.5:1 on background, card, muted and accent`, () => {
      for (const fg of ["success", "warning", "danger", "info", "destructive"]) {
        for (const bg of ["background", "card", "muted", "accent"]) {
          const c = contrast(fg, bg, mode)
          if (c !== undefined) expect(c, `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    })
  }
})

describe("hover and the current page", () => {
  for (const mode of modes) {
    // Navigation marks the current page with --muted (and weight) and hover with --accent: the two fills must differ, or
    // hovering another item looks like moving the current page. One step of the neutral ramp, darker for hover.
    it(`${mode}: --accent (hover) is a visible step from --muted (current page), and text reads on both`, () => {
      expect(contrast("accent", "muted", mode)!).toBeGreaterThanOrEqual(1.15)
      expect(contrast("muted-foreground", "accent", mode)!).toBeGreaterThanOrEqual(mode.endsWith("hc") ? 7 : 4.5)
      expect(contrast("foreground", "accent", mode)!).toBeGreaterThanOrEqual(mode.endsWith("hc") ? 7 : 4.5)
    })
  }
})

describe("tracks and quiet shapes", () => {
  for (const mode of modes) {
    // The empty part of a slider, progress, meter or ring, a skeleton bone, an avatar placeholder: a shape, not text.
    it(`${mode}: --track reads as a shape (1.5:1) on the card, the page and a popover`, () => {
      for (const bg of ["card", "background", "popover"]) expect(contrast("track", bg, mode), `track on ${bg}`).toBeGreaterThanOrEqual(1.5)
    })
    // Initials on an avatar without a picture are ink on the track.
    it(`${mode}: initials on --track reach 4.5:1`, () => {
      expect(contrast("foreground", "track", mode)).toBeGreaterThanOrEqual(4.5)
    })
    // Where the shape alone carries meaning: a bar at 0 % takes the --input edge, a selected row the ink bar.
    it(`${mode}: the edges that carry meaning reach 3:1 on the card`, () => {
      expect(contrast("input", "card", mode)).toBeGreaterThanOrEqual(3)
      expect(contrast("foreground", "accent", mode)).toBeGreaterThanOrEqual(3)
    })
  }
})

describe("the stop and the wake button", () => {
  for (const mode of modes) {
    // "Standing still": the pale stop is danger text (18 px bold, normal text) on its tint.
    it(`${mode}: danger on danger-subtle reaches 4.5:1`, () => {
      expect(contrast("danger", "danger-subtle", mode)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
