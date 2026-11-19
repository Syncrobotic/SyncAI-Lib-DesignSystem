// @syncrobotic/data-grid v0.17.4 · update: npx shadcn add @syncrobotic/data-grid --overwrite
"use client"

import * as React from "react"
import { flexRender, type Column, type ColumnDef, type Row, type Table as TanTable } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Columns3, EyeOff, Pin, PinOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
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
import { scrollFadeMask, useScrollEdges } from "@/registry/syncrobotic/ui/table"

type Density = "default" | "dense"

const warned = new Set<string>()
/** Says once that `density` is now `size`, so it is not confused with the theme's data-density. Development only. */
function warnDensity(component: string, density: unknown) {
  if (density === undefined || process.env.NODE_ENV === "production" || warned.has(component)) return
  warned.add(component)
  console.warn(`${component}: \`density="dense"\` is now \`size="sm"\`. \`density\` stops working in 1.0.`)
}

/** A height token in px as it resolves at `el` (rem or px), or undefined before mount. */
function tokenPx(el: HTMLElement | null, name: string) {
  if (!el) return undefined
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  const n = parseFloat(v)
  if (!n) return undefined
  return v.endsWith("rem") ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}
type Variant = "default" | "striped" | "borders" | "borderless"
type Ctx = { table: TanTable<unknown>; density: Density; variant: Variant; loading: boolean; emptyText: React.ReactNode }
const GridContext = React.createContext<Ctx | null>(null)
const useGrid = () => {
  const c = React.useContext(GridContext)
  if (!c) throw new Error("DataGrid parts must be inside <DataGrid>")
  return c
}

/**
 * A data table on TanStack Table: sorting, pagination, selection, column visibility, pinning and resizing, expandable
 * rows, totals, a loading state, and virtual scrolling for thousands of rows. You build the table with useReactTable
 * and these parts draw it in the kit's style: rows 56 px (44 dense), numbers tabular and right-aligned, selection on the
 * accent fill. For a handful of static rows, Table is enough.
 *
 * Pass useReactTable data and columns that keep their identity between renders (module scope or useMemo): a new array
 * on every render recomputes the rows, TanStack auto-resets state, and the component renders again without end.
 */
