import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { waypointEditorLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import type { RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"
import { legLength, routeDistance, routeDuration, validateWaypoints, WaypointEditor, type Waypoint, type WaypointEditorMap } from "@/registry/syncrobotic/ui/waypoint-editor"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  act(() => toast.clear())
  cleanup()
  vi.useRealTimers()
})

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
    id: "bay",
    kind: "slow",
    label: "Loading bay",
    points: [
      [10, 28],
      [60, 28],
      [60, 36],
      [10, 36],
    ],
  },
]
const map: WaypointEditorMap = { label: "North site", width: 60, height: 36, zones }
const wp = (id: string, name: string, x: number, y: number, more: Partial<Waypoint> = {}): Waypoint => ({ id, name, at: { kind: "plan", x, y }, action: { type: "none" }, ...more })
const route: Waypoint[] = [wp("a", "Dock exit", 8, 9), wp("b", "Aisle 1", 11, 4, { action: { type: "wait", seconds: 10 } }), wp("c", "Bay door", 41, 25, { dwell: 20 })]

const rows = () => [...document.querySelectorAll<HTMLElement>("[data-slot=waypoint-row]")]
const row = (name: string) => rows().find((r) => r.textContent?.includes(name))!
const saveButton = () => screen.getByRole("button", { name: "Save route" })
const status = () => document.querySelector("[data-slot=waypoint-editor-status]")!.textContent
const announced = () => document.querySelector("[data-slot=waypoint-editor-announce]")!.textContent
const handle = (i: number) => document.querySelector<HTMLElement>(`[data-waypoint="${i}"]`)!

/** The app's side: it keeps the saved route. */
function App(props: Partial<React.ComponentProps<typeof WaypointEditor>>) {
  const [value, setValue] = React.useState(route)
  return (
    <>
      <WaypointEditor value={value} onSave={setValue} map={map} speed={1} {...props} />
      <Toaster />
    </>
  )
}

describe("measuring and checking", () => {
  it("measures plan legs straight and geo legs on the globe; a mixed leg is not measured", () => {
    expect(legLength({ kind: "plan", x: 0, y: 0 }, { kind: "plan", x: 3, y: 4 })).toBe(5)
    // One degree of latitude is about 111.2 km.
    expect(legLength({ kind: "geo", lat: 0, lon: 0 }, { kind: "geo", lat: 1, lon: 0 })).toBeCloseTo(111195, -1)
    expect(legLength({ kind: "plan", x: 0, y: 0 }, { kind: "geo", lat: 0, lon: 0 })).toBeNaN()
    expect(routeDistance([wp("a", "A", 0, 0), wp("b", "B", 3, 4), wp("c", "C", 3, 10)])).toBe(11)
  })

  it("estimates time from the speed, the waits and the dwells", () => {
    // 5 m at 0.5 m/s, a 10 s wait and a 20 s dwell.
    expect(routeDuration([wp("a", "A", 0, 0, { action: { type: "wait", seconds: 10 } }), wp("b", "B", 3, 4, { dwell: 20 })], 0.5)).toBe(40)
  })

  it("finds missing names, keep-out zones, the map's edges and waypoints too close to the one before", () => {
    const problems = validateWaypoints(
      [
        wp("a", "", 8, 9),
        wp("b", "Cold", 50, 5),
        wp("c", "Off", 70, 5),
        wp("d", "Near", 70.2, 5),
        wp("e", "Bay", 20, 30),
        wp("f", "Act", 5, 5, { action: { type: "custom", name: " " } }),
        { ...wp("g", "NaN", 0, 0), at: { kind: "plan", x: NaN, y: 0 } },
      ],
      { width: 60, height: 36, zones, minSpacing: 0.5 },
    )
    expect(problems.map((p) => [p.id, p.kind])).toEqual([
      ["a", "noName"],
      ["b", "keepOut"],
      ["c", "outside"],
      ["d", "outside"],
      ["d", "tooClose"],
      ["f", "noActionName"],
      ["g", "invalid"],
    ])
    // A slow zone is not keep-out; the zone is named.
    expect(problems.find((p) => p.kind === "keepOut")!.zone).toBe("Cold store")
    expect(problems.find((p) => p.kind === "tooClose")!.distance).toBeCloseTo(0.2, 5)
  })
})

