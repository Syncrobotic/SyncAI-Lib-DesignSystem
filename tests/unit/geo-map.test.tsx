import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  GeoMap,
  GeoMapList,
  fenceOf,
  geoFixText,
  geoPointInPolygon,
  metresPerPixel,
  projectGeo,
  tileUrlFor,
  unprojectGeo,
  type GeoMapFence,
  type GeoMapRobot,
  type GeoPoint,
} from "@/registry/syncrobotic/ui/geo-map"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// A patrol site about 500 × 300 m, built from metres east and north of its centre.
const C = { lat: 24.8812, lon: 121.1468 }
const at = (east: number, north: number): GeoPoint => ({ lat: C.lat + north / 111320, lon: C.lon + east / (111320 * Math.cos((C.lat * Math.PI) / 180)) })
const fences: GeoMapFence[] = [
  { id: "perimeter", kind: "allowed", label: "Solar farm", points: [at(-250, -150), at(250, -150), at(250, 150), at(-250, 150)] },
  { id: "sub", kind: "keep-out", label: "Substation", points: [at(100, 40), at(200, 40), at(200, 100), at(100, 100)] },
  { id: "pit", kind: "keep-out", points: [at(-200, -140), at(-150, -140), at(-150, -100), at(-200, -100)] },
]
const robots: GeoMapRobot[] = [
  { id: "p1", name: "Patrol-1", ...at(0, 0), heading: 90, status: "active", fix: "rtk-fixed", accuracy: 0.02, trail: [at(-100, 0), at(-50, 0)] },
  { id: "p2", name: "Patrol-2", ...at(-150, 60), status: "warning", statusLabel: "Battery 14 %", fix: "gps", accuracy: 3.2 },
  { id: "p4", name: "Patrol-4", ...at(150, 70), status: "normal", fix: "none" },
]

const region = () => screen.getByRole("application", { name: "Map of Solar farm" })
const marker = (id: string) => document.querySelector<HTMLElement>(`[data-robot-id="${id}"]`)!
const left = (id: string) => parseFloat(marker(id).style.left)
const click = (el: Element, x = 10, y = 10) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: x, clientY: y })
  fireEvent.pointerUp(el, { pointerId: 1, button: 0, clientX: x, clientY: y })
}
const said = () => document.querySelector("[data-slot=geo-map-announce]")!.textContent

describe("projection", () => {
  it("projects to Web Mercator and back", () => {
    expect(projectGeo({ lat: 0, lon: 0 })).toEqual([0.5, 0.5])
    const [x, y] = projectGeo(C)
    const back = unprojectGeo(x, y)
    expect(back.lat).toBeCloseTo(C.lat, 9)
    expect(back.lon).toBeCloseTo(C.lon, 9)
    // The square world ends at about 85.05°: a pole is clamped to its edge.
    expect(projectGeo({ lat: 90, lon: 0 })[1]).toBeCloseTo(0, 6)
  })

  it("knows the ground size of a pixel", () => {
    expect(metresPerPixel(0, 0)).toBeCloseTo(156543.03, 1)
    expect(metresPerPixel(60, 1)).toBeCloseTo(156543.03 / 4, 1)
  })

  it("fills a tile template, or asks a function", () => {
    expect(tileUrlFor("https://t.example/{z}/{x}/{y}.png", { z: 17, x: 109665, y: 56170 })).toBe("https://t.example/17/109665/56170.png")
    expect(tileUrlFor((t) => `/cache/${t.z}-${t.x}-${t.y}`, { z: 1, x: 0, y: 1 })).toBe("/cache/1-0-1")
  })

  it("finds the fence a point is in, keep-outs first", () => {
    expect(geoPointInPolygon(at(0, 0), fences[0]!.points)).toBe(true)
    expect(geoPointInPolygon(at(300, 0), fences[0]!.points)).toBe(false)
    expect(fenceOf(at(150, 70), fences)?.id).toBe("sub")
    expect(fenceOf(at(0, 0), fences)?.id).toBe("perimeter")
    expect(fenceOf(at(900, 0), fences)).toBeUndefined()
  })

  it("writes a fix in words with its accuracy", () => {
    expect(geoFixText({ fix: "rtk-fixed", accuracy: 0.02 })).toBe("RTK fixed · ±2 cm")
    expect(geoFixText({ fix: "rtk-float", accuracy: 0.42 })).toBe("RTK float · ±42 cm")
    expect(geoFixText({ fix: "gps", accuracy: 3 })).toBe("GPS fix · ±3 m")
    expect(geoFixText({ fix: "gps", accuracy: 3.24 })).toBe("GPS fix · ±3.2 m")
    expect(geoFixText({ fix: "gps", accuracy: 12.6 })).toBe("GPS fix · ±13 m")
    expect(geoFixText({ fix: "none", accuracy: 3 })).toBe("No fix")
    expect(geoFixText({})).toBeUndefined()
    // In a locale: its decimal mark.
    expect(geoFixText({ fix: "gps", accuracy: 3.24 }, undefined, "de")).toBe("GPS fix · ±3,2 m")
  })
})

