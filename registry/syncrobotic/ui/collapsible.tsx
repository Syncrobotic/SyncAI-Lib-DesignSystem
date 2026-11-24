// @syncrobotic/collapsible v0.32.0 · update: npx shadcn add @syncrobotic/collapsible --overwrite
"use client"

import type * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * One region behind one trigger: "More filters", "How to use this", a long note. Not a section, so the trigger needs no
 * heading; for a set of sections with headings use Accordion, which it matches (the chevron, the focus ring, the motion).
 * Closed by default (`defaultOpen`, or `open` and `onOpenChange`).
 */
export function Collapsible(props: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/** A text button with the accordion's chevron after its words, turned up while open. `aria-expanded` says which. */
export function CollapsibleTrigger({ className, children, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "press inline-flex min-h-(--h-sm) items-center gap-2 rounded-2xs text-left text-sm font-medium",
        "disabled:pointer-events-none disabled:text-disabled [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--motion-base) ease-(--ease-standard)" />
    </CollapsiblePrimitive.Trigger>
  )
}

/**
 * The region. It opens and closes in height at --motion-base (instant under reduced motion), and only once Radix has
 * measured it: content open in the server's HTML shows at once, without growing on first paint. Closed, it leaves the
 * page; `forceMount` keeps it mounted for a show and hide of your own, as in Radix.
 */
export function CollapsibleContent({ className, children, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden",
        // The height Radix measured is in the style attribute only after hydration; until then nothing animates.
        "[&[style*=--radix-collapsible-content-height]]:data-[state=open]:animate-expand",
        "[&[style*=--radix-collapsible-content-height]]:data-[state=closed]:animate-collapse",
      )}
      {...props}
    >
      <div className={cn("pt-2", className)}>{children}</div>
    </CollapsiblePrimitive.Content>
  )
}
