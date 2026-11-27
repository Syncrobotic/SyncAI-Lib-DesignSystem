// @syncrobotic/tooltip v0.51.0 · update: npx shadcn add @syncrobotic/tooltip --overwrite
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

export function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * Escape inside a native <dialog> closes the dialog (and the tooltip). Radix's layer would take the key for the tooltip
 * alone, so the dialog gets a `cancel` event as if it had the key, which it can refuse.
 */
function escapeToDialog(e: KeyboardEvent) {
  const dialog = (document.activeElement as HTMLElement | null)?.closest("dialog[open]") as HTMLDialogElement | null
  if (!dialog) return
  e.preventDefault()
  if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close()
}

export function TooltipContent({ className, sideOffset = 8, onEscapeKeyDown, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        onEscapeKeyDown={(e) => {
          onEscapeKeyDown?.(e)
          if (!e.defaultPrevented) escapeToDialog(e)
        }}
        className={cn(
          "z-50 rounded-xs bg-primary px-2 py-1 text-xs font-medium text-primary-foreground data-[state=delayed-open]:animate-appear data-[state=instant-open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
