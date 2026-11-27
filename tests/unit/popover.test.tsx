import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function Filter(props: React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent aria-label="Filter robots">
        <button type="button">Online only</button>
      </PopoverContent>
    </Popover>
  )
}

describe("Popover", () => {
  it("opens on trigger click as a dialog the trigger points to", () => {
    render(<Filter />)
    const trigger = screen.getByRole("button", { name: "Filters" })
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(trigger.getAttribute("data-slot")).toBe("popover-trigger")
    act(() => fireEvent.click(trigger))
    const panel = screen.getByRole("dialog", { name: "Filter robots" })
    expect(panel.getAttribute("data-slot")).toBe("popover-content")
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id)
  })

  it("moves focus into the panel and returns it to the trigger on Esc", () => {
    vi.useFakeTimers()
    render(<Filter />)
    const trigger = screen.getByRole("button", { name: "Filters" })
    act(() => trigger.focus())
    act(() => fireEvent.click(trigger))
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true)
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    // Radix hands focus back on the next tick after the content unmounts.
    act(() => void vi.runAllTimers())
    expect(document.activeElement).toBe(trigger)
  })

  it("closes on a second trigger click", () => {
    render(<Filter />)
    const trigger = screen.getByRole("button", { name: "Filters" })
    act(() => fireEvent.click(trigger))
    act(() => fireEvent.click(trigger))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("follows a controlled open and reports changes", () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Filter open={false} onOpenChange={onOpenChange} />)
    act(() => fireEvent.click(screen.getByRole("button", { name: "Filters" })))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole("dialog")).toBeNull()
    rerender(<Filter open onOpenChange={onOpenChange} />)
    expect(screen.getByRole("dialog")).toBeTruthy()
  })
})
