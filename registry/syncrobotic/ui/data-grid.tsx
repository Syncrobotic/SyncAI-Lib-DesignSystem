// @syncrobotic/data-grid v0.51.0 · update: npx shadcn add @syncrobotic/data-grid --overwrite
"use client"
"use no memo"

// "use no memo": TanStack Table 9 keeps one table, row and column object for life and answers through methods that read
// its store (row.getIsSelected()). The React Compiler would cache those calls against the unchanging object, so state
// would stop showing. DataGrid memoizes its context by hand instead. tests/unit/data-grid.compiler.test.tsx guards it.

import * as React from "react"
import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  flexRender,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column,
  type ColumnDef,
  type Row,
  type RowData,
  type Table as TanTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, ChevronsLeftRight, ChevronsRightLeft, Columns3, EyeOff, Pin, PinOff, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { useScrollEdges } from "@/registry/syncrobotic/ui/table"

type Density = "default" | "dense"

// The TanStack Table features the grid's parts call. Table 9 gives a table only the APIs of the features it registers.
const gridFeatures = tableFeatures({
  columnVisibilityFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
})
/** The features a table given to DataGrid has at least: the parts call their APIs. Yours may have more. */
export type DataGridFeatures = typeof gridFeatures

/**
 * The features DataGrid's parts call, plus the text, mixed and date sort functions Table 9 does not bundle. Spread it into
 * your features and add row models: `tableFeatures({ ...dataGridFeatures, sortedRowModel: createSortedRowModel() })`.
 * With sort functions of your own: `sortFns: { ...dataGridFeatures.sortFns, byBattery }`.
 */
export const dataGridFeatures = tableFeatures({
  ...gridFeatures,
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
})
/**
 * A column of a DataGrid table. Table 9's ColumnDef takes the table's features first; this keeps the one-argument form
 * (`DataGridColumnDef<Robot>`) for a table built on dataGridFeatures, and takes your own features as the second.
 */
export type DataGridColumnDef<TData extends RowData, TFeatures extends DataGridFeatures = typeof dataGridFeatures> = ColumnDef<TFeatures, TData>
// The parts share the table through context, where its row type is erased; RowData is the widest row Table 9 allows.
type GridTable = TanTable<DataGridFeatures, RowData>
type GridColumn = Column<DataGridFeatures, RowData, unknown>
type GridRow = Row<DataGridFeatures, RowData>

/** A height token in px as it resolves at `el` (rem or px), or undefined before mount. */
function tokenPx(el: HTMLElement | null, name: string) {
  if (!el) return undefined
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  const n = parseFloat(v)
  if (!n) return undefined
  return v.endsWith("rem") ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}
type Variant = "default" | "striped" | "borders" | "borderless"

export type DataGridLabels = {
  /** Names the scrolling grid when DataGridTable has no `aria-label`. */
  region: string
  /** In the grid when there are no rows. */
  empty: string
  /** A column's resize handle: "Resize Robot". */
  resize: (column: string) => string
  /** The handle's value, the column's width: "200 px". */
  width: (px: number) => string
  /** The column header menu. */
  ascending: string
  descending: string
  unpin: string
  pinLeft: string
  hideColumn: string
  /** The column menu's width items, for whoever cannot drag the edge. */
  wider: string
  narrower: string
  resetWidth: string
  /** The button that opens the column menu (DataGridColumnVisibility). */
  columns: string
  /** The heading inside that menu. */
  showColumns: string
  /** DataGridSelectionSummary: "3 of 48 selected". */
  selected: (count: number, total: number) => string
  /** selectColumn's checkboxes. */
  selectAll: string
  selectRow: string
  /** Read after selectRow on a row that cannot be selected, when selectColumn gives no reason of its own. */
  cannotSelect: string
  /** expandColumn's header (screen readers only) and its button. */
  details: string
  showDetails: string
  hideDetails: string
}

export const defaultDataGridLabels: DataGridLabels = {
  region: "Data",
  empty: "No rows",
  resize: (column) => `Resize ${column}`,
  width: (px) => `${px} px`,
  ascending: "Ascending",
  descending: "Descending",
  unpin: "Unpin",
  pinLeft: "Pin to the left",
  hideColumn: "Hide column",
  wider: "Wider",
  narrower: "Narrower",
  resetWidth: "Reset width",
  columns: "Columns",
  showColumns: "Show columns",
  selected: (count, total) => `${count} of ${total} selected`,
  selectAll: "Select all on this page",
  selectRow: "Select row",
  cannotSelect: "cannot be selected",
  details: "Details",
  showDetails: "Show details",
  hideDetails: "Hide details",
}

