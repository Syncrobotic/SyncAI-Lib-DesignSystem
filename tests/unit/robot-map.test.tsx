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
  type RobotMapGrid,
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
