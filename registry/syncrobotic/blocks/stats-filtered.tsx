// @syncrobotic/stats-filtered v0.40.0 · update: npx shadcn add @syncrobotic/stats-filtered --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/registry/syncrobotic/lib/format-count"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
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
      <SectionHeader
        id="stats-filtered-title"
        title="Performance"
        actions={
          <>
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
            <SegmentedControl aria-label="Time range" value={range} onValueChange={(v) => v && setRange(v as Range)} className="w-auto">
              <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
              <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
              <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
            </SegmentedControl>
          </>
        }
      />
      <MetricGrid>
        {kpis.map((k) => {
          const { now, before } = k.values[range]
          const change = before === 0 ? 0 : ((now - before) / before) * 100
          const up = change >= 0
          // Under half a percent is no change: no colour, no arrow.
          const moved = Math.abs(change) >= 0.5
          const worse = moved && (k.good === "up" ? !up : up)
          return (
            <MetricCard
              key={k.label}
              label={k.label}
              value={formatNumber(now)}
              unit={k.unit}
              delta={moved ? `${up ? "+" : "−"}${Math.abs(change).toFixed(0)} %` : "0 %"}
              trend={!moved ? "flat" : worse ? "bad" : "good"}
              caption={`vs ${rangeLabel[range]}`}
            />
          )
        })}
      </MetricGrid>
    </section>
  )
}