type Ctx = { table: GridTable; density: Density; variant: Variant; loading: boolean; emptyText: React.ReactNode; labels: DataGridLabels }
const GridContext = React.createContext<Ctx | null>(null)
/** The grid's words; the defaults outside a DataGrid (a column helper used with another table). */
const useGridLabels = () => React.useContext(GridContext)?.labels ?? defaultDataGridLabels
const useGrid = () => {
  const c = React.useContext(GridContext)
  if (!c) throw new Error("DataGrid parts must be inside <DataGrid>")
  return c
}

/**
 * A data table on TanStack Table 9 (sorting, pagination, selection, pinning, resizing, expanding, virtual scrolling); build
 * it with useTable and dataGridFeatures. For a handful of static rows, Table is enough. Keep `data` and `columns` stable
 * between renders (a new array re-renders without end), and keep useTable's default state selector: a narrower one leaves
 * the grid showing old state.
 */
export function DataGrid<T extends RowData, TFeatures extends DataGridFeatures>({
  table,
  size = "default",
  variant = "default",
  loading = false,
  emptyText,
  labels,
  className,
  children,
}: {
  table: TanTable<TFeatures, T>
  /** sm: 44 px rows for long lists on a desktop. Separate from the theme's data-density, which this follows too. */
  size?: "default" | "sm"
  variant?: Variant
  loading?: boolean
  /** Same as `labels.empty`, and wins over it. */
  emptyText?: React.ReactNode
  /** The words every part of the grid says, to translate them. */
  labels?: Partial<DataGridLabels>
  className?: string
  children: React.ReactNode
}) {
  const density: Density = size === "sm" ? "dense" : "default"
  // Memoized by hand, since the compiler skips this file: the parts render again when the table changes (useTable
  // returns a new one on every state change) or the grid's own props do, not on every render of the page around it.
  const ctx = React.useMemo<Ctx>(() => {
    const l = { ...defaultDataGridLabels, ...labels }
    // Table 9's table type is invariant in its features and row type, so a table with more features than the grid needs
    // is narrowed to the ones the parts call through unknown; dataGridFeatures in TFeatures guarantees they are there.
    return { table: table as unknown as GridTable, density, variant, loading, emptyText: emptyText ?? l.empty, labels: l }
  }, [table, density, variant, loading, emptyText, labels])
  return (
    <GridContext.Provider value={ctx}>
      <div data-slot="data-grid" className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
        {children}
      </div>
    </GridContext.Provider>
  )
}

const meta = (c: GridColumn) =>
  (c.columnDef.meta ?? {}) as { align?: "left" | "right"; headerClassName?: string; cellClassName?: string; label?: string }
/** A column's name in words: meta.label, else a plain-text header, else its id. */
const columnName = (c: GridColumn) => meta(c).label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)

/** How far one arrow key press moves a column's edge, in px; Shift and the column menu move it four times as far. */
const RESIZE_STEP = 16
/** A column's width limits: its minSize and maxSize, else TanStack's defaults (20, unbounded). */
const sizeLimits = (c: GridColumn) => ({ min: c.columnDef.minSize ?? 20, max: c.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER })
/** Moves a column's edge by `delta` px within its limits: the arrow keys on the edge, and the column menu. */
function resizeBy(c: GridColumn, delta: number) {
  const { min, max } = sizeLimits(c)
  const next = Math.min(max, Math.max(min, Math.round(c.getSize() + delta)))
  c.table.setColumnSizing((old) => ({ ...old, [c.id]: next }))
}

/**
 * A column's right edge as a focusable separator: ← → move it 16 px (Shift 64), Home and End to its limits, Enter or a
 * double-click resets it. The line is 4 px; the hit area 24 px, 44 px on touch.
 */
