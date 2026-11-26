// @syncrobotic/responsive-table v0.45.0 · update: npx shadcn add @syncrobotic/responsive-table --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** One column, written once for both layouts. */
export type ResponsiveTableColumn<T> = {
  /** A stable key for the column. */
  id: string
  /** The column's header on wide screens. */
  header: React.ReactNode
  /** What the cell shows for a row, in the table and (unless `phoneCell` is given) in the phone row. */
  cell: (row: T) => React.ReactNode
  /** `end` for numbers, so their digits line up. */
  align?: "start" | "end"
  /**
   * Where the column goes in the phone row: `title` (the row's name, the first column unless one says so), `meta` (the
   * line under it, joined with " · "; the default for the other columns), `trailing` (the state or the value at the
   * row's end, one column) or `hidden`. Keep the meta line to one or two facts.
   */
  phone?: "title" | "meta" | "trailing" | "hidden"
  /**
   * Prose that is the point of the row (a failure's reason, a note): it wraps instead of staying on one line. In the
   * table the cell keeps at least 12rem so it never narrows to a word a line; on a phone a `meta` column that wraps gets
   * a line of its own under the row's facts, in full, instead of being cut at the end of the meta line.
   */
  wrap?: boolean
  /** A shorter form for the phone row ("82 %" where the table cell draws a meter). */
  phoneCell?: (row: T) => React.ReactNode
  /** A sortable column's order (TableHead's `sort`). */
  sort?: "asc" | "desc" | false
  /** Makes the header a sort button (TableHead's `onSort`). Sort from a control of your own on phones, where there is no header. */
  onSort?: () => void
  /** Classes for the column's header and cells on wide screens (a width, `hidden lg:table-cell`). */
  className?: string
}

export type ResponsiveTableLabels = {
  /** The hidden header of the actions column. */
  actions: string
}

const defaultLabels: ResponsiveTableLabels = { actions: "Actions" }

/** The table needs this much of its own width (36rem, 576 px); narrower, the rows are a grouped list. */
const TABLE_MIN_REM = 36

/**
 * The same rows as a Table where there is room and as a grouped list (ListGroup and ListRow) on a phone or in a narrow
 * column, from one list of columns. Its own width decides, not the screen's: under 36rem the rows are a list. Only one
 * of the two is rendered, so nothing is read twice; before the first measure (the server's HTML) both are in the page and
 * a container query shows one, so a phone never sees a table flash.
 */
