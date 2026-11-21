import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { createExpandedRowModel, createSortedRowModel, Subscribe, tableFeatures, useTable, type Row } from "@tanstack/react-table"
import { afterEach, describe, expect, it } from "vitest"
import * as compiled from "@/registry/syncrobotic/ui/data-grid?react-compiler"
import * as undirected from "@/registry/syncrobotic/ui/data-grid?react-compiler&without-directive"

// Products build with the React Compiler (reactCompiler: true), and TanStack Table 9 hands the grid the same row, column
// and header objects on every render, read through methods. A compiled component caches those calls against the object
// and stops following the state. vitest.config.ts compiles this file (a product's own components: the page that calls
// useTable and its custom cells) and data-grid.tsx imported with ?react-compiler, so these tests run the grid as a
// product ships it. The grid is imported twice: as written, with "use no memo", and with that directive removed, which
// shows the tests would catch the grid going stale.

type Kit = typeof compiled
type Robot = { id: string; name: string; km: number }
const robots: Robot[] = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, name: `Robot ${String.fromCharCode(76 - i)}`, km: 100 + i * 10 }))

// The table a product builds, at module scope so it keeps its identity. Every row shows: there is no paginated row model.
const features = tableFeatures({ ...compiled.dataGridFeatures, sortedRowModel: createSortedRowModel(), expandedRowModel: createExpandedRowModel() })
type Features = typeof features
type Col = compiled.DataGridColumnDef<Robot, Features>

// A product's cells take their words from its translations, here a context, as most products' cells would.
const Words = React.createContext({ picked: "Picked", notPicked: "Not picked" })

// A product's own cell that reads the selection through a builder call. Compiled, it caches row.getIsSelected() against
// the row, which never changes, so it keeps its first answer. Whether the compiler caches such a call depends on the
// component's shape (without the hook above it, this one happens to call it on every render), so the guide does not
// rely on it either way.
function SelectedByCall({ row }: { row: Row<Features, Robot> }) {
  const words = React.useContext(Words)
  return <span data-testid="by-call">{row.getIsSelected() ? words.picked : words.notPicked}</span>
}

// The same cell as the migration guide writes it: subscribed to the selection atom, so it renders again when it changes.
function SelectedBySubscribe({ row }: { row: Row<Features, Robot> }) {
  const words = React.useContext(Words)
  return (
    <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => selection[row.id] === true}>
      {(picked) => <span data-testid="by-subscribe">{picked ? words.picked : words.notPicked}</span>}
    </Subscribe>
  )
}

const columnsFor = (kit: Kit): Col[] => [
  kit.selectColumn<Robot, Features>(),
  kit.expandColumn<Robot, Features>(),
  { accessorKey: "name", header: ({ column }) => <kit.DataGridColumnHeader column={column} title="Robot" />, size: 200, meta: { label: "Robot" } },
  { accessorKey: "km", header: ({ column }) => <kit.DataGridColumnHeader column={column} title="Odometer" />, size: 120, meta: { align: "right", label: "Odometer" } },
  { id: "byCall", header: "By call", cell: ({ row }) => <SelectedByCall row={row} />, enableSorting: false, size: 120 },
  { id: "bySubscribe", header: "By subscribe", cell: ({ row }) => <SelectedBySubscribe row={row} />, enableSorting: false, size: 120 },
]
const kits = { compiled: { kit: compiled, columns: columnsFor(compiled) }, undirected: { kit: undirected, columns: columnsFor(undirected) } }
const renderSubRow = (row: { original: Robot }) => <p>Detail of {row.original.name}</p>

// The page a product writes: useTable with its default selector, so it hands back a new table on every state change.
function Fleet({ which }: { which: keyof typeof kits }) {
  const { kit, columns } = kits[which]
  const table = useTable({
    features,
    data: robots,
    columns,
    getRowId: (r) => r.id,
    getRowCanExpand: () => true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    meta: { renderSubRow },
  })
  return (
    <kit.DataGrid table={table}>
      <kit.DataGridSelectionSummary />
      <kit.DataGridTable aria-label="Robots" />
    </kit.DataGrid>
  )
}

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })
const bodyRows = () => within(screen.getByRole("region", { name: "Robots" })).getAllByRole("row").slice(1)
const names = () => bodyRows().map((r) => r.querySelectorAll("td")[2]?.textContent)
const robotHeader = () => document.querySelectorAll("thead th")[2] as HTMLElement
const sortIcon = () => robotHeader().querySelector("[data-slot=sort-icon]")!.getAttribute("data-sort")
const sortAscending = async () => {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Robot" }), { button: 0, pointerType: "mouse" })
  await flush()
  fireEvent.click(screen.getByRole("menuitem", { name: "Ascending" }))
  await flush()
}

