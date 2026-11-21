import * as React from "react"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  RobotMap,
  RobotMapList,
  gridToPlan,
  pointInPolygon,
  rasteriseGrid,
  rosToPlan,
  scanToPoints,
  type RobotMapGrid,
  type RobotMapPoint,
  type RobotMapRobot,
  type RobotMapZone,
} from "@/registry/syncrobotic/ui/robot-map"

afterEach(cleanup)

const zones: RobotMapZone[] = [
  {
    id: "cold",
    kind: "restricted",
    label: "Cold store",
    points: [
      [44, 0],
      [60, 0],
      [60, 18],
      [44, 18],
    ],
  },
  {
    id: "docks",
    kind: "charging",
    points: [
      [0, 4],
      [6, 4],
      [6, 14],
      [0, 14],
    ],
  },
]
const robots: RobotMapRobot[] = [
  { id: "amr-07", name: "AMR-07", x: 23, y: 24, heading: 90, status: "active" },
  { id: "amr-11", name: "AMR-11", x: 50, y: 12, status: "warning", statusLabel: "Battery 12 %" },
  { id: "amr-14", name: "AMR-14", x: 3, y: 9, heading: 0, status: "normal" },
]

const region = () => screen.getByRole("application", { name: "Map of North site" })
const marker = (id: string) => document.querySelector<HTMLElement>(`[data-robot-id="${id}"]`)!
const click = (el: Element) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 })
  fireEvent.pointerUp(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 })
}
const left = (id: string) => parseFloat(marker(id).style.left)

/** Map and list sharing one selection, as the rules ask. */
function Both({ onSelect }: { onSelect?: (id: string | null) => void }) {
  const [selected, setSelected] = React.useState<string | null>(null)
  const pick = (id: string | null) => {
    setSelected(id)
    onSelect?.(id)
  }
  return (
    <>
      <RobotMap label="Map of North site" width={60} height={36} zones={zones} robots={robots} selectedId={selected} onSelect={pick} />
      <RobotMapList label="Robots on North site" robots={robots} zones={zones} selectedId={selected} onSelect={pick} />
    </>
  )
}

