// @syncrobotic/switch v0.8.0 · update: npx shadcn add @syncrobotic/switch --overwrite
"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** On is success green, per the colour rules; off is a neutral track. */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] transition-colors duration-(--motion-base) ease-(--ease-standard)",
        "bg-muted ring-1 ring-border ring-inset data-[state=checked]:bg-primary data-[state=checked]:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-white shadow-float data-[state=checked]:bg-primary-foreground",
          "transition-transform duration-(--motion-base) ease-(--ease-standard) data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  )
}
