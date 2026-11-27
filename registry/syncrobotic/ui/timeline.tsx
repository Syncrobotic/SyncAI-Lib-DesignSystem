// @syncrobotic/timeline v0.53.0 · update: npx shadcn add @syncrobotic/timeline --overwrite
"use client"

import * as React from "react"
import { type Status, StatusGlyph, statusText } from "@/registry/syncrobotic/shell/status-glyph"
import { cn } from "@/lib/utils"

type Ctx = { orientation: "vertical" | "horizontal"; align: "start" | "alternate"; density: "default" | "dense" }
const TimelineCtx = React.createContext<Ctx>({ orientation: "vertical", align: "start", density: "default" })

/**
 * Events in time order with neutral markers, status glyphs or icons; vertical, alternate or horizontal, grouped by day.
 * A status is coloured only for warning and danger, so the one abnormal event stands out.
 */
export function Timeline({
  orientation = "vertical",
  align = "start",
  size = "default",
  className,
  ...props
}: React.ComponentProps<"ol"> & {
  orientation?: "vertical" | "horizontal"
  /** alternate puts time on one side and content on the other (vertical, wide screens only). */
  align?: "start" | "alternate"
  /** sm: less space between events, for a long history. */
  size?: "default" | "sm"
}) {
  const density = size === "sm" ? "dense" : "default"
  const list = React.useRef<HTMLOListElement>(null)
  const more = useMoreToTheRight(list, orientation === "horizontal")
  return (
    <TimelineCtx.Provider value={{ orientation, align, density }}>
      <ol
        ref={list}
        data-slot="timeline"
        data-orientation={orientation}
        // A horizontal timeline scrolls; the keyboard needs to reach it.
        tabIndex={orientation === "horizontal" ? 0 : undefined}
        className={cn(
          orientation === "horizontal"
            ? cn(
                "flex w-full overflow-x-auto rounded-sm pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                // Events past the right edge: the last visible one fades out, the cue that the row scrolls.
                more && "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]",
              )
            : "flex flex-col",
          className,
        )}
        {...props}
      />
    </TimelineCtx.Provider>
  )
}

/** Whether a sideways-scrolling list still hides events past its right edge. */
function useMoreToTheRight(ref: React.RefObject<HTMLElement | null>, watch: boolean) {
  const [more, setMore] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || !watch) return
    const update = () => setMore(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update)
    ro?.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro?.disconnect()
    }
  }, [ref, watch])
  return more
}

export function TimelineItem({
  time,
  dateTime,
  status,
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
  /** A status, drawn as its glyph (or on the icon): only warning and danger are coloured, the mark and never the title. Leave empty for an ordinary event. */
  status?: Status
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
        icon ? "size-8 ring-1 ring-border [&_svg]:size-4" : "size-4",
        // An icon takes the status colour when the event is a warning or a failure; otherwise it stays grey.
        icon && (status === "warning" || status === "danger" ? statusText[status] : "text-muted-foreground"),
      )}
    >
      {icon ?? (status ? <StatusGlyph status={status} /> : <span className="size-2 rounded-full bg-muted-foreground" />)}
    </span>
  )
  const timeEl = time ? (
    <time dateTime={dateTime} className="text-xs text-muted-foreground tabular-nums">
      {time}
    </time>
  ) : null
  const body = (
    <div className="flex min-w-0 flex-col gap-1">
      {/* The title stays in the text colour: status colour is for the status mark only. */}
      <span className="text-sm font-medium">
        {title}
        {/* The glyph is hidden from screen readers, so the status is said in words, as Marker does. */}
        {(status === "danger" || status === "warning") && <span className="sr-only"> {status === "danger" ? "failed" : "warning"}</span>}
      </span>
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
