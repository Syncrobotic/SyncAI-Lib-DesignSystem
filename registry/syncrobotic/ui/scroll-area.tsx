// @syncrobotic/scroll-area v0.9.0 · update: npx shadcn add @syncrobotic/scroll-area --overwrite
"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A bounded region that scrolls with a thin themed scrollbar, the same on every platform: a long log inside a card, a
 * row of thumbnails, a wide table in a panel. `fade` softens the edges where content is hidden past them. The viewport
 * takes focus, so keyboard users can scroll it with the arrow keys.
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
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        className={cn(
          "size-full rounded-[inherit] outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          fade && orientation !== "horizontal" && "[mask-image:linear-gradient(to_bottom,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]",
          fade && orientation === "horizontal" && "[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]",
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
