// @syncrobotic/accordion v0.51.0 · update: npx shadcn add @syncrobotic/accordion --overwrite
"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-border last:border-b-0", className)} {...props} />
}

/** The button that opens an item, inside a heading. `as` sets that heading's level so the page outline has no gap. */
export function AccordionTrigger({
  as: Heading = "h3",
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** The level of the heading the trigger sits in: h3 by default; h2 under the page's h1, h4 under an h3. The look stays the same. */
  as?: "h2" | "h3" | "h4"
}) {
  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="flex">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            "press flex min-h-(--h-row) flex-1 items-center justify-between gap-4 text-left text-sm font-medium",
            "disabled:pointer-events-none disabled:text-disabled [&[data-state=open]>svg]:rotate-180",
            className,
          )}
          {...props}
        >
          {children}
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--motion-base) ease-(--ease-standard)"
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  )
}

/**
 * Opening animates only once Radix has measured --radix-collapsible-content-height, so an item open in the server's
 * HTML does not replay its animation on every page load.
 */
export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm [&[data-state=open][style*='--radix-collapsible-content-height:']]:animate-expand data-[state=closed]:animate-collapse"
      {...props}
    >
      <div className={cn("pb-4 text-muted-foreground", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
