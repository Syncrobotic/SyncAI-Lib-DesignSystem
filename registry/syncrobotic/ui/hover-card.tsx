// @syncrobotic/hover-card v0.51.0 · update: npx shadcn add @syncrobotic/hover-card --overwrite
"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A preview of where a link leads, on hover or keyboard focus. Touch never shows it and screen readers are not told, so
 * everything in it must also be on the linked page, and nothing in it is a control. Opens after 500 ms (no flashing across
 * a table of links) and closes after 300 ms (time to cross onto the card).
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
