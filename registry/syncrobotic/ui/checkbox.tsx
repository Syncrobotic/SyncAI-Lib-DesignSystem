// @syncrobotic/checkbox v0.12.0 · update: npx shadcn add @syncrobotic/checkbox --overwrite
"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

/** 20 px box inside a 44 px hit area: wrap it with its label so the whole row is tappable. */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-2xs bg-card ring-1 ring-input ring-inset transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        // The 20 px box answers a 44 px touch (--h-md, so it follows density) even without a label row around it.
        "after:absolute after:top-1/2 after:left-1/2 after:size-(--h-md) after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:ring-primary",
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:ring-primary",
        // Disabled: never faded. The box keeps its edge (the grey label says it is off limits); when checked, grey instead of the primary, so on and off stay readable in glare.
        "disabled:cursor-not-allowed disabled:data-[state=checked]:bg-muted-foreground disabled:data-[state=checked]:ring-muted-foreground disabled:data-[state=checked]:text-background disabled:data-[state=indeterminate]:bg-muted-foreground disabled:data-[state=indeterminate]:ring-muted-foreground disabled:data-[state=indeterminate]:text-background aria-invalid:ring-danger",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="group flex items-center justify-center">
        <Check aria-hidden="true" className="size-4 animate-fade-in group-data-[state=indeterminate]:hidden" strokeWidth={2} />
        <Minus aria-hidden="true" className="hidden size-4 animate-fade-in group-data-[state=indeterminate]:block" strokeWidth={2} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
