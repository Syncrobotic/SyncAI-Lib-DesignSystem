import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CVD_TARGET, chroma, NORMAL_MIN, separation } from "@/site/palette-check"
import { color, contrast, type Mode } from "@/site/theme-tokens"

// The Data visualisation foundation promises these for boxes and points drawn over photos; a theme change that breaks one
// fails CI instead of an annotation that vanishes on a dark picture.
const modes: Mode[] = ["light", "dark", "light-hc", "dark-hc"]
const strokes = ["annotate-predicted", "annotate-truth", "annotate-previous", "annotate-selected"]
const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")

describe("annotation tokens", () => {
  it("exist in every mode and as Tailwind colours (stroke-annotate-*)", () => {
    for (const name of [...strokes, "annotate-halo"]) {
      for (const m of modes) expect(color(name)[m], `${name} ${m}`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(css, name).toContain(`--color-${name}: var(--${name});`)
    }
  })

  for (const m of modes) {
    it(`${m}: every stroke is at least 3:1 against its halo, so one of the two shows on any photo`, () => {
      for (const s of strokes) expect(contrast(s, "annotate-halo", m), s).toBeGreaterThanOrEqual(3)
    })
    it(`${m}: predicted and ground truth differ, also to colour-blind eyes`, () => {
      const d = separation(color("annotate-predicted")[m], color("annotate-truth")[m])
      expect(d.normal).toBeGreaterThanOrEqual(NORMAL_MIN)
      expect(d.cvd).toBeGreaterThanOrEqual(CVD_TARGET)
    })
  }

  it("the halo is pure white or black, opposite the ink; the previous version is grey and fades except in high contrast", () => {
    expect(color("annotate-halo").light).toBe("#ffffff")
    expect(color("annotate-halo").dark).toBe("#000000")
    for (const m of ["light", "dark"] as const) expect(chroma(color("annotate-previous")[m])).toBeLessThan(0.03)
    const fades = [...css.matchAll(/--annotate-fade:\s*([\d.]+);/g)].map((x) => Number(x[1]))
    expect(fades).toEqual([0.6, 1, 1])
  })
})
