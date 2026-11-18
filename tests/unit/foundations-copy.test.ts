import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { foundations } from "@/site/foundations"

// The foundation cards state how many steps a scale has. They are hand-written, so this checks them against the theme:
// change the scale and forget the card, and CI fails instead of the docs quietly drifting.
const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")
const theme = css.slice(css.indexOf("@theme {"))
const count = (re: RegExp) => new Set([...theme.matchAll(re)].map((m) => m[1])).size
const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
const lead = (slug: string) => foundations.find((f) => f.slug === slug)!.lead.toLowerCase()

describe("foundation cards match the theme", () => {
  it("type scale", () => {
    const n = count(/^\s*--text-([a-z0-9]+):/gm)
    expect(lead("typography")).toContain(`${words[n]} sizes`)
  })
  it("radius scale", () => {
    const n = count(/^\s*--radius-([a-z0-9]+):/gm)
    expect(lead("radius")).toContain(`${words[n]} steps`)
  })
  it("font weights", () => {
    const n = count(/^\s*--font-weight-([a-z]+):/gm)
    expect(lead("typography")).toContain(`${words[n]} weights`)
  })
})
