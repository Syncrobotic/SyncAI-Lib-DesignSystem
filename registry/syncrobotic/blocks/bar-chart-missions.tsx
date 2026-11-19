// @syncrobotic/bar-chart-missions v0.9.0 · update: npx shadcn add @syncrobotic/bar-chart-missions --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { done: { label: "Completed", color: 1 }, aborted: { label: "Aborted", color: 2 } } satisfies ChartConfig
// Sample data: missions per day this week.
const data = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({ d, done: [18, 22, 19, 24, 21, 12, 10][i], aborted: [2, 1, 4, 1, 3, 0, 1][i] }))

/** Two counts side by side per day: grouped bars with a 2 px gap, rounded on the data end, and a table view. */
export function BarChartMissions() {
  const [view, setView] = React.useState("chart")
  return (
    <Card>
      <CardDataHeader
        title="Missions this week"
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <p className="text-xs text-muted-foreground tabular-nums">
          {data.reduce((s, x) => s + x.done, 0)} completed · {data.reduce((s, x) => s + x.aborted, 0)} aborted
        </p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Completed and aborted missions per day this week">
          <BarChart data={data} barGap={2} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="d" {...chartAxis} />
            <YAxis {...chartAxis} allowDecimals={false} width={40} />
            <ChartTooltip />
            <ChartLegend />
            <Bar dataKey="done" fill="var(--color-done)" radius={[4, 4, 0, 0]} maxBarSize={24} {...chartMotion} />
            <Bar dataKey="aborted" fill="var(--color-aborted)" radius={[4, 4, 0, 0]} maxBarSize={24} {...chartMotion} />
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="d" xLabel="Day" config={config} />
      )}
    </Card>
  )
}
