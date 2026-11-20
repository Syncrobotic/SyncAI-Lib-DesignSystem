import { describe, expect, it } from "vitest"
import { chartDash, chartDashes, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { chroma, NORMAL_MIN, separation } from "@/site/palette-check"
import { color, contrast, type Mode } from "@/site/theme-tokens"

// The Data visualisation foundation promises these; a theme change that breaks one fails CI instead of a chart.
// The model: graphite and one accent. 1 the accent, 2 and 3 graphite, 4 the light grey for Other, 5 the baseline.
const modes: Mode[] = ["light", "dark", "light-hc", "dark-hc"]
const hex = (n: number, m: Mode) => color(`chart-${n}`)[m]

describe("chart palette", () => {
  for (const m of modes) {
    it(`${m}: the accent and the two greys all differ from each other, also to colour-blind eyes`, () => {
      for (const [a, b] of [
        [1, 2],
        [1, 3],
        [2, 3],
      ]) {
        const s = separation(hex(a, m), hex(b, m))
        expect(s.normal, `${a}·${b} normal`).toBeGreaterThanOrEqual(NORMAL_MIN)
        expect(s.cvd, `${a}·${b} colour-blind`).toBeGreaterThanOrEqual(NORMAL_MIN)
      }
    })
    it(`${m}: Other differs from the grey beside it`, () => {
      const s = separation(hex(3, m), hex(4, m))
      expect(s.normal).toBeGreaterThanOrEqual(NORMAL_MIN)
      expect(s.cvd).toBeGreaterThanOrEqual(NORMAL_MIN)
    })
    it(`${m}: the accent and the greys are visible marks on a card (3:1)`, () => {
      for (const n of [1, 2, 3, 5]) expect(contrast(`chart-${n}`, "card", m), `chart-${n}`).toBeGreaterThanOrEqual(3)
    })
    it(`${m}: the baseline is the graphite mid, by name`, () => {
      expect(hex(5, m)).toBe(hex(3, m))
    })
  }
  it("only the accent has colour; the brand indigo in light", () => {
    expect(hex(1, "light")).toBe("#5347a8")
    for (const m of modes) {
      expect(chroma(hex(1, m)), `chart-1 ${m}`).toBeGreaterThanOrEqual(0.1)
      for (const n of [2, 3, 4, 5]) expect(chroma(hex(n, m)), `chart-${n} ${m}`).toBeLessThan(0.03)
    }
  })
  it("Other recedes: below the other greys in contrast, still a shape on the card", () => {
    for (const m of modes) {
      const other = contrast("chart-4", "card", m)!
      expect(other).toBeLessThan(contrast("chart-3", "card", m)!)
      expect(other).toBeGreaterThanOrEqual(1.5)
    }
  })
})

describe("chart line styles", () => {
  const config = {
    a: { label: "A", color: 1 },
    b: { label: "B", color: 2 },
    c: { label: "C", color: 3 },
    d: { label: "Other", color: 4 },
  } satisfies ChartConfig
  it("follow the series order: solid, dashed, dotted, then solid for Other", () => {
    expect(["a", "b", "c", "d"].map((k) => chartDash(config, k))).toEqual([undefined, "6 4", "1.5 3.5", undefined])
    expect(chartDashes).toEqual([undefined, "6 4", "1.5 3.5"])
  })
  it("leave a key that is not a series solid", () => {
    expect(chartDash(config, "nope")).toBeUndefined()
  })
})
