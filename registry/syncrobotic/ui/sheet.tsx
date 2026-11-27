// @syncrobotic/sheet v0.53.0 · update: npx shadcn add @syncrobotic/sheet --overwrite
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A panel that slides in and floats 8 px from the screen's edges: a bottom sheet with a grab handle on phones, a side
 * panel on wide screens, a drawer for navigation. Like a Dialog it keeps focus inside until it closes; Escape closes it.
 */
export const Sheet = SheetPrimitive.Root
export function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}
export function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

// A sheet floats 8 px from the screen's edges, the app shell's gutter, so it reads as one more panel on the page instead
// of a slab glued to the glass; every corner is rounded. The bottom sheet also clears the home indicator.
const sides = {
  bottom:
    "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[85dvh] rounded-xl data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom",
  right:
    "inset-2 ml-auto max-w-sm rounded-xl data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right",
  /**
   * A detail or a form beside the page: from the bottom on a phone (under 640 px), from the right from 640 px, decided
   * in CSS so the first paint is already the right one. What most sheets want.
   */
  end: "rounded-xl max-sm:inset-x-2 max-sm:bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-sm:max-h-[85dvh] max-sm:data-[state=open]:animate-sheet-in-bottom max-sm:data-[state=closed]:animate-sheet-out-bottom sm:inset-2 sm:ml-auto sm:max-w-sm sm:data-[state=open]:animate-sheet-in-right sm:data-[state=closed]:animate-sheet-out-right",
  /** Navigation drawers, which open from the side the navigation lives on. */
  left: "inset-2 mr-auto max-w-sm rounded-xl data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left",
} as const

/**
 * A bottom sheet on phones, a right panel on wide screens, left for navigation drawers; `end` is bottom under 640 px and
 * right from it. It floats 8 px from the edges, up to `max-w-sm` (change with `w-*` or `sm:max-w-*`).
 */
export function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: keyof typeof sides }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-fade-in data-[state=closed]:animate-disappear data-[state=closed]:[animation-duration:var(--motion-sheet)]" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-popover p-6 text-popover-foreground shadow-overlay ring-1 ring-border",
          sides[side],
          className,
        )}
        {...props}
      >
        {(side === "bottom" || side === "end") && (
          <span aria-hidden="true" className={cn("mx-auto -mt-2 block h-1 w-10 shrink-0 rounded-full bg-border", side === "end" && "sm:hidden")} />
        )}
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />
}

/**
 * The sheet's actions, at its bottom. When the content is taller than the sheet and scrolls, the footer stays pinned to
 * the bottom edge with the sheet's own padding under it, so the primary action is never cut in half.
 */
export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  // It pins to the scroller's edge, where -mb-6 puts it in the flow, not 24 px up at its padding: pinned there it would
  // cover the last field and its focus ring even when everything fits.
  return <div className={cn("sticky -bottom-6 z-10 -mx-6 mt-auto -mb-6 flex flex-col gap-2 bg-popover px-6 pt-2 pb-6", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-xl font-bold", className)} {...props} />
}

export function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}
