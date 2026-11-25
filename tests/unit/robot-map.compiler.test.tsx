import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RobotMap, RobotMapList, type RobotMapPoint, type RobotMapRobot } from "@/registry/syncrobotic/ui/robot-map?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's fleet page: robots moving in
// state ten times a second, one selection shared by the map and the list, waypoints owned by the app) and robot-map
// imported with ?react-compiler. A map that drew an old pose, sent a goal or a waypoint from an earlier render, or lost
// its selection on a re-render sends a robot to the wrong place: these check it does not, once compiled.

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] }))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const start: RobotMapRobot[] = [
  { id: "amr-07", name: "AMR-07", x: 10, y: 10, heading: 90, status: "active" },
  { id: "amr-11", name: "AMR-11", x: 50, y: 12, status: "warning", statusLabel: "Battery 12 %" },
]

let advance: () => void = () => {}

/** The app: poses arrive every 100 ms; selection and waypoints live here. Each render passes new inline callbacks. */
function Fleet({ onGoal, mode }: { onGoal?: (goal: { x: number; y: number; heading?: number }) => void; mode?: "view" | "goal" | "waypoints" }) {
  const [robots, setRobots] = React.useState(start)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [waypoints, setWaypoints] = React.useState<RobotMapPoint[]>([])
  React.useEffect(() => {
    advance = () => setRobots((rs) => rs.map((r) => (r.id === "amr-07" ? { ...r, x: r.x + 1 } : r)))
  }, [])
  return (
    <>
      <RobotMap
        label="Map of North site"
        width={60}
        height={36}
        robots={robots}
        selectedId={selected}
        onSelect={(id) => setSelected(id)}
        mode={mode}
        onGoal={(goal) => onGoal?.(goal)}
        waypoints={waypoints}
        onWaypointsChange={(next) => setWaypoints(next)}
      />
      <RobotMapList label="Robots on North site" robots={robots} selectedId={selected} onSelect={(id) => setSelected(id)} />
      <output data-testid="waypoints">{JSON.stringify(waypoints.map(([x, y]) => [Math.round(x), Math.round(y)]))}</output>
    </>
  )
}

const region = () => screen.getByRole("application", { name: "Map of North site" })
const marker = (id: string) => document.querySelector<HTMLElement>(`[data-robot-id="${id}"]`)!
const left = (id: string) => parseFloat(marker(id).style.left)
// Unmeasured, the frame is 640 × 384 px; a 60 × 36 m site fits at 8⅓ px a metre around the frame point (320, 166).
const k = 300 / 36
const px = (x: number, y: number) => ({ clientX: 320 + (x - 30) * k, clientY: 166 + (y - 18) * k })
const tap = (el: Element, at: { clientX: number; clientY: number }) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, pointerType: "mouse", ...at })
  fireEvent.pointerUp(el, { pointerId: 1, button: 0, pointerType: "mouse", ...at })
}

describe("compiled", () => {
  it("draws every new pose, and keeps the selection made on the map or in the list while the robots move", () => {
    render(<Fleet />)
    const x0 = left("amr-07")
    for (let i = 0; i < 3; i++) act(() => advance())
    expect(left("amr-07")).toBeCloseTo(x0 + 3 * k, 3)
    tap(marker("amr-07"), { clientX: 10, clientY: 10 })
    expect(marker("amr-07").dataset.state).toBe("selected")
    act(() => advance())
    expect(marker("amr-07").dataset.state).toBe("selected")
    expect(screen.getByRole("button", { name: /AMR-07/ }).getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: /AMR-11/ }))
    act(() => advance())
    expect(marker("amr-11").dataset.state).toBe("selected")
    expect(marker("amr-07").dataset.state).toBeUndefined()
    fireEvent.keyDown(region(), { key: "Escape" })
    expect(marker("amr-11").dataset.state).toBeUndefined()
  })

  it("sends the goal through the newest callback, placed where it was pressed, while poses keep arriving", () => {
    const onGoal = vi.fn()
    render(<Fleet mode="goal" onGoal={onGoal} />)
    const at = px(20, 20)
    fireEvent.pointerDown(region(), { pointerId: 1, button: 0, pointerType: "mouse", ...at })
    act(() => advance())
    fireEvent.pointerMove(region(), { pointerId: 1, clientX: at.clientX + 40, clientY: at.clientY })
    act(() => advance())
    fireEvent.pointerUp(region(), { pointerId: 1, button: 0, pointerType: "mouse", clientX: at.clientX + 40, clientY: at.clientY })
    expect(onGoal).toHaveBeenCalledTimes(1)
    expect(onGoal.mock.calls[0]![0].x).toBeCloseTo(20, 5)
    expect(onGoal.mock.calls[0]![0].y).toBeCloseTo(20, 5)
    expect(onGoal.mock.calls[0]![0].heading).toBe(90)
  })

  it("adds, moves and removes waypoints the app owns, across re-renders", () => {
    render(<Fleet mode="waypoints" />)
    const list = () => screen.getByTestId("waypoints").textContent
    tap(region(), px(10, 10))
    act(() => advance())
    tap(region(), px(20, 10))
    expect(list()).toBe("[[10,10],[20,10]]")
    const handles = () => [...document.querySelectorAll<HTMLElement>("[data-waypoint]")]
    fireEvent.pointerDown(handles()[0]!, { pointerId: 1, button: 0, pointerType: "mouse", ...px(10, 10) })
    act(() => advance())
    fireEvent.pointerMove(handles()[0]!, { pointerId: 1, ...px(12, 14) })
    fireEvent.pointerUp(handles()[0]!, { pointerId: 1, button: 0, pointerType: "mouse", ...px(12, 14) })
    expect(list()).toBe("[[12,14],[20,10]]")
    act(() => advance())
    fireEvent.keyDown(region(), { key: "Delete" })
    expect(list()).toBe("[[20,10]]")
  })
})
