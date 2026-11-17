// @syncrobotic/tabs v0.7.0 · update: npx shadcn add @syncrobotic/tabs --overwrite
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** Sections of one page. To switch between views of the same data, use SegmentedControl. */
export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("flex gap-4 overflow-x-auto border-b border-border", className)} {...props} />
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px inline-flex h-(--h-md) items-center gap-2 border-b-2 border-transparent text-sm whitespace-nowrap text-muted-foreground",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground",
        "data-[state=active]:border-foreground data-[state=active]:font-medium data-[state=active]:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none data-[state=active]:animate-appear", className)} {...props} />
}
