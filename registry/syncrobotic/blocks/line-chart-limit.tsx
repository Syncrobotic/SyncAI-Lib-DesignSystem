// @syncrobotic/line-chart-limit v0.17.1 · update: npx shadcn add @syncrobotic/line-chart-limit --overwrite
"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { TriangleAlert } from "lucide-react"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const config = { temp: { label: "Motor", color: 1, unit: "°C" } } satisfies ChartConfig
const limit = 60
// Sample data: motor temperature of one robot, every 30 minutes.
const data = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00"].map((t, i) => ({
  t,
  temp: [42, 45, 49, 53, 58, 62, 64, 59, 55][i],
}))

/**
 * One measurement against its limit: the latest value up top, the limit as a labelled dashed line. The header turns to
 * warning only while the value is over the limit; the line itself keeps its series colour.
 */
export function LineChartLimit() {
  const [view, setView] = React.useState("chart")
  const latest = data[data.length - 1].temp
  const peak = Math.max(...data.map((d) => d.temp))
  const over = latest > limit
  const overAt = data.filter((d) => d.temp > limit).map((d) => d.t)
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">Motor temperature · Patrol dog 7F3A</h3>
          <p className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{latest} °C</span>
            <span className="text-xs text-muted-foreground tabular-nums">peak {peak} °C at 13:00</span>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {peak > limit && (
            <p className={over ? "flex items-center gap-2 text-sm text-warning" : "flex items-center gap-2 text-sm text-muted-foreground"}>
              <TriangleAlert aria-hidden="true" className="size-4" />
              {over ? "Over the limit now" : "Was over the limit for 1 h"}
            </p>
          )}
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
      {view === "chart" ? (
        <ChartContainer config={config} label={`Motor temperature of 7F3A every 30 minutes, with the ${limit} °C limit`} className="h-48">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" {...chartAxis} interval="equidistantPreserveStart" />
            <YAxis {...chartAxis} domain={[30, 80]} ticks={[30, 40, 50, 60, 70, 80]} interval={0} width={40} />
            <ChartTooltip />
            <ReferenceLine
              y={limit}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: `Limit ${limit} °C`, position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Line
              dataKey="temp"
              stroke="var(--color-temp)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              {...chartMotion}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex flex-col gap-2">
          <ChartTable data={data} x="t" xLabel="Time" config={config} />
          <p className="text-xs text-muted-foreground tabular-nums">
            Limit {limit} °C{overAt.length > 0 && ` · over it at ${overAt.join(", ")}`}
          </p>
        </div>
      )}
    </Card>
  )
}
