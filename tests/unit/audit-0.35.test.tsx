import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { ChartViewSwitch } from "@/registry/syncrobotic/ui/segmented-control"
import { ViewportOverlay, ViewportPanel } from "@/registry/syncrobotic/ui/viewport-overlay"

afterEach(cleanup)

describe("Meter past a threshold", () => {
  it("is a shape and a word, the number stays text", () => {
    render(<Meter label="Battery" value={12} low={15} />)
    const meter = screen.getByRole("meter")
    expect(meter.getAttribute("aria-valuetext")).toBe("12 %, low")
    const value = meter.querySelector("[data-slot=meter-value]")!
    // The triangle before the value, in the warning colour; the word beside it in the warning colour.
    expect(value.querySelector("svg path")).toBeTruthy()
    expect(value.querySelector("svg")!.getAttribute("class")).toMatch(/\btext-warning\b/)
    expect(value.textContent).toBe("low12 %")
    const number = Array.from(value.querySelectorAll("span")).find((s) => s.textContent === "12 %")!
    expect(number.className).not.toMatch(/text-(warning|danger)/)
  })

  it("inline keeps the glyph and leaves the word to aria-valuetext", () => {
    render(<Meter label="Battery" value={3} low={15} critical={5} inline />)
    const meter = screen.getByRole("meter")
    expect(meter.getAttribute("aria-valuetext")).toBe("3 %, critical")
    const value = meter.querySelector("[data-slot=meter-value]")!
    expect(value.querySelector("svg rect")).toBeTruthy()
    expect(value.textContent).toBe("3 %")
  })

  it("shows no glyph while normal", () => {
    render(<Meter label="Battery" value={72} low={15} inline />)
    expect(screen.getByRole("meter").querySelector("svg")).toBeNull()
  })
})

describe("ChartViewSwitch", () => {
  it("is a Chart / Table switch at --h-sm, named Show as", () => {
    const change = vi.fn()
    render(<ChartViewSwitch value="chart" onValueChange={change} />)
    const group = screen.getByRole("radiogroup", { name: "Show as" })
    expect(group.getAttribute("data-slot")).toBe("chart-view-switch")
    expect(group.className).toMatch(/h-\(--h-sm\)/)
    fireEvent.click(screen.getByRole("radio", { name: "Table" }))
    expect(change).toHaveBeenCalledWith("table")
  })

  it("takes other views and translated words", () => {
    render(
      <ChartViewSwitch
        value="map"
        onValueChange={() => {}}
        labels={{ view: "顯示方式" }}
        views={[
          { value: "map", label: "Map" },
          { value: "list", label: "List" },
        ]}
      />,
    )
    expect(screen.getByRole("radiogroup", { name: "顯示方式" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "List" })).toBeTruthy()
  })
})

describe("ViewportOverlay", () => {
  it("sits 16 px in and lets the pointer through; a panel is Float, never the page's background", () => {
    render(
      <ViewportOverlay position="bottom-left">
        <ViewportPanel as="p">Stale</ViewportPanel>
      </ViewportOverlay>,
    )
    const panel = screen.getByText("Stale")
    expect(panel.tagName).toBe("P")
    expect(panel.className).toMatch(/\bbg-float\b.*\bring-edge\b/)
    expect(panel.className).not.toMatch(/bg-background/)
    const region = panel.parentElement!
    expect(region.getAttribute("data-slot")).toBe("viewport-overlay")
    expect(region.className).toMatch(/\bpointer-events-none\b/)
    expect(region.className).toMatch(/\bbottom-4\b.*\bleft-4\b/)
  })

  it("scrim is the dark theme's words over a picture", () => {
    render(<ViewportPanel variant="scrim">Paused</ViewportPanel>)
    expect(screen.getByText("Paused").className).toMatch(/\bdark\b.*\bbg-scrim\b/)
  })
})
