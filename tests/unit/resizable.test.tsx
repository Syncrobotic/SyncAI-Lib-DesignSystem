import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/syncrobotic/ui/resizable"

// happy-dom lays nothing out, and the library measures the group from its panels and orders panels and handles by their
// position, so this lays out a 1000 × 400 group by hand: two 500 px panels with a 1 px handle between them, side by side
// in a horizontal group and stacked in a vertical one.
const vertical = (el: Element) => el.parentElement?.closest("[data-group]")?.getAttribute("style")?.includes("column") ?? false
const length = (el: Element) => (el.hasAttribute("data-panel") ? 500 : el.hasAttribute("data-separator") ? 1 : 0)
const box = (el: Element) => {
  if (el.hasAttribute("data-group")) return new DOMRect(0, 0, 1000, 400)
  let start = 0
  for (let s = el.previousElementSibling; s; s = s.previousElementSibling) start += length(s)
  const across = vertical(el) ? 1000 : 400
  return vertical(el) ? new DOMRect(0, start, across, length(el)) : new DOMRect(start, 0, length(el), across)
}
const real = Object.fromEntries(
  ["offsetWidth", "offsetHeight", "offsetLeft", "offsetTop"].map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)!]),
)
const rect = HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    return box(this)
  }
  const measure = (k: string, f: (r: DOMRect) => number) =>
    Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get(this: HTMLElement) { return f(box(this)) } })
  measure("offsetWidth", (r) => r.width)
  measure("offsetHeight", (r) => r.height)
  measure("offsetLeft", (r) => r.x)
  measure("offsetTop", (r) => r.y)
})
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = rect
  for (const [k, d] of Object.entries(real)) Object.defineProperty(HTMLElement.prototype, k, d)
})

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

function Two({ orientation = "horizontal", withHandle }: { orientation?: "horizontal" | "vertical"; withHandle?: boolean }) {
  return (
    <div style={{ width: 1000, height: 400 }}>
      <ResizablePanelGroup orientation={orientation}>
        <ResizablePanel defaultSize={40} minSize={25}>
          List
        </ResizablePanel>
        <ResizableHandle withHandle={withHandle} />
        <ResizablePanel defaultSize={60} minSize={30}>
          Map
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

afterEach(cleanup)

describe("Resizable", () => {
  it("draws the handle as a focusable separator across the group's direction", async () => {
    const { rerender } = render(<Two />)
    await flush()
    const handle = screen.getByRole("separator")
    expect(handle.getAttribute("data-slot")).toBe("resizable-handle")
    expect(handle.tabIndex).toBe(0)
    expect(handle.getAttribute("aria-orientation")).toBe("vertical")
    rerender(<Two orientation="vertical" />)
    await flush()
    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal")
  })

  it("shows the grip only with withHandle, hidden from screen readers", async () => {
    const { rerender } = render(<Two />)
    await flush()
    expect(screen.getByRole("separator").querySelector("span")).toBeNull()
    rerender(<Two withHandle />)
    await flush()
    const grip = screen.getByRole("separator").querySelector("span")!
    expect(grip.getAttribute("aria-hidden")).toBe("true")
  })

  it("reads a number as a percentage, as version 3 did", async () => {
    render(<Two />)
    await flush()
    // The first panel's share of the group: 40, not 40 px.
    expect(Number(screen.getByRole("separator").getAttribute("aria-valuenow"))).toBeCloseTo(40)
  })

  it("resizes with the arrow keys, Home and End, within the panels' limits", async () => {
    render(<Two />)
    await flush()
    const handle = screen.getByRole("separator")
    const now = () => Number(handle.getAttribute("aria-valuenow"))
    handle.focus()
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    await flush()
    expect(now()).toBeGreaterThan(40)
    fireEvent.keyDown(handle, { key: "ArrowLeft" })
    fireEvent.keyDown(handle, { key: "ArrowLeft" })
    await flush()
    expect(now()).toBeLessThan(40)
    fireEvent.keyDown(handle, { key: "Home" })
    await flush()
    expect(now()).toBeCloseTo(25)
    fireEvent.keyDown(handle, { key: "End" })
    await flush()
    expect(now()).toBeCloseTo(70)
  })

  it("remembers the sizes in localStorage under autoSaveId, and saves nothing without it", async () => {
    localStorage.clear()
    const { unmount } = render(
      <ResizablePanelGroup orientation="horizontal" autoSaveId="fleet-map">
        <ResizablePanel id="list" defaultSize={40}>
          List
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="map" defaultSize={60}>
          Map
        </ResizablePanel>
      </ResizablePanelGroup>,
    )
    await flush()
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150))
    })
    const saved = Object.keys(localStorage).filter((k) => k.includes("fleet-map"))
    expect(saved).toHaveLength(1)
    const layout = JSON.parse(localStorage.getItem(saved[0]!)!) as Record<string, number>
    expect(layout.list).toBeGreaterThan(40)
    unmount()
    localStorage.clear()
    render(<Two />)
    await flush()
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" })
    await flush()
    expect(localStorage.length).toBe(0)
  })

  it("still takes direction, the version 3 name", async () => {
    render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>Camera</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>Log</ResizablePanel>
      </ResizablePanelGroup>,
    )
    await flush()
    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal")
  })
})
