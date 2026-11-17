// @syncrobotic/sheet v0.6.0 · update: npx shadcn add @syncrobotic/sheet --overwrite
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

const sides = {
  bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  right: "inset-y-0 right-0 h-full w-full max-w-sm rounded-l-xl",
  /** Navigation drawers, which open from the side the navigation lives on. */
  left: "inset-y-0 left-0 h-full w-full max-w-sm rounded-r-xl",
} as const

/**
 * Bottom sheet on phones (radius 24, xl, with a grab handle); right panel on wide screens; left for navigation drawers.
 */
export function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: keyof typeof sides }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim)" />
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
  return <SheetPrimitive.Title className={cn("text-lg font-bold", className)} {...props} />
}

export function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}
