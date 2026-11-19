// @syncrobotic/segmented-control v0.13.1 · update: npx shadcn add @syncrobotic/segmented-control --overwrite
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
        "relative inline-flex h-full flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xs px-3 text-sm text-muted-foreground",
        // The segment draws 36 px inside the 44 px track; its hit area reaches the track's edges, so a finger gets 44.
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        "press hover:text-foreground",
        "data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground",
        "disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}
