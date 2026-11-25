// @syncrobotic/line-chart-limit v0.35.0 · update: npx shadcn add @syncrobotic/line-chart-limit --overwrite
"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { TriangleAlert } from "lucide-react"
import { Card, CardDataHeader, CardFigure } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { ChartViewSwitch } from "@/registry/syncrobotic/ui/segmented-control"

const config = { temp: { label: "Motor", color: 1, unit: "°C" } } satisfies ChartConfig
const limit = 60
// Sample data: motor temperature of one robot, every 30 minutes.
const data = [
  { t: "10:00", temp: 42 },
  { t: "10:30", temp: 45 },
  { t: "11:00", temp: 49 },
  { t: "11:30", temp: 53 },
  { t: "12:00", temp: 58 },
  { t: "12:30", temp: 62 },
  { t: "13:00", temp: 64 },
  { t: "13:30", temp: 59 },
  { t: "14:00", temp: 55 },
]

/**
 * One measurement against its limit: the latest value up top, the limit as a labelled dashed line. The header turns to
 * warning only while the value is over the limit; the line itself keeps its series colour.
 */
export function LineChartLimit() {
  const [view, setView] = React.useState("chart")
  // With no readings yet there is no latest value, and nothing can be over the limit.
  const latest = data.at(-1)?.temp
  const peak = Math.max(...data.map((d) => d.temp))
  const over = latest !== undefined && latest > limit
  const overAt = data.filter((d) => d.temp > limit).map((d) => d.t)
  return (
    <Card>
      <CardDataHeader
        title="Motor temperature · Patrol dog 7F3A"
        actions={
          <ChartViewSwitch value={view} onValueChange={setView} />
        }
      >
        <CardFigure value={latest === undefined ? "—" : `${latest} °C`} note={`peak ${peak} °C at 13:00`} />
        {peak > limit && (
          <p className={over ? "flex items-center gap-2 text-sm text-warning" : "flex items-center gap-2 text-sm text-muted-foreground"}>
            <TriangleAlert aria-hidden="true" className="size-4" />
            {over ? "Over the limit now" : "Was over the limit for 1 h"}
          </p>
        )}
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label={`Motor temperature of 7F3A every 30 minutes, with the ${limit} °C limit`} className="h-48">
          {/* Right margin: the last tick sits on the plot's edge, and its centred label has to stay inside the card. */}
          <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            {/* A label every hour, evenly spaced, from the first reading to the last. */}
            <XAxis dataKey="t" {...chartAxis} ticks={data.filter((d) => d.t.endsWith(":00")).map((d) => d.t)} interval={0} />
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
