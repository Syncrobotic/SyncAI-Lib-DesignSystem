// @syncrobotic/hover-card v0.51.0 · update: npx shadcn add @syncrobotic/hover-card --overwrite
"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A preview of what a link leads to, shown while the pointer rests on it or the link has keyboard focus. Preview only:
 * touch screens never show it, and screen readers are not told it is there, so everything in it is also on the page the
 * link opens, and nothing in it is a control.
 *
 * It waits 500 ms before opening, so moving the pointer across a table of robot IDs does not flash a card under each one,
 * and 300 ms before closing, so the pointer can cross the gap onto the card to read it.
 */
export function HoverCard({ openDelay = 500, closeDelay = 300, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay} {...props} />
}

/** The link it previews. Use `asChild` on a real link (an `a`, or your router's Link) that goes where the card's facts live. */
export function HoverCardTrigger(props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

/** The card: styled like PopoverContent, 288 px wide. It keeps 8 px from the screen's edges, the app shell's gutter. */
export function HoverCardContent({ className, align = "center", sideOffset = 8, collisionPadding = 8, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        // focus-ring: the card never takes focus (focus stays on its link, which shows its own ring); nothing in it is a control.
        className={cn(
          "z-50 w-72 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-border outline-none data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
