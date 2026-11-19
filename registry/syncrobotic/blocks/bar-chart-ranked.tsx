// @syncrobotic/bar-chart-ranked v0.17.2 · update: npx shadcn add @syncrobotic/bar-chart-ranked --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { n: { label: "Stops", color: 1 } } satisfies ChartConfig
// Sample data: why robots stopped in the last 30 days, sorted.
const data = [
  { cause: "Blocked path", n: 23 },
  { cause: "Door closed", n: 14 },
  { cause: "Low battery", n: 9 },
  { cause: "Lost localization", n: 5 },
  { cause: "Other", n: 3 },
]

/** Categories with long names, ranked: horizontal bars, one series, the value at each bar's end. */
export function BarChartRanked() {
  const [view, setView] = React.useState("chart")
  return (
    <Card>
      <CardDataHeader
        title="Why robots stopped"
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <p className="text-xs text-muted-foreground tabular-nums">Last 30 days · {data.reduce((s, d) => s + d.n, 0)} stops</p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Number of robot stops by cause, last 30 days" className="h-56">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" {...chartAxis} allowDecimals={false} />
            <YAxis type="category" dataKey="cause" {...chartAxis} width={112} />
            <ChartTooltip />
            <Bar dataKey="n" fill="var(--color-n)" radius={[0, 4, 4, 0]} maxBarSize={20} {...chartMotion}>
              <LabelList dataKey="n" position="right" className="fill-foreground text-xs tabular-nums" />
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="cause" xLabel="Cause" config={config} />
      )}
    </Card>
  )
}