export function DataGrid<T>({
  table,
  size,
  density: legacy,
  variant = "default",
  loading = false,
  emptyText = "No rows",
  className,
  children,
}: {
  table: TanTable<T>
  /** sm: 44 px rows for long lists on a desktop. Separate from the theme's data-density, which this follows too. */
  size?: "default" | "sm"
  /** @deprecated Use `size="sm"`. */
  density?: Density
  variant?: Variant
  loading?: boolean
  emptyText?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  warnDensity("DataGrid", legacy)
  const density: Density = (size ?? (legacy === "dense" ? "sm" : "default")) === "sm" ? "dense" : "default"
  return (
    <GridContext.Provider value={{ table: table as TanTable<unknown>, density, variant, loading, emptyText }}>
      <div data-slot="data-grid" className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
        {children}
      </div>
    </GridContext.Provider>
  )
}

const meta = (c: Column<unknown>) =>
  (c.columnDef.meta ?? {}) as { align?: "left" | "right"; headerClassName?: string; cellClassName?: string; label?: string }
/** A column's name in words: meta.label, else a plain-text header, else its id. */
const columnName = (c: Column<unknown>) => meta(c).label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)

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
  const { table, density, variant, loading, emptyText } = useGrid()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scrollRef)
  const rows = table.getRowModel().rows
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    // The row height is a token, so it follows the density (data-density) the grid sits in.
    estimateSize: () => tokenPx(scrollRef.current, density === "dense" ? "--h-md" : "--h-row") ?? (density === "dense" ? 44 : 56),
    overscan: 8,
  })
  const items = virtual ? virtualizer.getVirtualItems() : []
  const padTop = virtual && items.length ? items[0].start : 0
  const padBottom = virtual && items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0
  const shown = virtual ? items.map((v) => rows[v.index]) : rows
  const cols = table.getVisibleLeafColumns().length
  const hasFooter = table.getFooterGroups().some((g) => g.headers.some((h) => h.column.columnDef.footer))
  const cellPad = density === "dense" ? "px-3" : "px-4"
  // When the grid scrolls sideways its totals are usually off to the side, so they are written out in one row that stays
  // in view. Whether it scrolls depends on the space it is given (a card, a tablet, a phone), not on the screen's width.
  const overflows = edges.start || edges.end
  const pinStyle = (c: Column<unknown>): React.CSSProperties | undefined => {
    const p = c.getIsPinned()
    if (!p) return undefined
    return { position: "sticky", [p]: p === "left" ? c.getStart("left") : c.getAfter("right"), zIndex: 1 }
  }

  return (
    // The frame draws the edge and the focus ring; the scrolling box fades the columns it still hides (a phone shows only
    // the first ones), so the fade never eats the edge.
    <div
      data-slot="data-grid-frame"
      className={cn(
        "relative w-full rounded-md has-[>[role=region]:focus-visible]:outline-2 has-[>[role=region]:focus-visible]:outline-offset-2 has-[>[role=region]:focus-visible]:outline-ring",
        variant !== "borderless" && "ring-1 ring-border",
      )}
    >
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel ?? "Data"}
        aria-busy={loading || undefined}
        style={{ ...(maxHeight ? { maxHeight } : {}), ...scrollFadeMask(edges) }}
        // focus-ring: the frame around it draws the ring (has-[…:focus-visible]), so the fade does not hide it.
        className={cn(
          "@container relative w-full overflow-auto rounded-md outline-none",
          className,
        )}
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
                      "relative h-(--h-md) border-b border-border text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
                      cellPad,
                      variant === "borders" && "border-r last:border-r-0",
                      h.column.getIsPinned() && "bg-muted",
                      meta(h.column).align === "right" && "text-right",
                      meta(h.column).headerClassName,
                    )}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanResize() && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${String(h.column.columnDef.header ?? h.id)}`}
                        onMouseDown={h.getResizeHandler()}
                        onTouchStart={h.getResizeHandler()}
                        onDoubleClick={() => h.column.resetSize()}
                        className={cn(
                          "absolute top-2 right-0 bottom-2 w-1 cursor-col-resize touch-none rounded-xs select-none hover:bg-ring",
                          h.column.getIsResizing() && "bg-ring",
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card">
            {padTop > 0 && <tr aria-hidden="true" style={{ height: padTop }} />}
            {loading &&
              Array.from({ length: Math.min(table.getState().pagination?.pageSize ?? 5, 8) }, (_, i) => (
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
                  <div className="sticky left-0 flex h-32 w-[100cqw] items-center justify-center px-4 text-center whitespace-normal text-muted-foreground">
                    {emptyText}
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              shown.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={cn(
                      "transition-colors duration-(--motion-fast) ease-(--ease-standard) data-[state=selected]:bg-accent",
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
                          cell.column.getIsPinned() && "bg-card",
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
                      render={(table.options.meta as { renderSubRow?: (r: Row<unknown>) => React.ReactNode } | undefined)?.renderSubRow}
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
 * A column header with sorting (click toggles, and a menu offers both orders), hiding and pinning. Plain text if the
 * column can do none of them.
 */
export function DataGridColumnHeader<T>({ column, title }: { column: Column<T, unknown>; title: string }) {
  const sorted = column.getIsSorted()
  // The swap pattern: the three arrows sit on top of each other and the current one fades and scales in at --motion-fast,
  // so a change of order is seen on the header even though the rows move at once.
  const swap = "absolute transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)"
  const shown = (s: false | "asc" | "desc") => (sorted === s ? "scale-100 opacity-100" : "scale-60 opacity-0")
  if (!column.getCanSort() && !column.getCanHide() && !column.getCanPin()) return <>{title}</>
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
              <ArrowUp aria-hidden="true" /> Ascending
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
              <ArrowDown aria-hidden="true" /> Descending
            </DropdownMenuItem>
          </>
        )}
        {column.getCanPin() && (
          <>
            <DropdownMenuSeparator />
            {column.getIsPinned() ? (
              <DropdownMenuItem onSelect={() => column.pin(false)}>
                <PinOff aria-hidden="true" /> Unpin
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => column.pin("left")}>
                <Pin aria-hidden="true" /> Pin to the left
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff aria-hidden="true" /> Hide column
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A menu of the hideable columns with a checkbox each. */
export function DataGridColumnVisibility({ label = "Columns" }: { label?: string }) {
  const { table } = useGrid()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="press inline-flex h-(--h-sm) items-center gap-2 rounded-sm px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
        >
          <Columns3 aria-hidden="true" className="size-4" /> {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
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
export function DataGridPagination({ pages = true }: { pages?: boolean }) {
  const { table } = useGrid()
  const { pageIndex, pageSize } = table.getState().pagination
  return <Pagination page={pageIndex} pageSize={pageSize} total={table.getRowCount()} onPageChange={(p) => table.setPageIndex(p)} pages={pages} />
}

/** "3 of 48 selected", for a bulk-action bar. */
export function DataGridSelectionSummary({ children }: { children?: React.ReactNode }) {
  const { table } = useGrid()
  const n = table.getSelectedRowModel().rows.length
  // The bar arrives with the first selection and leaves with the last, keeping its count while it goes.
  const { mounted, leaving, done } = usePresence(n > 0)
  const last = React.useRef(n)
  if (n) last.current = n
  if (!mounted) return null
  return (
    <div
      role="status"
      onAnimationEnd={(e) => e.target === e.currentTarget && done()}
      className={cn("flex h-(--h-md) items-center justify-between gap-3 rounded-sm bg-muted px-3 text-sm", leaving ? "animate-disappear" : "animate-appear")}
    >
      <span className="tabular-nums">
        {last.current} of {table.getRowCount()} selected
      </span>
      <div className="flex items-center gap-2" inert={leaving || undefined}>
        {children}
      </div>
    </div>
  )
}

// An expanded row's detail: arrives under the row and leaves before the row closes up.
function SubRow({ row, cols, render }: { row: Row<unknown>; cols: number; render?: (r: Row<unknown>) => React.ReactNode }) {
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

/** A checkbox column for row selection; the header box selects the page. */
export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all on this page"
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox aria-label="Select row" checked={row.getIsSelected()} disabled={!row.getCanSelect()} onCheckedChange={(v) => row.toggleSelected(v === true)} />
    ),
  }
}

/** A chevron column that opens a row's detail (table meta.renderSubRow draws it). */
export function expandColumn<T>(): ColumnDef<T> {
  return {
    id: "expand",
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    header: () => <span className="sr-only">Details</span>,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <button
          type="button"
          aria-label={row.getIsExpanded() ? "Hide details" : "Show details"}
          aria-expanded={row.getIsExpanded()}
          onClick={row.getToggleExpandedHandler()}
          className="press -ml-2 flex size-(--h-sm) items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronRight
            aria-hidden="true"
            className={cn("size-4 transition-transform duration-(--motion-fast) ease-(--ease-standard)", row.getIsExpanded() && "rotate-90")}
          />
        </button>
      ) : null,
  }
}
