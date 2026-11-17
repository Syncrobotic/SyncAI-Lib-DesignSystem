// @syncrobotic/segmented-control v0.5.0 · update: npx shadcn add @syncrobotic/segmented-control --overwrite
"use client"

import * as React from "react"
import { ToggleGroup } from "radix-ui"
import { cn } from "@/lib/utils"

/** Pick one of a few views. The selected segment is inverted (white on black in dark mode). */
export function SegmentedControl({ className, ...props }: Omit<ToggleGroup.ToggleGroupSingleProps, "type">) {
  return (
    <ToggleGroup.Root
      data-slot="segmented-control"
      type="single"
      className={cn("inline-flex h-(--h-md) w-full items-center gap-1 rounded-sm bg-muted p-1", className)}
      {...props}
    />
  )
}

export function SegmentedControlItem({ className, ...props }: React.ComponentProps<typeof ToggleGroup.Item>) {
  return (
    <ToggleGroup.Item
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xs px-3 text-sm text-muted-foreground",
        "transition-colors duration-(--motion-fast) hover:text-foreground",
        "data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}
