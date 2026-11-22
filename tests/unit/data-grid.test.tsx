import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import {
  createExpandedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  tableFeatures,
  useTable,
  type TableOptions,
} from "@tanstack/react-table"
import { afterEach, describe, expect, it } from "vitest"
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridPagination,
  DataGridSelectionSummary,
  DataGridTable,
  dataGridFeatures,
  expandColumn,
  selectColumn,
  type DataGridColumnDef,
} from "@/registry/syncrobotic/ui/data-grid"

// These pin what DataGrid does with the table a product builds, so a TanStack Table upgrade that changes the table's API
// shows up here as a broken interaction rather than in a product.

type Robot = { id: string; name: string; km: number }
const robots: Robot[] = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `Robot ${String.fromCharCode(76 - i)}`, km: 100 + i * 10 }))
const six = robots.slice(0, 6)

// The table a product builds: the grid's features plus the row models it wants, at module scope so they stay stable.
const features = tableFeatures({
  ...dataGridFeatures,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
})
type Features = typeof features
type Col = DataGridColumnDef<Robot, Features>

const columns: Col[] = [
  { accessorKey: "name", header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />, size: 200, meta: { label: "Robot" } },
  { accessorKey: "km", header: ({ column }) => <DataGridColumnHeader column={column} title="Odometer" />, size: 120, meta: { align: "right", label: "Odometer" } },
]
const selectable = [selectColumn<Robot, Features>(), ...columns]
const expandable = [expandColumn<Robot, Features>(), ...columns]
const withTotals: Col[] = [
  { ...columns[0], footer: () => "Total" },
  { ...columns[1], footer: () => `${six.reduce((s, r) => s + r.km, 0)} km` },
]

function Grid({
  data = robots,
  cols = columns,
  options = {},
  children,
  loading,
}: {
  data?: Robot[]
  cols?: Col[]
  options?: Partial<TableOptions<Features, Robot>>
  children?: React.ReactNode
  loading?: boolean
}) {
  const table = useTable({
    features,
    data,
    columns: cols,
    getRowId: (r) => r.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    ...options,
  })
  return (
    <DataGrid table={table} loading={loading}>
      {children}
      <DataGridTable aria-label="Robots" />
      <DataGridPagination />
    </DataGrid>
  )
}

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })
const headers = () => [...document.querySelectorAll("thead th")] as HTMLElement[]
const bodyRows = () => within(screen.getByRole("region", { name: "Robots" })).getAllByRole("row").slice(1)
const names = () => bodyRows().map((r) => r.querySelector("td")?.textContent)
const openMenu = async (name: string) => {
  fireEvent.pointerDown(screen.getByRole("button", { name }), { button: 0, pointerType: "mouse" })
  await flush()
}

afterEach(() => {
  cleanup()
  fireEvent.pointerDown(document.body)
})

