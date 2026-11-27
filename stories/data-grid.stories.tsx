import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  createExpandedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  tableFeatures,
  useTable,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table"
import { Download, Pause, Trash2 } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
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
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Filters, filterRows, type FilterField, type FilterRule } from "@/registry/syncrobotic/ui/filters"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"

const meta: Meta = { title: "Display/Data grid" }
export default meta
type S = StoryObj

type Robot = {
  id: string
  name: string
  site: string
  status: "patrolling" | "docked" | "attention" | "stopped" | "offline"
  battery: number
  km: number
  tasks: number
}
const status: Record<Robot["status"], { tone: Status; label: string }> = {
  patrolling: { tone: "active", label: "Patrolling" },
  docked: { tone: "normal", label: "Docked" },
  attention: { tone: "warning", label: "Needs attention" },
  stopped: { tone: "danger", label: "Stopped" },
  offline: { tone: "offline", label: "Offline" },
}
const sites = ["North gate", "Hall B", "Warehouse 3", "Parking lot", "Perimeter"]
const kinds = Object.keys(status) as Robot["status"][]
// Deterministic sample rows, so stories and screenshots never change between runs.
const makeRobots = (n: number): Robot[] =>
  Array.from({ length: n }, (_, i) => {
    const id = ((i * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 4).toUpperCase()
    return {
      id,
      name: `${i % 3 ? "Courier" : "Patrol dog"} ${id}`,
      site: sites[i % sites.length],
      status: kinds[(i * 7) % kinds.length],
      battery: 12 + ((i * 37) % 88), // never 0 %: a robot at 0 % is not patrolling
      km: 120 + ((i * 53) % 900),
      tasks: (i * 11) % 30,
    }
  })
const robots = makeRobots(48)
// useTable needs data and columns that keep their identity between renders (module scope or useMemo). A new array on
// every render recomputes the rows and auto-resets state, which renders again: an endless loop once a row is expanded.
const six = robots.slice(0, 6)
const five = robots.slice(0, 5)
const none: Robot[] = []

// The grid's features plus client-side sorting and paging; the expandable story adds the expanded row model. Each set is
// built once, at module scope, because the table's features must keep their identity like its data and columns.
const features = tableFeatures({ ...dataGridFeatures, sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel() })
type Features = typeof features
type Col = DataGridColumnDef<Robot, Features>
const expanding = tableFeatures({ ...features, expandedRowModel: createExpandedRowModel() })
// Stories that scroll every row instead of paging. manualPagination makes the table skip its paginated row model, as
// leaving out the pagination row model did in Table 8, so these share the paged stories' features and columns.
const unpaged: Partial<TableOptions<Features, Robot>> = { manualPagination: true }

const columns: Col[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    size: 200,
    meta: { label: "Robot" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <InlineStatus status={status[row.original.status].tone}>{status[row.original.status].label}</InlineStatus>,
    size: 170,
    meta: { label: "Status" },
  },
  // Status right after the name, so it stays in view when a narrow screen shows only the first columns.
  { accessorKey: "site", header: ({ column }) => <DataGridColumnHeader column={column} title="Site" />, size: 140, meta: { label: "Site" } },
  {
    accessorKey: "battery",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Battery" />,
    cell: ({ row }) => <Meter inline label="Battery" value={row.original.battery} low={15} />,
    size: 160,
    meta: { label: "Battery" },
  },
  {
    accessorKey: "km",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Odometer" />,
    cell: ({ getValue }) => `${(getValue() as number).toLocaleString("en-US")} km`,
    size: 120,
    meta: { align: "right", label: "Odometer" },
  },
]

const firstThree = columns.slice(0, 3)
const expandableColumns = [expandColumn<Robot, Features>(), ...firstThree]
const selectableColumns = [
  selectColumn<Robot, Features>({ reason: (r) => (r.status === "offline" ? "offline robots cannot be selected" : undefined) }),
  ...columns,
]
const totalsColumns: Col[] = [
  { ...columns[0], footer: () => "Total" },
  columns[1],
  { ...columns[4], footer: () => `${six.reduce((s, r) => s + r.km, 0).toLocaleString("en-US")} km` },
  {
    accessorKey: "tasks",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Tasks" />,
    size: 90,
    meta: { align: "right", label: "Tasks" },
    footer: () => six.reduce((s, r) => s + r.tasks, 0),
  },
]

// The features are a parameter so a story can drop paging or add expanding; the columns are typed for the default set,
// whose APIs every other set here contains.
function useGrid(data: Robot[], cols: Col[], extra: Partial<TableOptions<Features, Robot>> = {}, set: Features = features) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  // Table 9 keeps its state in a store and useTable hands back a new table object on every change. No selector: the
  // grid redraws when that table changes, and the React Compiler can memoize around it (no incompatible-library escape).
  return useTable({
    features: set,
    data,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (r) => r.id,
    initialState: { pagination: { pageSize: 8, pageIndex: 0 } },
    ...extra,
  })
}

