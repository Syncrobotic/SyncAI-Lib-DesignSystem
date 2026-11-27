// @syncrobotic/switch v0.53.0 · update: npx shadcn add @syncrobotic/switch --overwrite
"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * On or off for a setting that takes effect immediately, with no save button; on is the primary colour, off a neutral
 * track. A setting being on is a selection, not a status.
 */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 after:absolute after:inset-x-0 after:top-1/2 after:h-(--h-md) after:-translate-y-1/2 after:content-[''] transition-colors duration-(--motion-base) ease-(--ease-standard)",
        "bg-muted ring-1 ring-input ring-inset data-[state=checked]:bg-primary data-[state=checked]:ring-primary",
        // Disabled: never faded. When on, the track goes grey instead of the primary, so the setting still reads in glare.
        "disabled:cursor-not-allowed disabled:data-[state=checked]:bg-muted-foreground disabled:data-[state=checked]:ring-muted-foreground",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-thumb shadow-float data-[state=checked]:bg-primary-foreground",
          "transition-transform duration-(--motion-base) ease-(--ease-standard) data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  )
}
