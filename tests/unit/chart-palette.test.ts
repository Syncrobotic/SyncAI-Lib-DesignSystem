import { describe, expect, it } from "vitest"
import { CVD_MIN, CVD_TARGET, chroma, NORMAL_MIN, separation } from "@/site/palette-check"
import { color, contrast, type Mode } from "@/site/theme-tokens"

// The Data visualisation foundation promises these; a theme change that breaks one fails CI instead of a chart.
const modes: Mode[] = ["light", "dark", "light-hc", "dark-hc"]
const hex = (n: number, m: Mode) => color(`chart-${n}`)[m]

describe("chart palette", () => {
  for (const m of modes) {
    it(`${m}: neighbouring slots differ (lines, bars, stacks: up to five)`, () => {
      for (const n of [1, 2, 3, 4]) {
        const s = separation(hex(n, m), hex(n + 1, m))
        expect(s.normal, `${n}·${n + 1} normal`).toBeGreaterThanOrEqual(NORMAL_MIN)
        expect(s.cvd, `${n}·${n + 1} colour-blind`).toBeGreaterThanOrEqual(CVD_MIN)
      }
    })
    it(`${m}: slots 1–3 all differ from each other (scatter, maps)`, () => {
      for (const [a, b] of [
        [1, 2],
        [1, 3],
        [2, 3],
      ]) {
        const s = separation(hex(a, m), hex(b, m))
        expect(s.normal, `${a}·${b} normal`).toBeGreaterThanOrEqual(NORMAL_MIN)
        expect(s.cvd, `${a}·${b} colour-blind`).toBeGreaterThanOrEqual(CVD_TARGET)
      }
    })
    it(`${m}: every slot is a visible mark on a card (3:1)`, () => {
      for (const n of [1, 2, 3, 4, 5]) expect(contrast(`chart-${n}`, "card", m), `chart-${n}`).toBeGreaterThanOrEqual(3)
    })
  }
  it("slots 1–4 are hues and slot 5 is grey, so Other recedes", () => {
    for (const m of ["light", "dark"] as const) {
      for (const n of [1, 2, 3, 4]) expect(chroma(hex(n, m)), `chart-${n}`).toBeGreaterThanOrEqual(0.1)
      expect(chroma(hex(5, m))).toBeLessThan(0.03)
    }
  })
})
