// @syncrobotic/card v0.5.0 · update: npx shadcn add @syncrobotic/card --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/** One surface, radius 16 (md). Do not nest cards; group rows inside one card instead. */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col gap-4 rounded-md bg-card p-4 text-card-foreground ring-1 ring-border", className)} {...props} />
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-lg font-bold", className)} {...props} />
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-2", className)} {...props} />
}

/**
 * The head of a card that shows data (a chart, a heatmap, a ring, a status strip), the same on every such card: the
 * title, then the figure and summary under it, then the controls (Chart / Table, a range, a legend). In a narrow card
 * (under 28rem: a phone, a dashboard column) the controls go under the summary; in a wide one they sit at the top right.
 * The card's own width decides, not the screen's.
 */
export function CardDataHeader({
  title,
  actions,
  className,
  children,
}: {
  title: React.ReactNode
  /** Controls: the Chart / Table switch, a range. */
  actions?: React.ReactNode
  className?: string
  /** What comes under the title: a CardFigure, a one-line summary. */
  children?: React.ReactNode
}) {
  return (
    <div data-slot="card-data-header" className={cn("@container", className)}>
      <div className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {children}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** The number that leads a data card, with a short note beside it ("+12 % on last week"). */
export function CardFigure({ value, note }: { value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <p data-slot="card-figure" className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {note && <span className="text-xs text-muted-foreground tabular-nums">{note}</span>}
    </p>
  )
}
