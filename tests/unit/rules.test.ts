import { describe, expect, it } from "vitest"
import { contrast } from "@/site/theme-tokens"

// WCAG 1.4.11: what identifies a control reaches 3:1. On a card a field's fill is the card's own colour, so its edge
// (--input: fields, checkboxes, radios, a switch that is off) is all that shows where it is. Every theme, every surface
// a control sits on. Dividers and card edges (--border) only group things and stay quiet, so they are not held to it.
const surfaces = ["card", "background", "muted"] as const

describe("field edges", () => {
  for (const mode of ["light", "dark", "light-hc", "dark-hc"] as const) {
    it(`${mode}: --input is 3:1 on the card, the page and a muted tile`, () => {
      for (const bg of surfaces) expect(contrast("input", bg, mode), `input on ${bg}`).toBeGreaterThanOrEqual(3)
    })
  }
})
