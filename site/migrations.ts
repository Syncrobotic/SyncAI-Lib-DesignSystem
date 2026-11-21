import { site } from "./config"

// Upgrade guides for items whose new version makes products change their own code. The component page shows the guide
// under its own heading and the markdown twin (what agents and the MCP server read) carries the same text, so a person
// and a coding agent follow one set of steps. Each step was checked against the installed version of the library.

export type Migration = {
  /** The heading's anchor on the component page. */
  id: string
  title: string
  lead: string
  /** What the before and after code run on: "Table 8", "Table 9". */
  from: string
  to: string
  /** In order; `code` and **bold** are the only marks. */
  steps: string[]
  before: string
  after: string
  /** What the React Compiler, which products build with, changes about the item. */
  compiler: string[]
  /** A custom cell written the compiler-safe way. */
  compilerExample: string
  /** A prompt to paste into a coding agent. */
  prompt: string
  /** Shell lines that must print nothing once the migration is done. */
  grep: string
}

const before = `import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table"
import { DataGrid, DataGridColumnHeader, DataGridPagination, DataGridTable, selectColumn } from "@/components/ui/data-grid"

const columns: ColumnDef<Robot>[] = [
  selectColumn<Robot>(),
  {
    accessorKey: "name",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />,
    sortingFn: "alphanumeric",
    meta: { label: "Robot" },
  },
  { accessorKey: "km", header: "Odometer", meta: { align: "right", label: "Odometer" } },
]

export function Fleet({ robots }: { robots: Robot[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const table = useReactTable({
    data: robots,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.id,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { columnPinning: { left: ["name"] } },
  })
  const page = table.getState().pagination.pageIndex
  return (
    <DataGrid table={table}>
      <p>Page {page + 1}</p>
      <DataGridTable aria-label="Robots" />
      <DataGridPagination />
    </DataGrid>
  )
}`

const after = `import { createPaginatedRowModel, createSortedRowModel, tableFeatures, useTable, type SortingState } from "@tanstack/react-table"
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridPagination,
  DataGridTable,
  dataGridFeatures,
  selectColumn,
  type DataGridColumnDef,
} from "@/components/ui/data-grid"

// Built once, at module scope: the features keep their identity, like data and columns.
const features = tableFeatures({
  ...dataGridFeatures,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

const columns: DataGridColumnDef<Robot, typeof features>[] = [
  selectColumn<Robot, typeof features>(),
  {
    accessorKey: "name",
    header: ({ column }) => <DataGridColumnHeader column={column} title="Robot" />,
    sortFn: "alphanumeric",
    meta: { label: "Robot" },
  },
  { accessorKey: "km", header: "Odometer", meta: { align: "right", label: "Odometer" } },
]

export function Fleet({ robots }: { robots: Robot[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  // No selector (second argument): useTable hands back a new table on every change, and the grid redraws with it.
  const table = useTable({
    features,
    data: robots,
    columns,
    getRowId: (r) => r.id,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { columnPinning: { start: ["name"], end: [] } },
  })
  const page = table.state.pagination.pageIndex
  return (
    <DataGrid table={table}>
      <p>Page {page + 1}</p>
      <DataGridTable aria-label="Robots" />
      <DataGridPagination />
    </DataGrid>
  )
}`

const compilerExample = `import { Subscribe, type Row } from "@tanstack/react-table"

// Reads the selection through the atom, not row.getIsSelected(): the row object never changes, so a compiled cell that
// calls the method can keep its first answer. Subscribe renders again when the selection changes.
function PickedCell({ row }: { row: Row<typeof features, Robot> }) {
  return (
    <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => selection[row.id] === true}>
      {(picked) => (picked ? "Picked" : null)}
    </Subscribe>
  )
}`

