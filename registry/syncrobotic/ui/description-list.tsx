// @syncrobotic/description-list v0.8.0 · update: npx shadcn add @syncrobotic/description-list --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

type Item = { label: React.ReactNode; value: React.ReactNode }

const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const

/**
 * Facts about one thing as label and value pairs: a robot's battery, site and last contact; a dataset's owner and size.
 * `plain` lays them out in a card; `tiles` gives each its own tile, for the few numbers that matter most.
 */
export function DescriptionList({
  items,
  columns = 3,
  variant = "plain",
  className,
}: {
  items: Item[]
  columns?: keyof typeof cols
  variant?: "plain" | "tiles"
  className?: string
}) {
  return (
    <dl
      data-slot="description-list"
      className={cn("grid gap-4", cols[columns], variant === "plain" && "rounded-md bg-card p-4 ring-1 ring-border", variant === "tiles" && "gap-2", className)}
    >
      {items.map((it, i) => (
        <div key={i} className={cn("flex min-w-0 flex-col gap-1", variant === "tiles" && "rounded-sm bg-muted p-3")}>
          <dt className="text-xs text-muted-foreground">{it.label}</dt>
          <dd className="min-w-0 text-sm font-medium tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
