// @syncrobotic/table v0.8.0 · update: npx shadcn add @syncrobotic/table --overwrite
import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Dense data for dashboards. Numbers are tabular by default; right-align numeric columns. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      // A table wider than the screen scrolls; keyboard users reach it with Tab and scroll it with the arrow keys.
      tabIndex={0}
      className="relative w-full overflow-x-auto rounded-md ring-1 ring-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
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
  return <tr data-slot="table-row" className={cn("border-b border-border data-[state=selected]:bg-accent", className)} {...props} />
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

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("py-3 text-sm text-muted-foreground", className)} {...props} />
}