// Each line is one pattern; every one must print nothing. The installed data-grid itself matches none of them.
const grep = `# Run from the project root. Every command must print nothing.
g() { grep -rnE --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.next "$1" .; }
g "useReactTable|useLegacyTable|react-table/legacy"
g "get(Core|Sorted|Pagination|Expanded|Filtered|Grouped|Faceted)RowModel|getFaceted(MinMax|Unique)Values"
g "columnPinning:[^}]*\\b(left|right):|pin\\(\\"(left|right)\\"\\)|getIsPinned\\(\\) *[!=]== *\\"(left|right)\\""
g "\\.get(Left|Right)(VisibleCells|HeaderGroups|FooterGroups|FlatHeaders|LeafHeaders|LeafColumns|VisibleLeafColumns|TotalSize)\\("
g "\\.getState\\(\\)|onStateChange"
g "\\bsortingFns?\\b|\\bSortingFns?\\b|getSortingFn|getAutoSortingFn"
g "columnSizingInfo|ColumnSizingInfo|setColumnSizingInfo"
g "\\bColumnDef<[A-Za-z_][A-Za-z0-9_]*>"
g "interface (ColumnMeta|TableMeta)<TData"
g "stockFeatures"
# Review each hit by hand: a table-level enablePinning is now enableColumnPinning (a column's own enablePinning stays).
g "enablePinning"`

const prompt = `Migrate this project's SYNCROBOTIC data grids from @tanstack/react-table 8 to 9 (@syncrobotic/data-grid 0.26.0).
1. Run: npm install @tanstack/react-table@^9 && npx shadcn add @syncrobotic/data-grid --overwrite
   Then git diff components/ui/data-grid.tsx and re-apply any local edits the overwrite removed. Keep its "use no memo" directive.
2. Read ${site.url}/docs/components/data-grid.md, section "Upgrading to TanStack Table 9", and apply every step to every file that imports @tanstack/react-table or the data grid.
3. The project builds with the React Compiler. Call useTable without a selector. In every cell, header or footer you wrote, a state read through a row, column or table method (getIsSelected, getIsExpanded, getIsSorted, getIsPinned, getIsResizing, getIsAllRowsSelected, getIsSomeRowsSelected) goes through <Subscribe source={row.table.atoms.<slice>} selector={...}> from @tanstack/react-table, or that component starts with "use no memo".
4. Do not use useLegacyTable or stockFeatures, and add no casts or any to quiet a type error: register the feature or row model the error names.
5. Run the grep checklist from that section until every command prints nothing, then the type-check, lint and tests. Then try each grid: sort, select (one row and the page), expand, page, pin and resize, and check the screen follows each change.
Report each file you changed and anything you could not migrate.`

