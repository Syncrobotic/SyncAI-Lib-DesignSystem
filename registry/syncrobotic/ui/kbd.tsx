// @syncrobotic/kbd v0.10.0 · update: npx shadcn add @syncrobotic/kbd --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A key on the keyboard, in shortcuts and instructions: ⌘K, Esc, Hold Space. One key per Kbd; a chord is a KbdGroup.
 * On a dark surface (a tooltip) it inverts with the surface by inheriting the text colour.
 */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-6 min-w-6 shrink-0 items-center justify-center gap-1 rounded-2xs bg-muted px-1 font-sans text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset select-none [&_svg]:size-4",
        "[[data-slot=tooltip-content]_&]:bg-white/15 [[data-slot=tooltip-content]_&]:text-current [[data-slot=tooltip-content]_&]:ring-white/20",
        className,
      )}
      {...props}
    />
  )
}

/** Keys pressed together. Screen readers hear "Control plus K"; the plus signs are not drawn. */
export function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />
}
