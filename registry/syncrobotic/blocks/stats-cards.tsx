// @syncrobotic/stats-cards v0.17.1 · update: npx shadcn add @syncrobotic/stats-cards --overwrite
import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"

export type Stat = {
  label: string
  value: string
  /** e.g. "/ 14" after the value. */
  unit?: string
  /** Change against the previous period, e.g. "+8%". */
  delta?: string
  /** Whether the change is good. A rise in events is bad, so direction alone does not decide the colour. */
  trend?: "good" | "bad" | "flat"
  /** Last values, oldest first, for the sparkline. */
  series?: number[]
  caption?: string
}

export const sampleStats: Stat[] = [
  { label: "Robots online", value: "12", unit: "/ 14", delta: "+1", trend: "good", series: [9, 10, 10, 11, 11, 12, 12], caption: "2 docked for charging" },
  { label: "Patrol hours", value: "286", unit: "h", delta: "+8%", trend: "good", series: [210, 230, 228, 250, 262, 270, 286], caption: "Last 7 days" },
  { label: "Events", value: "24", delta: "+6", trend: "bad", series: [12, 15, 14, 18, 16, 18, 24], caption: "3 need review" },
  { label: "Avg. battery", value: "71", unit: "%", delta: "−2%", trend: "flat", series: [76, 75, 74, 72, 73, 72, 71], caption: "Lowest: 9C44 at 18%" },
]

function Sparkline({ series, className }: { series: number[]; className?: string }) {
  const min = Math.min(...series)
  const max = Math.max(...series)
  const points = series.map((v, i) => `${(i / (series.length - 1)) * 100},${max === min ? 50 : 100 - ((v - min) / (max - min)) * 100}`).join(" ")
  return (
    <svg aria-hidden="true" viewBox="-2 -6 104 112" preserveAspectRatio="none" className={cn("h-8 w-24", className)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

// Only a change for the worse gets colour. Good news and the sparkline stay neutral, so the bad number is the one you see.
const trendText = { good: "text-foreground", bad: "text-danger", flat: "text-muted-foreground" } as const

/** Four headline numbers for a dashboard. Value first, then the change, then context. */
export function StatsCards({ stats = sampleStats, className }: { stats?: Stat[]; className?: string }) {
  return (
    // Two across from the smallest phone, so four numbers take half a screen, not a whole one: there the change sits under the
    // label in every card (so the values line up) and the sparkline joins from 640 px.
    <div className={cn("grid grid-cols-2 gap-4 xl:grid-cols-4", className)}>
      {stats.map((s) => {
        const trend = s.trend ?? "flat"
        const Arrow = s.delta?.startsWith("-") || s.delta?.startsWith("−") ? ArrowDownRight : ArrowUpRight
        return (
          <Card key={s.label} className="gap-3">
            <div className="flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-start max-sm:gap-0">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              {s.delta && (
                <span className={cn("inline-flex items-center gap-2 text-sm font-medium", trendText[trend])}>
                  <Arrow aria-hidden="true" className="size-4" />
                  {s.delta}
                  <span className="sr-only">{trend === "good" ? ", better" : trend === "bad" ? ", worse" : ""}</span>
                </span>
              )}
            </div>
            <div className="flex items-end justify-between gap-4">
              <span className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{s.value}</span>
                {s.unit && <span className="text-sm text-muted-foreground">{s.unit}</span>}
              </span>
              {s.series && <Sparkline series={s.series} className="text-muted-foreground max-sm:hidden" />}
            </div>
            {s.caption && <span className="text-xs text-muted-foreground">{s.caption}</span>}
          </Card>
        )
      })}
    </div>
  )
}
