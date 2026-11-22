import { readFileSync } from "node:fs"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"
import { Slider } from "@/registry/syncrobotic/ui/slider"
import { Switch } from "@/registry/syncrobotic/ui/switch"

// Colours come from tokens, so dark mode, high contrast and a product's own theme can change them (#301).
afterEach(cleanup)

const classOf = (el: Element | null) => el?.getAttribute("class") ?? ""

describe("Kbd in a tooltip", () => {
  it("takes the tooltip's text colour for its cap and edge, so it shows in light and dark alike", () => {
    render(
      <div data-slot="tooltip-content">
        <Kbd>K</Kbd>
      </div>,
    )
    const c = classOf(document.querySelector("[data-slot=kbd]"))
    expect(c).toContain("[[data-slot=tooltip-content]_&]:bg-primary-foreground/15")
    expect(c).toContain("[[data-slot=tooltip-content]_&]:ring-primary-foreground/20")
    expect(c).not.toMatch(/white/)
  })
})

describe("thumbs", () => {
  it("a slider's thumb is the thumb token, never a raw white", () => {
    render(<Slider aria-label="Speed" defaultValue={[40]} />)
    const c = classOf(document.querySelector("[role=slider]"))
    expect(c).toContain("bg-thumb")
    expect(c).not.toMatch(/white/)
  })

  it("a switch's knob is the thumb token while off", () => {
    render(<Switch aria-label="Lights" />)
    const c = classOf(document.querySelector("[data-slot=switch] > span"))
    expect(c).toContain("bg-thumb")
    expect(c).not.toMatch(/white/)
  })

  it("the theme defines --thumb in light, dark and both high-contrast modes, and maps it for Tailwind", () => {
    const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")
    expect(css.match(/^\s*--thumb:/gm)).toHaveLength(4)
    expect(css).toContain("--color-thumb: var(--thumb);")
    for (const mode of ["light", "dark", "light-hc", "dark-hc"]) {
      const tokens = JSON.parse(readFileSync(`public/tokens/color.${mode}.tokens.json`, "utf8"))
      expect(tokens.color.thumb, mode).toBeDefined()
    }
  })
})
