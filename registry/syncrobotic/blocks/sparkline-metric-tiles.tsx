// @syncrobotic/sparkline-metric-tiles v0.19.0 · update: npx shadcn add @syncrobotic/sparkline-metric-tiles --overwrite
"use client"

import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"

type Tile = { label: string; value: string; unit?: string; change: string; worse: boolean; values: number[]; range: string }
// Sample data, oldest first. `worse` decides the colour of the change, not its sign: more incidents is worse.
const tiles: Tile[] = [
  { label: "Uptime", value: "99.2", unit: "%", change: "+0.4", worse: false, values: [98.1, 98.6, 98.4, 98.9, 99.0, 98.8, 99.2], range: "Last 7 days" },
  { label: "Incidents", value: "11", change: "+4", worse: true, values: [5, 6, 4, 7, 6, 9, 11], range: "Last 7 days" },
  { label: "Avg. response", value: "48", unit: "s", change: "−6", worse: false, values: [62, 58, 57, 55, 51, 54, 48], range: "Last 7 days" },
]

/** Three headline numbers, each with its week as a sparkline and the range in words. Only a change for the worse is coloured. */
export function SparklineMetricTiles() {
  return (
    // Three across from 640 px; one per row on a phone, so no card is left alone on a second row.
    <MetricGrid className="grid-cols-1 sm:grid-cols-3 xl:grid-cols-3">
      {tiles.map((t) => (
        <MetricCard key={t.label} label={t.label} value={t.value} unit={t.unit} delta={t.change} trend={t.worse ? "bad" : "good"} series={t.values} caption={t.range} />
      ))}
    </MetricGrid>
  )
}
