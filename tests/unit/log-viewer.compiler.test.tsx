import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createLogBuffer, LogViewer, type LogLine, type LogViewerHandle } from "@/registry/syncrobotic/ui/log-viewer?react-compiler"
import { layOut } from "./log-viewer-layout"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own components) and
// log-viewer imported with ?react-compiler, so these check the viewer still follows its buffer once compiled: the
// buffer is one object whose contents change, and the virtual rows answer through one virtualizer object, both of which
// a compiled component would otherwise cache. The rows opt out ("use no memo"); the rest reads the buffer's snapshot.

const t0 = Date.UTC(2026, 10, 21, 14, 2, 0)
const make = (n: number, from = 0): LogLine[] =>
  Array.from({ length: n }, (_, k) => ({ time: t0 + (from + k) * 100, level: (from + k) % 7 === 0 ? "error" : "info", source: "/planner", message: `line ${from + k}` }))

let restore: () => void
beforeEach(() => {
  restore = layOut()
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  restore()
  vi.useRealTimers()
})

const lines = () => within(screen.getByRole("treegrid")).queryAllByRole("row").filter((r) => r.hasAttribute("data-seq"))

describe("log-viewer, compiled", { timeout: 20_000 }, () => {
  it("draws new lines appended through the handle, following the newest", () => {
    function Console() {
      const viewer = React.useRef<LogViewerHandle>(null)
      return (
        <>
          <button type="button" onClick={() => viewer.current?.append(make(3, 40))}>
            More
          </button>
          <LogViewer ref={viewer} lines={make(40)} />
        </>
      )
    }
    render(<Console />)
    expect(lines().at(-1)!.textContent).toContain("line 39")
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "More" }))
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByRole("treegrid").getAttribute("aria-rowcount")).toBe("44")
    expect(lines().at(-1)!.textContent).toContain("line 42")
    expect(screen.getByText("43 lines")).toBeTruthy()
  })

  it("follows a buffer the app appends to from outside React, and a lines array kept in state", () => {
    const buffer = createLogBuffer({ maxLines: 50, flushMs: 0, lines: make(10) })
    function FromState() {
      const [log, setLog] = React.useState(() => make(5, 100))
      return (
        <>
          <button type="button" onClick={() => setLog((l) => [...l, ...make(2, 105)])}>
            Grow
          </button>
          <LogViewer lines={log} />
        </>
      )
    }
    const { unmount } = render(<LogViewer buffer={buffer} />)
    act(() => buffer.append(make(60, 10)))
    // Capped at 50: the newest is line 69, the oldest kept line 20.
    expect(screen.getByRole("treegrid").getAttribute("aria-rowcount")).toBe("51")
    expect(lines().at(-1)!.textContent).toContain("line 69")
    expect(screen.getByText(/keeps the last 50/)).toBeTruthy()
    unmount()
    render(<FromState />)
    act(() => void fireEvent.click(screen.getByRole("button", { name: "Grow" })))
    expect(lines().at(-1)!.textContent).toContain("line 106")
  })

  it("keeps filters, search and the keyboard working", () => {
    render(<LogViewer lines={make(30)} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "line 1" } })
    expect(screen.getByText("11 matches")).toBeTruthy()
    const grid = screen.getByRole("treegrid")
    act(() => grid.focus())
    fireEvent.keyDown(grid, { key: "ArrowUp" })
    expect(grid.getAttribute("aria-activedescendant")).toMatch(/line-28$/)
    fireEvent.keyDown(grid, { key: "Enter" })
    expect(document.querySelector("[aria-expanded=true]")?.textContent).toContain("line 28")
  })
})