function ResizeHandle({ column, handler, label: l }: { column: GridColumn; handler: (e: unknown) => void; label: DataGridLabels }) {
  const size = column.getSize()
  const { min, max } = sizeLimits(column)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? RESIZE_STEP * 4 : RESIZE_STEP
    // Moving the edge right widens the column in a left-to-right page; in a right-to-left one the edge is on the left.
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const by =
      e.key === "ArrowRight" ? (rtl ? -step : step) : e.key === "ArrowLeft" ? (rtl ? step : -step) : e.key === "Home" ? min - size : e.key === "End" && max < Number.MAX_SAFE_INTEGER ? max - size : 0
    if (by) {
      e.preventDefault()
      resizeBy(column, by)
    } else if (e.key === "Enter") {
      e.preventDefault()
      column.resetSize()
    }
  }
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a focusable separator is a widget (value, arrow keys resize, Enter resets)
    <span
      role="separator"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a focusable separator is a widget (value, arrow keys resize, Enter resets)
      tabIndex={0}
      aria-orientation="vertical"
      // Named in words (meta.label, a plain-text header, else the id): a header that renders a component is a
      // function, and stringifying it read its source code aloud.
      aria-label={l.resize(columnName(column))}
      aria-valuenow={size}
      aria-valuemin={min}
      aria-valuemax={max < Number.MAX_SAFE_INTEGER ? max : undefined}
      aria-valuetext={l.width(size)}
      onMouseDown={handler}
      onTouchStart={handler}
      onDoubleClick={() => column.resetSize()}
      onKeyDown={onKeyDown}
      // The last column's edge stays inside the grid, so it never adds a sliver of sideways scroll.
      className={cn(
        "group/resize absolute inset-y-0 end-0 z-2 flex w-6 translate-x-1/2 cursor-col-resize touch-none justify-center rounded-xs select-none pointer-coarse:w-(--h-md) rtl:-translate-x-1/2",
        "group-last/th:translate-x-0 group-last/th:justify-end",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "my-2 w-1 rounded-xs transition-colors duration-(--motion-fast) ease-(--ease-standard) group-hover/resize:bg-ring group-focus-visible/resize:bg-ring",
          column.getIsResizing() && "bg-ring",
        )}
      />
    </span>
  )
}

/**
 * Table's scroll fade, starting where the pinned columns end, so they stay solid and rows fade in from behind them. The
 * offsets are --fade-start and --fade-end, set only where pinning holds.
 */
function pinnedFadeMask({ start, end }: { start: boolean; end: boolean }): React.CSSProperties | undefined {
  if (!start && !end) return undefined
  const s = "var(--fade-start, 0px)"
  const e = "var(--fade-end, 0px)"
  const image = `linear-gradient(to right, ${start ? `black ${s}, transparent ${s}, black calc(${s} + 2rem)` : "black, black"}, ${
    end ? `black calc(100% - ${e} - 2rem), transparent calc(100% - ${e}), black calc(100% - ${e})` : "black"
  })`
  return { maskImage: image, WebkitMaskImage: image }
}

/**
 * The grid itself. `maxHeight` makes the body scroll under a sticky header; `virtual` renders only the rows in view
 * (give it a maxHeight), for thousands of rows.
 */
