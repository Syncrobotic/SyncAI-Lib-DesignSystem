// @syncrobotic/progress v0.53.0 · update: npx shadcn add @syncrobotic/progress --overwrite
"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

const fill = {
  info: "bg-info",
  // No success: done is calm, so a finished bar is `neutral` (green is a confirmation that comes and goes, a toast).
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
} as const

/**
 * A determinate bar that fills as work completes; blue unless the value itself is a status. Blue is for a process
 * someone is waiting on; a level that stays (battery, storage) is a Meter. At 0 % the empty track takes the --input
 * edge (3:1), so it still reads as a bar.
 */
export function Progress({
  className,
  value,
  tone = "info",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: keyof typeof fill }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-track", !value && "ring-1 ring-input ring-inset", className)} {...props}>
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full transition-transform duration-(--motion-base) ease-(--ease-standard)", fill[tone])}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
