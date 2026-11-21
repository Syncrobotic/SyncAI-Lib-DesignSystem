import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

afterEach(cleanup)

const Range = (props: Partial<React.ComponentProps<typeof SegmentedControl>>) => (
  <SegmentedControl aria-label="Range" {...props}>
    <SegmentedControlItem value="1h">1 h</SegmentedControlItem>
    <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
    <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
    <SegmentedControlItem value="30d" disabled>
      30 days
    </SegmentedControlItem>
  </SegmentedControl>
)

const radio = (name: string) => screen.getByRole("radio", { name })
const checked = () => screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")

describe("SegmentedControl", () => {
  it("is a labelled radiogroup of radios, with the default value checked", () => {
    render(<Range defaultValue="24h" />)
    expect(screen.getByRole("radiogroup", { name: "Range" })).toBeTruthy()
    expect(screen.getAllByRole("radio")).toHaveLength(4)
    expect(radio("24 h").getAttribute("aria-checked")).toBe("true")
    expect(radio("24 h").getAttribute("data-state")).toBe("on")
    expect(radio("1 h").getAttribute("aria-checked")).toBe("false")
    expect(checked()).toHaveLength(1)
  })

  it("selects a segment on click (uncontrolled) and reports the value", () => {
    const onValueChange = vi.fn()
    render(<Range defaultValue="24h" onValueChange={onValueChange} />)
    fireEvent.click(radio("7 days"))
    expect(onValueChange).toHaveBeenLastCalledWith("7d")
    expect(radio("7 days").getAttribute("aria-checked")).toBe("true")
    expect(radio("24 h").getAttribute("aria-checked")).toBe("false")
  })

  it("follows the value when controlled, and only moves when the parent updates it", () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<Range value="1h" onValueChange={onValueChange} />)
    fireEvent.click(radio("7 days"))
    expect(onValueChange).toHaveBeenLastCalledWith("7d")
    // The parent has not accepted the change yet.
    expect(radio("1 h").getAttribute("aria-checked")).toBe("true")
    rerender(<Range value="7d" onValueChange={onValueChange} />)
    expect(radio("7 days").getAttribute("aria-checked")).toBe("true")
    expect(checked()).toHaveLength(1)
  })

  it("does not select a disabled segment", () => {
    const onValueChange = vi.fn()
    render(<Range defaultValue="24h" onValueChange={onValueChange} />)
    const off = radio("30 days")
    expect(off.hasAttribute("disabled")).toBe(true)
    fireEvent.click(off)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(radio("24 h").getAttribute("aria-checked")).toBe("true")
  })

  it("disables every segment when the control is disabled", () => {
    render(<Range defaultValue="24h" disabled />)
    for (const r of screen.getAllByRole("radio")) expect(r.hasAttribute("disabled")).toBe(true)
  })

  it("is one Tab stop: tabbing in lands on the selected segment, which then holds the stop", () => {
    render(<Range defaultValue="24h" />)
    const group = screen.getByRole("radiogroup")
    for (const r of screen.getAllByRole("radio")) expect(r.getAttribute("tabindex")).toBe("-1")
    expect(group.getAttribute("tabindex")).toBe("0")
    act(() => group.focus())
    expect(document.activeElement).toBe(radio("24 h"))
    expect(radio("24 h").getAttribute("tabindex")).toBe("0")
    for (const name of ["1 h", "7 days", "30 days"]) expect(radio(name).getAttribute("tabindex")).toBe("-1")
  })

  it("moves focus with the arrow keys and Home / End, skipping the disabled segment, without selecting", () => {
    vi.useFakeTimers()
    try {
      const onValueChange = vi.fn()
      render(<Range defaultValue="1h" onValueChange={onValueChange} />)
      const first = radio("1 h")
      // Radix moves focus on the next tick.
      const press = (key: string) => {
        fireEvent.keyDown(document.activeElement!, { key })
        act(() => vi.runAllTimers())
      }
      act(() => first.focus())
      press("ArrowRight")
      expect(document.activeElement).toBe(radio("24 h"))
      press("ArrowRight")
      expect(document.activeElement).toBe(radio("7 days"))
      // 30 days is disabled; the row loops back to the start.
      press("ArrowRight")
      expect(document.activeElement).toBe(first)
      press("ArrowLeft")
      expect(document.activeElement).toBe(radio("7 days"))
      press("Home")
      expect(document.activeElement).toBe(first)
      press("End")
      expect(document.activeElement).toBe(radio("7 days"))
      expect(radio("7 days").getAttribute("tabindex")).toBe("0")
      // Focus moved; the selection did not.
      expect(onValueChange).not.toHaveBeenCalled()
      expect(first.getAttribute("aria-checked")).toBe("true")
    } finally {
      vi.useRealTimers()
    }
  })

  it("selects the focused segment with Enter / Space (a native button click)", () => {
    const onValueChange = vi.fn()
    render(<Range defaultValue="1h" onValueChange={onValueChange} />)
    const seven = radio("7 days")
    expect(seven.tagName).toBe("BUTTON")
    expect(seven.getAttribute("type")).toBe("button")
    // Enter and Space on a <button> fire click; that is the path Radix listens on.
    fireEvent.click(seven)
    expect(onValueChange).toHaveBeenLastCalledWith("7d")
  })

  it("draws a thumb behind the selected segment and moves it to the new one", async () => {
    // Radix does not write the value to the DOM; the label identifies the segment.
    const box = new Map([
      ["1 h", [4, 60]],
      ["24 h", [68, 60]],
      ["7 days", [132, 80]],
    ])
    const left = vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return box.get(this.textContent ?? "")?.[0] ?? 0
    })
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
      return box.get(this.textContent ?? "")?.[1] ?? 0
    })
    try {
      const { container } = render(<Range defaultValue="24h" />)
      const group = screen.getByRole("radiogroup")
      const thumb = () => container.querySelector<HTMLElement>('[data-slot="segmented-control-thumb"]')
      expect(group.hasAttribute("data-thumb")).toBe(true)
      expect(thumb()?.getAttribute("aria-hidden")).toBe("true")
      expect(thumb()?.style.width).toBe("60px")
      expect(thumb()?.style.translate).toBe("68px 0")
      fireEvent.click(radio("7 days"))
      // A MutationObserver on data-state re-measures; its callback runs as a microtask.
      await act(async () => {})
      expect(thumb()?.style.width).toBe("80px")
      expect(thumb()?.style.translate).toBe("132px 0")
    } finally {
      left.mockRestore()
      width.mockRestore()
    }
  })

  it("has no thumb when nothing is selected", () => {
    const { container } = render(<Range />)
    expect(checked()).toHaveLength(0)
    expect(container.querySelector('[data-slot="segmented-control-thumb"]')).toBeNull()
    expect(screen.getByRole("radiogroup").hasAttribute("data-thumb")).toBe(false)
  })

  // BUG: SegmentedControl passes straight through to Radix ToggleGroup type="single", which turns the selected item off
  // when it is pressed again (onItemDeactivate -> value ""). The docs call a segmented control "one choice among several
  // that stays selected" (site/overview.ts), but clicking (or Enter / Space on) the selected segment leaves nothing
  // selected and calls onValueChange(""). The component should ignore a deselect.
  it.fails("keeps the selection when the selected segment is pressed again", () => {
    const onValueChange = vi.fn()
    render(<Range defaultValue="24h" onValueChange={onValueChange} />)
    fireEvent.click(radio("24 h"))
    expect(radio("24 h").getAttribute("aria-checked")).toBe("true")
    expect(onValueChange).not.toHaveBeenCalledWith("")
  })
})
