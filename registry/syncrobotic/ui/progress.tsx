// @syncrobotic/progress v0.17.2 · update: npx shadcn add @syncrobotic/progress --overwrite
"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

const fill = {
  info: "bg-info",
  // Done is calm: a finished bar stays grey (green is a confirmation that comes and goes, a toast; not a state that stays).
  success: "bg-neutral",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
} as const

/** Blue: a process someone is waiting on, with an end. A level that stays (battery, storage) is a Meter, not a Progress. */
export function Progress({
  className,
  value,
  tone = "info",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: keyof typeof fill }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full transition-transform duration-(--motion-base) ease-(--ease-standard)", fill[tone])}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
