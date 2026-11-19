// @syncrobotic/line-chart-telemetry v0.17.2 · update: npx shadcn add @syncrobotic/line-chart-telemetry --overwrite
"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { north: { label: "North site", color: 1, unit: "m/s" }, south: { label: "South site", color: 2, unit: "m/s" } } satisfies ChartConfig

// Sample data: average patrol speed per hour (24 h) and per 10 minutes (last hour). Replace with your telemetry.
const day = Array.from({ length: 12 }, (_, i) => ({
  t: `${String(i * 2).padStart(2, "0")}:00`,
  north: [0.9, 0.8, 1.1, 1.4, 1.6, 1.5, 1.3, 1.5, 1.7, 1.4, 1.2, 1.0][i],
  south: [0.7, 0.8, 0.9, 1.2, 1.3, 1.4, 1.5, 1.2, 1.1, 1.3, 1.1, 0.9][i],
}))
const hour = Array.from({ length: 7 }, (_, i) => ({
  t: i < 6 ? `13:${String(i * 10).padStart(2, "0")}` : "14:00",
  north: [1.4, 1.5, 1.3, 1.6, 1.7, 1.5, 1.6][i],
  south: [1.1, 1.2, 1.3, 1.2, 1.0, 1.1, 1.2][i],
}))

/** Two series over time with a range switch and a table view: the default telemetry chart for a dashboard. */
export function LineChartTelemetry({ title = "Average patrol speed" }: { title?: string }) {
  const [range, setRange] = React.useState("24h")
  const [view, setView] = React.useState("chart")
  const data = range === "24h" ? day : hour
  return (
    <Card>
      <CardDataHeader
        title={
          <>
            {title} <span className="font-normal text-muted-foreground">· m/s</span>
          </>
        }
        actions={
          <>
            <SegmentedControl value={range} onValueChange={(v) => v && setRange(v)} aria-label="Range" className="w-auto">
              <SegmentedControlItem value="1h">1 h</SegmentedControlItem>
              <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
            </SegmentedControl>
            <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
              <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
              <SegmentedControlItem value="table">Table</SegmentedControlItem>
            </SegmentedControl>
          </>
        }
      >
        <p className="text-xs text-muted-foreground">{range === "24h" ? "Last 24 hours, per 2 hours" : "Last hour, per 10 minutes"}</p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label={`${title}, north and south site`}>
          {/* Right margin: a label on the last point is centred on the plot's edge and has to stay inside the card. */}
          <LineChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            {/* Every other point: evenly spaced labels (every 4 hours, every 20 minutes) that fit a phone. */}
            <XAxis dataKey="t" {...chartAxis} interval={1} />
            <YAxis {...chartAxis} domain={[0, 2]} ticks={[0, 0.5, 1, 1.5, 2]} width={40} />
            <ChartTooltip />
            <ChartLegend />
            <Line
              dataKey="north"
              stroke="var(--color-north)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              {...chartMotion}
            />
            <Line
              dataKey="south"
              stroke="var(--color-south)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              {...chartMotion}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <ChartTable data={data} x="t" xLabel="Time" config={config} />
      )}
    </Card>
  )
}
