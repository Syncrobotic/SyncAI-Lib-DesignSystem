// @syncrobotic/popover v0.53.0 · update: npx shadcn add @syncrobotic/popover --overwrite
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Extra detail anchored to a control. It opens on click, takes focus, and closes on Escape or a click outside, returning
 * focus to the control; a name for an icon-only control is a Tooltip, a decision a Dialog.
 */
export const Popover = PopoverPrimitive.Root
export function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}
export const PopoverAnchor = PopoverPrimitive.Anchor

export function PopoverContent({ className, align = "center", sideOffset = 8, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        // focus-ring: the panel only holds focus for what is inside it; it is not a control, its contents show their own rings.
        className={cn("z-50 w-72 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-border outline-none data-[state=open]:animate-appear data-[state=closed]:animate-disappear", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