export function DataGridTable({
  maxHeight,
  virtual = false,
  className,
  "aria-label": ariaLabel,
}: {
  maxHeight?: number
  virtual?: boolean
  className?: string
  "aria-label"?: string
}) {
  const { table, density, variant, loading, emptyText, labels: l } = useGrid()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scrollRef)
  const rows = table.getRowModel().rows
  // The virtualizer's methods read live scroll state, so this component must not be memoized either. The file's
  // "use no memo" already keeps the compiler away, but the lint rule reports the call regardless of that directive
  // (eslint-plugin-react-hooks 7.1), so the suppression stays, scoped to this one line.
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual's useVirtualizer, skipped on purpose.
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    // The row height is a token, so it follows the density (data-density) the grid sits in.
    estimateSize: () => tokenPx(scrollRef.current, density === "dense" ? "--h-md" : "--h-row") ?? (density === "dense" ? 44 : 56),
    overscan: 8,
  })
  const items = virtual ? virtualizer.getVirtualItems() : []
  const first = items[0]
  const last = items.at(-1)
  const padTop = virtual && first ? first.start : 0
  const padBottom = virtual && last ? virtualizer.getTotalSize() - last.end : 0
  // The filter only drops an item whose row is gone, which the virtualizer's count (rows.length) already rules out.
  const shown = virtual ? items.map((v) => rows[v.index]).filter((row) => row !== undefined) : rows
  const cols = table.getVisibleLeafColumns().length
  const hasFooter = table.getFooterGroups().some((g) => g.headers.some((h) => h.column.columnDef.footer))
  const cellPad = density === "dense" ? "px-3" : "px-4"
  // When the grid scrolls sideways its totals are usually off to the side, so they are written out in one row that stays
  // in view. Whether it scrolls depends on the space it is given (a card, a tablet, a phone), not on the screen's width.
  const overflows = edges.start || edges.end
  // Pinning is to the logical start and end, so it mirrors in a right-to-left page. It holds only from 448 px of grid
  // (@md): on a phone two pinned columns leave nothing to scroll. The offset is a variable because an inline style cannot
  // read the container's width.
  const pinStyle = (c: GridColumn) => {
    const p = c.getIsPinned()
    if (!p) return undefined
    return { "--pin": `${p === "start" ? c.getStart("start") : c.getAfter("end")}px` } as React.CSSProperties
  }
  // The edge between the pinned columns and those scrolling behind them is drawn, so the pinned ones read as fixed.
  const pinClass = (c: GridColumn) => {
    const p = c.getIsPinned()
    if (!p) return undefined
    return p === "start"
      ? cn("@md:sticky @md:start-(--pin) @md:z-1", table.getStartVisibleLeafColumns().at(-1)?.id === c.id && "@md:border-e @md:border-border")
      : cn("@md:sticky @md:end-(--pin) @md:z-1", table.getEndVisibleLeafColumns()[0]?.id === c.id && "@md:border-s @md:border-border")
  }
  const pinned = table.getIsSomeColumnsPinned()
  const pinnedWidths = {
    "--pinned-start": `${pinned ? table.getStartTotalSize() : 0}px`,
    "--pinned-end": `${pinned ? table.getEndTotalSize() : 0}px`,
  } as React.CSSProperties

  return (
    // The frame draws the edge and the focus ring; the scrolling box fades the columns it still hides (a phone shows only
    // the first ones), so the fade never eats the edge.
    <div
      data-slot="data-grid-frame"
      className={cn(
        "@container relative w-full rounded-md has-[>[role=region]:focus-visible]:outline-2 has-[>[role=region]:focus-visible]:outline-offset-2 has-[>[role=region]:focus-visible]:outline-ring",
        variant !== "borderless" && "ring-1 ring-border",
      )}
    >
      <div
        ref={scrollRef}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1)
        tabIndex={0}
        role="region"
        aria-label={ariaLabel ?? l.region}
        aria-busy={loading || undefined}
        style={{ ...(maxHeight ? { maxHeight } : {}), ...pinnedWidths, ...pinnedFadeMask(edges) }}
        // focus-ring: the frame around it draws the ring (has-[…:focus-visible]), so the fade does not hide it.
        className={cn("relative w-full overflow-auto rounded-md outline-none @md:[--fade-end:var(--pinned-end)] @md:[--fade-start:var(--pinned-start)]", className)}
      >
        <table className="w-full caption-bottom border-separate border-spacing-0 text-sm" style={{ minWidth: table.getTotalSize() }}>
          <thead className={cn(variant !== "borderless" && "bg-muted", maxHeight && "sticky top-0 z-10")}>
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => (
                  <th
                    key={h.id}
                    colSpan={h.colSpan}
                    aria-sort={
                      h.column.getIsSorted() === "asc"
                        ? "ascending"
                        : h.column.getIsSorted() === "desc"
                          ? "descending"
                          : h.column.getCanSort()
                            ? "none"
                            : undefined
                    }
                    style={{ width: h.getSize(), ...pinStyle(h.column) }}
                    className={cn(
                      "group/th relative h-(--h-md) border-b border-border text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
                      cellPad,
                      variant === "borders" && "border-r last:border-r-0",
                      h.column.getIsPinned() && "bg-muted",
                      pinClass(h.column),
                      meta(h.column).align === "right" && "text-right",
                      meta(h.column).headerClassName,
                    )}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanResize() && <ResizeHandle column={h.column} handler={h.getResizeHandler()} label={l} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card">
            {padTop > 0 && <tr aria-hidden="true" style={{ height: padTop }} />}
            {loading &&
              // A snapshot read is enough: the grid redraws whenever the table it is given changes.
              Array.from({ length: Math.min(table.store.state.pagination?.pageSize ?? 5, 8) }, (_, i) => (
                <tr key={`sk-${i}`} aria-hidden="true">
                  {table.getVisibleLeafColumns().map((c) => (
                    <td key={c.id} className={cn(cellPad, density === "dense" ? "h-(--h-md)" : "h-(--h-row)", "border-b border-border")}>
                      <span className="block h-3 w-3/4 animate-breath rounded-xs bg-track" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={cols} className="p-0">
                  {/* As wide as the visible part of the grid and held at its left edge, so the words stay in view however
                      wide the columns behind them are. 100cqw is the scroll area's own width (it is the container). */}
                  <div className="sticky left-0 flex min-h-32 w-[100cqw] items-center justify-center text-center whitespace-normal text-muted-foreground">
                    {typeof emptyText === "string" ? <EmptyState size="inline" title={emptyText} /> : emptyText}
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              shown.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    // Selected: the accent fill and a bar in the ink colour on the first cell, as Table marks it, so a
                    // selected row never reads as a fill under the pointer. Pinned cells paint their own fill and take it too.
                    className={cn(
                      "group/row transition-colors duration-(--motion-fast) ease-(--ease-standard) data-[state=selected]:bg-accent data-[state=selected]:*:first:shadow-selected",
                      variant === "striped" && "even:bg-muted/50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize(), ...pinStyle(cell.column) }}
                        className={cn(
                          "border-b border-border align-middle whitespace-nowrap",
                          density === "dense" ? "h-(--h-md)" : "h-(--h-row)",
                          cellPad,
                          variant === "borders" && "border-r last:border-r-0",
                          cell.column.getIsPinned() && "bg-card group-data-[state=selected]/row:bg-accent",
                          pinClass(cell.column),
                          meta(cell.column).align === "right" && "text-right tabular-nums",
                          meta(cell.column).cellClassName,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getCanExpand() && (
                    <SubRow
                      row={row}
                      cols={cols}
                      render={(table.options.meta as { renderSubRow?: (r: GridRow) => React.ReactNode } | undefined)?.renderSubRow}
                    />
                  )}
                </React.Fragment>
              ))}
            {padBottom > 0 && <tr aria-hidden="true" style={{ height: padBottom }} />}
          </tbody>
          {hasFooter && (
            <tfoot className={cn("bg-muted font-medium", maxHeight && "sticky bottom-0")}>
              {table.getFooterGroups().map((g) => (
                <React.Fragment key={g.id}>
                  <tr className={cn(overflows && "hidden")}>
                    {g.headers.map((h) => (
                      <td key={h.id} className={cn("h-(--h-md) tabular-nums", cellPad, meta(h.column).align === "right" && "text-right")}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.footer, h.getContext())}
                      </td>
                    ))}
                  </tr>
                  {/* Scrolling sideways: the totals in one row held at the visible left edge. The first column's footer
                      leads ("Total"), then each total after its column's name. */}
                  <tr className={cn(!overflows && "hidden")}>
                    <td colSpan={cols} className="p-0">
                      <div className={cn("sticky left-0 flex w-[100cqw] flex-wrap items-center gap-x-4 gap-y-1 py-3 tabular-nums", cellPad)}>
                        {g.headers
                          .filter((h) => !h.isPlaceholder && h.column.columnDef.footer)
                          .map((h, i) =>
                            i === 0 && meta(h.column).align !== "right" ? (
                              <span key={h.id}>{flexRender(h.column.columnDef.footer, h.getContext())}</span>
                            ) : (
                              <span key={h.id} className="flex items-baseline gap-2">
                                <span className="font-normal text-muted-foreground">{columnName(h.column)}</span>
                                {flexRender(h.column.columnDef.footer, h.getContext())}
                              </span>
                            ),
                          )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

/**
 * A column header that opens a menu on click: both sort orders, pinning, the column's width (for whoever cannot drag
 * its edge) and hiding. Plain text if the column can do none of them.
 */
export function DataGridColumnHeader<T extends RowData, TFeatures extends DataGridFeatures>({
  column: col,
  title,
}: {
  column: Column<TFeatures, T, unknown>
  title: string
}) {
  // The same narrowing as DataGrid's: the column has the grid's features at least.
  const column = col as unknown as GridColumn
  const l = useGridLabels()
  const sorted = column.getIsSorted()
  // The swap pattern: the three arrows sit on top of each other and the current one fades and scales in at --motion-fast,
  // so a change of order is seen on the header even though the rows move at once.
  const swap = "absolute transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)"
  const shown = (s: false | "asc" | "desc") => (sorted === s ? "scale-100 opacity-100" : "scale-60 opacity-0")
  const resizable = column.getCanResize()
  if (!column.getCanSort() && !column.getCanHide() && !column.getCanPin() && !resizable) return <>{title}</>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "press -mx-1 inline-flex h-(--h-sm) items-center gap-2 rounded-xs px-1 hover:text-foreground data-[state=open]:text-foreground",
            sorted && "text-foreground",
          )}
        >
          {title}
          {column.getCanSort() && (
            <span data-slot="sort-icon" data-sort={sorted || "none"} aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center">
              <ArrowUpDown className={cn(swap, "size-4", shown(false))} />
              <ArrowUp className={cn(swap, "size-4", shown("asc"))} />
              <ArrowDown className={cn(swap, "size-4", shown("desc"))} />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {column.getCanSort() && (
          <>
            <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
              <ArrowUp aria-hidden="true" /> {l.ascending}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
              <ArrowDown aria-hidden="true" /> {l.descending}
            </DropdownMenuItem>
          </>
        )}
        {column.getCanPin() && (
          <>
            <DropdownMenuSeparator />
            {column.getIsPinned() ? (
              <DropdownMenuItem onSelect={() => column.pin(false)}>
                <PinOff aria-hidden="true" /> {l.unpin}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => column.pin("start")}>
                <Pin aria-hidden="true" /> {l.pinLeft}
              </DropdownMenuItem>
            )}
          </>
        )}
        {resizable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => resizeBy(column, RESIZE_STEP * 4)}>
              <ChevronsLeftRight aria-hidden="true" /> {l.wider}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => resizeBy(column, -RESIZE_STEP * 4)}>
              <ChevronsRightLeft aria-hidden="true" /> {l.narrower}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => column.resetSize()}>
              <Undo2 aria-hidden="true" /> {l.resetWidth}
            </DropdownMenuItem>
          </>
        )}
        {column.getCanHide() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff aria-hidden="true" /> {l.hideColumn}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A menu of the hideable columns with a checkbox each. It is a toolbar control, so it is as tall as the field beside it
 * (--h-md), the one height of every toolbar in the kit.
 */
export function DataGridColumnVisibility({
  label,
}: {
  /** Same as DataGrid's `labels.columns`, and wins over it. */
  label?: string
}) {
  const { table, labels: l } = useGrid()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="press inline-flex h-(--h-md) shrink-0 items-center gap-2 rounded-sm px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
        >
          <Columns3 aria-hidden="true" className="size-4" /> {label ?? l.columns}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{l.showColumns}</DropdownMenuLabel>
        {table
          .getAllLeafColumns()
          .filter((c) => c.getCanHide())
          .map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={c.getIsVisible()}
              onCheckedChange={(v) => c.toggleVisibility(v === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {typeof c.columnDef.header === "string" ? c.columnDef.header : ((c.columnDef.meta as { label?: string } | undefined)?.label ?? c.id)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The kit's Pagination wired to the table's page state. */
export function DataGridPagination({
  pages = true,
  labels,
}: {
  pages?: boolean
  /** Pagination's words, to translate them. */
  labels?: React.ComponentProps<typeof Pagination>["labels"]
}) {
  const { table } = useGrid()
  const { pageIndex, pageSize } = table.store.state.pagination
  return (
    <Pagination
      page={pageIndex}
      pageSize={pageSize}
      total={table.getRowCount()}
      onPageChange={(p) => table.setPageIndex(p)}
      pages={pages}
      labels={labels}
    />
  )
}

/** "3 of 48 selected", for a bulk-action bar. */
export function DataGridSelectionSummary({ children }: { children?: React.ReactNode }) {
  const { table, labels: l } = useGrid()
  const n = table.getSelectedRowModel().rows.length
  // The bar arrives with the first selection and leaves with the last, keeping its count while it goes.
  const { mounted, leaving, done } = usePresence(n > 0)
  // State set during render rather than a ref, so the React Compiler can see what the count depends on.
  const [last, setLast] = React.useState(n)
  if (n && n !== last) setLast(n)
  if (!mounted) return null
  return (
    <div
      role="status"
      onAnimationEnd={(e) => e.target === e.currentTarget && done()}
      className={cn("flex h-(--h-md) items-center justify-between gap-3 rounded-sm bg-muted px-3 text-sm", leaving ? "animate-disappear" : "animate-appear")}
    >
      <span className="tabular-nums">{l.selected(n || last, table.getRowCount())}</span>
      <div className="flex items-center gap-2" inert={leaving || undefined}>
        {children}
      </div>
    </div>
  )
}

// An expanded row's detail: arrives under the row and leaves before the row closes up.
function SubRow({ row, cols, render }: { row: GridRow; cols: number; render?: (r: GridRow) => React.ReactNode }) {
  const { mounted, leaving, done } = usePresence(row.getIsExpanded())
  if (!mounted || !render) return null
  return (
    <tr>
      <td colSpan={cols} className="border-b border-border bg-muted/50 p-4">
        <div onAnimationEnd={(e) => e.target === e.currentTarget && done()} className={leaving ? "animate-disappear" : "animate-appear"}>
          {render(row)}
        </div>
      </td>
    </tr>
  )
}

/**
 * A selection checkbox column; the header box selects the page. With your own features: `selectColumn<Robot, typeof
 * features>()`. A row enableRowSelection refuses gets a grey box; give `reason` (read out and shown on hover).
 */
export function selectColumn<T extends RowData, TFeatures extends DataGridFeatures = typeof dataGridFeatures>({
  reason,
}: {
  /** Why a row cannot be selected, in words. */
  reason?: (row: T) => string | undefined
} = {}): ColumnDef<TFeatures, T> {
  const column: ColumnDef<DataGridFeatures, RowData> = {
    id: "select",
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    header: ({ table }) => <SelectAll table={table} />,
    cell: ({ row }) => <SelectRow row={row} reason={reason as ((row: RowData) => string | undefined) | undefined} />,
  }
  // Written against the grid's own features and the widest row, and handed back as the caller's column: a column
  // type in Table 9 is invariant in both, and this column only calls APIs that dataGridFeatures guarantees.
  return column as unknown as ColumnDef<TFeatures, T>
}

function SelectAll({ table }: { table: GridTable }) {
  const l = useGridLabels()
  return (
    <Checkbox
      aria-label={l.selectAll}
      checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
      onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
    />
  )
}

function SelectRow({ row, reason }: { row: GridRow; reason?: (row: RowData) => string | undefined }) {
  const l = useGridLabels()
  if (row.getCanSelect()) return <Checkbox aria-label={l.selectRow} checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(v === true)} />
  const why = reason?.(row.original) ?? l.cannotSelect
  // A box that cannot be ticked is filled grey, as a disabled field is, so it does not pass for an empty one; the
  // reason is in its name and, for the pointer, on the cell (a disabled control gets no hover of its own).
  return (
    <span title={why} className="inline-flex">
      <Checkbox aria-label={`${l.selectRow}, ${why}`} checked={row.getIsSelected()} disabled className="disabled:bg-muted" />
    </span>
  )
}

function DetailsHeader() {
  return <span className="sr-only">{useGridLabels().details}</span>
}

function ExpandButton({ row }: { row: GridRow }) {
  const l = useGridLabels()
  return (
    <button data-slot="data-grid-expand"
      type="button"
      aria-label={row.getIsExpanded() ? l.hideDetails : l.showDetails}
      aria-expanded={row.getIsExpanded()}
      onClick={row.getToggleExpandedHandler()}
      className="press -ml-2 flex size-(--h-sm) items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <ChevronRight
        aria-hidden="true"
        className={cn("size-4 transition-transform duration-(--motion-fast) ease-(--ease-standard)", row.getIsExpanded() && "rotate-90")}
      />
    </button>
  )
}

/** A chevron column that opens a row's detail (table meta.renderSubRow draws it). Its type arguments are selectColumn's. */
export function expandColumn<T extends RowData, TFeatures extends DataGridFeatures = typeof dataGridFeatures>(): ColumnDef<TFeatures, T> {
  const column: ColumnDef<DataGridFeatures, RowData> = {
    id: "expand",
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    header: () => <DetailsHeader />,
    cell: ({ row }) => (row.getCanExpand() ? <ExpandButton row={row} /> : null),
  }
  // Handed back as the caller's column for the reason given in selectColumn.
  return column as unknown as ColumnDef<TFeatures, T>
}
