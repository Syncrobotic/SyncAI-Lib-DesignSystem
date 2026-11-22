import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { tableFeatures, useTable, type TableOptions } from "@tanstack/react-table"
import { Wrench } from "lucide-react"
import { afterEach, describe, expect, it } from "vitest"
import { DataGrid, DataGridColumnHeader, DataGridTable, dataGridFeatures, selectColumn, type DataGridColumnDef } from "@/registry/syncrobotic/ui/data-grid"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Trace, TraceItem } from "@/registry/syncrobotic/ui/trace"
import { MarkerRow } from "@/registry/syncrobotic/ui/marker"
import { Timeline, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

afterEach(() => {
  cleanup()
  fireEvent.pointerDown(document.body)
})

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

describe("Meter says what its colour means", () => {
  it("reads a warning on a higher-is-worse level as high, not low", () => {
    const { rerender } = render(<Meter label="Motor temperature" value={68} max={90} low={60} critical={75} higherIsWorse unit="°C" />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("68 °C, high")
    rerender(<Meter label="Motor temperature" value={81} max={90} low={60} critical={75} higherIsWorse unit="°C" />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("81 °C, critical")
    // A level that runs out still reads low.
    rerender(<Meter label="Battery" value={9} low={15} />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("9 %, low")
  })

  it("writes one space before a unit given with a leading space", () => {
    render(<Meter label="Motor temperature" value={48} max={90} unit=" °C" />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("48 °C")
    expect(screen.getByText("48 °C")).toBeTruthy()
  })

  it("writes the total beside the value with showMax", () => {
    render(<Meter label="Recording storage" value={412} max={512} low={461} critical={486} higherIsWorse unit="GB" showMax />)
    const m = screen.getByRole("meter")
    expect(m.getAttribute("data-tone")).toBe("normal")
    expect(m.getAttribute("aria-valuetext")).toBe("412 of 512 GB")
  })

  it("writes numbers as given by default, and formats value and total with locale and format", () => {
    const { rerender } = render(<Meter label="Items" value={412345} max={1000000} unit="items" showMax />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("412345 of 1000000 items")
    rerender(<Meter label="Items" value={412345} max={1000000} unit="items" showMax locale="en-US" />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("412,345 of 1,000,000 items")
    expect(screen.getByText("412,345 of 1,000,000 items")).toBeTruthy()
    rerender(<Meter label="Items" value={412345} max={1000000} unit="items" showMax locale="en-US" format={{ notation: "compact" }} />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("412K of 1M items")
    rerender(<Meter label="Items" value={412345} max={1000000} unit="items" showMax locale="de" labels={{ range: (v, m) => `${v} / ${m}` }} />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("412.345 / 1.000.000 items")
    rerender(<Meter label="Storage" value={97} low={80} critical={95} higherIsWorse labels={{ critical: "kritisch" }} />)
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("97 %, kritisch")
  })

  it("marks the thresholds with ticks only when asked, without changing what it says", () => {
    const { container, rerender } = render(<Meter label="Storage used" value={78} low={80} critical={95} higherIsWorse />)
    expect(container.querySelectorAll("[data-threshold]")).toHaveLength(0)
    rerender(<Meter label="Storage used" value={78} low={80} critical={95} higherIsWorse showThresholds />)
    const ticks = [...container.querySelectorAll<HTMLElement>("[data-threshold]")]
    expect(ticks.map((t) => t.style.left)).toEqual(["80%", "95%"])
    expect(ticks[0].className).toContain("border-muted-foreground")
    expect(ticks[0].closest("[aria-hidden]")).toBeTruthy()
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("78 %")
    rerender(<Meter label="Temperature" value={40} min={20} max={120} low={60} unit="°C" showThresholds />)
    expect([...container.querySelectorAll<HTMLElement>("[data-threshold]")].map((t) => t.style.left)).toEqual(["40%"])
  })
})

describe("Trace keeps the status mark with a custom icon", () => {
  it("shows the icon only in place of the done check", () => {
    const { container } = render(
      <Trace>
        <TraceItem status="done" icon={<Wrench data-testid="icon" />} title="search_events" />
        <TraceItem status="warning" icon={<Wrench data-testid="icon" />} title="Robot 5384" />
        <TraceItem status="running" icon={<Wrench data-testid="icon" />} title="create_work_order" />
        <TraceItem status="error" icon={<Wrench data-testid="icon" />} title="open_door" />
      </Trace>,
    )
    const items = [...container.querySelectorAll("[data-slot=trace-item]")]
    expect(items.map((i) => i.querySelector("[data-testid=icon]") !== null)).toEqual([true, false, false, false])
    expect(items[1].querySelector(".lucide-triangle-alert")).not.toBeNull()
    expect(items[2].querySelector("svg.animate-spin")).not.toBeNull()
    expect(items[3].querySelector(".lucide-circle-alert")).not.toBeNull()
  })
})

type Robot = { id: string; name: string; km: number; offline?: boolean }
const robots: Robot[] = [
  { id: "a", name: "Robot A", km: 100 },
  { id: "b", name: "Robot B", km: 200, offline: true },
]
const features = tableFeatures({ ...dataGridFeatures })
type Col = DataGridColumnDef<Robot, typeof features>
const columns: Col[] = [
  { accessorKey: "name", header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />, size: 200, minSize: 80, meta: { label: "Robot" } },
  { accessorKey: "km", header: ({ column }) => <DataGridColumnHeader column={column} title="Odometer" />, size: 120, meta: { label: "Odometer" } },
]
const selectable: Col[] = [selectColumn<Robot, typeof features>({ reason: (r) => (r.offline ? "offline robots cannot be selected" : undefined) }), ...columns]

function Grid({ cols = columns, options = {} }: { cols?: Col[]; options?: Partial<TableOptions<typeof features, Robot>> }) {
  const table = useTable({ features, data: robots, columns: cols, getRowId: (r) => r.id, enableColumnResizing: true, columnResizeMode: "onChange", ...options })
  return (
    <DataGrid table={table}>
      <DataGridTable aria-label="Robots" />
    </DataGrid>
  )
}
const width = () => (document.querySelector("thead th") as HTMLElement).style.width

describe("DataGrid column resizing without dragging", () => {
  it("makes each column edge a focusable separator that says its width", () => {
    render(<Grid />)
    const [edge] = screen.getAllByRole("separator", { name: "Resize Robot" })
    expect(edge.tabIndex).toBe(0)
    expect(edge.getAttribute("aria-valuenow")).toBe("200")
    expect(edge.getAttribute("aria-valuemin")).toBe("80")
    expect(edge.getAttribute("aria-valuetext")).toBe("200 px")
  })

  it("moves the edge with the arrow keys, Shift for bigger steps, Home to the minimum and Enter back to the start", async () => {
    render(<Grid />)
    const edge = () => screen.getByRole("separator", { name: "Resize Robot" })
    fireEvent.keyDown(edge(), { key: "ArrowRight" })
    await flush()
    expect(width()).toBe("216px")
    fireEvent.keyDown(edge(), { key: "ArrowLeft", shiftKey: true })
    await flush()
    expect(width()).toBe("152px")
    fireEvent.keyDown(edge(), { key: "Home" })
    await flush()
    expect(width()).toBe("80px")
    expect(edge().getAttribute("aria-valuenow")).toBe("80")
    fireEvent.keyDown(edge(), { key: "Enter" })
    await flush()
    expect(width()).toBe("200px")
  })

  it("offers the width in the column menu, for touch", async () => {
    render(<Grid />)
    fireEvent.pointerDown(screen.getByRole("button", { name: "Robot" }), { button: 0, pointerType: "mouse" })
    await flush()
    fireEvent.click(screen.getByRole("menuitem", { name: "Wider" }))
    await flush()
    expect(width()).toBe("264px")
    fireEvent.pointerDown(screen.getByRole("button", { name: "Robot" }), { button: 0, pointerType: "mouse" })
    await flush()
    fireEvent.click(screen.getByRole("menuitem", { name: "Reset width" }))
    await flush()
    expect(width()).toBe("200px")
  })
})

describe("DataGrid selection says why a row cannot be selected", () => {
  it("names the reason on the grey box", () => {
    render(<Grid cols={selectable} options={{ enableRowSelection: (r) => !r.original.offline }} />)
    const blocked = screen.getByRole("checkbox", { name: "Select row, offline robots cannot be selected" })
    expect(blocked.hasAttribute("disabled")).toBe(true)
    expect(blocked.className).toContain("disabled:bg-muted")
    expect(screen.getByRole("checkbox", { name: "Select row" }).hasAttribute("disabled")).toBe(false)
  })
})

describe("MarkerRow and TimelineItem take a status", () => {
  it("draws and says the status from `status`, as the old `tone` did", () => {
    const { container } = render(
      <>
        <MarkerRow status="danger" title="open_door" />
        <Timeline>
          <TimelineItem status="warning" title="Battery 12 %" />
          <TimelineItem status="active" title="Patrol started" />
        </Timeline>
      </>,
    )
    expect(screen.getByText("open_door").textContent).toBe("open_door, failed")
    expect(screen.getByText("Battery 12 %").textContent).toBe("Battery 12 %, warning")
    expect(screen.getByText("Patrol started").className).not.toMatch(/text-(warning|danger|info)/)
    // A filled circle for active: the glyph, not the plain dot of an ordinary event.
    expect(container.querySelectorAll("svg circle[fill=currentColor]").length).toBe(1)
  })
})
