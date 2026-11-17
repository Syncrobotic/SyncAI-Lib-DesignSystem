// @syncrobotic/sparkline-metric-tiles v0.9.0 · update: npx shadcn add @syncrobotic/sparkline-metric-tiles --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"

// A sparkline: the shape of the last values, no axes. Neutral, so only a word or a number carries a warning.
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${max === min ? 50 : 100 - ((v - min) / (max - min)) * 100}`).join(" ")
  return (
    <svg aria-hidden="true" viewBox="-2 -6 104 112" preserveAspectRatio="none" className={cn("h-8 w-24 text-muted-foreground", className)}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

type Tile = { label: string; value: string; unit?: string; change: string; worse: boolean; values: number[]; range: string }
// Sample data, oldest first. `worse` decides the colour of the change, not its sign: more incidents is worse.
const tiles: Tile[] = [
  { label: "Uptime", value: "99.2", unit: "%", change: "+0.4", worse: false, values: [98.1, 98.6, 98.4, 98.9, 99.0, 98.8, 99.2], range: "7 days" },
  { label: "Incidents", value: "11", change: "+4", worse: true, values: [5, 6, 4, 7, 6, 9, 11], range: "7 days" },
  { label: "Avg. response", value: "48", unit: "s", change: "−6", worse: false, values: [62, 58, 57, 55, 51, 54, 48], range: "7 days" },
]

/** Three headline numbers, each with its week as a sparkline and the range in words. Only a change for the worse is coloured. */
export function SparklineMetricTiles() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <Card key={t.label} className="gap-2">
          <span className="text-xs text-muted-foreground">{t.label}</span>
          <span className="flex items-end justify-between gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {t.value}
              {t.unit && <span className="text-sm font-normal text-muted-foreground"> {t.unit}</span>}
            </span>
            <Sparkline values={t.values} className="h-10 w-28" />
          </span>
          <span className="flex justify-between text-xs tabular-nums">
            <span className={cn(t.worse ? "font-medium text-danger" : "text-muted-foreground")}>
              {t.change}
              {t.worse && <span className="sr-only"> (worse)</span>}
            </span>
            <span className="text-muted-foreground">{t.range}</span>
          </span>
        </Card>
      ))}
    </div>
  )
}