describe("RobotMap", () => {
  it("is one named, focusable region that says how to use it and what it shows", () => {
    render(<RobotMap label="Map of North site" width={60} height={36} zones={zones} robots={robots} northDeg={30} />)
    const map = region()
    expect(map.tabIndex).toBe(0)
    expect(map.getAttribute("aria-roledescription")).toBe("map")
    const hint = document.getElementById(map.getAttribute("aria-describedby")!)!
    expect(hint.textContent).toContain("Arrow keys move the map")
    expect(hint.textContent).toContain("3 robots")
    expect(hint.textContent).toContain("North is 30° clockwise from the top")
    // The robots on the map are drawn, not Tab stops: the list is where each is reached.
    expect(map.querySelectorAll("[data-robot-id]")).toHaveLength(3)
    expect(within(map).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Zoom in", "Zoom out", "Show the whole site"])
  })

  it("names abnormal robots' state on the map; calm ones are only their shape and name", () => {
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} />)
    expect(document.querySelector('[data-robot-label="amr-11"]')!.textContent).toBe("AMR-11 · Battery 12 %")
    expect(document.querySelector('[data-robot-label="amr-07"]')!.textContent).toBe("AMR-07")
  })

  it("selects a robot by click, and clears on a click on the empty map", () => {
    const onSelect = vi.fn()
    render(<Both onSelect={onSelect} />)
    click(marker("amr-07"))
    expect(onSelect).toHaveBeenLastCalledWith("amr-07")
    expect(marker("amr-07").dataset.state).toBe("selected")
    expect(screen.getByRole("button", { name: /AMR-07/ }).getAttribute("aria-pressed")).toBe("true")
    click(region())
    expect(onSelect).toHaveBeenLastCalledWith(null)
    expect(marker("amr-07").dataset.state).toBeUndefined()
  })

  it("a drag pans and does not select", () => {
    const onSelect = vi.fn()
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} onSelect={onSelect} />)
    fireEvent.keyDown(region(), { key: "+" })
    const before = left("amr-07")
    const el = marker("amr-07")
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 60, clientY: 100 })
    fireEvent.pointerUp(el, { pointerId: 1, button: 0, clientX: 60, clientY: 100 })
    expect(onSelect).not.toHaveBeenCalled()
    expect(left("amr-07")).toBeCloseTo(before - 40, 0)
  })

  it("selecting in the list highlights the robot on the map", () => {
    render(<Both />)
    fireEvent.click(screen.getByRole("button", { name: /AMR-11/ }))
    expect(marker("amr-11").dataset.state).toBe("selected")
    // Selected: its name in bold and its state written, so it does not rely on colour.
    const label = document.querySelector('[data-robot-label="amr-11"]')!
    expect(label.className).toContain("font-bold")
    expect(region().querySelector("svg circle.stroke-ring")).not.toBeNull()
  })

  it("pans with the arrow keys, zooms with + and -, and 0 shows the whole site", () => {
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} />)
    const map = region()
    const zoomOut = screen.getByRole("button", { name: "Zoom out" }) as HTMLButtonElement
    const fit = left("amr-07")
    // At the fit the map cannot zoom out further.
    expect(zoomOut.disabled).toBe(true)
    // Fitted, the whole site is in view: panning stops at its edge.
    fireEvent.keyDown(map, { key: "+" })
    expect(zoomOut.disabled).toBe(false)
    const zoomed = left("amr-07")
    expect(zoomed).not.toBe(fit)
    fireEvent.keyDown(map, { key: "ArrowRight" })
    expect(left("amr-07")).toBeLessThan(zoomed)
    fireEvent.keyDown(map, { key: "ArrowLeft" })
    expect(left("amr-07")).toBeCloseTo(zoomed, 5)
    fireEvent.keyDown(map, { key: "-" })
    expect(left("amr-07")).toBeCloseTo(fit, 5)
    fireEvent.keyDown(map, { key: "+" })
    fireEvent.keyDown(map, { key: "+" })
    fireEvent.keyDown(map, { key: "ArrowDown" })
    fireEvent.keyDown(map, { key: "0" })
    expect(left("amr-07")).toBeCloseTo(fit, 5)
    expect(zoomOut.disabled).toBe(true)
  })

  it("the buttons zoom too, and the scale bar follows", () => {
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} />)
    const scale = () => document.querySelector("[data-slot=robot-map-scale]")!.textContent
    const before = scale()
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(scale()).not.toBe(before)
    fireEvent.click(screen.getByRole("button", { name: "Show the whole site" }))
    expect(scale()).toBe(before)
  })

  it("Esc clears the selection only when there is one", () => {
    const onSelect = vi.fn()
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} selectedId="amr-07" onSelect={onSelect} />)
    fireEvent.keyDown(region(), { key: "Escape" })
    expect(onSelect).toHaveBeenCalledWith(null, undefined)
  })

  it("draws planned routes dashed and travelled tracks solid, and zones without fill", () => {
    render(
      <RobotMap
        label="Map of North site"
        width={60}
        height={36}
        zones={zones}
        robots={robots}
        paths={[
          { id: "a", kind: "planned", points: [[1, 1], [10, 10]] },
          { id: "b", kind: "travelled", points: [[1, 1], [5, 1]] },
        ]}
      />,
    )
    const planned = document.querySelector('[data-path="planned"]')!
    const travelled = document.querySelector('[data-path="travelled"]')!
    expect(planned.getAttribute("stroke-dasharray")).toBeTruthy()
    expect(planned.getAttribute("class")).toContain("stroke-info")
    expect(travelled.getAttribute("stroke-dasharray")).toBeNull()
    for (const z of document.querySelectorAll("[data-zone]")) expect(z.getAttribute("class")).toContain("fill-none")
    // A zone without a name takes its kind's word.
    expect(screen.getByText("Charging")).toBeTruthy()
  })

  it("says when there are no robots, and shows loading and errors", () => {
    const retry = vi.fn()
    const { rerender } = render(<RobotMap label="Map of North site" width={60} height={36} zones={zones} robots={[]} />)
    expect(screen.getByText("No robots on this site right now.")).toBeTruthy()
    rerender(<RobotMap label="Map of North site" width={60} height={36} loading />)
    expect(screen.getByRole("group", { name: "Map of North site" }).getAttribute("aria-busy")).toBe("true")
    expect(screen.getByRole("status").textContent).toBe("Loading the map")
    rerender(<RobotMap label="Map of North site" width={60} height={36} error onRetry={retry} />)
    expect(screen.getByRole("alert").textContent).toBe("The map could not be loaded.")
    fireEvent.click(screen.getByRole("button", { name: "Reload the map" }))
    expect(retry).toHaveBeenCalled()
  })
})

