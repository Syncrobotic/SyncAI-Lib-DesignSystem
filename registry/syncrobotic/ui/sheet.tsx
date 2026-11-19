// @syncrobotic/sheet v0.14.1 · update: npx shadcn add @syncrobotic/sheet --overwrite
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

// A sheet floats 8 px from the screen's edges, the app shell's gutter, so it reads as one more panel on the page instead
// of a slab glued to the glass; every corner is rounded. The bottom sheet also clears the home indicator.
const sides = {
  bottom:
    "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[85dvh] rounded-xl data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom",
  right:
    "inset-2 ml-auto max-w-sm rounded-xl data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right",
  /** Navigation drawers, which open from the side the navigation lives on. */
  left: "inset-2 mr-auto max-w-sm rounded-xl data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left",
} as const

/**
 * Bottom sheet on phones (radius 24, xl, with a grab handle); right panel on wide screens; left for navigation drawers.
 * Each floats 8 px in from the screen's edges. A side sheet fills the space between those edges up to `max-w-sm`;
 * set `w-*` or `sm:max-w-*` to change it, and auto margins keep it on its side.
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
        {side === "bottom" && <span aria-hidden="true" className="mx-auto -mt-2 block h-1 w-10 shrink-0 rounded-full bg-border" />}
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-xl font-bold", className)} {...props} />
}

export function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}
