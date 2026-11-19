// @syncrobotic/scroll-area v0.15.0 · update: npx shadcn add @syncrobotic/scroll-area --overwrite
"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A bounded region that scrolls with a thin themed scrollbar, the same on every platform: a long log inside a card, a
 * row of thumbnails, a wide table in a panel. `fade` softens an edge only while content is hidden past it: at the start
 * nothing fades on the start side, so the first item keeps its edge and its contrast. The viewport takes focus, so
 * keyboard users can scroll it with the arrow keys.
 */
export function ScrollArea({
  className,
  children,
  orientation = "vertical",
  fade = false,
  viewportClassName,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  orientation?: "vertical" | "horizontal" | "both"
  /** Fade the edges where more content is hidden. */
  fade?: boolean
  viewportClassName?: string
}) {
  const viewport = React.useRef<HTMLDivElement>(null)
  const across = orientation === "horizontal"
  // Which edges have content hidden past them; measured on scroll and on resize, both false until measured.
  const [hidden, setHidden] = React.useState({ start: false, end: false })
  React.useEffect(() => {
    const el = viewport.current
    if (!fade || !el) return
    const measure = () => {
      const pos = across ? Math.abs(el.scrollLeft) : el.scrollTop
      const room = across ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight
      const start = pos > 1
      const end = pos < room - 1
      setHidden((h) => (h.start === start && h.end === end ? h : { start, end }))
    }
    measure()
    el.addEventListener("scroll", measure, { passive: true })
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    ro?.observe(el)
    if (el.firstElementChild) ro?.observe(el.firstElementChild)
    return () => {
      el.removeEventListener("scroll", measure)
      ro?.disconnect()
    }
  }, [fade, across])
  const fadeStyle = fade
    ? ({ "--fade-start": hidden.start ? "1.5rem" : "0rem", "--fade-end": hidden.end ? "1.5rem" : "0rem" } as React.CSSProperties)
    : undefined
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewport}
        data-slot="scroll-area-viewport"
        tabIndex={0}
        style={fadeStyle}
        className={cn(
          "size-full rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          fade && !across && "[mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
          fade && across && "[mask-image:linear-gradient(to_right,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
      {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBar({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px select-none transition-opacity duration-(--motion-fast) ease-(--ease-standard)",
        orientation === "vertical" ? "h-full w-2" : "h-2 flex-col",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-border hover:bg-muted-foreground" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
