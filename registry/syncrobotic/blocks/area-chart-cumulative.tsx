// @syncrobotic/area-chart-cumulative v0.15.0 · update: npx shadcn add @syncrobotic/area-chart-cumulative --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { done: { label: "Patrolled", color: 1, unit: "km" }, plan: { label: "Plan", color: 5, unit: "km" } } satisfies ChartConfig
// Sample data: kilometres patrolled so far this month against the plan's straight line.
const data = Array.from({ length: 17 }, (_, i) => ({
  d: `${i + 1}`,
  done: Math.round([0, 11, 24, 33, 47, 58, 66, 79, 91, 97, 110, 124, 131, 144, 158, 166, 177][i]),
  plan: Math.round((i + 1) * 10),
}))
const date = (d: unknown) => `Nov ${d}`
// The table names each day the way the tooltip does.
const rows = data.map((r) => ({ ...r, d: date(r.d) }))

/** Progress toward a monthly target: the running total as an area, the plan as a dashed line, the gap said in words. */
export function AreaChartCumulative() {
  const [view, setView] = React.useState("chart")
  const last = data[data.length - 1]
  const ahead = last.done - last.plan
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">Patrolled this month</h3>
          <p className="text-xs text-muted-foreground">Target 300 km by the 30th</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{last.done} km</span>
            <span className="text-xs text-muted-foreground tabular-nums">{ahead >= 0 ? `${ahead} km ahead of plan` : `${-ahead} km behind plan`}</span>
          </p>
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
      {view === "chart" ? (
        <ChartContainer config={config} label="Kilometres patrolled so far this month against the plan" className="h-48">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="d" {...chartAxis} interval={3} />
            <YAxis {...chartAxis} width={40} />
            <ChartTooltip labelFormatter={date} />
            <ChartLegend />
            <Area dataKey="done" type="linear" stroke="var(--color-done)" strokeWidth={2} fill="var(--color-done)" fillOpacity={0.12} {...chartMotion} />
            <Line dataKey="plan" stroke="var(--color-plan)" strokeWidth={2} strokeDasharray="4 4" dot={false} {...chartMotion} />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartTable data={rows} x="d" xLabel="Date" config={config} />
      )}
    </Card>
  )
}
