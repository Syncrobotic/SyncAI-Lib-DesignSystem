// @syncrobotic/page-header v0.17.3 · update: npx shadcn add @syncrobotic/page-header --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { StatusGlyph, type Tone, toStatus } from "@/registry/syncrobotic/shell/status-glyph"

/**
 * The block a page opens with: where you are (a breadcrumb above), what the page is (one h1 and a line), facts about it
 * (meta pills), and its actions on the right. No label above the title: the breadcrumb says where, the title says what.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  meta,
  actions,
  metaLabel = "About this page",
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** A Breadcrumb, shown above the title. */
  breadcrumb?: React.ReactNode
  /** MetaPills: counts, owner, last update, a status. */
  meta?: React.ReactNode
  /** Buttons for this page, at the right on wide screens and under the title on phones. */
  actions?: React.ReactNode
  /** Names the row of meta pills for screen readers. */
  metaLabel?: string
  className?: string
}) {
  return (
    <header data-slot="page-header" className={cn("flex flex-col gap-3 pb-6", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
          {description && <p className="text-base text-pretty text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {meta && (
        <div role="list" aria-label={metaLabel} className="flex flex-wrap items-center gap-2">
          {meta}
        </div>
      )}
    </header>
  )
}

/**
 * One fact about the page, as a quiet tag: "128 datasets", "Updated 2 h ago", "Owner: Data team". A status (`tone`)
 * adds its glyph; only warning and danger are coloured, like everywhere else.
 */
export function MetaPill({ tone, icon, className, children }: { tone?: Tone; icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <span
      role="listitem"
      data-slot="meta-pill"
      className={cn(
        "inline-flex h-(--h-tag) items-center gap-2 rounded-xs px-2 text-xs text-muted-foreground ring-1 ring-border ring-inset [&_svg]:size-4",
        tone === "warning" && "text-warning",
        tone === "danger" && "text-danger",
        className,
      )}
    >
      {tone ? <StatusGlyph status={toStatus(tone)} /> : icon}
      {children}
    </span>
  )
}