describe("RobotMapList", () => {
  it("lists each robot with its name, state, position, zone and heading", () => {
    render(<RobotMapList label="Robots on North site" robots={robots} zones={zones} />)
    const list = screen.getByRole("list", { name: "Robots on North site" })
    const rows = within(list).getAllByRole("button")
    expect(rows.map((r) => r.textContent)).toEqual([
      "AMR-07Working23 m across, 24 m down · Outside the marked zones · Facing 90°",
      "AMR-11Battery 12 %50 m across, 12 m down · In Cold store (no entry)",
      "AMR-14Idle3.0 m across, 9.0 m down · In a charging zone · Facing 0°",
    ])
    expect(rows.every((r) => r.getAttribute("aria-pressed") === "false")).toBe(true)
  })

  it("has empty, loading and error states", () => {
    const { rerender } = render(<RobotMapList label="Robots" robots={[]} />)
    expect(screen.getByText("No robots on this site right now.")).toBeTruthy()
    rerender(<RobotMapList label="Robots" loading />)
    expect(screen.getByRole("status").textContent).toBe("Loading the map")
    rerender(<RobotMapList label="Robots" error="Robot positions could not be loaded." />)
    expect(screen.getByRole("alert").textContent).toBe("Robot positions could not be loaded.")
  })
})

describe("pointInPolygon", () => {
  it("finds points inside and outside", () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]
    expect(pointInPolygon([5, 5], square)).toBe(true)
    expect(pointInPolygon([15, 5], square)).toBe(false)
  })
})

describe("occupancy grid", () => {
  // Two rows of two cells, row 0 at the bottom as ROS sends it: [unknown, free] below, [occupied, half] above.
  const grid: RobotMapGrid = { width: 2, height: 2, resolution: 0.5, origin: { x: -1, y: -2 }, data: new Int8Array([-1, 0, 100, 50]) }
  const pixel = (px: Uint8ClampedArray, col: number, row: number) => [...px.slice((row * 2 + col) * 4, (row * 2 + col) * 4 + 4)]

  it("rasterises each value for the two masks, top row first", () => {
    const px = rasteriseGrid(grid)
    // The image's top row is the grid's top row (row 1): occupied, then 50 %.
    expect(pixel(px, 0, 0)).toEqual([255, 255, 255, 255])
    expect(pixel(px, 1, 0)).toEqual([255, 255, 255, 128])
    // Unknown: no luminance (no ink), full alpha (the hatch). Free: nothing, the map's surface.
    expect(pixel(px, 0, 1)).toEqual([0, 0, 0, 255])
    expect(pixel(px, 1, 1)).toEqual([0, 0, 0, 0])
  })

  it("draws only costs above zero on a costmap, and leaves unknown clear", () => {
    const px = rasteriseGrid(grid, "cost")
    expect(pixel(px, 0, 0)).toEqual([255, 255, 255, 255])
    expect(pixel(px, 1, 0)).toEqual([255, 255, 255, 128])
    expect(pixel(px, 0, 1)).toEqual([0, 0, 0, 0])
    expect(pixel(px, 1, 1)).toEqual([0, 0, 0, 0])
  })

  it("rasterises a number[] the same as an Int8Array, and clamps values past 100", () => {
    expect(rasteriseGrid({ ...grid, data: [-1, 0, 100, 50] })).toEqual(rasteriseGrid(grid))
    expect(pixel(rasteriseGrid({ ...grid, data: [0, 0, 127, 0] }), 0, 0)).toEqual([255, 255, 255, 255])
  })

  it("maps the grid to the plan as the ROS conversion does", () => {
    const frame = gridToPlan(grid)
    expect(frame).toEqual({ width: 1, height: 1, origin: { x: -1, y: -2 } })
    // The centre of cell (column 1, row 0), bottom right in the map frame, lands on the image's bottom-right pixel.
    const p = rosToPlan(frame, { x: grid.origin.x + 1.5 * grid.resolution, y: grid.origin.y + 0.5 * grid.resolution })
    expect(p.x).toBeCloseTo(0.75)
    expect(p.y).toBeCloseTo(0.75)
    // The formula in the docs: x = xRos − originX, y = height − (yRos − originY), heading = 90 − yaw × 180 / π.
    const out = rosToPlan({ width: 20, height: 10, origin: { x: 1, y: -2 } }, { x: 3.2, y: -0.4, yaw: Math.PI / 4 })
    expect(out.x).toBeCloseTo(3.2 - 1)
    expect(out.y).toBeCloseTo(10 - (-0.4 - -2))
    expect(out.heading).toBeCloseTo(45)
    expect(rosToPlan(frame, { x: 0, y: 0, yaw: Math.PI }).heading).toBeCloseTo(270)
  })

  it("takes its size from the grid when none is given, and writes the costmap's legend in words", () => {
    render(<RobotMap label="Map of North site" grid={grid} costmap={grid} robots={robots} />)
    expect(document.querySelector("[data-layer=grid] rect")).not.toBeNull()
    expect(document.querySelector("[data-slot=robot-map-legend]")!.textContent).toBe("Costlowlethal")
  })
})

