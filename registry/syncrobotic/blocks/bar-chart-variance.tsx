// @syncrobotic/bar-chart-variance v0.17.3 · update: npx shadcn add @syncrobotic/bar-chart-variance --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, chartNumber, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { delta: { label: "Against plan", color: 1, unit: "min" } } satisfies ChartConfig
// Sample data: minutes each robot's patrol ran over (+) or under (−) its plan today.
const data = [
  { r: "7F3A", delta: -4 },
  { r: "DAA6", delta: 2 },
  { r: "9E37", delta: -11 },
  { r: "1715", delta: 6 },
  { r: "B54C", delta: 1 },
  { r: "5384", delta: -2 },
]

/** Above and below zero: one hue, the zero line drawn, the biggest miss named in words. */
export function BarChartVariance() {
  const [view, setView] = React.useState("chart")
  const worst = data.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a))
  return (
    <Card>
      <CardDataHeader
        title={
          <>
            Patrol time against plan <span className="font-normal text-muted-foreground">· min</span>
          </>
        }
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <p className="text-xs text-muted-foreground tabular-nums">
          Biggest gap: {worst.r}, {Math.abs(worst.delta)} min {worst.delta < 0 ? "short" : "over"}
        </p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label="Minutes each robot's patrol ran over or under plan today" className="h-48">
          {/* 8 px above the plot: the top tick's label is centred on its gridline and needs half its line height clear. */}
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="r" {...chartAxis} />
            <YAxis {...chartAxis} domain={[-12, 12]} ticks={[-12, -6, 0, 6, 12]} tickFormatter={chartNumber} width={40} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" />
            <ChartTooltip />
            <Bar dataKey="delta" fill="var(--color-delta)" radius={4} maxBarSize={24} {...chartMotion} />
          </BarChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="r" xLabel="Robot" config={config} />
      )}
    </Card>
  )
}
