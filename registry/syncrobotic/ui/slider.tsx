"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Each thumb is a focusable control and needs its own name. By default it takes the slider's
 * `aria-label` ("… minimum" / "… maximum" for a range); pass `thumbLabels` to name them yourself.
 */
export function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }) {
  const thumbs = (value ?? defaultValue ?? [min]).length
  const label = props["aria-label"]
  const nameOf = (i: number) => thumbLabels?.[i] ?? (label && thumbs > 1 ? `${label} ${i === 0 ? "minimum" : "maximum"}` : label)
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn("relative flex h-(--h-md) w-full touch-none select-none items-center data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }, (_, i) => (
        <SliderPrimitive.Thumb key={i} aria-label={nameOf(i)} className="block size-6 rounded-full bg-white shadow-float ring-1 ring-edge" />
      ))}
    </SliderPrimitive.Root>
  )
}
