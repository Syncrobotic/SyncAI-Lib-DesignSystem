// @syncrobotic/viewport-overlay v0.51.0 · update: npx shadcn add @syncrobotic/viewport-overlay --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/** Where chrome sits over a canvas, a map or a picture. `top` and `bottom` span the width; `center` fills the frame. */
export type ViewportOverlayPosition = "top-left" | "top" | "top-right" | "bottom-left" | "bottom" | "bottom-right" | "center"

// One inset for everything drawn over a viewport: 16 px from the frame's edges (24 would eat a phone-sized map, 8 crowds
// the frame's ring), pieces 8 px apart. The top corners stack downwards; the bottom ones sit in a row on the bottom edge.
const placement: Record<ViewportOverlayPosition, string> = {
  "top-left": "top-4 left-4 flex-col items-start",
  top: "top-4 right-4 left-4 flex-col items-start",
  "top-right": "top-4 right-4 flex-col items-end",
  "bottom-left": "bottom-4 left-4 items-end",
  bottom: "right-4 bottom-4 left-4 items-end",
  "bottom-right": "right-4 bottom-4 items-end justify-end",
  center: "inset-0 grid place-items-center p-4",
}

/**
 * The place for chrome over a viewport (a map, a camera): a corner or edge, 16 px in, pieces 8 px apart. Pointer events
 * pass through to the canvas; give pressable pieces `pointer-events-auto`. Keep the bottom right clear for the stop.
 */
export function ViewportOverlay({
  position = "top-left",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** The corner or edge: top-left (the default), top, top-right, bottom-left, bottom, bottom-right, or center (a message over the whole frame). */
  position?: ViewportOverlayPosition
}) {
  return (
    <div
      data-slot="viewport-overlay"
      data-position={position}
      className={cn("pointer-events-none absolute", position !== "center" && "flex gap-2", placement[position], className)}
      {...props}
    />
  )
}

/**
 * One piece of chrome over a viewport: a banner, a legend, a small panel. `float` (default) is the kit's Float, opaque in
 * high contrast; `scrim` is words straight over a picture, in the dark theme's ink. Never `bg-background` (the page).
 */
export function ViewportPanel({
  as = "div",
  variant = "float",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  /** The element: a `p` for a line of words, `li` inside a list, `div` (the default) for anything with controls. */
  as?: "div" | "p" | "li" | "span"
  /** float (the default) over a map or a canvas; scrim for words over a picture. */
  variant?: "float" | "scrim"
  ref?: React.Ref<HTMLElement>
}) {
  // One element of a few, with the props of any of them: the cast only widens the tag for the type checker.
  const Comp = as as unknown as React.ComponentType<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement>; "data-slot": string; "data-variant": string }>
  return (
    <Comp
      data-slot="viewport-panel"
      data-variant={variant}
      className={cn(
        "rounded-sm px-3 py-2 text-sm",
        variant === "float" ? "bg-float text-foreground shadow-float ring-1 ring-edge backdrop-blur-xl" : "dark bg-scrim text-foreground",
        className,
      )}
      {...props}
    />
  )
}