export function ResponsiveTable<T>({
  rows,
  columns,
  rowKey,
  label,
  onRowClick,
  rowActions,
  empty,
  layout = "auto",
  labels,
  className,
}: {
  rows: readonly T[]
  columns: readonly ResponsiveTableColumn<T>[]
  /** A stable key for each row. */
  rowKey: (row: T) => React.Key
  /** Names the table, and the list on a phone, for screen readers ("Robots"). */
  label: string
  /** Opens a row: the title cell becomes a button in the table, the whole row a button with a chevron on a phone. */
  onRowClick?: (row: T) => void
  /** A row's ⋯ menu or one or two icon buttons (`DropdownMenuMoreTrigger` with the row's name): the table's last cell, the end of a phone row. */
  rowActions?: (row: T) => React.ReactNode
  /** What shows when there are no rows: an EmptyState with `size="inline"`. */
  empty?: React.ReactNode
  /** `auto` measures its own width; `table` or `list` fixes the layout (a side panel that is always narrow). */
  layout?: "auto" | "table" | "list"
  /** The words it says, to translate them. */
  labels?: Partial<ResponsiveTableLabels>
  className?: string
}) {
  const l = { ...defaultLabels, ...labels }
  const frame = React.useRef<HTMLDivElement>(null)
  const measured = useFitsTable(frame, layout === "auto")
  const mode = layout === "auto" ? measured : layout

  // The row's name on a phone: the column marked title, else the first. A table always has a column.
  const titleColumn = columns.find((c) => c.phone === "title") ?? columns[0]!
  const trailingColumn = columns.find((c) => c.phone === "trailing" && c !== titleColumn)
  const metaColumns = columns.filter((c) => c !== titleColumn && c !== trailingColumn && (c.phone ?? "meta") === "meta")
  const phoneValue = (c: ResponsiveTableColumn<T>, row: T) => (c.phoneCell ?? c.cell)(row)

  const table = (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.id} sort={c.sort} onSort={c.onSort} className={cn(c.align === "end" && "text-right", c.wrap && "min-w-48", c.className)}>
              {c.header}
            </TableHead>
          ))}
          {rowActions && (
            <TableHead className="w-0 pr-2 pl-0 sm:px-4">
              <span className="sr-only">{l.actions}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && empty ? (
          <TableRow>
            <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="h-auto py-4 whitespace-normal">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={rowKey(row)} data-slot="responsive-table-row">
              {columns.map((c) => (
                <TableCell key={c.id} className={cn(c.align === "end" && "text-right", c.wrap && "min-w-48 py-3 whitespace-normal", c.className)}>
                  {c === titleColumn && onRowClick ? (
                    <button
                      type="button"
                      data-slot="responsive-table-open"
                      onClick={() => onRowClick(row)}
                      className="press flex min-h-(--h-md) items-center text-left font-medium hover:underline"
                    >
                      {c.cell(row)}
                    </button>
                  ) : (
                    c.cell(row)
                  )}
                </TableCell>
              ))}
              {rowActions && <TableActionsCell>{rowActions(row)}</TableActionsCell>}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  const list =
    rows.length === 0 ? (
      empty ? <ListGroup className="py-4">{empty}</ListGroup> : null
    ) : (
      <ListGroup role="list" aria-label={label}>
        {rows.map((row) => {
          const present = (m: { value: React.ReactNode }) => m.value !== null && m.value !== undefined && m.value !== ""
          const values = metaColumns.map((c) => ({ id: c.id, wrap: c.wrap, value: phoneValue(c, row) })).filter(present)
          // The facts share one line, cut at its end; prose that wraps follows, a line each, in full.
          const facts = values.filter((m) => !m.wrap)
          const prose = values.filter((m) => m.wrap)
          const trailing = trailingColumn ? phoneValue(trailingColumn, row) : undefined
          return (
            // The item draws the hairline, so a row and its actions share one line between rows.
            <div key={rowKey(row)} role="listitem" data-slot="responsive-table-item" className="flex items-center gap-2 border-b border-border last:border-b-0">
              <div className="min-w-0 flex-1">
                <ListRow
                  title={phoneValue(titleColumn, row)}
                  meta={
                    prose.length ? (
                      <>
                        {facts.length > 0 && <span className="block truncate">{joined(facts)}</span>}
                        {prose.map((m) => (
                          <span key={m.id} className="block whitespace-normal break-words">
                            {m.value}
                          </span>
                        ))}
                      </>
                    ) : facts.length ? (
                      joined(facts)
                    ) : undefined
                  }
                  trailing={typeof trailing === "number" ? String(trailing) : trailing}
                  chevron={!!onRowClick}
                  onClick={onRowClick && (() => onRowClick(row))}
                  // The title is the words that matter: two lines on a phone, never cut to "Two robots lost sign…".
                  wrap
                />
              </div>
              {rowActions && <div className="flex shrink-0 items-center">{rowActions(row)}</div>}
            </div>
          )
        })}
      </ListGroup>
    )

  return (
    <div ref={frame} data-slot="responsive-table" data-layout={mode ?? undefined} className={cn("@container w-full", className)}>
      {mode === null ? (
        <>
          <div className="hidden @xl:block">{table}</div>
          <div className="@xl:hidden">{list}</div>
        </>
      ) : mode === "table" ? (
        table
      ) : (
        list
      )}
    </div>
  )
}

/** The meta line's facts, joined with " · ". */
function joined(items: { id: string; value: React.ReactNode }[]) {
  return items.map((m, i) => (
    <React.Fragment key={m.id}>
      {i > 0 && " · "}
      {m.value}
    </React.Fragment>
  ))
}

/**
 * "table" or "list" from the element's own width, kept up to date as it changes; null until it has a width (on the
 * server, and while it is hidden), when the container query decides instead.
 */
function useFitsTable(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [mode, setMode] = React.useState<"table" | "list" | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el) return
    const update = () => {
      const width = el.getBoundingClientRect().width
      if (!width) return
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      setMode(width >= TABLE_MIN_REM * rem ? "table" : "list")
    }
    update()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, enabled])
  return mode
}
