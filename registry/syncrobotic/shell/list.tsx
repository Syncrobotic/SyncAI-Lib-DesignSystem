// @syncrobotic/list v0.53.0 · update: npx shadcn add @syncrobotic/list --overwrite
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A grouped list: one surface per group with inset dividers, icons only when they carry meaning, and status as shape
 * plus word. Never nested cards.
 */
export function ListGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col rounded-md bg-card px-4 ring-1 ring-border", className)} {...props} />
}

type RowProps = {
  title: React.ReactNode
  meta?: React.ReactNode
  /** Only when the icon carries meaning (event snapshot, step number). No decorative tiles. */
  lead?: React.ReactNode
  /** Value text or InlineStatus. Filled badges belong in headers, not rows. */
  trailing?: React.ReactNode
  /** Show only when the row leads somewhere. */
  chevron?: boolean
  onClick?: () => void
  /**
   * The title wraps to a second line (clamped past that) instead of being cut, and the trailing slot moves under it rather
   * than squeeze it below 160 px. For a row whose title is the words that matter (an incident, an alarm).
   */
  wrap?: boolean
}

export function ListRow({ title, meta, lead, trailing, chevron, onClick, wrap }: RowProps) {
  const Comp = onClick ? "button" : "div"
  const end = (
    <>
      {typeof trailing === "string" ? <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">{trailing}</span> : trailing}
      {chevron && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />}
    </>
  )
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-(--h-row) w-full items-center gap-3 border-b border-border py-2 text-left last:border-b-0",
        wrap && "flex-wrap gap-y-1",
        onClick && "press",
      )}
    >
      {/* The lead sits on the title's line (20 px), not the middle of title and meta, so an icon reads with its name. */}
      <span className={cn("flex min-w-0 flex-1 items-start gap-3", wrap && "basis-40")}>
        {lead && <span className="flex min-h-5 shrink-0 items-center">{lead}</span>}
        <span className="flex min-w-0 flex-1 flex-col">
          {/* Clamped, not cut short in the DOM: the whole title stays in the row's accessible name. */}
          <span className={wrap ? "line-clamp-2 text-sm font-medium break-words" : "truncate text-sm font-medium"}>
            {title}
          </span>
          {meta && <span className="truncate text-xs text-muted-foreground">{meta}</span>}
        </span>
      </span>
      {/* Wrapping, the trailing slot and the chevron move together, to the end of a line of their own when it comes to that. */}
      {wrap && (trailing || chevron) ? <span className="ml-auto flex shrink-0 items-center gap-3">{end}</span> : end}
    </Comp>
  )
}
