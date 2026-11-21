import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/syncrobotic/ui/resizable"

// These pin what the handle is and how sizes are read, so an upgrade of react-resizable-panels that changes either shows
// up here rather than in a product. Keyboard resizing is not covered: version 3 attaches its key handlers only once it has
// measured a laid-out group, which happy-dom never provides.

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

function Two({ direction = "horizontal", withHandle }: { direction?: "horizontal" | "vertical"; withHandle?: boolean }) {
  return (
    <ResizablePanelGroup direction={direction}>
      <ResizablePanel defaultSize={40} minSize={25}>
        List
      </ResizablePanel>
      <ResizableHandle withHandle={withHandle} />
      <ResizablePanel defaultSize={60} minSize={30}>
        Map
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

// The first panel's share of the group, which the library writes on the panel.
const first = () => Number(document.querySelector("[data-panel]")!.getAttribute("data-panel-size"))

afterEach(cleanup)

describe("Resizable", () => {
  it("draws the handle as a focusable separator that knows its group's direction", async () => {
    const { rerender } = render(<Two />)
    await flush()
    const handle = screen.getByRole("separator")
    expect(handle.getAttribute("data-slot")).toBe("resizable-handle")
    expect(handle.tabIndex).toBe(0)
    // The vertical styles hang off this attribute, so it must follow the group.
    expect(handle.getAttribute("data-panel-group-direction")).toBe("horizontal")
    rerender(<Two direction="vertical" />)
    await flush()
    expect(screen.getByRole("separator").getAttribute("data-panel-group-direction")).toBe("vertical")
  })

  it("shows the grip only with withHandle, hidden from screen readers", async () => {
    const { rerender } = render(<Two />)
    await flush()
    expect(screen.getByRole("separator").querySelector("span")).toBeNull()
    rerender(<Two withHandle />)
    await flush()
    expect(screen.getByRole("separator").querySelector("span")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("reads a number as a percentage of the group", async () => {
    render(<Two />)
    await flush()
    expect(first()).toBeCloseTo(40)
  })
})
