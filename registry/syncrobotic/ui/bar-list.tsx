// @syncrobotic/bar-list v0.40.0 · update: npx shadcn add @syncrobotic/bar-list --overwrite
import type * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/registry/syncrobotic/lib/format-count"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"

export type BarListItem = {
  key: string
  /** What is counted: a class, a format, a site. Truncates on one line; the whole name is in its title and read in full. */
  label: string
  value: number
  /** Where this row leads, such as the list filtered to it: the row becomes a link. */
  href?: string
}

export type BarListLabels = {
  /** Under the list when `max` leaves rows out: "4 more". The count comes formatted. */
  more: (count: string) => string
  /** Shown in place of the list when it has no items. */
  empty: string
}

export const defaultBarListLabels: BarListLabels = {
  more: (count) => `${count} more`,
  empty: "Nothing to show",
}

/**
 * A short ranked list of counts ("items per class", "files per format"), drawn without a chart library. Each row is its
 * label and its value in words, with a bar under it in the accent (`--chart-1`) scaled to the largest value, so the
 * numbers are in the text and it needs no table view, as a sparkline does. One series: no status colours, no colour per
 * row. A `<ul>` with no surface of its own, so it sits in a card, a table cell or a sheet; rows with `href` are links.
 */
export function BarList({
  items,
  max,
  locale,
  format,
  label,
  linkAs: Link = "a",
  labels: labelsProp,
  className,
}: {
  /** The rows, in the order to show them: largest first for a ranking. */
  items: BarListItem[]
  /** Show this many rows, then "N more". All of them when left out. */
  max?: number
  /** Formats the values (a BCP 47 tag such as "zh-TW"): "412,345". */
  locale?: string
  /** How to write the values, e.g. `{ notation: "compact" }` (412K). */
  format?: Intl.NumberFormatOptions
  /** Names the list for screen readers, e.g. "Items by class". Show the same words as the title of the card around it. */
  label: string
  /** Your router's link (e.g. next/link), for rows with `href`. */
  linkAs?: React.ElementType
  /** The words it says, to translate them. */
  labels?: Partial<BarListLabels>
  className?: string
}) {
  const l = { ...defaultBarListLabels, ...labelsProp }
  // Grouped, in English unless a locale is asked for, so a number never changes between server and browser.
  const num = (n: number) => formatNumber(n, { ...format, locale })
  // Scaled to the largest value of all the items, shown or not, so a row's bar does not change with `max`.
  const top = Math.max(0, ...items.map((i) => i.value))
  const shown = max !== undefined ? items.slice(0, Math.max(0, max)) : items
  const rest = items.length - shown.length

  if (!items.length)
    return (
      <div data-slot="bar-list" data-empty="" className={cn("w-full min-w-0", className)}>
        <EmptyState size="inline" title={l.empty} />
      </div>
    )

  return (
    <div data-slot="bar-list" className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
      <ul aria-label={label} className="flex flex-col gap-1">
        {shown.map((item) => {
          const pct = top > 0 ? (Math.max(0, item.value) / top) * 100 : 0
          const row = (
            <>
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span title={item.label} className={cn("min-w-0 truncate", item.href && "underline decoration-muted-foreground underline-offset-4 group-hover:decoration-foreground")}>
                  {item.label}
                </span>
                <span className="shrink-0 font-medium tabular-nums">{num(item.value)}</span>
              </span>
              {/* The bar is the picture of the value written above it: hidden from screen readers. A value above zero keeps
                  4 px, so a small count still shows. */}
              <span aria-hidden="true" className="block h-2">
                <span
                  data-slot="bar-list-bar"
                  className={cn("block h-full rounded-2xs bg-chart-1 transition-[width] duration-(--motion-base) ease-(--ease-standard)", pct > 0 && "min-w-1")}
                  style={{ width: `${pct}%` }}
                />
              </span>
            </>
          )
          const rowClass = "flex min-h-(--h-sm) flex-col justify-center gap-1 py-1"
          return (
            <li key={item.key} data-slot="bar-list-item">
              {item.href ? (
                // The whole row is the target: 36 px tall with a mouse, 44 on touch (--h-sm). The ring is drawn inside it.
                <Link
                  data-slot="bar-list-link"
                  href={item.href}
                  className={cn(
                    rowClass,
                    "group -mx-2 rounded-xs px-2 text-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  {row}
                </Link>
              ) : (
                <div className={rowClass}>{row}</div>
              )}
            </li>
          )
        })}
      </ul>
      {rest > 0 && (
        <p data-slot="bar-list-more" className="text-xs text-muted-foreground tabular-nums">
          {l.more(num(rest))}
        </p>
      )}
    </div>
  )
}
