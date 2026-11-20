// @syncrobotic/slider v0.21.0 · update: npx shadcn add @syncrobotic/slider --overwrite
"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Each thumb is a focusable control and needs its own name. By default it takes the slider's
 * `aria-label` ("… minimum" / "… maximum" for a range); pass `thumbLabels` to name them yourself. `valueText` writes the
 * value as it is read out ("0:42 of 1:00", "40 %") when the bare number would not say what it is.
 */
export function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  valueText,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: string[]
  /** The value as screen readers say it (aria-valuetext), per thumb. Needs a controlled `value`. */
  valueText?: (value: number, index: number) => string
}) {
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
      className={cn("relative flex h-(--h-md) w-full touch-none select-none items-center data-disabled:cursor-not-allowed", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-track">
        {/* Disabled: never faded. The filled part goes grey instead of the primary; the thumbs keep their edge. */}
        <SliderPrimitive.Range className="absolute h-full bg-primary in-data-disabled:bg-muted-foreground" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={nameOf(i)}
          aria-valuetext={valueText && value ? valueText(value[i], i) : undefined}
          className="block size-6 rounded-full bg-white shadow-float ring-1 ring-edge"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
