import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"

// One column list, two layouts (#383): a table where there is room, a grouped list under 36rem of its own width, and only
// one of them in the page once it has been measured.
type Robot = { id: string; name: string; state: string; site: string; battery: number; missions: number }
const robots: Robot[] = [
  { id: "a", name: "Patrol dog 7F3A", state: "Patrolling", site: "North gate", battery: 82, missions: 1284 },
  { id: "b", name: "Courier 2B19", state: "Low battery", site: "Hall B", battery: 12, missions: 135287 },
]
const columns: ResponsiveTableColumn<Robot>[] = [
  { id: "name", header: "Robot", cell: (r) => r.name },
  { id: "state", header: "Status", cell: (r) => r.state, phone: "trailing" },
  { id: "site", header: "Site", cell: (r) => r.site },
  { id: "battery", header: "Battery", cell: (r) => <meter value={r.battery} max={100} />, phoneCell: (r) => `${r.battery} %` },
  { id: "missions", header: "Missions", cell: (r) => r.missions.toLocaleString("en"), align: "end", phone: "hidden" },
]

let width = 0
let observers: (() => void)[] = []
beforeEach(() => {
  width = 0
  observers = []
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, toJSON: () => ({}) }))
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: () => void) {
        observers.push(() => this.cb())
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const frame = () => document.querySelector<HTMLElement>("[data-slot=responsive-table]")!

describe("ResponsiveTable", () => {
  it("is a table with every column where it has 36rem of its own width", () => {
    width = 800
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    const table = screen.getByRole("table", { name: "Robots" })
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Robot", "Status", "Site", "Battery", "Missions"])
    expect(within(table).getByText("135,287").className).toContain("text-right")
    expect(screen.queryByRole("list")).toBeNull()
    expect(frame().dataset.layout).toBe("table")
  })

  it("wraps a phone row's title to two lines instead of cutting it, the whole title in the row's accessible name", () => {
    width = 360
    const long = "Two robots lost signal in Zone B while crossing the loading bay"
    const rows = [{ ...robots[0], name: long }]
    const onRowClick = vi.fn()
    render(<ResponsiveTable label="Robots" rows={rows} columns={columns} rowKey={(r) => r.id} onRowClick={onRowClick} />)
    const title = document.querySelector<HTMLElement>("[data-slot=list-row-title]")!
    expect(title.textContent).toBe(long)
    expect(title.className).toContain("line-clamp-2")
    expect(title.className).not.toContain("truncate")
    expect(screen.getByRole("button", { name: new RegExp(long) })).toBeTruthy()
    // The title keeps at least 160 px: the row wraps, and the trailing state moves under it before it squeezes the title.
    const row = title.closest("button")!
    expect(row.className).toContain("flex-wrap")
    expect(title.parentElement!.parentElement!.className).toContain("basis-40")
    expect(within(row).getByText("Patrolling").parentElement!.className).toContain("ml-auto")
  })

  it("is a grouped list under 36rem: title, the line under it and the trailing state, hidden columns left out", () => {
    width = 360
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    expect(screen.queryByRole("table")).toBeNull()
    const list = screen.getByRole("list", { name: "Robots" })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0]!.textContent).toBe("Patrol dog 7F3ANorth gate · 82 %Patrolling")
    expect(within(list).queryByText("1,284")).toBeNull()
    expect(frame().dataset.layout).toBe("list")
  })

  it("switches when its own width crosses 36rem, keeping one layout in the page", () => {
    width = 800
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    expect(screen.getByRole("table")).toBeTruthy()
    width = 500
    act(() => observers.forEach((o) => o()))
    expect(screen.queryByRole("table")).toBeNull()
    expect(screen.getAllByText("Patrol dog 7F3A")).toHaveLength(1)
    width = 576
    act(() => observers.forEach((o) => o()))
    expect(screen.getByRole("table")).toBeTruthy()
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("before it has a width (the server's HTML), leaves the choice to a container query", () => {
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    expect(frame().className).toContain("@container")
    expect(frame().dataset.layout).toBeUndefined()
    expect(screen.getByRole("table", { hidden: true }).closest(".hidden")?.className).toContain("@xl:block")
    expect(screen.getByRole("list", { hidden: true }).parentElement!.className).toBe("@xl:hidden")
  })

  it("takes a fixed layout without measuring", () => {
    width = 800
    const { rerender } = render(<ResponsiveTable layout="list" label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    expect(screen.getByRole("list")).toBeTruthy()
    width = 300
    rerender(<ResponsiveTable layout="table" label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} />)
    expect(screen.getByRole("table")).toBeTruthy()
  })

  it("opens a row from the title cell's button in the table and from the whole row on a phone", () => {
    const open = vi.fn()
    width = 800
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} onRowClick={open} />)
    fireEvent.click(screen.getByRole("button", { name: "Courier 2B19" }))
    expect(open).toHaveBeenLastCalledWith(robots[1])
    width = 360
    act(() => observers.forEach((o) => o()))
    const row = within(screen.getByRole("list")).getAllByRole("button")[0]!
    expect(row.textContent).toContain("North gate · 82 %")
    fireEvent.click(row)
    expect(open).toHaveBeenLastCalledWith(robots[0])
  })

  it("puts row actions in the table's last cell, under a hidden header, and beside the phone row's button", () => {
    width = 800
    const actions = (r: Robot) => <button type="button">More actions for {r.name}</button>
    render(<ResponsiveTable label="Robots" rows={robots} columns={columns} rowKey={(r) => r.id} rowActions={actions} onRowClick={() => {}} labels={{ actions: "動作" }} />)
    const headers = screen.getAllByRole("columnheader")
    expect(headers.at(-1)!.textContent).toBe("動作")
    expect(screen.getByRole("button", { name: "More actions for Courier 2B19" }).closest("td")!.dataset.slot).toBe("table-actions-cell")
    width = 360
    act(() => observers.forEach((o) => o()))
    const item = screen.getAllByRole("listitem")[1]!
    const menu = within(item).getByRole("button", { name: "More actions for Courier 2B19" })
    const row = within(item).getByRole("button", { name: /Courier 2B19 Hall B/ })
    expect(row.contains(menu)).toBe(false)
  })

  it("shows the empty state in one spanning cell, or alone on a phone", () => {
    width = 800
    const empty = <p>No robots match</p>
    render(<ResponsiveTable label="Robots" rows={[]} columns={columns} rowKey={(r: Robot) => r.id} rowActions={() => null} empty={empty} />)
    expect(screen.getByText("No robots match").closest("td")!.colSpan).toBe(6)
    width = 360
    act(() => observers.forEach((o) => o()))
    expect(screen.getByText("No robots match")).toBeTruthy()
    expect(screen.queryByRole("list")).toBeNull()
    expect(screen.queryByRole("table")).toBeNull()
  })
})
