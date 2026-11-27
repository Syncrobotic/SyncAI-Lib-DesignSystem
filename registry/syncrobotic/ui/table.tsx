// @syncrobotic/table v0.50.0 · update: npx shadcn add @syncrobotic/table --overwrite
"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Which ends of a sideways-scrolling box still hide content, so a fade can say there is more that way. The data grid
 * uses it too.
 */
export function useScrollEdges(ref: React.RefObject<HTMLElement | null>) {
  const [edges, setEdges] = React.useState({ start: false, end: false })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const start = el.scrollLeft > 4
      const end = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
      setEdges((e) => (e.start === start && e.end === end ? e : { start, end }))
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update)
    ro?.observe(el)
    if (el.firstElementChild) ro?.observe(el.firstElementChild)
    return () => {
      el.removeEventListener("scroll", update)
      ro?.disconnect()
    }
  }, [ref])
  return edges
}

/**
 * The cue that a box scrolls sideways: its content fades out at each end that still hides columns. A mask, so whatever
 * is behind shows through (a grey header row fades to the card, a white row to the card): no coloured smear over the
 * rows and nothing painted over the frame's edge. Put it on the scrolling box; draw the edge on a box around it.
 */
export function scrollFadeMask({ start, end }: { start: boolean; end: boolean }): React.CSSProperties | undefined {
  if (!start && !end) return undefined
  const image = `linear-gradient(to right, ${start ? "transparent, black 2rem" : "black, black"}, ${end ? "black calc(100% - 2rem), transparent" : "black"})`
  return { maskImage: image, WebkitMaskImage: image }
}

/**
 * Dense data for dashboards. Numbers are tabular by default; right-align numeric columns. Give phones their own layout
 * first (hide secondary columns below sm, stack them under the first cell); a table that still scrolls fades on the
 * side that hides columns. `bare` inside something that is already a surface (a card, a sheet, a panel): no edge of its
 * own, only the hairlines between rows, so edges never nest.
 */
export function Table({ className, bare, ...props }: React.ComponentProps<"table"> & { bare?: boolean }) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const edges = useScrollEdges(scroller)
  return (
    // The frame draws the edge and the focus ring, so the fade on the scrolling box never eats either.
    <div
      data-slot="table-frame"
      data-bare={bare || undefined}
      className="relative w-full rounded-md ring-1 ring-border data-bare:ring-0 has-[>[data-slot=table-container]:focus-visible]:outline-2 has-[>[data-slot=table-container]:focus-visible]:outline-offset-2 has-[>[data-slot=table-container]:focus-visible]:outline-ring"
    >
      <div
        ref={scroller}
        data-slot="table-container"
        // A table wider than the screen scrolls; keyboard users reach it with Tab and scroll it with the arrow keys.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1)
        tabIndex={0}
        style={scrollFadeMask(edges)}
        // focus-ring: the frame around it draws the ring (has-[…:focus-visible]), so the fade does not hide it.
        className="relative w-full overflow-x-auto rounded-md outline-none"
      >
        <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("bg-muted [&_tr]:border-b", className)} {...props} />
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("bg-card [&_tr:last-child]:border-0", className)} {...props} />
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("border-b border-border data-[state=selected]:bg-accent data-[state=selected]:*:first:shadow-selected", className)} {...props} />
}

/**
 * A column header. Give it `sort` and `onSort` to make it sortable: the whole label becomes a button, the header announces
 * its order (aria-sort), and an arrow shows it; unsorted columns show a neutral two-way arrow.
 */
export function TableHead({
  className,
  children,
  sort,
  onSort,
  ...props
}: React.ComponentProps<"th"> & { sort?: "asc" | "desc" | false; onSort?: () => void }) {
  const sortable = onSort !== undefined
  // The swap pattern (like CopyButton): all three arrows are drawn in one spot and cross-fade, so a change of order
  // reads as a change instead of a jump.
  const arrow = (s: typeof sort, Icon: typeof ArrowUp) => (
    <Icon
      aria-hidden="true"
      className={cn(
        "absolute size-4 transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)",
        (sort || false) === s ? "scale-100 opacity-100" : "scale-60 opacity-0",
      )}
    />
  )
  return (
    <th
      data-slot="table-head"
      aria-sort={sortable ? (sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none") : undefined}
      className={cn("h-(--h-md) px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground", className)}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          data-slot="table-head-sort"
          onClick={onSort}
          className={cn("press -mx-1 inline-flex h-(--h-sm) items-center gap-2 rounded-xs px-1 hover:text-foreground", sort && "text-foreground")}
        >
          {children}
          <span className="relative flex size-4 items-center justify-center">
            {arrow(false, ArrowUpDown)}
            {arrow("asc", ArrowUp)}
            {arrow("desc", ArrowDown)}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  )
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("h-(--h-row) px-4 align-middle whitespace-nowrap", className)} {...props} />
}

/**
 * The last cell of a row, holding its ⋯ menu (`DropdownMenuMoreTrigger` with the row's name) or one or two icon buttons:
 * as narrow as what it holds, at the row's end. On phones it gives its start padding to the cell before it and keeps
 * 8 px at the end, so the ⋯ lines up down the table on every width.
 */
export function TableActionsCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-actions-cell" className={cn("h-(--h-row) w-0 pr-2 pl-0 text-right align-middle whitespace-nowrap sm:px-4", className)} {...props} />
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("py-3 text-sm text-muted-foreground", className)} {...props} />
}