export const migrations: Record<string, Migration> = {
  "data-grid": {
    id: "table-9",
    title: "Upgrading to TanStack Table 9",
    lead: "data-grid 0.26.0 needs @tanstack/react-table 9. The grid looks and behaves the same; the table you build for it changes. Upgrade the package and the item together, then follow these steps in every file that builds a table.",
    from: "Table 8",
    to: "Table 9",
    steps: [
      "Install both: `npm install @tanstack/react-table@^9` and `npx shadcn add @syncrobotic/data-grid --overwrite`. Re-apply your local edits to the grid from the diff, and keep the `\"use no memo\"` line at its top.",
      "Build the features once, at module scope: `tableFeatures({ ...dataGridFeatures, sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel() })`. Add `expandedRowModel: createExpandedRowModel()` for expandable rows, and the feature and row model of anything else you use (`columnFilteringFeature` with `filteredRowModel: createFilteredRowModel()`).",
      "Replace `useReactTable({ … })` with `useTable({ features, … })`, with no second argument (selector). Delete `getCoreRowModel` (it is built in) and every other `get*RowModel` option: the row models are in the features now.",
      "A grid that showed every row because it had no `getPaginationRowModel`: leave `paginatedRowModel` out of its features, or, if it shares a features object that has one, set `manualPagination: true`.",
      "Types take the features first. `ColumnDef<Row>` becomes `DataGridColumnDef<Row, typeof features>` (the same as `ColumnDef<typeof features, Row>`); `selectColumn<Row>()` and `expandColumn<Row>()` become `selectColumn<Row, typeof features>()`; `Table`, `Row`, `Column`, `Cell` and `createColumnHelper` likewise. A column type fits only its own features: `DataGridColumnDef<Row>` alone, or `ColumnDef<DataGridFeatures, Row>`, does not fit a table that adds row models.",
      "Pinning is logical. `columnPinning: { left: [\"name\"] }` becomes `{ start: [\"name\"], end: [] }`, and both keys are required. `pin(\"left\")` becomes `pin(\"start\")`, `getIsPinned() === \"left\"` compares with `\"start\"`, `getLeft…`/`getRight…` become `getStart…`/`getEnd…`, and sticky CSS uses `insetInlineStart`/`insetInlineEnd`. The table option `enablePinning` is now `enableColumnPinning`; a column's own `enablePinning` stays.",
      "`table.getState()` and `onStateChange` are gone. In the component that calls useTable, read `table.state.sorting` (it re-renders); elsewhere `table.atoms.sorting.get()` and `table.store.state` are snapshots that do not. Use one `on<Slice>Change` per controlled slice, paired with its `state` value.",
      "Renames: a column's `sortingFn` is `sortFn`, and the `sortingFns` option is a `sortFns` slot in the features (`sortFns: { ...dataGridFeatures.sortFns, byBattery }`); `SortingFn` is `SortFn`. `columnSizingInfo`, `setColumnSizingInfo` and `onColumnSizingInfoChange` are `columnResizing`, `setColumnResizing` and `onColumnResizingChange`.",
      "`RowSelectionState` is `Record<string, true>`: delete a row's key to clear it instead of setting `false`. `getIsSomeRowsSelected()` and `getIsSomePageRowsSelected()` now mean at least one, all included: an indeterminate box is `some && !all`.",
      "Meta: a Table 8 `declare module \"@tanstack/react-table\"` with `interface ColumnMeta<TData extends RowData, TValue>` no longer compiles (TS2428). Prefer a slot in the features, `columnMeta: metaHelper<YourMeta>()`, and delete the declaration; or keep it with the features first, `interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue extends CellData = CellData>`. Either way the type then rejects keys it does not name, so list the grid's own: `align`, `label`, `headerClassName`, `cellClassName`.",
      "Row, column and cell methods live on shared prototypes: call them on the object (`row.getValue(\"km\")`, `rows.map((r) => r.getVisibleCells())`), never destructured or passed bare. A render function's own `getValue` (`cell: ({ getValue }) => …`) is still bound.",
    ],
    before,
    after,
    compiler: [
      "Table 9 keeps one table, row, column and header object for the table's whole life and answers state through methods: `row.getIsSelected()`, `row.getIsExpanded()`, `column.getIsSorted()`, `column.getIsResizing()`. A component compiled by the React Compiler caches those calls against the object, which never changes, so it keeps showing the first state.",
      "The grid opts out: `data-grid.tsx` starts with `\"use no memo\"`, so the compiler leaves it as written and it memoizes by hand. Keep the directive when you edit your copy.",
      "Call `useTable` without a selector. It then hands back a new table on every state change, and the grid redraws with it. A narrower selector leaves the grid showing old state.",
      "A cell, header or footer of your own that reads state through such a method subscribes to that state: wrap it in the standalone `<Subscribe source={row.table.atoms.rowSelection} selector={(s) => s[row.id] === true}>` from `@tanstack/react-table` (in a header, `column.table.atoms.sorting`; for several slices, `source={table.store}` with a selector), or pass the value in as a prop that changes, or start the component with `\"use no memo\"`. Reading the row's data (`row.original`, `getValue()`) needs none of this: new data makes new rows.",
    ],
    compilerExample,
    prompt,
    grep,
  },
}