describe("DataGrid", () => {
  it("draws the current page of rows and pages through the rest", async () => {
    render(<Grid />)
    expect(names()).toEqual(["Robot L", "Robot K", "Robot J", "Robot I", "Robot H"])
    fireEvent.click(screen.getByRole("button", { name: /next/i }))
    await flush()
    expect(names()).toEqual(["Robot G", "Robot F", "Robot E", "Robot D", "Robot C"])
  })

  it("sorts from the column menu and says so with aria-sort", async () => {
    render(<Grid />)
    const header = screen.getAllByRole("columnheader")[0]
    expect(header.getAttribute("aria-sort")).toBe("none")
    await openMenu("Robot")
    fireEvent.click(screen.getByRole("menuitem", { name: "Ascending" }))
    await flush()
    expect(header.getAttribute("aria-sort")).toBe("ascending")
    expect(names()[0]).toBe("Robot A")
    expect(header.querySelector("[data-slot=sort-icon]")?.getAttribute("data-sort")).toBe("asc")
  })

  it("hides a column from its header menu and shows it again from the columns menu", async () => {
    render(
      <Grid>
        <DataGridColumnVisibility />
      </Grid>,
    )
    await openMenu("Odometer")
    fireEvent.click(screen.getByRole("menuitem", { name: "Hide column" }))
    await flush()
    // An open Radix menu hides the rest of the page from the accessibility tree, so the headers are found by tag.
    expect(headers()).toHaveLength(1)
    fireEvent.pointerDown(document.body)
    await openMenu("Columns")
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Odometer" }))
    await flush()
    expect(headers()).toHaveLength(2)
  })

  it("selects rows, marks the page box as mixed, and counts the selection", async () => {
    render(
      <Grid cols={selectable}>
        <DataGridSelectionSummary />
      </Grid>,
    )
    const all = screen.getByRole("checkbox", { name: "Select all on this page" })
    expect(all.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0])
    await flush()
    expect(all.getAttribute("aria-checked")).toBe("mixed")
    expect(bodyRows()[0].getAttribute("data-state")).toBe("selected")
    expect(screen.getByRole("status").textContent).toContain("1 of 12 selected")
    fireEvent.click(all)
    await flush()
    expect(all.getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("status").textContent).toContain("5 of 12 selected")
  })

  it("keeps a row that cannot be selected disabled", () => {
    render(<Grid cols={selectable} options={{ enableRowSelection: (r) => r.original.id !== "r1" }} />)
    const boxes = screen.getAllByRole("checkbox", { name: /^Select row/ })
    expect(boxes[0].hasAttribute("disabled")).toBe(false)
    expect(boxes[1].hasAttribute("disabled")).toBe(true)
  })

  it("opens a row's detail under it and closes it again", async () => {
    render(
      <Grid
        data={six}
        cols={expandable}
        options={{
          getRowCanExpand: () => true,
          meta: { renderSubRow: (row: { original: Robot }) => <p>Detail of {row.original.name}</p> },
        }}
      />,
    )
    const show = screen.getAllByRole("button", { name: "Show details" })[0]
    expect(show.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(show)
    await flush()
    expect(screen.getByText("Detail of Robot L")).toBeTruthy()
    const hide = screen.getByRole("button", { name: "Hide details" })
    expect(hide.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(hide)
    // The detail leaves with an animation; its end unmounts it.
    fireEvent.animationEnd(screen.getByText("Detail of Robot L").parentElement!)
    await flush()
    expect(screen.queryByText("Detail of Robot L")).toBeNull()
  })

  it("pins a column to the start edge from its menu, and unpins it", async () => {
    // Pinning is a class that holds where the grid is 448 px wide or more (@md): on a phone every column scrolls.
    const sticky = (el: Element) => el.className.split(" ").includes("@md:sticky")
    render(<Grid options={{ initialState: { pagination: { pageIndex: 0, pageSize: 5 }, columnPinning: { start: ["name"], end: [] } } }} />)
    const header = screen.getAllByRole("columnheader")[0]
    expect(sticky(header)).toBe(true)
    expect(sticky(bodyRows()[0].querySelector("td")!)).toBe(true)
    expect(header.style.getPropertyValue("--pin")).toBe("0px")
    await openMenu("Robot")
    fireEvent.click(screen.getByRole("menuitem", { name: "Unpin" }))
    await flush()
    expect(sticky(header)).toBe(false)
    fireEvent.pointerDown(document.body)
    await openMenu("Odometer")
    fireEvent.click(screen.getByRole("menuitem", { name: "Pin to the left" }))
    await flush()
    expect(headers()[0].textContent).toContain("Odometer")
    expect(sticky(headers()[0])).toBe(true)
  })

  it("sizes columns from their definitions and gives each a named resize handle", () => {
    render(<Grid options={{ enableColumnResizing: true, columnResizeMode: "onChange" }} />)
    const [name, km] = screen.getAllByRole("columnheader")
    expect(name.style.width).toBe("200px")
    expect(km.style.width).toBe("120px")
    // Named after the column in words (meta.label), not the header's render function.
    expect(screen.getAllByRole("separator").map((s) => s.getAttribute("aria-label"))).toEqual(["Resize Robot", "Resize Odometer"])
  })

  it("resizes a column by dragging its handle, and double-click resets it", async () => {
    render(<Grid options={{ enableColumnResizing: true, columnResizeMode: "onChange" }} />)
    const handle = screen.getAllByRole("separator")[0]
    fireEvent.mouseDown(handle, { clientX: 200 })
    fireEvent.mouseMove(document, { clientX: 260 })
    fireEvent.mouseUp(document, { clientX: 260 })
    await flush()
    expect(headers()[0].style.width).toBe("260px")
    fireEvent.doubleClick(screen.getAllByRole("separator")[0])
    await flush()
    expect(headers()[0].style.width).toBe("200px")
  })

  it("writes the totals in a footer", () => {
    render(<Grid data={six} cols={withTotals} />)
    // Two footer rows: the one under the columns, and the one-line summary shown instead when the grid scrolls sideways.
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0)
    expect(screen.getAllByText("750 km").length).toBeGreaterThan(0)
  })

  it("shows as many skeleton rows as the page holds while loading, up to eight", () => {
    render(<Grid data={[]} loading />)
    const region = screen.getByRole("region", { name: "Robots" })
    expect(region.getAttribute("aria-busy")).toBe("true")
    expect(region.querySelectorAll("tbody tr[aria-hidden=true]")).toHaveLength(5)
  })

  it("says there are no rows", () => {
    render(<Grid data={[]} />)
    expect(screen.getByText("No rows")).toBeTruthy()
  })
})