describe("laser scans", () => {
  const scan = {
    robotId: "amr-07",
    angleMin: -Math.PI / 2,
    angleIncrement: Math.PI / 2,
    // Right, ahead, left; then readings the map must skip: no return, out of reach, too close, and the end of the array.
    ranges: [1, 2, 3, NaN, Infinity, 0.01, 50],
    rangeMin: 0.1,
    rangeMax: 10,
  }

  it("projects each beam from the robot's pose and skips NaN, Infinity and out-of-range readings", () => {
    // Facing right (90°): the beam ahead goes right, the ROS left (counter-clockwise) goes up the plan.
    const pts = scanToPoints({ ...scan, ranges: scan.ranges.slice(0, 3) }, { x: 10, y: 10, heading: 90 })
    expect(pts).toHaveLength(3)
    const [right, ahead, left] = pts as [[number, number], [number, number], [number, number]]
    expect(right[0]).toBeCloseTo(10)
    expect(right[1]).toBeCloseTo(11)
    expect(ahead[0]).toBeCloseTo(12)
    expect(ahead[1]).toBeCloseTo(10)
    expect(left[0]).toBeCloseTo(10)
    expect(left[1]).toBeCloseTo(7)
    // Beams 3 to 6 are all invalid, so a Float32Array of the whole scan gives the same three points.
    expect(scanToPoints({ ...scan, angleIncrement: Math.PI / 2, ranges: Float32Array.from(scan.ranges) }, { x: 10, y: 10, heading: 90 })).toHaveLength(3)
    // Facing up (0°), the beam ahead goes up the plan.
    const [, up] = scanToPoints(scan, { x: 0, y: 5, heading: 0 }) as [[number, number], [number, number]]
    expect(up[0]).toBeCloseTo(0)
    expect(up[1]).toBeCloseTo(3)
    // No heading, no frame to draw it in.
    expect(scanToPoints(scan, { x: 0, y: 0 })).toEqual([])
  })

  it("draws one path per scan, of dots, in a neutral ink", () => {
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} scans={[scan, { ...scan, robotId: "amr-14" }, { ...scan, robotId: "gone" }]} />)
    const drawn = document.querySelectorAll("[data-scan]")
    // amr-14 and amr-07 have headings; a scan from a robot not on the map is not drawn.
    expect(drawn).toHaveLength(2)
    const d = drawn[0]!.getAttribute("d")!
    expect(d.match(/M/g)).toHaveLength(3)
    expect(d).toContain("h0")
    expect(drawn[0]!.getAttribute("class")).toContain("stroke-foreground")
    expect(drawn[0]!.getAttribute("class")).not.toMatch(/info|warning|danger|stop/)
  })
})

