import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type TableOptions,
} from "@tanstack/react-table"
import { Download, Pause, Trash2 } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridPagination,
  DataGridSelectionSummary,
  DataGridTable,
  expandColumn,
  selectColumn,
} from "@/registry/syncrobotic/ui/data-grid"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Meter } from "@/registry/syncrobotic/ui/meter"

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
const status: Record<Robot["status"], { tone: Tone; label: string }> = {
  patrolling: { tone: "info", label: "Patrolling" },
  docked: { tone: "success", label: "Docked" },
  attention: { tone: "warning", label: "Needs attention" },
  stopped: { tone: "danger", label: "Stopped" },
  offline: { tone: "neutral", label: "Offline" },
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
      battery: (i * 37) % 100,
      km: 120 + ((i * 53) % 900),
      tasks: (i * 11) % 30,
    }
  })
const robots = makeRobots(48)

const columns: ColumnDef<Robot>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    size: 200,
    meta: { label: "Robot" },
  },
  { accessorKey: "site", header: ({ column }) => <DataGridColumnHeader column={column} title="Site" />, size: 150, meta: { label: "Site" } },
  {
    accessorKey: "status",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <InlineStatus tone={status[row.original.status].tone}>{status[row.original.status].label}</InlineStatus>,
    size: 170,
    meta: { label: "Status" },
  },
  {
    accessorKey: "battery",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Battery" />,
    cell: ({ row }) => <Meter inline label="Battery" value={row.original.battery} low={30} critical={15} />,
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

function useGrid(data: Robot[], cols: ColumnDef<Robot>[], extra: Partial<TableOptions<Robot>> = {}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  return useReactTable({
    data,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    const table = useGrid(robots, [selectColumn<Robot>(), ...columns], { enableRowSelection: (r) => r.original.status !== "offline" })
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
        <DataGridPagination />
      </DataGrid>
    )
  },
}

export const DataGridDense: S = {
  render: function D() {
    const table = useGrid(robots, columns)
    return (
      <DataGrid table={table} density="dense">
        <DataGridTable aria-label="Robots" />
        <DataGridPagination pages={false} />
      </DataGrid>
    )
  },
}

export const DataGridStriped: S = {
  render: function D() {
    const table = useGrid(robots.slice(0, 6), columns)
    return (
      <DataGrid table={table} variant="striped">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridCellBorders: S = {
  render: function D() {
    const table = useGrid(robots.slice(0, 6), columns)
    return (
      <DataGrid table={table} variant="borders" density="dense">
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridBorderless: S = {
  render: function D() {
    const table = useGrid(robots.slice(0, 5), columns.slice(0, 3))
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
    const table = useGrid(robots.slice(0, 6), [expandColumn<Robot>(), ...columns.slice(0, 3)], {
      getRowCanExpand: () => true,
      getExpandedRowModel: getExpandedRowModel(),
      initialState: { expanded: { [robots[0].id]: true } },
      meta: {
        renderSubRow: (row: { original: Robot }) => (
          <DescriptionList
            columns={3}
            items={[
              { label: "Battery", value: `${row.original.battery} %` },
              { label: "Odometer", value: `${row.original.km} km` },
              { label: "Tasks today", value: row.original.tasks },
            ]}
          />
        ),
      },
    })
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridPinnedAndResizable: S = {
  render: function D() {
    const table = useGrid(robots, columns, {
      enableColumnResizing: true,
      columnResizeMode: "onChange",
      initialState: { pagination: { pageSize: 6, pageIndex: 0 }, columnPinning: { left: ["name"] } },
    })
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robots" className="max-w-sm" />
        <p className="text-xs text-muted-foreground">Robot stays pinned while the rest scrolls. Drag a column edge to resize; double-click resets it.</p>
      </DataGrid>
    )
  },
}

export const DataGridStickyHeader: S = {
  render: function D() {
    const table = useGrid(robots, columns, { getPaginationRowModel: undefined })
    return (
      <DataGrid table={table} density="dense">
        <DataGridTable aria-label="Robots" maxHeight={320} />
      </DataGrid>
    )
  },
}

export const DataGridVirtualRows: S = {
  render: function D() {
    const many = React.useMemo(() => makeRobots(5000), [])
    const table = useGrid(many, columns, { getPaginationRowModel: undefined })
    return (
      <DataGrid table={table} density="dense">
        <p className="text-sm text-muted-foreground">5 000 robots, only the rows in view are drawn.</p>
        <DataGridTable aria-label="All robots" maxHeight={360} virtual />
      </DataGrid>
    )
  },
}

export const DataGridTotalsFooter: S = {
  render: function D() {
    const rows = robots.slice(0, 6)
    const cols: ColumnDef<Robot>[] = [
      { ...columns[0], footer: () => "Total" },
      columns[1],
      { ...columns[4], footer: () => `${rows.reduce((s, r) => s + r.km, 0).toLocaleString("en-US")} km` },
      {
        accessorKey: "tasks",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tasks" />,
        size: 90,
        meta: { align: "right" },
        footer: () => rows.reduce((s, r) => s + r.tasks, 0),
      },
    ]
    const table = useGrid(rows, cols)
    return (
      <DataGrid table={table}>
        <DataGridTable aria-label="Robot mileage" />
      </DataGrid>
    )
  },
}

export const DataGridLoading: S = {
  render: function D() {
    const table = useGrid([], columns)
    return (
      <DataGrid table={table} loading>
        <DataGridTable aria-label="Robots" />
      </DataGrid>
    )
  },
}

export const DataGridEmpty: S = {
  render: function D() {
    const table = useGrid([], columns)
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            aria-label="Filter robots"
            placeholder="Filter by name or site"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-(--h-sm) min-w-0 flex-1 rounded-sm bg-card px-3 text-sm ring-1 ring-input ring-inset"
          />
          <DataGridColumnVisibility />
          <Button size="sm" variant="outline">
            <Download aria-hidden="true" /> Export
          </Button>
        </div>
        <DataGridTable aria-label="Robots" />
        <DataGridPagination />
      </DataGrid>
    )
  },
}
