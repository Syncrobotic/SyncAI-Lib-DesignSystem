// @syncrobotic/list v0.6.0 · update: npx shadcn add @syncrobotic/list --overwrite
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** One surface per group. Rows are separated by an inset hairline, never nested cards. */
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
}

export function ListRow({ title, meta, lead, trailing, chevron, onClick }: RowProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="press flex min-h-(--h-row) w-full items-center gap-3 border-b border-border py-2 text-left last:border-b-0"
    >
      {lead}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{title}</span>
        {meta && <span className="truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      {typeof trailing === "string" ? <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">{trailing}</span> : trailing}
      {chevron && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />}
    </Comp>
  )
}
