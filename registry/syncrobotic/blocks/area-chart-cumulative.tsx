// @syncrobotic/area-chart-cumulative v0.22.0 · update: npx shadcn add @syncrobotic/area-chart-cumulative --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader, CardFigure } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { done: { label: "Patrolled", color: 1, unit: "km" }, plan: { label: "Plan", color: 5, unit: "km" } } satisfies ChartConfig
// Sample data: kilometres patrolled so far this month against the plan's straight line.
const data = [0, 11, 24, 33, 47, 58, 66, 79, 91, 97, 110, 124, 131, 144, 158, 166, 177].map((done, i) => ({
  d: `${i + 1}`,
  done: Math.round(done),
  plan: Math.round((i + 1) * 10),
}))
const date = (d: unknown) => `Nov ${d}`
// The table names each day the way the tooltip does.
const rows = data.map((r) => ({ ...r, d: date(r.d) }))

/** Progress toward a monthly target: the running total as an area, the plan as a dashed line, the gap said in words. */
export function AreaChartCumulative() {
  const [view, setView] = React.useState("chart")
  // Before the first day is in there is no running total yet: nothing patrolled, nothing planned.
  const last = data.at(-1) ?? { done: 0, plan: 0 }
  const ahead = last.done - last.plan
  return (
    <Card>
      <CardDataHeader
        title="Patrolled this month"
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <CardFigure value={`${last.done} km`} note={ahead >= 0 ? `${ahead} km ahead of plan` : `${-ahead} km behind plan`} />
        <p className="text-xs text-muted-foreground">Target 300 km by the 30th</p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Kilometres patrolled so far this month against the plan" className="h-48">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="d" {...chartAxis} interval={3} />
            <YAxis {...chartAxis} width={40} />
            <ChartTooltip labelFormatter={date} />
            <ChartLegend />
            <Area dataKey="done" type="linear" stroke="var(--color-done)" strokeWidth={2} fill="var(--color-done)" fillOpacity={0.12} {...chartMotion} />
            <Line dataKey="plan" stroke="var(--color-plan)" strokeWidth={2} dot={false} {...chartMotion} />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartTable data={rows} x="d" xLabel="Date" config={config} />
      )}
    </Card>
  )
}
