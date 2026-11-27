// @syncrobotic/separator v0.53.0 · update: npx shadcn add @syncrobotic/separator --overwrite
"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * A horizontal or vertical hairline between groups of content. Decorative by default, so screen readers skip it; set
 * `decorative={false}` when it separates sections they should hear about.
 */
export function Separator({ className, orientation = "horizontal", decorative = true, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn("shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px", className)}
      {...props}
    />
  )
}
