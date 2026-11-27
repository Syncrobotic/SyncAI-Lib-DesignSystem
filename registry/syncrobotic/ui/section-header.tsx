// @syncrobotic/section-header v0.53.0 · update: npx shadcn add @syncrobotic/section-header --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"

const levels = {
  // A section of the page, outside any card: 16 px bold, under the page's title (18) and level with a card's title.
  page: { heading: "text-base font-bold", description: "text-sm", as: "h2" },
  // A section inside a card, a sheet or a panel: 14 px medium, never bold, as CardDataHeader's title.
  surface: { heading: "text-sm font-medium", description: "text-xs", as: "h3" },
} as const

/**
 * A section heading at page level (16 px bold, outside cards) or surface level (14 px medium, inside one), with an
 * optional count, a line and actions; `as` sets the heading level. The count is written in full (1,284, never 1.2K). A
 * data card opens with CardDataHeader; a page with PageHeader.
 */
export function SectionHeader({
  title,
  variant = "page",
  as,
  count,
  locale,
  description,
  actions,
  id,
  className,
}: {
  title: React.ReactNode
  /** `page`: a section of the page, outside any card (16 px bold). `surface`: inside a card, a sheet or a panel (14 px medium). */
  variant?: "page" | "surface"
  /** The heading level: h2 for `page` and h3 for `surface` by default. Set it so the page's outline skips no level; the look stays the same. */
  as?: "h2" | "h3" | "h4"
  /** How many items the section holds, after the title in muted text: full, with grouping (formatCount). */
  count?: number
  /** The locale the count is written in (English by default). */
  locale?: string
  /** One line under the title. */
  description?: React.ReactNode
  /** Buttons for this section ("View all", "Add"): `size="sm"` in a `surface` header. */
  actions?: React.ReactNode
  /** The heading's id, for a section's `aria-labelledby`. */
  id?: string
  className?: string
}) {
  const level = levels[variant]
  const Heading = as ?? level.as
  return (
    <div
      data-slot="section-header"
      data-variant={variant}
      className={cn("flex flex-wrap justify-between gap-x-4 gap-y-2", description ? "items-start" : "items-center", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading id={id} className={cn(level.heading, "text-pretty")}>
          {title}
          {count !== undefined && (
            <>
              {" "}
              <span data-slot="section-header-count" className="ms-1 font-normal text-muted-foreground tabular-nums">
                {formatCount(count, { locale })}
              </span>
            </>
          )}
        </Heading>
        {description && <p className={cn(level.description, "text-pretty text-muted-foreground")}>{description}</p>}
      </div>
      {actions && (
        <div data-slot="section-header-actions" className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