afterEach(() => {
  cleanup()
  fireEvent.pointerDown(document.body)
})

describe("DataGrid compiled with the React Compiler", () => {
  it("sorts: the header's arrow, aria-sort and the row order all follow", async () => {
    render(<Fleet which="compiled" />)
    expect(sortIcon()).toBe("none")
    await sortAscending()
    expect(robotHeader().getAttribute("aria-sort")).toBe("ascending")
    expect(sortIcon()).toBe("asc")
    expect(names()[0]).toBe("Robot G")
  })

  it("selects: the row's box, the page box, the row and the count all follow", async () => {
    render(<Fleet which="compiled" />)
    const box = screen.getAllByRole("checkbox", { name: "Select row" })[0]
    fireEvent.click(box)
    await flush()
    expect(box.getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("checkbox", { name: "Select all on this page" }).getAttribute("aria-checked")).toBe("mixed")
    expect(bodyRows()[0].getAttribute("data-state")).toBe("selected")
    expect(screen.getByRole("status").textContent).toContain("1 of 6 selected")
    fireEvent.click(box)
    await flush()
    expect(box.getAttribute("aria-checked")).toBe("false")
  })

  it("expands: the button and the detail row follow, and it closes again", async () => {
    render(<Fleet which="compiled" />)
    const button = screen.getAllByRole("button", { name: "Show details" })[0]
    fireEvent.click(button)
    await flush()
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(button.getAttribute("aria-label")).toBe("Hide details")
    expect(screen.getByText("Detail of Robot L")).toBeTruthy()
    fireEvent.click(button)
    fireEvent.animationEnd(screen.getByText("Detail of Robot L").parentElement!)
    await flush()
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("Detail of Robot L")).toBeNull()
  })

  it("resizes: the handle lights while dragged and the column takes the new width", async () => {
    render(<Fleet which="compiled" />)
    const handle = screen.getByRole("separator", { name: "Resize Robot" })
    fireEvent.mouseDown(handle, { clientX: 200 })
    fireEvent.mouseMove(document, { clientX: 260 })
    await flush()
    expect(screen.getByRole("separator", { name: "Resize Robot" }).classList.contains("bg-ring")).toBe(true)
    expect(robotHeader().style.width).toBe("260px")
    fireEvent.mouseUp(document, { clientX: 260 })
    await flush()
    expect(screen.getByRole("separator", { name: "Resize Robot" }).classList.contains("bg-ring")).toBe(false)
    expect(robotHeader().style.width).toBe("260px")
  })

  it("a product's own cell follows the selection only when it subscribes, as the migration guide says", async () => {
    render(<Fleet which="compiled" />)
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0])
    await flush()
    expect(screen.getAllByTestId("by-subscribe")[0].textContent).toBe("Picked")
    // The compiled cell that calls row.getIsSelected() keeps its first answer: the reason for <Subscribe>.
    expect(screen.getAllByTestId("by-call")[0].textContent).toBe("Not picked")
  })
})

describe("the same grid compiled without its \"use no memo\"", () => {
  // These pin the failure the directive prevents, so the tests above are known to catch it: the table's state changes
  // (the row is marked, aria-sort moves, in DataGridTable, which the compiler skips for TanStack Virtual), but the
  // compiled parts that read it through the stable row and column keep their first render.
  it("leaves the row's box, the sort arrow and the details button behind the state", async () => {
    render(<Fleet which="undirected" />)
    const box = screen.getAllByRole("checkbox", { name: "Select row" })[0]
    fireEvent.click(box)
    await flush()
    expect(bodyRows()[0].getAttribute("data-state")).toBe("selected")
    expect(box.getAttribute("aria-checked")).toBe("false")

    const button = screen.getAllByRole("button", { name: "Show details" })[0]
    fireEvent.click(button)
    await flush()
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("Detail of Robot L")).toBeNull()

    await sortAscending()
    expect(robotHeader().getAttribute("aria-sort")).toBe("ascending")
    expect(sortIcon()).toBe("none")
  })
})
