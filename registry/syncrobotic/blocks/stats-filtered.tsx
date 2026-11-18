// @syncrobotic/stats-filtered v0.9.0 · update: npx shadcn add @syncrobotic/stats-filtered --overwrite
"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

type Range = "24h" | "7d" | "30d"
type Kpi = { label: string; unit?: string; good: "up" | "down"; values: Record<Range, { now: number; before: number }> }

// Sample data per range. Whether a change is good depends on the measure: fewer stops is better, more hours is better.
const kpis: Kpi[] = [
  { label: "Missions done", good: "up", values: { "24h": { now: 142, before: 131 }, "7d": { now: 968, before: 1004 }, "30d": { now: 4120, before: 3890 } } },
  {
    label: "Patrol hours",
    unit: "h",
    good: "up",
    values: { "24h": { now: 41, before: 40 }, "7d": { now: 286, before: 265 }, "30d": { now: 1190, before: 1150 } },
  },
  { label: "Unplanned stops", good: "down", values: { "24h": { now: 6, before: 2 }, "7d": { now: 19, before: 24 }, "30d": { now: 77, before: 81 } } },
  {
    label: "Time to recover",
    unit: "min",
    good: "down",
    values: { "24h": { now: 4.2, before: 5.0 }, "7d": { now: 4.8, before: 4.6 }, "30d": { now: 5.1, before: 5.9 } },
  },
]

const rangeLabel: Record<Range, string> = { "24h": "previous 24 hours", "7d": "previous 7 days", "30d": "previous 30 days" }

/** A KPI row that follows one range and one site, chosen above it. Every change is compared with the period before and coloured only when it is worse. */
export function StatsFiltered({ className }: { className?: string }) {
  const [range, setRange] = React.useState<Range>("7d")
  const [site, setSite] = React.useState("all")
  return (
    <section aria-labelledby="stats-filtered-title" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="stats-filtered-title" className="text-lg font-bold">
          Performance
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger aria-label="Site" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              <SelectItem value="taipei">Taipei HQ</SelectItem>
              <SelectItem value="taoyuan">Taoyuan plant</SelectItem>
            </SelectContent>
          </Select>
          <SegmentedControl aria-label="Time range" value={range} onValueChange={(v) => v && setRange(v as Range)}>
            <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
            <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
            <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const { now, before } = k.values[range]
          const change = before === 0 ? 0 : ((now - before) / before) * 100
          const up = change >= 0
          const worse = Math.abs(change) >= 0.5 && (k.good === "up" ? !up : up)
          const Arrow = up ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={k.label} className="gap-2">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <span className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums">{now.toLocaleString("en")}</span>
                {k.unit && <span className="text-sm text-muted-foreground">{k.unit}</span>}
              </span>
              <span className={cn("flex items-center gap-2 text-xs", worse ? "font-medium text-danger" : "text-muted-foreground")}>
                <Arrow aria-hidden="true" className="size-4" />
                <span className="tabular-nums">
                  {up ? "+" : "−"}
                  {Math.abs(change).toFixed(0)} %
                </span>
                <span className={worse ? "text-muted-foreground font-normal" : ""}>vs {rangeLabel[range]}</span>
                {worse && <span className="sr-only">, worse</span>}
              </span>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
