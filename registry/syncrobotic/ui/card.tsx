// @syncrobotic/card v0.53.0 · update: npx shadcn add @syncrobotic/card --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * One surface with radius 16 for a group of related content, with CardMedia for a cover picture. Do not nest cards;
 * group rows inside one card instead.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col gap-4 rounded-md bg-card p-4 text-card-foreground ring-1 ring-border", className)} {...props} />
}

const mediaAspects = { video: "aspect-video", "4/3": "aspect-4/3", square: "aspect-square", auto: "" } as const

/**
 * A picture on a card: a cover across the top, or `inset` inside the padding. It keeps its `aspect` before the picture
 * loads; an `<img>` or `<video>` in it fills it.
 */
export function CardMedia({
  inset = false,
  aspect = "video",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Inside the card's padding, with its own corners, instead of edge to edge at the top. */
  inset?: boolean
  /** The box's shape, kept before and after the picture loads: 16:9 by default; `auto` lets the content decide. */
  aspect?: keyof typeof mediaAspects
}) {
  return (
    <div
      data-slot="card-media"
      data-inset={inset || undefined}
      className={cn(
        "relative overflow-hidden bg-muted [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover",
        mediaAspects[aspect],
        // Edge to edge: out through the card's padding (p-4); first in the card it clips to the card's top corners, the
        // parent's own step (rounded-[inherit]), so the corners stay concentric.
        inset ? "rounded-sm" : "-mx-4 first:-mt-4 first:rounded-t-[inherit]",
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />
}

/** A card's heading. `as` sets its level so the page outline has no gap; the size stays the same. */
export function CardTitle({
  as: Heading = "h3",
  className,
  ...props
}: React.ComponentProps<"h3"> & {
  /** The heading level: h3 by default; h2 for a card right under the page's h1, h4 for one in a section under an h3. */
  as?: "h2" | "h3" | "h4"
}) {
  return <Heading data-slot="card-title" className={cn("text-base font-bold", className)} {...props} />
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
 * The head of a card that shows data: title, figure and summary, then controls (Chart / Table, a range, a legend). Under
 * 28rem of card width the controls go under the summary; wider, they sit top right.
 */
export function CardDataHeader({
  title,
  titleAs: Heading = "h3",
  actions,
  className,
  children,
}: {
  title: React.ReactNode
  /** The title's heading level: h3 by default; h2 for a card right under the page's h1, h4 for one under an h3. */
  titleAs?: "h2" | "h3" | "h4"
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
          <Heading className="text-sm font-medium">{title}</Heading>
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
