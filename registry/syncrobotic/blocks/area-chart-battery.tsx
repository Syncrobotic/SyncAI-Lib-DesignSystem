// @syncrobotic/area-chart-battery v0.53.0 · update: npx shadcn add @syncrobotic/area-chart-battery --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardDataHeader, CardFigure } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { ChartViewSwitch } from "@/registry/syncrobotic/ui/segmented-control"

const config = { battery: { label: "Battery", color: 1, unit: "%" } } satisfies ChartConfig
const dock = 30
// Sample data: one robot's battery over a shift, with a charge at 14:00.
const data = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t, i) => ({
  t,
  battery: [98, 88, 77, 66, 54, 41, 30, 82, 72, 61][i],
}))

/**
 * One robot's battery over a shift with the return-to-dock level marked; the charge shows as the jump. A single series
 * with a soft fill.
 */
export function AreaChartBattery() {
  const [view, setView] = React.useState("chart")
  return (
    <Card>
      <CardDataHeader
        title={
          <>
            Battery · Patrol dog 7F3A <span className="font-normal text-muted-foreground">· %</span>
          </>
        }
        actions={
          <ChartViewSwitch value={view} onValueChange={setView} />
        }
      >
        <CardFigure value="61 %" />
        <p className="text-xs text-muted-foreground">Charged 14:00–14:40 at Dock 2</p>
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label={`Battery of 7F3A by hour over the shift, with the ${dock} % return level`} className="h-48">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" {...chartAxis} interval="equidistantPreserveStart" />
            <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={40} />
            <ChartTooltip />
            <ReferenceLine
              y={dock}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: "Returns to dock", position: "insideBottomLeft", fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Area dataKey="battery" type="linear" stroke="var(--color-battery)" strokeWidth={2} fill="var(--color-battery)" fillOpacity={0.12} {...chartMotion} />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="flex flex-col gap-2">
          <ChartTable data={data} x="t" xLabel="Time" config={config} />
          <p className="text-xs text-muted-foreground tabular-nums">Returns to dock at {dock} %.</p>
        </div>
      )}
    </Card>
  )
}
