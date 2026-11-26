import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/syncrobotic/ui/resizable"

// These pin what the handle is, how sizes are read and what the keyboard does, so an upgrade of react-resizable-panels that
// changes any of them shows up here rather than in a product. Version 4 measures the group with getBoundingClientRect and
// waits while it is 0 px, which is all happy-dom draws, so the group is given a size: two 500 × 400 panels side by side
// (or 1000 × 200 stacked), measured the way the library measures them.

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

const proto = HTMLElement.prototype
const original = {
  rect: proto.getBoundingClientRect,
  width: Object.getOwnPropertyDescriptor(proto, "offsetWidth")!,
  height: Object.getOwnPropertyDescriptor(proto, "offsetHeight")!,
  left: Object.getOwnPropertyDescriptor(proto, "offsetLeft")!,
  top: Object.getOwnPropertyDescriptor(proto, "offsetTop")!,
}
const vertical = (el: Element) => el.closest("[data-group]")?.getAttribute("data-orientation") === "vertical"
const size = (el: Element): [number, number] | null => {
  if (el.hasAttribute("data-group")) return [1000, 400]
  if (el.hasAttribute("data-panel")) return vertical(el) ? [1000, 200] : [500, 400]
  if (el.hasAttribute("data-separator")) return vertical(el) ? [1000, 0] : [0, 400]
  return null
}
// Laid out in order: each child of the group starts where the one before it ends.
const offset = (el: Element) => {
  let at = 0
  for (let prev = el.previousElementSibling; prev; prev = prev.previousElementSibling) at += size(prev)?.[vertical(el) ? 1 : 0] ?? 0
  return at
}
beforeAll(() => {
  proto.getBoundingClientRect = function (this: HTMLElement) {
    const s = size(this)
    if (!s || this.hasAttribute("data-group")) return s ? new DOMRect(0, 0, ...s) : original.rect.call(this)
    return vertical(this) ? new DOMRect(0, offset(this), ...s) : new DOMRect(offset(this), 0, ...s)
  }
  Object.defineProperty(proto, "offsetWidth", { configurable: true, get(this: HTMLElement) { return size(this)?.[0] ?? 0 } })
  Object.defineProperty(proto, "offsetHeight", { configurable: true, get(this: HTMLElement) { return size(this)?.[1] ?? 0 } })
  Object.defineProperty(proto, "offsetLeft", { configurable: true, get(this: HTMLElement) { return size(this) && !vertical(this) ? offset(this) : 0 } })
  Object.defineProperty(proto, "offsetTop", { configurable: true, get(this: HTMLElement) { return size(this) && vertical(this) ? offset(this) : 0 } })
})
afterAll(() => {
  proto.getBoundingClientRect = original.rect
  Object.defineProperty(proto, "offsetWidth", original.width)
  Object.defineProperty(proto, "offsetHeight", original.height)
  Object.defineProperty(proto, "offsetLeft", original.left)
  Object.defineProperty(proto, "offsetTop", original.top)
})
afterEach(cleanup)

type Orientation = "horizontal" | "vertical"
function Two({ direction, orientation, withHandle, first = 40 }: { direction?: Orientation; orientation?: Orientation; withHandle?: boolean; first?: number | string }) {
  return (
    <ResizablePanelGroup direction={direction} orientation={orientation}>
      <ResizablePanel defaultSize={first} minSize={25}>
        List
      </ResizablePanel>
      <ResizableHandle withHandle={withHandle} />
      <ResizablePanel minSize={30}>Map</ResizablePanel>
    </ResizablePanelGroup>
  )
}

// The first panel's share of the group, as the handle tells assistive technology.
const now = () => Number(screen.getByRole("separator").getAttribute("aria-valuenow"))

describe("Resizable", () => {
  it("draws the handle as a focusable separator whose orientation follows the group", async () => {
    const { rerender } = render(<Two />)
    await flush()
    const handle = screen.getByRole("separator")
    expect(handle.getAttribute("data-slot")).toBe("resizable-handle")
    expect(handle.tabIndex).toBe(0)
    // Side-by-side panels are split by a vertical line. The vertical group's styles hang off aria-orientation="horizontal".
    expect(handle.getAttribute("aria-orientation")).toBe("vertical")
    rerender(<Two direction="vertical" />)
    await flush()
    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal")
    expect(document.querySelector("[data-slot=resizable-panel-group]")!.getAttribute("data-orientation")).toBe("vertical")
  })

  it("takes orientation, and direction as its version 3 name", async () => {
    render(<Two orientation="vertical" />)
    await flush()
    expect(screen.getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal")
  })

  it("shows the grip only with withHandle, hidden from screen readers", async () => {
    const { rerender } = render(<Two />)
    await flush()
    expect(screen.getByRole("separator").querySelector("span")).toBeNull()
    rerender(<Two withHandle />)
    await flush()
    expect(screen.getByRole("separator").querySelector("span")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("reads a number as a percentage of the group, and a string with its unit", async () => {
    const { unmount } = render(<Two />)
    await flush()
    expect(now()).toBeCloseTo(40)
    unmount()
    render(<Two first="300px" />)
    await flush()
    expect(now()).toBeCloseTo(30)
  })

  it("resizes with the arrow keys, 5% a press, within minSize", async () => {
    render(<Two />)
    await flush()
    const handle = screen.getByRole("separator")
    for (let i = 0; i < 3; i++) fireEvent.keyDown(handle, { key: "ArrowRight" })
    await flush()
    expect(now()).toBeCloseTo(55)
    fireEvent.keyDown(handle, { key: "Home" })
    await flush()
    expect(now()).toBeCloseTo(25)
  })

  it("remembers the sizes in this browser under autoSaveId", async () => {
    const Saved = () => (
      <ResizablePanelGroup autoSaveId="resizable-test">
        <ResizablePanel id="list" defaultSize={40}>
          List
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="map">Map</ResizablePanel>
      </ResizablePanelGroup>
    )
    localStorage.clear()
    const { unmount } = render(<Saved />)
    await flush()
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" })
    await flush()
    expect(JSON.parse(localStorage.getItem("react-resizable-panels:resizable-test")!)).toEqual({ list: 45, map: 55 })
    unmount()
    render(<Saved />)
    await flush()
    expect(now()).toBeCloseTo(45)
    localStorage.clear()
  })
})
