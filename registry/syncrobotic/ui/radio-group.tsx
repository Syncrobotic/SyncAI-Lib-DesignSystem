// @syncrobotic/radio-group v0.7.0 · update: npx shadcn add @syncrobotic/radio-group --overwrite
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
        "peer flex size-5 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        "data-[state=checked]:ring-2 data-[state=checked]:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2 animate-fade-in rounded-full bg-primary" />
    </RadioGroupPrimitive.Item>
  )
}
