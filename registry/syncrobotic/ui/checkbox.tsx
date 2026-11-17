// @syncrobotic/checkbox v0.7.0 · update: npx shadcn add @syncrobotic/checkbox --overwrite
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
        "peer flex size-5 shrink-0 items-center justify-center rounded-xs bg-card ring-1 ring-input ring-inset transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:ring-primary",
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-danger",
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
