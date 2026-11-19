// @syncrobotic/timeline v0.13.0 · update: npx shadcn add @syncrobotic/timeline --overwrite
import * as React from "react"
import { StatusGlyph, type Tone, toStatus } from "@/registry/syncrobotic/shell/status-glyph"
import { cn } from "@/lib/utils"

/**
 * Events in time order: what a robot did on a shift, how an incident unfolded, a release history.
 * Markers are neutral dots; a status tone adds its shape (and colour only for warning and danger),
 * so a calm history stays calm and the one abnormal event stands out.
 */
type Ctx = { orientation: "vertical" | "horizontal"; align: "start" | "alternate"; density: "default" | "dense" }
const TimelineCtx = React.createContext<Ctx>({ orientation: "vertical", align: "start", density: "default" })

const warned = new Set<string>()
/** Says once that `density` is now `size`, so it is not confused with the theme's data-density. Development only. */
function warnDensity(component: string, density: unknown) {
  if (density === undefined || process.env.NODE_ENV === "production" || warned.has(component)) return
  warned.add(component)
  console.warn(`${component}: \`density="dense"\` is now \`size="sm"\`. \`density\` stops working in 1.0.`)
}

export function Timeline({
  orientation = "vertical",
  align = "start",
  size,
  density: legacy,
  className,
  ...props
}: React.ComponentProps<"ol"> & {
  orientation?: "vertical" | "horizontal"
  /** alternate puts time on one side and content on the other (vertical, wide screens only). */
  align?: "start" | "alternate"
  /** sm: less space between events, for a long history. */
  size?: "default" | "sm"
  /** @deprecated Use `size="sm"`. */
  density?: "default" | "dense"
}) {
  warnDensity("Timeline", legacy)
  const density = (size ?? (legacy === "dense" ? "sm" : "default")) === "sm" ? "dense" : "default"
  return (
    <TimelineCtx.Provider value={{ orientation, align, density }}>
      <ol
        data-slot="timeline"
        data-orientation={orientation}
        // A horizontal timeline scrolls; the keyboard needs to reach it.
        tabIndex={orientation === "horizontal" ? 0 : undefined}
        className={cn(
          orientation === "horizontal"
            ? "flex w-full overflow-x-auto rounded-sm pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            : "flex flex-col",
          className,
        )}
        {...props}
      />
    </TimelineCtx.Provider>
  )
}

export function TimelineItem({
  time,
  dateTime,
  tone,
  icon,
  title,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  /** Shown as written ("09:41", "Yesterday"). */
  time?: React.ReactNode
  /** Machine-readable time for the <time> element. */
  dateTime?: string
  /** A status, drawn as its glyph. Leave empty for an ordinary event. */
  tone?: Tone
  /** An icon instead of a dot, e.g. for kinds of event. */
  icon?: React.ReactNode
  title: React.ReactNode
}) {
  const { orientation, align, density } = React.useContext(TimelineCtx)
  const marker = (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 grid shrink-0 place-items-center rounded-full bg-background",
        icon ? "size-8 text-muted-foreground ring-1 ring-border [&_svg]:size-4" : "size-4",
      )}
    >
      {icon ?? (tone ? <StatusGlyph status={toStatus(tone)} /> : <span className="size-2 rounded-full bg-muted-foreground" />)}
    </span>
  )
  const timeEl = time ? (
    <time dateTime={dateTime} className="text-xs text-muted-foreground tabular-nums">
      {time}
    </time>
  ) : null
  const body = (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={cn("text-sm font-medium", tone === "warning" && "text-warning", tone === "danger" && "text-danger")}>{title}</span>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  )
  // Line between markers: centred under the marker, through the bottom of the item.
  const line = "absolute bg-border"
  const iconSize = !!icon

  if (orientation === "horizontal") {
    return (
      <li data-slot="timeline-item" className={cn("relative flex min-w-40 flex-1 flex-col gap-3 pr-4 last:pr-0", className)} {...props}>
        <span aria-hidden="true" className={cn(line, "right-0 h-px", iconSize ? "top-4 left-8" : "top-2 left-4", "[li:last-child>&]:hidden")} />
        {marker}
        <div className="flex flex-col gap-1">
          {timeEl}
          {body}
        </div>
      </li>
    )
  }

  const gap = density === "dense" ? "pb-4" : "pb-6"
  if (align === "alternate") {
    return (
      <li data-slot="timeline-item" className={cn("relative grid grid-cols-[1fr_auto_1fr] gap-x-4", className)} {...props}>
        <div className={cn("text-right", gap)}>{timeEl}</div>
        <div className="relative flex justify-center">
          {marker}
          <span aria-hidden="true" className={cn(line, "bottom-0 w-px", iconSize ? "top-8" : "top-4", "[li:last-child_&]:hidden")} />
        </div>
        <div className={gap}>{body}</div>
      </li>
    )
  }

  return (
    <li data-slot="timeline-item" className={cn("relative flex gap-3", className)} {...props}>
      <div className="relative flex justify-center">
        {marker}
        <span aria-hidden="true" className={cn(line, "bottom-0 w-px", iconSize ? "top-8" : "top-4", "[li:last-child_&]:hidden", !iconSize && "mt-1")} />
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", gap, iconSize && "pt-1")}>
        {timeEl}
        {body}
      </div>
    </li>
  )
}

/** A label between groups of events, e.g. a day. */
export function TimelineHeading({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="timeline-heading" className={cn("pb-3 text-xs font-medium text-muted-foreground", className)} {...props} />
}
