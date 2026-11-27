// @syncrobotic/label v0.53.0 · update: npx shadcn add @syncrobotic/label --overwrite
"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * The visible name of a control, wired to it so a click focuses the control and screen readers announce it. Give it
 * `htmlFor` with the control's `id`, or use a Field, which wires both.
 */
export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-sm font-medium select-none peer-disabled:text-muted-foreground", className)}
      {...props}
    />
  )
}
