// @syncrobotic/pagination v0.12.0 · update: npx shadcn add @syncrobotic/pagination --overwrite
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import type { Navigate } from "@/registry/syncrobotic/ui/filter-form"

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
 * (`pages`). Pages are zero-based in code and one-based on screen. Previous and next disable at the ends. In a narrow
 * container (under 36rem) numbered pages fold to previous / current / next; the range stays on one line.
 *
 * With `href` every page is a link (`?page=3`), so a page can be shared, Back works and it needs no JavaScript; pass
 * `onNavigate` to route through the app's router instead of a full load.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  href,
  onNavigate,
  pages = false,
  labels,
  className,
}: {
  page: number
  pageSize: number
  total: number
  /** For pages kept in state. Not needed with `href`. */
  onPageChange?: (page: number) => void
  /** Link mode: the URL of a page (zero-based), e.g. (p) => `?page=${p + 1}`. */
  href?: (page: number) => string
  /** In link mode, follow a link through the app's router; without it the browser loads the page. */
  onNavigate?: Navigate
  /** Show numbered page buttons between previous and next. */
  pages?: boolean
  labels?: Labels
  className?: string
}) {
  const l = { ...defaults, ...labels }
  const count = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  // One control per page: a link in link mode, a button otherwise. An end that does not exist is a disabled button.
  const go = (n: number, props: React.ComponentProps<typeof Button>, children: React.ReactNode) => {
    if (!href || props.disabled)
      return (
        <Button {...props} onClick={() => onPageChange?.(n)}>
          {children}
        </Button>
      )
    const url = href(n)
    return (
      <Button {...props} asChild>
        <a
          href={url}
          onClick={(e) => {
            onPageChange?.(n)
            if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            onNavigate(url, "push")
          }}
        >
          {children}
        </a>
      </Button>
    )
  }
  return (
    // A container, so the row fits the space it is given (a card, a sheet, a phone), not the screen: under 36rem the
    // numbered pages fold to the current one between previous and next. The range never wraps; if even the compact row
    // does not fit, the buttons move under it.
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("@container flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground", className)}
    >
      <span aria-live="polite" className="whitespace-nowrap tabular-nums">
        {total === 0 ? l.empty : l.range(from, to, total)}
      </span>
      <div className="flex shrink-0 items-center gap-1" /* icon-gap-ok: 4 px between page buttons, not an icon and its label */>
        {go(page - 1, { variant: "outline", size: "icon-sm", "aria-label": l.previous, disabled: page <= 0 }, <ChevronLeft aria-hidden="true" />)}
        {pages &&
          pageList(page, count).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} aria-hidden="true" className="hidden w-6 text-center @xl:inline">
                …
              </span>
            ) : (
              <React.Fragment key={n}>
                {go(
                  n,
                  {
                    variant: n === page ? "secondary" : "ghost",
                    size: "icon-sm",
                    "aria-label": l.page(n + 1),
                    "aria-current": n === page ? "page" : undefined,
                    className: cn("tabular-nums", n === page ? "font-medium text-foreground" : "hidden @xl:inline-flex"),
                  },
                  n + 1,
                )}
              </React.Fragment>
            ),
          )}
        {go(page + 1, { variant: "outline", size: "icon-sm", "aria-label": l.next, disabled: page >= count - 1 }, <ChevronRight aria-hidden="true" />)}
      </div>
    </nav>
  )
}