describe("GeoMap", () => {
  it("is one named, focusable region that says how to use it and what it shows", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} fences={fences} />)
    const map = region()
    expect(map.tabIndex).toBe(0)
    expect(map.getAttribute("aria-roledescription")).toBe("map")
    const hint = document.getElementById(map.getAttribute("aria-describedby")!)!
    expect(hint.textContent).toContain("Arrow keys move the map")
    expect(hint.textContent).toContain("3 robots")
    expect(map.querySelectorAll("[data-robot-id]")).toHaveLength(3)
    expect(within(map).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Zoom in", "Zoom out", "Show all robots"])
  })

  it("names abnormal robots' state and a lost fix on the map; calm ones are their shape and name", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} />)
    expect(document.querySelector('[data-robot-label="p2"]')!.textContent).toBe("Patrol-2\u00a0· Battery 14 %")
    expect(document.querySelector('[data-robot-label="p1"]')!.textContent).toBe("Patrol-1")
    const lost = document.querySelector('[data-robot-label="p4"]')!
    expect(lost.textContent).toBe("Patrol-4\u00a0· No fix")
    expect(lost.querySelector(".text-warning")).not.toBeNull()
    // Its last known place: the disc's edge is dashed.
    expect(marker("p4").querySelector("circle[stroke-dasharray]")).not.toBeNull()
    expect(marker("p1").querySelector("circle[stroke-dasharray]")).toBeNull()
  })

  it("fits the robots at first, and keeps every robot in the frame", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} />)
    for (const r of robots) {
      const x = left(r.id)
      const y = parseFloat(marker(r.id).style.top)
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(640)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(400)
    }
  })

  it("selects by click and from the list, and clears on the empty map", () => {
    const onSelect = vi.fn()
    function Both() {
      const [sel, setSel] = React.useState<string | null>(null)
      const pick = (id: string | null) => {
        setSel(id)
        onSelect(id)
      }
      return (
        <>
          <GeoMap label="Map of Solar farm" robots={robots} selectedId={sel} onSelect={pick} />
          <GeoMapList label="Robots" robots={robots} selectedId={sel} onSelect={pick} />
        </>
      )
    }
    render(<Both />)
    click(marker("p1"))
    expect(onSelect).toHaveBeenLastCalledWith("p1")
    expect(marker("p1").dataset.state).toBe("selected")
    expect(screen.getByRole("button", { name: /Patrol-1/ }).getAttribute("aria-pressed")).toBe("true")
    click(region())
    expect(onSelect).toHaveBeenLastCalledWith(null)
    fireEvent.click(screen.getByRole("button", { name: /Patrol-2/ }))
    expect(marker("p2").dataset.state).toBe("selected")
    expect(document.querySelector('[data-robot-label="p2"]')!.className).toContain("font-bold")
  })

  it("a drag pans and does not select", () => {
    const onSelect = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} onSelect={onSelect} />)
    const before = left("p1")
    const el = marker("p1")
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 60, clientY: 100 })
    fireEvent.pointerUp(el, { pointerId: 1, button: 0, clientX: 60, clientY: 100 })
    expect(onSelect).not.toHaveBeenCalled()
    expect(left("p1")).toBeCloseTo(before - 40, 5)
  })

  it("pans with the arrow keys, zooms with + and - a level at a time, and 0 fits the robots again", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} />)
    const map = region()
    const scale = () => document.querySelector("[data-slot=geo-map-scale]")!.textContent
    const fit = left("p2")
    const fitScale = scale()
    fireEvent.keyDown(map, { key: "+" })
    // One level in: everything twice as far from the anchor.
    expect(left("p2") - 320).toBeCloseTo((fit - 320) * 2, 5)
    expect(scale()).not.toBe(fitScale)
    const zoomed = left("p2")
    fireEvent.keyDown(map, { key: "ArrowRight" })
    expect(left("p2")).toBeLessThan(zoomed)
    fireEvent.keyDown(map, { key: "ArrowLeft" })
    expect(left("p2")).toBeCloseTo(zoomed, 5)
    fireEvent.keyDown(map, { key: "-" })
    expect(left("p2")).toBeCloseTo(fit, 5)
    fireEvent.keyDown(map, { key: "+" })
    fireEvent.keyDown(map, { key: "ArrowDown" })
    fireEvent.keyDown(map, { key: "0" })
    expect(left("p2")).toBeCloseTo(fit, 5)
    expect(scale()).toBe(fitScale)
  })

  it("the buttons zoom, and stop at the zoom limits", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={21} maxZoom={22} />)
    const zoomIn = screen.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement
    expect(zoomIn.disabled).toBe(false)
    fireEvent.click(zoomIn)
    expect(zoomIn.disabled).toBe(true)
  })

  it("the scale bar says metres or kilometres for a round length", () => {
    const { rerender } = render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={18} />)
    expect(document.querySelector("[data-slot=geo-map-scale]")!.textContent).toBe("50 m")
    rerender(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={11} />)
    expect(document.querySelector("[data-slot=geo-map-scale]")!.textContent).toBe("5 km")
  })

  it("with no tiles draws the coordinate grid with its labels, and needs no network", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={17} />)
    expect(document.querySelector("image")).toBeNull()
    expect(region().dataset.tiles).toBeUndefined()
    const lon = [...document.querySelectorAll("[data-graticule=lon]")].map((e) => e.textContent)
    const lat = [...document.querySelectorAll("[data-graticule=lat]")].map((e) => e.textContent)
    expect(lon.length).toBeGreaterThan(0)
    expect(lat.length).toBeGreaterThan(0)
    expect(lon.every((t) => /^\d+\.\d+° E$/.test(t!))).toBe(true)
    expect(lat.every((t) => /^\d+\.\d+° N$/.test(t!))).toBe(true)
  })

  it("draws tiles from the template, says when they are ready, and falls back to the grid when none load", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={17} tileUrl="/tiles/{z}/{x}/{y}.png" attribution="© Test tiles" />)
    const images = [...document.querySelectorAll("image")]
    expect(images.length).toBeGreaterThan(1)
    const [x, y] = projectGeo(C)
    const tx = Math.floor(x * 2 ** 17)
    const ty = Math.floor(y * 2 ** 17)
    expect(images.map((i) => i.getAttribute("href"))).toContain(`/tiles/17/${tx}/${ty}.png`)
    expect(region().dataset.tiles).toBe("loading")
    expect(screen.getByText("© Test tiles")).toBeTruthy()
    // While tiles are asked for, the grid has no labels; if every tile fails, it is the map again and says so.
    expect(document.querySelector("[data-graticule]")).toBeNull()
    for (const i of images) fireEvent.error(i)
    expect(region().dataset.tiles).toBe("ready")
    expect(screen.getByText("Map tiles could not be loaded. Showing the coordinate grid.")).toBeTruthy()
    expect(document.querySelector("[data-graticule]")).not.toBeNull()
  })

  it("loaded tiles are ready and say nothing", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={17} tileUrl={(t) => `/t/${t.z}/${t.x}/${t.y}`} />)
    for (const i of document.querySelectorAll("image")) fireEvent.load(i)
    expect(region().dataset.tiles).toBe("ready")
    expect(screen.queryByText(/could not be loaded/)).toBeNull()
  })

  it("past the server's deepest level, its tiles are drawn larger", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={21} tileUrl="/{z}/{x}/{y}" tileMaxZoom={19} />)
    const img = document.querySelector("image")!
    expect(img.getAttribute("href")!.startsWith("/19/")).toBe(true)
    expect(Number(img.getAttribute("width"))).toBe(1025)
  })

  it("keep-outs are hatched with a solid outline; work areas dashed; never a status fill", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} fences={fences} />)
    const keep = document.querySelector('[data-fence="keep-out"]')!
    expect(keep.querySelector("polygon[fill^='url(']")).not.toBeNull()
    const allowed = document.querySelector('[data-fence="allowed"]')!
    expect(allowed.querySelector("polygon[fill^='url(']")).toBeNull()
    expect(allowed.querySelector("polygon[stroke-dasharray]")).not.toBeNull()
    for (const p of document.querySelectorAll("[data-fence] polygon")) expect(p.getAttribute("class") ?? "").not.toMatch(/danger|warning|stop/)
    // An unnamed fence takes its kind's word.
    expect(screen.getByText("Keep out")).toBeTruthy()
    expect(screen.getByText("Substation")).toBeTruthy()
  })

  it("draws the route grey or, when it is being driven, blue, with numbered waypoints, and each robot's trail", () => {
    const route = [at(-100, -100), at(100, -100), at(100, 0)]
    const { rerender } = render(<GeoMap label="Map of Solar farm" robots={robots} route={route} />)
    const line = () => document.querySelectorAll("[data-route] polyline")[1]!
    expect(line().getAttribute("class")).toContain("stroke-muted-foreground")
    expect(document.querySelectorAll("[data-waypoint]")).toHaveLength(3)
    expect(document.querySelector('[data-waypoint="2"] text')!.textContent).toBe("3")
    rerender(<GeoMap label="Map of Solar farm" robots={robots} route={route} routeActive />)
    expect(line().getAttribute("class")).toContain("stroke-info")
    const trail = document.querySelectorAll('[data-trail="p1"] polyline')[1]!
    // The trail ends where the robot is now.
    expect(trail.getAttribute("points")!.split(" ")).toHaveLength(3)
    expect(trail.getAttribute("stroke-dasharray")).toBeNull()
  })

  it("draws the accuracy circle once it is larger than the marker, at its size in metres", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={at(-150, 60)} zoom={20} />)
    const circle = document.querySelector('[data-accuracy="p2"]')!
    expect(Number(circle.getAttribute("r"))).toBeCloseTo(3.2 / metresPerPixel(robots[1]!.lat, 20), 3)
    // ±2 cm hides under the marker; no fix draws none.
    expect(document.querySelector('[data-accuracy="p1"]')).toBeNull()
    expect(document.querySelector('[data-accuracy="p4"]')).toBeNull()
  })

  it("says when there are no robots, and shows loading and errors", () => {
    const retry = vi.fn()
    const { rerender } = render(<GeoMap label="Map of Solar farm" robots={[]} fences={fences} />)
    expect(screen.getByText("No robots on this map right now.")).toBeTruthy()
    rerender(<GeoMap label="Map of Solar farm" loading />)
    expect(screen.getByRole("group", { name: "Map of Solar farm" }).getAttribute("aria-busy")).toBe("true")
    expect(screen.getByRole("status").textContent).toBe("Loading the map")
    rerender(<GeoMap label="Map of Solar farm" error onRetry={retry} />)
    expect(screen.getByRole("alert").textContent).toBe("The map could not be loaded.")
    fireEvent.click(screen.getByRole("button", { name: "Load again" }))
    expect(retry).toHaveBeenCalled()
  })

  it("says robots' fix changes, gathered and at most once per announceEveryMs", () => {
    vi.useFakeTimers()
    const { rerender } = render(<GeoMap label="Map of Solar farm" robots={robots} announceEveryMs={3000} />)
    // The first fixes are where it starts, not news.
    act(() => void vi.advanceTimersByTime(5000))
    expect(said()).toBe("")
    const lose = robots.map((r) => (r.id === "p1" ? { ...r, fix: "none" as const } : r))
    rerender(<GeoMap label="Map of Solar farm" robots={lose} announceEveryMs={3000} />)
    act(() => void vi.advanceTimersByTime(0))
    expect(said()).toBe("Patrol-1: No fix")
    // Two more changes within the window: said together, once the window has passed.
    const back = lose.map((r) => (r.id === "p1" ? { ...r, fix: "rtk-float" as const } : r.id === "p4" ? { ...r, fix: "gps" as const } : r))
    rerender(<GeoMap label="Map of Solar farm" robots={back} announceEveryMs={3000} />)
    act(() => void vi.advanceTimersByTime(1000))
    expect(said()).toBe("Patrol-1: No fix")
    act(() => void vi.advanceTimersByTime(2000))
    expect(said()).toBe("Patrol-1: RTK float. Patrol-4: GPS fix")
  })
})