describe("editing", () => {
  // Unmeasured, the frame is 640 × 384 px; a 60 × 36 m site fits at 8⅓ px a metre around the frame point (320, 166).
  const k = 300 / 36
  const px = (x: number, y: number) => ({ clientX: 320 + (x - 30) * k, clientY: 166 + (y - 18) * k })
  const press = (el: Element, at: { clientX: number; clientY: number }, more: object = {}) =>
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, pointerType: "mouse", ...at, ...more })
  const release = (el: Element, at: { clientX: number; clientY: number }) => fireEvent.pointerUp(el, { pointerId: 1, button: 0, pointerType: "mouse", ...at })
  const tap = (el: Element, at: { clientX: number; clientY: number }) => {
    press(el, at)
    release(el, at)
  }
  const said = () => document.querySelector("[data-slot=robot-map-announce]")!.textContent
  const banner = () => document.querySelector("[data-slot=robot-map-mode]")?.textContent ?? null
  const key = (k: string, more: object = {}) => fireEvent.keyDown(region(), { key: k, ...more })
  const near = (a: RobotMapPoint | undefined, b: RobotMapPoint) => {
    expect(a![0]).toBeCloseTo(b[0], 5)
    expect(a![1]).toBeCloseTo(b[1], 5)
  }

  /** The app's side: it owns the waypoints and zones, the map asks for changes. */
  function Editor(props: Partial<React.ComponentProps<typeof RobotMap>> & { onDraw?: (p: RobotMapPoint[]) => void; start?: RobotMapPoint[] }) {
    const [waypoints, setWaypoints] = React.useState<RobotMapPoint[]>(props.start ?? [])
    const [zs, setZones] = React.useState(zones)
    return (
      <RobotMap
        label="Map of North site"
        width={60}
        height={36}
        robots={robots}
        zones={zs}
        onZonesChange={setZones}
        waypoints={waypoints}
        onWaypointsChange={setWaypoints}
        onZoneDraw={props.onDraw}
        {...props}
      />
    )
  }

  it("view mode draws no banner and no crosshair, and keeps its keys", () => {
    render(<Editor />)
    fireEvent.focus(region())
    expect(banner()).toBeNull()
    expect(document.querySelector("[data-cursor]")).toBeNull()
    expect(region().className).toContain("cursor-grab")
  })

  it("goal: press places, drag points it, release emits and says so", () => {
    const onGoal = vi.fn()
    render(<Editor mode="goal" onGoal={onGoal} />)
    expect(banner()).toContain("Press to place the goal, drag to point it")
    // A drag to the right: heading 90°.
    const at = px(10, 10)
    press(region(), at)
    expect(document.querySelector('[data-goal="draft"]')).not.toBeNull()
    fireEvent.pointerMove(region(), { pointerId: 1, clientX: at.clientX + 40, clientY: at.clientY })
    release(region(), { clientX: at.clientX + 40, clientY: at.clientY })
    expect(onGoal).toHaveBeenCalledTimes(1)
    const goal = onGoal.mock.calls[0]![0]
    expect(goal.x).toBeCloseTo(10, 5)
    expect(goal.y).toBeCloseTo(10, 5)
    expect(goal.heading).toBe(90)
    expect(said()).toBe("Goal set at 10.0, 10.0 m, heading 90°")
    expect(document.querySelector('[data-goal="draft"]')).toBeNull()
    // A press that does not drag leaves the heading to the planner.
    tap(region(), px(20, 20))
    expect(onGoal.mock.calls[1]![0].heading).toBeUndefined()
    expect(said()).toBe("Goal set at 20.0, 20.0 m")
  })

  it("goal: a second finger turns the press into a pinch and places nothing", () => {
    const onGoal = vi.fn()
    render(<Editor mode="goal" onGoal={onGoal} />)
    fireEvent.pointerDown(region(), { pointerId: 1, pointerType: "touch", ...px(10, 10) })
    fireEvent.pointerDown(region(), { pointerId: 2, pointerType: "touch", ...px(20, 10) })
    expect(document.querySelector('[data-goal="draft"]')).toBeNull()
    fireEvent.pointerUp(region(), { pointerId: 2, pointerType: "touch", ...px(20, 10) })
    fireEvent.pointerUp(region(), { pointerId: 1, pointerType: "touch", ...px(10, 10) })
    expect(onGoal).not.toHaveBeenCalled()
  })

  it("goal by keyboard: a crosshair, Enter places, arrows turn it, Enter sets it; Esc cancels", () => {
    const onGoal = vi.fn()
    render(<Editor mode="goal" onGoal={onGoal} goal={{ x: 5, y: 5, heading: 0 }} />)
    expect(document.querySelector('[data-goal="set"]')).not.toBeNull()
    fireEvent.focus(region())
    expect(document.querySelector("[data-cursor]")).not.toBeNull()
    expect(document.querySelector("[data-slot=robot-map-cursor]")!.textContent).toBe("30.0, 18.0 m")
    // One step is a metre at this zoom (the first round length of 8 px or more); Shift, five.
    key("ArrowLeft")
    key("ArrowUp", { shiftKey: true })
    expect(document.querySelector("[data-slot=robot-map-cursor]")!.textContent).toBe("29.0, 13.0 m")
    key("Enter")
    expect(said()).toBe("Goal at 29.0, 13.0 m. Left and right arrows turn it, Enter sets it.")
    expect(banner()).toContain("Left and right arrows turn the goal")
    key("ArrowRight", { shiftKey: true })
    key("ArrowRight", { shiftKey: true })
    key("ArrowLeft")
    key(" ")
    expect(onGoal).toHaveBeenCalledWith({ x: 29, y: 13, heading: 75 })
    expect(said()).toBe("Goal set at 29.0, 13.0 m, heading 75°")
    key("Enter")
    key("Escape")
    expect(said()).toBe("Goal cancelled")
    expect(onGoal).toHaveBeenCalledTimes(1)
  })

  it("waypoints: a click adds at the end, a drag moves one, Delete removes the selected one", () => {
    render(<Editor mode="waypoints" />)
    expect(banner()).toContain("Click to add a waypoint")
    tap(region(), px(10, 10))
    tap(region(), px(20, 10))
    expect(said()).toBe("Waypoint 2 added at 20.0, 10.0 m")
    const handles = () => [...document.querySelectorAll<HTMLElement>("[data-waypoint]")]
    expect(handles().map((h) => h.textContent)).toEqual(["1", "2"])
    // Not the planned route: the line between them is grey, dashed.
    const route = document.querySelector('[data-path="waypoints"]')!
    expect(route.getAttribute("class")).toContain("stroke-muted-foreground")
    expect(route.getAttribute("stroke-dasharray")).toBeTruthy()
    // A drag on the empty map adds nothing.
    press(region(), px(30, 30))
    fireEvent.pointerMove(region(), { pointerId: 1, ...px(32, 30) })
    release(region(), px(32, 30))
    expect(handles()).toHaveLength(2)
    // Drag the first to 12, 14.
    press(handles()[0]!, px(10, 10))
    fireEvent.pointerMove(handles()[0]!, { pointerId: 1, ...px(12, 14) })
    release(handles()[0]!, px(12, 14))
    expect(said()).toBe("Waypoint 1 moved to 12.0, 14.0 m")
    expect(parseFloat(handles()[0]!.style.left)).toBeCloseTo(px(12, 14).clientX, 3)
    expect(handles()[0]!.dataset.state).toBe("selected")
    key("Delete")
    expect(said()).toBe("Waypoint 1 removed")
    expect(handles().map((h) => h.textContent)).toEqual(["1"])
  })

  it("waypoints by keyboard: Enter adds, Enter on one picks it up, arrows carry it, Esc puts it back, Backspace removes", () => {
    render(<Editor mode="waypoints" />)
    fireEvent.focus(region())
    key("ArrowRight")
    key("Enter")
    expect(said()).toBe("Waypoint 1 added at 31.0, 18.0 m")
    key(" ")
    expect(said()).toBe("Waypoint 1 picked up. Arrow keys move it, Enter drops it, Esc puts it back.")
    key("ArrowDown")
    key("ArrowDown")
    key("Enter")
    expect(said()).toBe("Waypoint 1 moved to 31.0, 20.0 m")
    key("Enter")
    key("ArrowUp")
    key("Escape")
    expect(said()).toBe("Move cancelled")
    const handle = document.querySelector<HTMLElement>('[data-waypoint="0"]')!
    expect(parseFloat(handle.style.top)).toBeCloseTo(px(31, 20).clientY, 3)
    key("Backspace")
    expect(said()).toBe("Waypoint 1 removed")
    expect(document.querySelector("[data-waypoint]")).toBeNull()
  })

  it("draws the waypoints' line in the in-progress blue only when it is the planned route", () => {
    render(<Editor start={[[1, 1], [5, 5]]} waypointsPlanned />)
    expect(document.querySelector('[data-path="waypoints"]')!.getAttribute("class")).toContain("stroke-info")
  })

  it("zone: clicks add corners and a click on the first corner closes it", () => {
    const onDraw = vi.fn()
    render(<Editor mode="zone" onDraw={onDraw} />)
    expect(banner()).toContain("first corner")
    tap(region(), px(10, 10))
    tap(region(), px(20, 10))
    tap(region(), px(20, 20))
    expect(said()).toBe("Corner 3 at 20.0, 20.0 m")
    expect(banner()).toContain("click the first corner or press Enter to finish")
    expect(document.querySelector('[data-draft="zone"]')).not.toBeNull()
    tap(document.querySelector('[data-draft-corner="0"]')!, px(10, 10))
    expect(onDraw).toHaveBeenCalledTimes(1)
    const drawn = onDraw.mock.calls[0]![0] as RobotMapPoint[]
    expect(drawn).toHaveLength(3)
    near(drawn[1], [20, 10])
    expect(said()).toBe("Zone drawn with 3 corners")
    expect(document.querySelector('[data-draft="zone"]')).toBeNull()
  })

  it("zone by keyboard: Space adds, Backspace removes the last, Enter closes, Esc cancels", () => {
    const onDraw = vi.fn()
    render(<Editor mode="zone" onDraw={onDraw} snap={0.5} />)
    fireEvent.focus(region())
    key(" ")
    key("ArrowRight", { shiftKey: true })
    key(" ")
    key("ArrowDown", { shiftKey: true })
    key(" ")
    key("ArrowLeft")
    key(" ")
    expect(said()).toBe("Corner 4 at 34.0, 23.0 m")
    key("Backspace")
    expect(said()).toBe("Last corner removed, 3 left")
    // With fewer than three corners, Enter places one; from three it closes.
    key("Enter")
    expect(onDraw).toHaveBeenCalledWith([
      [30, 18],
      [35, 18],
      [35, 23],
    ])
    key(" ")
    key("Escape")
    expect(said()).toBe("Zone cancelled")
    expect(onDraw).toHaveBeenCalledTimes(1)
  })

  it("editable zones: a corner drags with the pointer and moves with the keys", () => {
    const onZonesChange = vi.fn()
    render(<RobotMap label="Map of North site" width={60} height={36} zones={zones} mode="zone" editableZones onZonesChange={onZonesChange} />)
    expect(banner()).toContain("drag a corner to move it")
    const corner = document.querySelector('[data-zone-vertex="cold|0"]')!
    press(corner, px(44, 0))
    fireEvent.pointerMove(corner, { pointerId: 1, ...px(42, 2) })
    release(corner, px(42, 2))
    const moved = onZonesChange.mock.lastCall![0] as RobotMapZone[]
    near(moved[0]!.points[0], [42, 2])
    expect(moved[0]!.points[1]).toEqual([60, 0])
    expect(said()).toBe("Corner moved to 42.0, 2.0 m")
  })

  it("snaps placements to the grid given, and keeps them on the plan", () => {
    const changed = vi.fn()
    render(<RobotMap label="Map of North site" width={60} height={36} mode="waypoints" snap={0.5} onWaypointsChange={changed} />)
    tap(region(), px(10.37, 4.8))
    expect(changed).toHaveBeenLastCalledWith([[10.5, 5]])
    tap(region(), { clientX: 2, clientY: 2 })
    expect(changed.mock.lastCall![0]).toEqual([[0, 0]])
  })

  it("the right button pans while editing and adds nothing", () => {
    const changed = vi.fn()
    render(<RobotMap label="Map of North site" width={60} height={36} robots={robots} mode="waypoints" onWaypointsChange={changed} />)
    key("+")
    const before = left("amr-07")
    press(region(), px(30, 18), { button: 2 })
    fireEvent.pointerMove(region(), { pointerId: 1, clientX: px(30, 18).clientX - 40, clientY: px(30, 18).clientY })
    fireEvent.pointerUp(region(), { pointerId: 1, button: 2, pointerType: "mouse", clientX: px(30, 18).clientX - 40, clientY: px(30, 18).clientY })
    expect(left("amr-07")).toBeCloseTo(before - 40, 0)
    expect(changed).not.toHaveBeenCalled()
  })

  it("a new mode drops what the last one left half drawn", () => {
    const { rerender } = render(<RobotMap label="Map of North site" width={60} height={36} mode="zone" />)
    tap(region(), px(10, 10))
    expect(document.querySelector('[data-draft="zone"]')).not.toBeNull()
    rerender(<RobotMap label="Map of North site" width={60} height={36} mode="view" />)
    rerender(<RobotMap label="Map of North site" width={60} height={36} mode="zone" />)
    expect(document.querySelector('[data-draft="zone"]')).toBeNull()
  })
})
