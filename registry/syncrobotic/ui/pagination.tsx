// @syncrobotic/pagination v0.8.0 · update: npx shadcn add @syncrobotic/pagination --overwrite
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

type Labels = { range?: (from: number, to: number, total: number) => string; previous?: string; next?: string; page?: (n: number) => string; empty?: string }

const defaults = {
  range: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
  previous: "Previous page",
  next: "Next page",
  page: (n: number) => `Page ${n}`,
  empty: "Nothing to show",
}

/** Page numbers to show: the first, the last, the current and its neighbours, with gaps marked by null. */
function pageList(page: number, count: number): (number | null)[] {
  const keep = new Set([0, count - 1, page - 1, page, page + 1].filter((n) => n >= 0 && n < count))
  const out: (number | null)[] = []
  for (let n = 0; n < count; n++) {
    if (keep.has(n)) out.push(n)
    else if (out[out.length - 1] !== null) out.push(null)
  }
  return out
}

/**
 * Where you are in a long list and how to move through it: "1–5 of 8" and previous / next, or numbered pages
 * (`pages`). Pages are zero-based in code and one-based on screen. Previous and next disable at the ends.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pages = false,
  labels,
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Show numbered page buttons between previous and next. */
  pages?: boolean
  labels?: Labels
  className?: string
}) {
  const l = { ...defaults, ...labels }
  const count = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <nav aria-label="Pagination" data-slot="pagination" className={cn("flex items-center justify-between gap-4 text-sm text-muted-foreground", className)}>
      <span aria-live="polite" className="tabular-nums">
        {total === 0 ? l.empty : l.range(from, to, total)}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" aria-label={l.previous} disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        {pages &&
          pageList(page, count).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} aria-hidden="true" className="w-6 text-center">
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={l.page(n + 1)}
                aria-current={n === page ? "page" : undefined}
                className={cn("tabular-nums", n === page && "font-medium text-foreground")}
                onClick={() => onPageChange(n)}
              >
                {n + 1}
              </Button>
            ),
          )}
        <Button variant="outline" size="icon-sm" aria-label={l.next} disabled={page >= count - 1} onClick={() => onPageChange(page + 1)}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
