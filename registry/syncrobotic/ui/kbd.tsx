// @syncrobotic/kbd v0.28.0 · update: npx shadcn add @syncrobotic/kbd --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A key on the keyboard, in shortcuts and instructions: ⌘K, Esc, Space. One key per Kbd; a chord is a KbdGroup. How a
 * key is pressed ("Hold", "Double-press") is a word beside it, never a Kbd.
 * On a dark surface (a tooltip) it inverts with the surface by inheriting the text colour.
 * `pressed` shows the key going down while its shortcut runs (useHotkeys returns which one): it sinks, and its edge
 * thickens to the text colour, so the change is size and weight, not colour alone.
 */
export function Kbd({ className, pressed, ...props }: React.ComponentProps<"kbd"> & { pressed?: boolean }) {
  return (
    <kbd
      data-slot="kbd"
      data-pressed={pressed || undefined}
      className={cn(
        "inline-flex h-6 min-w-6 shrink-0 items-center justify-center gap-1 rounded-2xs bg-muted px-1 font-sans text-xs font-medium text-muted-foreground ring-1 ring-border ring-inset select-none [&_svg]:size-4",
        "transition-[scale,color,box-shadow] duration-(--motion-fast) ease-(--ease-standard) data-pressed:scale-90 data-pressed:text-foreground data-pressed:ring-2 data-pressed:ring-foreground",
        "[[data-slot=tooltip-content]_&]:bg-white/15 [[data-slot=tooltip-content]_&]:text-current [[data-slot=tooltip-content]_&]:ring-white/20",
        className,
      )}
      {...props}
    />
  )
}

const noSubscribe = () => () => {}

/**
 * The platform's modifier key for a shortcut: "⌘" on a Mac, iPhone or iPad, "Ctrl" elsewhere. The server and the first
 * render say "⌘"; the browser's own answer follows at once.
 */
export function useModKey() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "⌘",
  )
}

/** Keys pressed together. Screen readers hear "Control plus K"; the plus signs are not drawn. */
export function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />
}