describe("goal mode", () => {
  // At zoom 18 around C the frame's anchor (320, 174) is C; a pixel is metresPerPixel(C.lat, 18) metres.
  const s = 256 * 2 ** 18
  const [cx, cy] = projectGeo(C)
  const screenOf = (p: GeoPoint) => {
    const [x, y] = projectGeo(p)
    return { clientX: 320 + (x - cx) * s, clientY: 174 + (y - cy) * s }
  }
  /** Where a place is on screen now, measured from Patrol-1's marker (at the centre), so it holds after the map glides. */
  const onMap = (p: GeoPoint) => {
    const [x, y] = projectGeo(p)
    const m = document.querySelector<HTMLElement>('[data-robot-id="p1"]')!
    return { clientX: parseFloat(m.style.left) + (x - cx) * s, clientY: parseFloat(m.style.top) + (y - cy) * s }
  }
  const geoAt = (clientX: number, clientY: number) => unprojectGeo(cx + (clientX - 320) / s, cy + (clientY - 174) / s)
  const press = (p: { clientX: number; clientY: number }) => fireEvent.pointerDown(region(), { pointerId: 1, button: 0, pointerType: "mouse", ...p })
  const release = (p: { clientX: number; clientY: number }) => fireEvent.pointerUp(region(), { pointerId: 1, button: 0, pointerType: "mouse", ...p })
  const card = () => document.querySelector("[data-slot=geo-map-confirm]")
  const key = (k: string, more: object = {}) => fireEvent.keyDown(region(), { key: k, ...more })

  it("a click places a goal and asks before sending it; Send sends it", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} fences={fences} center={C} zoom={18} mode="goal" onGoal={onGoal} />)
    expect(document.querySelector("[data-slot=geo-map-mode]")!.textContent).toContain("Click to place the goal")
    const p = screenOf(at(-50, -50))
    press(p)
    release(p)
    expect(onGoal).not.toHaveBeenCalled()
    expect(card()!.textContent).toContain("Send this goal?")
    expect(document.querySelector('[data-goal="draft"]')).not.toBeNull()
    const g = geoAt(p.clientX, p.clientY)
    expect(said()).toBe(`Goal at ${g.lat.toFixed(6)}° N, ${g.lon.toFixed(6)}° E. Enter sends it, Esc cancels.`)
    fireEvent.click(within(card() as HTMLElement).getByRole("button", { name: "Send goal" }))
    expect(onGoal).toHaveBeenCalledTimes(1)
    const goal = onGoal.mock.calls[0]![0]
    expect(goal.lat).toBeCloseTo(g.lat, 9)
    expect(goal.lon).toBeCloseTo(g.lon, 9)
    expect(goal.heading).toBeUndefined()
    expect(card()).toBeNull()
    expect(said()).toContain("Goal sent:")
  })

  it("a drag points the goal; Cancel drops it", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={18} mode="goal" onGoal={onGoal} />)
    const p = screenOf(at(0, -40))
    press(p)
    fireEvent.pointerMove(region(), { pointerId: 1, clientX: p.clientX, clientY: p.clientY - 40 })
    // While the press lasts there is no card yet.
    expect(card()).toBeNull()
    release({ clientX: p.clientX, clientY: p.clientY - 40 })
    expect(card()!.textContent).toContain("Heading 0° N")
    fireEvent.click(within(card() as HTMLElement).getByRole("button", { name: "Cancel" }))
    expect(onGoal).not.toHaveBeenCalled()
    expect(document.querySelector('[data-goal="draft"]')).toBeNull()
    expect(said()).toBe("Goal cancelled")
  })

  it("a goal in a keep-out or outside the work area cannot be sent, and says why beside Send", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} fences={fences} center={C} zoom={18} mode="goal" onGoal={onGoal} />)
    const send = () => within(card() as HTMLElement).getByRole("button", { name: "Send goal" }) as HTMLButtonElement
    const reason = () => document.querySelector("[data-slot=geo-map-confirm-warning]")?.textContent ?? null
    const p = onMap(at(150, 70))
    press(p)
    release(p)
    expect(reason()).toBe("Inside Substation, a keep-out area")
    expect(send().disabled).toBe(true)
    // The reason is the button's description, and it is said.
    expect(document.getElementById(send().getAttribute("aria-describedby")!)!.textContent).toBe("Inside Substation, a keep-out area")
    expect(said()).toContain("Inside Substation, a keep-out area")
    // Enter does not send it either.
    key("Enter")
    expect(onGoal).not.toHaveBeenCalled()
    expect(said()).toContain("cannot be sent")
    // Outside the work area: the area is named.
    const q = onMap(at(0, 200))
    press(q)
    release(q)
    expect(reason()).toBe("Outside Solar farm, the work area")
    expect(send().disabled).toBe(true)
    // Moved to an allowed place: Send works again.
    const r = onMap(at(-50, -50))
    press(r)
    release(r)
    expect(reason()).toBeNull()
    expect(send().disabled).toBe(false)
    expect(send().hasAttribute("aria-describedby")).toBe(false)
    key("Enter")
    expect(onGoal).toHaveBeenCalledTimes(1)
  })

  it("with confirmGoal={false} a click in a keep-out sends nothing and says why", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} fences={fences} center={C} zoom={18} mode="goal" onGoal={onGoal} confirmGoal={false} />)
    const p = onMap(at(150, 70))
    press(p)
    release(p)
    expect(onGoal).not.toHaveBeenCalled()
    expect(card()).toBeNull()
    expect(document.querySelector("[data-slot=geo-map-blocked]")!.textContent).toBe("Inside Substation, a keep-out area")
    expect(said()).toContain("Inside Substation, a keep-out area")
    // An allowed place sends at once, and the notice goes.
    const q = onMap(at(-50, -50))
    press(q)
    release(q)
    expect(onGoal).toHaveBeenCalledTimes(1)
    expect(document.querySelector("[data-slot=geo-map-blocked]")).toBeNull()
  })

  it("with confirmGoal={false} a release sends it, as robot-map does", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={18} mode="goal" onGoal={onGoal} confirmGoal={false} />)
    const p = screenOf(at(10, 10))
    press(p)
    fireEvent.pointerMove(region(), { pointerId: 1, clientX: p.clientX + 40, clientY: p.clientY })
    release({ clientX: p.clientX + 40, clientY: p.clientY })
    expect(onGoal).toHaveBeenCalledTimes(1)
    expect(onGoal.mock.calls[0]![0].heading).toBe(90)
  })

  it("by keyboard: a crosshair with coordinates, Enter places, arrows turn, Enter sends; Esc cancels", () => {
    const onGoal = vi.fn()
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={18} mode="goal" onGoal={onGoal} />)
    fireEvent.focus(region())
    expect(document.querySelector("[data-cursor]")).not.toBeNull()
    expect(document.querySelector("[data-slot=geo-map-cursor]")!.textContent).toBe(`${C.lat.toFixed(6)}° N, ${C.lon.toFixed(6)}° E`)
    // 8 px a press, 40 with Shift.
    key("ArrowRight")
    key("ArrowUp", { shiftKey: true })
    const where = geoAt(328, 134)
    key("Enter")
    expect(card()).not.toBeNull()
    key("ArrowRight", { shiftKey: true })
    key("ArrowRight", { shiftKey: true })
    key("ArrowLeft")
    key("Enter")
    expect(onGoal).toHaveBeenCalledTimes(1)
    const goal = onGoal.mock.calls[0]![0]
    expect(goal.lat).toBeCloseTo(where.lat, 9)
    expect(goal.lon).toBeCloseTo(where.lon, 9)
    expect(goal.heading).toBe(75)
    key(" ")
    key("Escape")
    expect(said()).toBe("Goal cancelled")
    expect(onGoal).toHaveBeenCalledTimes(1)
  })

  it("a second finger turns the press into a pinch and places nothing", () => {
    render(<GeoMap label="Map of Solar farm" robots={robots} center={C} zoom={18} mode="goal" />)
    fireEvent.pointerDown(region(), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 })
    fireEvent.pointerDown(region(), { pointerId: 2, pointerType: "touch", clientX: 200, clientY: 100 })
    expect(document.querySelector('[data-goal="draft"]')).toBeNull()
    fireEvent.pointerUp(region(), { pointerId: 2, pointerType: "touch", clientX: 200, clientY: 100 })
    fireEvent.pointerUp(region(), { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 })
    expect(card()).toBeNull()
  })
})