describe("WaypointEditor", () => {
  it("lists the route with each waypoint's place and action, and sums it up", () => {
    render(<App />)
    expect(rows()).toHaveLength(3)
    expect(row("Aisle 1").textContent).toContain("11.0, 4.0 m")
    expect(row("Aisle 1").textContent).toContain("Wait 10 s")
    expect(row("Bay door").textContent).toContain("stay 20 s")
    const summary = document.querySelector("[data-slot=waypoint-editor-summary]")!
    // 5.83 + 36.62 m, at 1 m/s plus 10 s and 20 s.
    expect(summary.textContent).toContain("42.5 m")
    expect(summary.textContent).toContain("about 1 min 12 s")
    expect(status()).toBe("No unsaved changes")
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true)
  })

  it("a row and its point select each other", () => {
    render(<App />)
    fireEvent.click(row("Aisle 1"))
    expect(row("Aisle 1").getAttribute("aria-expanded")).toBe("true")
    expect(handle(1).getAttribute("data-state")).toBe("selected")
    // A press on point 3 on the map selects its row.
    fireEvent.pointerDown(handle(2), { pointerId: 1, button: 0, pointerType: "mouse", clientX: 10, clientY: 10 })
    fireEvent.pointerUp(handle(2), { pointerId: 1, button: 0, pointerType: "mouse", clientX: 10, clientY: 10 })
    expect(row("Bay door").getAttribute("aria-expanded")).toBe("true")
    expect(row("Aisle 1").getAttribute("aria-expanded")).toBe("false")
    expect(handle(2).getAttribute("data-state")).toBe("selected")
  })

  it("edits a waypoint's fields, and the draft has unsaved changes until Save", () => {
    const onSave = vi.fn()
    const onDirtyChange = vi.fn()
    render(<App onSave={onSave} onDirtyChange={onDirtyChange} />)
    fireEvent.click(row("Aisle 1"))
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Aisle 1 north" } })
    expect(status()).toBe("Unsaved changes")
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(saveButton())
    expect(onSave).toHaveBeenCalledWith([route[0], { ...route[1], name: "Aisle 1 north" }, route[2]])
    expect(status()).toBe("No unsaved changes")
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
    act(() => vi.advanceTimersByTime(1000))
    expect(announced()).toBe("Route saved")
  })

  it("disables Save with the reason beside it while a waypoint has a problem, and marks its point", () => {
    render(<App />)
    fireEvent.click(row("Aisle 1"))
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "" } })
    expect(status()).toBe("Unsaved changes · Fix 1 problem to save")
    expect((saveButton() as HTMLButtonElement).disabled).toBe(true)
    expect(saveButton().getAttribute("aria-describedby")).toBe(document.querySelector("[data-slot=waypoint-editor-status]")!.id)
    expect(rows()[1]!.querySelector("[data-slot=waypoint-problems]")!.textContent).toBe("Name missing")
    expect(handle(1).hasAttribute("data-problem")).toBe(true)
    // The count is said once typing has rested.
    act(() => vi.advanceTimersByTime(1600))
    expect(announced()).toBe("1 problem")
  })

  it("adds on the map at the end of the route, selected, and with the button after the selected one", () => {
    render(<App />)
    const region = screen.getByRole("application", { name: "North site" })
    fireEvent.focus(region)
    // The crosshair starts at the plan's middle, (30, 18).
    fireEvent.keyDown(region, { key: "Enter" })
    expect(rows()).toHaveLength(4)
    expect(rows()[3]!.textContent).toContain("Waypoint 4")
    expect(rows()[3]!.textContent).toContain("30.0, 18.0 m")
    expect(rows()[3]!.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(row("Dock exit"))
    fireEvent.click(screen.getByRole("button", { name: "Add waypoint" }))
    // Between waypoints 1 and 2, halfway, its name field focused.
    expect(rows()[1]!.textContent).toContain("Waypoint 2")
    expect(rows()[1]!.textContent).toContain("9.5, 6.5 m")
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Name" }))
  })

  it("moves a waypoint dragged on the map", () => {
    render(<App />)
    // 640 × 384 px unmeasured: 8⅓ px a metre around (320, 166) for the plan's middle.
    const k = 300 / 36
    const at = (x: number, y: number) => ({ clientX: 320 + (x - 30) * k, clientY: 166 + (y - 18) * k })
    fireEvent.pointerDown(handle(0), { pointerId: 1, button: 0, pointerType: "mouse", ...at(8, 9) })
    fireEvent.pointerMove(handle(0), { pointerId: 1, pointerType: "mouse", ...at(20, 12) })
    fireEvent.pointerUp(handle(0), { pointerId: 1, button: 0, pointerType: "mouse", ...at(20, 12) })
    expect(rows()[0]!.textContent).toContain("20.0, 12.0 m")
    expect(rows()[0]!.getAttribute("aria-expanded")).toBe("true")
  })

  it("deletes with Delete on a row, focus moves to the next, and Undo puts it back in its place", () => {
    render(<App />)
    row("Aisle 1").focus()
    fireEvent.keyDown(row("Aisle 1"), { key: "Delete" })
    expect(rows().map((r) => r.textContent?.includes("Aisle 1"))).toEqual([false, false])
    expect(document.activeElement).toBe(row("Bay door"))
    const t = screen.getByText("Aisle 1 deleted").closest("li")!
    fireEvent.click(within(t).getByRole("button", { name: "Undo" }))
    expect(rows()[1]!.textContent).toContain("Aisle 1")
    expect(status()).toBe("No unsaved changes")
  })

  it("deletes the selected waypoint from the map with Delete, with the same Undo", () => {
    render(<App defaultSelected="c" />)
    const region = screen.getByRole("application", { name: "North site" })
    fireEvent.focus(region)
    fireEvent.keyDown(region, { key: "Delete" })
    expect(rows()).toHaveLength(2)
    expect(screen.getByText("Bay door deleted")).toBeTruthy()
  })

  it("duplicates beside the original, not on it", () => {
    render(<App defaultSelected="b" />)
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }))
    expect(rows()).toHaveLength(4)
    expect(rows()[2]!.textContent).toContain("Aisle 1 copy")
    expect(rows()[2]!.textContent).toContain("12.0, 4.0 m")
    expect(document.activeElement).toBe(rows()[2])
    act(() => vi.advanceTimersByTime(1000))
    expect(announced()).toBe("Aisle 1 copy added as waypoint 3")
  })

  it("gives every row a handle named after its waypoint, and the row its keys", () => {
    render(<App />)
    expect(screen.getAllByRole("button", { name: /^Move / }).map((b) => b.getAttribute("aria-label"))).toEqual(["Move Dock exit", "Move Aisle 1", "Move Bay door"])
    expect(document.getElementById(row("Dock exit").getAttribute("aria-describedby")!)!.textContent).toBe("Enter opens its details, Delete removes it.")
  })

  it("Cancel goes back to the saved route, with Undo", () => {
    const onCancel = vi.fn()
    render(<App onCancel={onCancel} defaultDraft={[route[1]!, route[0]!, route[2]!]} />)
    expect(status()).toBe("Unsaved changes")
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(rows()[0]!.textContent).toContain("Dock exit")
    expect(onCancel).toHaveBeenCalled()
    fireEvent.click(within(screen.getByText("Changes discarded").closest("li")!).getByRole("button", { name: "Undo" }))
    expect(rows()[0]!.textContent).toContain("Aisle 1")
  })

  it("keeps Save busy while a promise runs, and keeps the draft when it fails", async () => {
    let reject: (e: Error) => void = () => {}
    const onSave = vi.fn(() => new Promise((_, r) => (reject = r)))
    render(<App onSave={onSave} defaultDraft={route.slice(0, 2)} />)
    fireEvent.click(saveButton())
    expect(saveButton().getAttribute("aria-busy")).toBe("true")
    await act(async () => reject(new Error("offline")))
    expect(status()).toBe("The route could not be saved. Try again.")
    expect(rows()).toHaveLength(2)
  })

  it("a new value replaces a clean draft and leaves unsaved changes alone", () => {
    const { rerender } = render(<WaypointEditor value={route} map={map} />)
    rerender(<WaypointEditor value={route.slice(0, 2)} map={map} />)
    expect(rows()).toHaveLength(2)
    fireEvent.click(rows()[0]!)
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Changed" } })
    rerender(<WaypointEditor value={route} map={map} />)
    expect(rows()).toHaveLength(2)
    expect(status()).toBe("Unsaved changes")
  })

  it("read-only: no handles, Add, Save or fields; a row still opens its details and selects its point", () => {
    render(<App readOnly />)
    expect(screen.queryByRole("button", { name: /^Move / })).toBeNull()
    expect(screen.queryByRole("button", { name: "Add waypoint" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Save route" })).toBeNull()
    expect(screen.getByText("View only: you cannot change this route.")).toBeTruthy()
    fireEvent.click(row("Bay door"))
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(screen.getByRole("group", { name: "Bay door" }).textContent).toContain("41.0, 25.0 m")
    expect(handle(2).getAttribute("data-state")).toBe("selected")
    expect(screen.getByRole("application", { name: "North site" }).getAttribute("data-mode")).toBe("view")
  })

  it("an empty route says how to start, and cannot be saved", () => {
    render(<App defaultDraft={[]} />)
    expect(document.querySelector("[data-slot=waypoint-editor-empty]")!.textContent).toContain("Click the map or Add waypoint")
    expect(status()).toBe("Unsaved changes · Add a waypoint to save")
  })

  it("lists geo waypoints with latitude and longitude, and measures them on the globe", () => {
    render(
      <WaypointEditor
        value={[
          { id: "g1", name: "Gate", at: { kind: "geo", lat: 25, lon: 121 }, action: { type: "none" } },
          { id: "g2", name: "Fence", at: { kind: "geo", lat: 25.001, lon: 121 }, action: { type: "none" } },
        ]}
      />,
    )
    expect(row("Gate").textContent).toContain("25.000000, 121.000000")
    expect(document.querySelector("[data-slot=waypoint-editor-summary]")!.textContent).toContain("111.2 m")
    fireEvent.click(row("Gate"))
    expect(screen.getByRole("spinbutton", { name: "Latitude" })).toBeTruthy()
  })

  it("takes the zh-TW pack", () => {
    render(<App labels={waypointEditorLabels} locale="zh-TW" />)
    expect(screen.getByRole("button", { name: "新增航點" })).toBeTruthy()
    expect(status()).toBe("沒有未儲存的變更")
  })
})
