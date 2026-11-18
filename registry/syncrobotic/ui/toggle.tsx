// @syncrobotic/toggle v0.10.0 · update: npx shadcn add @syncrobotic/toggle --overwrite
"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** An on/off button, e.g. a map or image layer. On is inverted, like a selected segment. For one choice among several, use SegmentedControl. */
export function Toggle({ className, size = "md", ...props }: React.ComponentProps<typeof TogglePrimitive.Root> & { size?: "sm" | "md" }) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap ring-1 ring-border ring-inset",
        "press hover:bg-accent",
        "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:ring-primary",
        "disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        size === "sm" ? "h-(--h-sm)" : "h-(--h-md)",
        className,
      )}
      {...props}
    />
  )
}
