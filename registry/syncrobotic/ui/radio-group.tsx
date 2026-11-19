// @syncrobotic/radio-group v0.15.0 · update: npx shadcn add @syncrobotic/radio-group --overwrite
"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />
}

export function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        // The 20 px disc answers a 44 px touch (--h-md, so it follows density) even without a label row around it.
        "after:absolute after:top-1/2 after:left-1/2 after:size-(--h-md) after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
        "data-[state=checked]:ring-2 data-[state=checked]:ring-primary",
        // Disabled: never faded. The disc keeps its edge; when chosen, a grey ring and dot instead of the primary.
        "disabled:cursor-not-allowed disabled:data-[state=checked]:ring-muted-foreground",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2 animate-fade-in rounded-full bg-primary in-data-disabled:bg-muted-foreground" />
    </RadioGroupPrimitive.Item>
  )
}
