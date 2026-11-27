// @syncrobotic/page-header v0.51.0 · update: npx shadcn add @syncrobotic/page-header --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * The block a page opens with: a breadcrumb, one h1 and a line, one InlineStatus, meta pills and actions on the right.
 * No label above the title: the breadcrumb says where, the title says what.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  status,
  badges,
  meta,
  actions,
  metaLabel = "About this page",
  as: Heading = "h1",
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** A Breadcrumb, shown above the title. */
  breadcrumb?: React.ReactNode
  /**
   * The state of what the page shows (a robot, a job, a dataset), beside the title: one `InlineStatus`, at most one. Its
   * shape and word, no box, so it never reads as one more fact in the meta row.
   */
  status?: React.ReactNode
  /** Badges for fixed attributes (an environment as an outline, Beta, a version), after the title and its status. */
  badges?: React.ReactNode
  /** MetaPills: facts about the page, such as counts, owner and last update. A state goes in `status`, not here. */
  meta?: React.ReactNode
  /** Buttons for this page, at the right on wide screens and under the title on phones. */
  actions?: React.ReactNode
  /** Names the row of meta pills for screen readers. */
  metaLabel?: string
  /** The title's heading level: h1 for the page's own header, h2 for one under another h1 (a sheet, a tab, an example). */
  as?: "h1" | "h2"
  className?: string
}) {
  return (
    <header data-slot="page-header" className={cn("flex flex-col gap-3 pb-6", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl min-w-0 flex-col gap-2">
          {status || badges ? (
            // The status, then the badges, sit on the title's line after it, and wrap under it on a narrow screen.
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Heading className="text-3xl font-bold tracking-tight text-balance">{title}</Heading>
              {status && (
                <span data-slot="page-header-status" className="inline-flex">
                  {status}
                </span>
              )}
              {badges && (
                <span data-slot="page-header-badges" className="inline-flex flex-wrap items-center gap-2">
                  {badges}
                </span>
              )}
            </div>
          ) : (
            <Heading className="text-3xl font-bold tracking-tight text-balance">{title}</Heading>
          )}
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
 * One fact about the page as a quiet tag ("128 datasets"); with `href` it is a link. A state is not a fact: it goes in
 * PageHeader's `status`.
 */
export function MetaPill({
  icon,
  href,
  linkAs: Link = "a",
  className,
  children,
}: {
  icon?: React.ReactNode
  /** Where the fact leads: the pill becomes a link, the same height on screen, with a 36 px target (44 on touch). */
  href?: string
  /** Your router's link (e.g. next/link), for `href`. */
  linkAs?: React.ElementType
  className?: string
  children: React.ReactNode
}) {
  const pill = cn(
    "inline-flex h-(--h-tag) items-center gap-2 rounded-xs px-2 text-xs text-muted-foreground ring-1 ring-border ring-inset [&_svg]:size-4",
    // A link's words are foreground, as every link's.
    href && "relative text-foreground",
  )
  const content = (
    <>
      {icon}
      {children}
    </>
  )
  if (!href)
    return (
      <span role="listitem" data-slot="meta-pill" className={cn(pill, className)}>
        {content}
      </span>
    )
  return (
    <span role="listitem" data-slot="meta-pill" className="inline-flex">
      <Link
        data-slot="meta-pill-link"
        href={href}
        className={cn(
          pill,
          "underline decoration-muted-foreground underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:decoration-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          // The target is taller than the pill: --h-sm (36 px with a mouse, 44 on touch), centred on it, so the header's
          // rows keep their height.
          "after:absolute after:inset-x-0 after:top-1/2 after:h-(--h-sm) after:-translate-y-1/2",
          className,
        )}
      >
        {content}
      </Link>
    </span>
  )
}
