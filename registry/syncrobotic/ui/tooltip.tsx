// @syncrobotic/tooltip v0.7.0 · update: npx shadcn add @syncrobotic/tooltip --overwrite
"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Names an icon-only control on hover and focus. Touch screens never show it,
 * so never put information here that the operator needs.
 */
export function TooltipProvider({ delayDuration = 300, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

export function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root {...props} />
    </TooltipProvider>
  )
}

export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-xs bg-primary px-2 py-1 text-xs font-medium text-primary-foreground data-[state=delayed-open]:animate-appear data-[state=instant-open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
