import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { color, contrast, type Mode } from "@/site/theme-tokens"

const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")
const inline = css.slice(css.indexOf("@theme inline {"), css.indexOf("\n}", css.indexOf("@theme inline {")))
const utility = (name: string) => inline.match(new RegExp(`--color-${name}:\\s*([^;]+);`))?.[1]

// Words and numbers drawn on a chart colour (a value inside a bar, a filled legend chip) take --chart-N-foreground.
const modes: Mode[] = ["light", "dark", "light-hc", "dark-hc"]

describe("chart foreground", () => {
  for (const m of modes) {
    it(`${m}: each chart colour's ink reaches 4.5:1 on it`, () => {
      for (const n of [1, 2, 3, 4, 5]) {
        expect(contrast(`chart-${n}-foreground`, `chart-${n}`, m), `chart-${n}-foreground on chart-${n}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
  it("the baseline's ink is the graphite mid's, as the baseline is the graphite mid", () => {
    for (const m of modes) expect(color("chart-5-foreground")[m]).toBe(color("chart-3-foreground")[m])
  })
  it("every pair is a Tailwind colour (text-chart-1-foreground)", () => {
    for (const n of [1, 2, 3, 4, 5]) expect(utility(`chart-${n}-foreground`)).toBe(`var(--chart-${n}-foreground)`)
  })
})

describe("scrim and letterbox", () => {
  it("are Tailwind colours (bg-scrim, bg-letterbox)", () => {
    expect(utility("scrim")).toBe("var(--scrim)")
    expect(utility("letterbox")).toBe("var(--letterbox)")
  })
  it("the letterbox is the dark page colour in every mode, so a dark video surface does not change", () => {
    expect(color("letterbox").light).toBe(color("background").dark)
    expect(color("letterbox").dark).toBe(color("background").dark)
    expect(color("letterbox")["light-hc"]).toBe(color("background")["dark-hc"])
    expect(color("letterbox")["dark-hc"]).toBe(color("background")["dark-hc"])
  })
})
