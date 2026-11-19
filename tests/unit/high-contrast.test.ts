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
    it(`${mode}: the stop label still reads (18 px bold, 3:1)`, () => {
      expect(contrast("white", "stop", mode)).toBeGreaterThanOrEqual(3)
    })
  }
})

describe("disabled text", () => {
  for (const mode of ["light", "dark", "light-hc", "dark-hc"] as const) {
    it(`${mode}: readable (3:1 on the page and cards) and lighter than secondary text`, () => {
      for (const bg of ["background", "card"]) expect(contrast("disabled", bg, mode), `disabled on ${bg}`).toBeGreaterThanOrEqual(3)
      expect(contrast("disabled", "background", mode)!).toBeLessThan(contrast("muted-foreground", "background", mode)!)
    })
  }
})
