// @syncrobotic/progress v0.5.0 · update: npx shadcn add @syncrobotic/progress --overwrite
"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

const fill = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
} as const

/** Blue means in progress. Use another tone only when the value itself is a status (e.g. low battery). */
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
