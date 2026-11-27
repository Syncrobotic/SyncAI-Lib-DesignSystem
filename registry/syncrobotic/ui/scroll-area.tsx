// @syncrobotic/scroll-area v0.53.0 · update: npx shadcn add @syncrobotic/scroll-area --overwrite
"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A bounded region with a thin themed scrollbar, vertical, horizontal or both, with optional fading edges. `fade`
 * softens edges that hide content. The viewport takes focus, so the arrow keys scroll it.
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
  const edges = useHiddenEdges(viewport, fade ? (orientation === "horizontal" ? "x" : "y") : null)
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // Sideways, it takes its container's width: sized by its content (a row of tiles, a wide table) it would grow to
      // fit them, and nothing would be left to scroll.
      className={cn("relative overflow-hidden", orientation !== "vertical" && "w-full max-w-full", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewport}
        data-slot="scroll-area-viewport"
        tabIndex={0}
        // Each edge fades only while content is hidden past it: at the start of a row the first chip is whole.
        style={fade ? ({ "--fade-start": edges.start ? "1.5rem" : "0rem", "--fade-end": edges.end ? "1.5rem" : "0rem" } as React.CSSProperties) : undefined}
        className={cn(
          "size-full rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          fade && orientation !== "horizontal" && "[mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
          fade && orientation === "horizontal" && "[mask-image:linear-gradient(to_right,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]",
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

/** Which ends of the viewport still hide content along `axis` (null: not watched). */
function useHiddenEdges(ref: React.RefObject<HTMLDivElement | null>, axis: "x" | "y" | null) {
  const [edges, setEdges] = React.useState({ start: false, end: false })
  React.useEffect(() => {
    const el = ref.current
    if (!el || !axis) return
    const update = () => {
      const pos = axis === "x" ? el.scrollLeft : el.scrollTop
      const max = axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight
      const start = pos > 1
      const end = pos < max - 1
      setEdges((e) => (e.start === start && e.end === end ? e : { start, end }))
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update)
    ro?.observe(el)
    if (el.firstElementChild) ro?.observe(el.firstElementChild)
    return () => {
      el.removeEventListener("scroll", update)
      ro?.disconnect()
    }
  }, [ref, axis])
  return edges
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