describe("GeoMapList", () => {
  it("writes each robot's state, fix, coordinates, fence and heading", () => {
    render(<GeoMapList label="Robots" robots={robots} fences={fences} />)
    const rows = screen.getAllByRole("button")
    expect(rows[0]!.textContent).toContain("RTK fixed · ±2 cm")
    expect(rows[0]!.textContent).toContain(`${robots[0]!.lat.toFixed(6)}° N, ${robots[0]!.lon.toFixed(6)}° E`)
    expect(rows[0]!.textContent).toContain("In Solar farm (work area)")
    expect(rows[0]!.textContent).toContain("Heading 90° E")
    expect(rows[1]!.textContent).toContain("GPS fix · ±3.2 m")
    // No fix: the warning shape and word.
    const lost = rows[2]!.querySelector("[data-slot=geo-map-fix]")!
    expect(lost.textContent).toBe("No fix")
    expect(lost.className).toContain("text-warning")
    expect(lost.querySelector("svg")).not.toBeNull()
    expect(rows[2]!.textContent).toContain("In Substation (keep out)")
  })

  it("says a robot is outside the work area, in a locale's numbers", () => {
    render(<GeoMapList label="Robots" robots={[{ id: "x", name: "X", ...at(400, 0), status: "normal" }]} fences={fences} locale="de" />)
    const row = screen.getByRole("button")
    expect(row.textContent).toContain("Outside the work area")
    expect(row.textContent).toMatch(/24,\d{6}° N/)
  })

  it("has empty, loading and error states", () => {
    const { rerender } = render(<GeoMapList label="Robots" robots={[]} />)
    expect(screen.getByText("No robots on this map right now.")).toBeTruthy()
    rerender(<GeoMapList label="Robots" loading />)
    expect(screen.getByRole("status").textContent).toBe("Loading the map")
    rerender(<GeoMapList label="Robots" error="Positions could not be loaded." />)
    expect(screen.getByRole("alert").textContent).toBe("Positions could not be loaded.")
  })
})