export const DataGridDefault: S = {
  render: function D() {
    const table = useGrid(robots, columns)
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" />
        <DataGridPagination />
      </DataGrid>
    )
  },
}

export const DataGridSelection: S = {
  render: function D() {
    const table = useGrid(robots, selectableColumns, { enableRowSelection: (r) => r.original.status !== "offline" })
    return (
      <DataGrid table={table}>
        <DataGridSelectionSummary>
          <Button size="sm" variant="outline">
            <Pause aria-hidden="true" /> Pause
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 aria-hidden="true" /> Remove
          </Button>
        </DataGridSelectionSummary>
        <DataGridTable aria-label="Robots" />
        {/* The reason a box is grey, said on the page as well as in each box's name. */}
        <p className="text-xs text-muted-foreground">Offline robots cannot be selected: they would not receive the command.</p>
        <DataGridPagination />
      </DataGrid>
    )
  },
}

export const DataGridDense: S = {
  render: function D() {
    const table = useGrid(robots, columns)
    return (
      <DataGrid table={table} size="sm">
        <DataGridTable aria-label="Robots" />
        <DataGridPagination pages={false} />
      </DataGrid>
    )
  },
}

export const DataGridStriped: S = {
  render: function D() {
    const table = useGrid(six, columns)
    return (
      <DataGrid table={table} variant="striped">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridCellBorders: S = {
  render: function D() {
    const table = useGrid(six, columns)
    return (
      <DataGrid table={table} variant="borders" size="sm">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridBorderless: S = {
  render: function D() {
    const table = useGrid(five, firstThree)
    return (
      <DataGrid table={table} variant="borderless">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridColumnVisibilityMenu: S = {
  render: function D() {
    const table = useGrid(robots, columns, { initialState: { pagination: { pageSize: 6, pageIndex: 0 }, columnVisibility: { km: false } } })
    return (
      <DataGrid table={table}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{robots.length} robots</span>
          <DataGridColumnVisibility />
        </div>
        <DataGridTable aria-label="Robots" />
        <DataGridPagination />
      </DataGrid>
    )
  },
}

export const DataGridExpandableRows: S = {
  render: function D() {
    const table = useGrid(six, expandableColumns, {
      getRowCanExpand: () => true,
      initialState: { expanded: { [robots[0].id]: true } },
      meta: {
        renderSubRow: (row: { original: Robot }) => (
          // bare: the expanded row is already a surface, so the list draws no card of its own inside it.
          <DescriptionList
            columns={3}
            variant="bare"
            items={[
              { label: "Battery", value: `${row.original.battery} %` },
              { label: "Odometer", value: `${row.original.km} km` },
              { label: "Tasks today", value: row.original.tasks },
            ]}
          />
        ),
      },
    }, expanding)
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

// Every column plus tasks: wider than the preview, so the pinned first column has something to stay in front of.
const pinnedColumns: Col[] = [...columns, { ...totalsColumns[3], footer: undefined }]

export const DataGridPinnedAndResizable: S = {
  render: function D() {
    const table = useGrid(robots, pinnedColumns, {
      enableColumnResizing: true,
      columnResizeMode: "onChange",
      initialState: { pagination: { pageSize: 6, pageIndex: 0 }, columnPinning: { start: ["name"], end: [] } },
    })
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" />
        <p className="text-xs text-muted-foreground">
          Robot stays pinned while the rest scrolls (on a phone every column scrolls). Drag a column edge, or Tab to it and press ← or →, to resize; double-click
          or Enter resets it. The column menu has the same.
        </p>
      </DataGrid>
    )
  },
}

export const DataGridStickyHeader: S = {
  render: function D() {
    const table = useGrid(robots, columns, unpaged)
    return (
      <DataGrid table={table} size="sm">
        <DataGridTable aria-label="Robots" maxHeight={320} />
      </DataGrid>
    )
  },
}

export const DataGridVirtualRows: S = {
  render: function D() {
    const many = React.useMemo(() => makeRobots(5000), [])
    const table = useGrid(many, columns, unpaged)
    return (
      <DataGrid table={table} size="sm">
        <p className="text-sm text-muted-foreground">5 000 robots, only the rows in view are drawn.</p>
        <DataGridTable aria-label="All robots" maxHeight={360} virtual />
      </DataGrid>
    )
  },
}

export const DataGridTotalsFooter: S = {
  render: function D() {
    // Robot stays pinned; where the grid scrolls, the totals are written out in one row that stays in view.
    const table = useGrid(six, totalsColumns, { initialState: { pagination: { pageSize: 8, pageIndex: 0 }, columnPinning: { start: ["name"], end: [] } } })
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robot mileage" />
      </DataGrid>
    )
  },
}

export const DataGridLoading: S = {
  render: function D() {
    const table = useGrid(none, columns)
    return (
      <DataGrid table={table} loading>
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridEmpty: S = {
  render: function D() {
    const table = useGrid(none, columns)
    return (
      <DataGrid table={table} emptyText="No robots match these filters.">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridToolbar: S = {
  render: function D() {
    const [q, setQ] = React.useState("")
    const data = React.useMemo(() => robots.filter((r) => `${r.name} ${r.site}`.toLowerCase().includes(q.toLowerCase())), [q])
    const table = useGrid(data, columns, { initialState: { pagination: { pageSize: 6, pageIndex: 0 } } })
    return (
      <DataGrid table={table}>
        {/* The search takes the whole first row on a phone, the buttons the row under it. One height across the toolbar:
            the field's (--h-md), so the buttons are the default size, not sm. */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchField label="Filter robots" placeholder="Filter robots" hotkey={null} value={q} onValueChange={setQ} className="basis-full sm:basis-0 sm:flex-1" />
          <DataGridColumnVisibility />
          <Button variant="outline" className="px-3">
            <Download aria-hidden="true" className="size-4" /> Export
          </Button>
        </div>
        <DataGridTable aria-label="Robots" />
        <DataGridPagination />
      </DataGrid>
    )
  },
}

// The filters bar over a grid: the rules filter the rows in the browser and the count says what is left.
const fleet = robots.slice(0, 40)
const fleetFields: FilterField[] = [
  { key: "name", label: "Robot", type: "text", placeholder: "Name or id" },
  {
    key: "status",
    label: "Status",
    type: "option",
    multiple: true,
    options: kinds.map((k) => ({ value: k, label: status[k].label, count: fleet.filter((r) => r.status === k).length })),
  },
  { key: "site", label: "Site", type: "option", options: sites.map((s) => ({ value: s, label: s, count: fleet.filter((r) => r.site === s).length })) },
  { key: "battery", label: "Battery", type: "number", unit: "%", min: 0, max: 100, step: 5 },
  { key: "km", label: "Odometer", type: "number", unit: "km", min: 0, step: 10 },
]

export const DataGridFiltered: S = {
  render: function D() {
    const [rules, setRules] = React.useState<FilterRule[]>([
      { id: "status", field: "status", operator: "any_of", value: ["patrolling", "docked"] },
      { id: "battery", field: "battery", operator: "gt", value: 30 },
    ])
    const data = React.useMemo(() => filterRows(fleet, rules, fleetFields), [rules])
    const table = useGrid(data, columns, { initialState: { pagination: { pageSize: 6, pageIndex: 0 } } })
    return (
      <DataGrid table={table} emptyText="No robots match these filters.">
        <div className="flex flex-col gap-2">
          <Filters fields={fleetFields} value={rules} onValueChange={setRules} />
          <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
            {data.length} of {fleet.length} robots
          </p>
        </div>
        <DataGridTable aria-label="Robots" />
        <DataGridPagination />
      </DataGrid>
    )
  },
}
