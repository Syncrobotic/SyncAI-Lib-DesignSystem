// @syncrobotic/area-chart-fleet-states v0.22.0 · update: npx shadcn add @syncrobotic/area-chart-fleet-states --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = {
  patrol: { label: "Patrolling", color: 1 },
  charging: { label: "Charging", color: 2 },
  idle: { label: "Idle", color: 3 },
} satisfies ChartConfig
// Sample data: how many of 6 robots were in each state, per hour. The three always add up to the fleet.
const data = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((t, i) => ({
  t,
  patrol: [2, 4, 5, 5, 4, 5, 3, 2][i],
  charging: [3, 1, 1, 1, 2, 1, 2, 3][i],
  idle: [1, 1, 0, 0, 0, 0, 1, 1][i],
}))

// Stacked bands, like the segments of a stacked bar: solid fills in the accent and the grey steps, each band set off from the
// next by a 2 px stroke in the card colour (so no dashed outlines here; the legend shows a square swatch).
const band = (key: keyof typeof config) => ({ dataKey: key, stackId: "s", type: "stepAfter", fill: `var(--color-${key})`, fillOpacity: 1, stroke: "var(--card)", strokeWidth: 2 }) as const

/** How the fleet's time splits over the day: stacked step areas, so every hour adds up to the fleet. */
export function AreaChartFleetStates() {
  const [view, setView] = React.useState("chart")
  return (
    <Card>
      <CardDataHeader
        title={
          <>
            Fleet by state <span className="font-normal text-muted-foreground">· 6 robots</span>
          </>
        }
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <p className="text-xs text-muted-foreground">Today, per 2 hours</p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Number of robots patrolling, charging and idle by hour today">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" {...chartAxis} interval="equidistantPreserveStart" />
            <YAxis {...chartAxis} allowDecimals={false} domain={[0, 6]} width={40} />
            <ChartTooltip />
            <ChartLegend />
            <Area {...band("patrol")} {...chartMotion} />
            <Area {...band("charging")} {...chartMotion} />
            <Area {...band("idle")} {...chartMotion} />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="t" xLabel="Time" config={config} />
      )}
    </Card>
  )
}
