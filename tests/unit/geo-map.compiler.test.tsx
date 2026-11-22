import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GeoMap, GeoMapList, type GeoMapRobot } from "@/registry/syncrobotic/ui/geo-map?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own component) and the map
// imported with ?react-compiler, so these check that once compiled the map still moves robots as they move, keeps its
// view when a parent re-renders with new objects, shares a selection with its list, and sends a goal on confirm.

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const C = { lat: 24.9, lon: 121.2 }
const region = () => screen.getByRole("application")
const left = (id: string) => parseFloat(document.querySelector<HTMLElement>(`[data-robot-id="${id}"]`)!.style.left)

describe("compiled", () => {
  it("keeps its view across re-renders with new objects, and moves robots as they move", () => {
    function Fleet({ east }: { east: number }) {
      // Robots and fences built afresh in the body, as product code often writes them.
      const robots: GeoMapRobot[] = [
        { id: "a", name: "A", lat: C.lat, lon: C.lon + east, status: "active", fix: "rtk-fixed" },
        { id: "b", name: "B", lat: C.lat + 0.001, lon: C.lon, status: "normal", fix: "gps", accuracy: 3 },
      ]
      return <GeoMap label="Farm" robots={robots} fences={[{ id: "f", kind: "allowed", points: [C, { lat: C.lat + 0.002, lon: C.lon }, { lat: C.lat, lon: C.lon + 0.002 }] }]} />
    }
    const { rerender } = render(<Fleet east={0} />)
    fireEvent.keyDown(region(), { key: "+" })
    const b = left("b")
    const a = left("a")
    rerender(<Fleet east={0} />)
    expect(left("b")).toBe(b)
    rerender(<Fleet east={0.0001} />)
    // The view stays where the person put it; only the robot that moved moves.
    expect(left("b")).toBe(b)
    expect(left("a")).toBeGreaterThan(a)
  })

  it("shares a selection with its list and sends a goal on confirm", () => {
    const onGoal = vi.fn()
    function Page() {
      const [sel, setSel] = React.useState<string | null>(null)
      const robots: GeoMapRobot[] = [{ id: "a", name: "A", ...C, status: "active" }]
      return (
        <>
          <GeoMap label="Farm" robots={robots} selectedId={sel} onSelect={setSel} center={C} zoom={18} mode="goal" onGoal={onGoal} />
          <GeoMapList label="Robots" robots={robots} selectedId={sel} onSelect={setSel} />
        </>
      )
    }
    render(<Page />)
    fireEvent.click(screen.getByRole("button", { name: /^A/ }))
    expect(document.querySelector('[data-robot-id="a"]')!.getAttribute("data-state")).toBe("selected")
    fireEvent.pointerDown(region(), { pointerId: 1, button: 0, pointerType: "mouse", clientX: 300, clientY: 150 })
    fireEvent.pointerUp(region(), { pointerId: 1, button: 0, pointerType: "mouse", clientX: 300, clientY: 150 })
    const card = document.querySelector<HTMLElement>("[data-slot=geo-map-confirm]")!
    act(() => void fireEvent.click(within(card).getByRole("button", { name: "Send goal" })))
    expect(onGoal).toHaveBeenCalledTimes(1)
    expect(onGoal.mock.calls[0]![0].lat).toBeGreaterThan(C.lat)
    expect(onGoal.mock.calls[0]![0].lon).toBeLessThan(C.lon)
  })
})
