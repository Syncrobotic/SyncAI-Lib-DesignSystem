// @syncrobotic/line-chart-compare v0.22.0 · update: npx shadcn add @syncrobotic/line-chart-compare --overwrite
"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader, CardFigure } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { now: { label: "This week", color: 1 }, before: { label: "Last week", color: 5 } } satisfies ChartConfig
// Sample data: missions completed per day.
const data = [
  { d: "Mon", now: 21, before: 18 },
  { d: "Tue", now: 24, before: 20 },
  { d: "Wed", now: 19, before: 21 },
  { d: "Thu", now: 26, before: 19 },
  { d: "Fri", now: 23, before: 22 },
  { d: "Sat", now: 14, before: 13 },
  { d: "Sun", now: 12, before: 11 },
]

/** This period against the last: totals and the change up top, the earlier period dashed so it reads as the reference. */
export function LineChartCompare() {
  const [view, setView] = React.useState("chart")
  const now = data.reduce((s, d) => s + d.now, 0)
  const before = data.reduce((s, d) => s + d.before, 0)
  const change = Math.round(((now - before) / before) * 100)
  return (
    <Card>
      <CardDataHeader
        title="Missions completed"
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <CardFigure value={now} note={`${change >= 0 ? "+" : "\u2212"}${Math.abs(change)} % on last week (${before})`} />
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Missions completed per day, this week against last week">
          <LineChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="d" {...chartAxis} />
            <YAxis {...chartAxis} allowDecimals={false} width={40} />
            <ChartTooltip />
            <ChartLegend />
            <Line dataKey="before" stroke="var(--color-before)" strokeWidth={2} dot={false} {...chartMotion} />
            <Line
              dataKey="now"
              stroke="var(--color-now)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              {...chartMotion}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="d" xLabel="Day" config={config} />
      )}
    </Card>
  )
}
