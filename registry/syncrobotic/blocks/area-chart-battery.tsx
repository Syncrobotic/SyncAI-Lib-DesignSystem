// @syncrobotic/area-chart-battery v0.9.0 · update: npx shadcn add @syncrobotic/area-chart-battery --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"

const config = { battery: { label: "Battery", color: 1, unit: "%" } } satisfies ChartConfig
// Sample data: one robot's battery over a shift, with a charge at 14:00.
const data = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t, i) => ({
  t,
  battery: [98, 88, 77, 66, 54, 41, 30, 82, 72, 61][i],
}))

/** One robot's battery over a shift: a single series with a soft fill, the return-to-dock level marked, and the charge visible as the jump. */
export function AreaChartBattery() {
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">
            Battery · Patrol dog 7F3A <span className="font-normal text-muted-foreground">· %</span>
          </h3>
          <p className="text-xs text-muted-foreground">Charged 14:00–14:40 at Dock 2</p>
        </div>
        <span className="text-2xl font-bold tabular-nums">61 %</span>
      </div>
      <ChartContainer config={config} label="Battery of 7F3A by hour over the shift, with the 30 % return level" className="h-48">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} />
          <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={40} />
          <ChartTooltip />
          <ReferenceLine
            y={30}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{ value: "Returns to dock", position: "insideBottomRight", fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Area dataKey="battery" type="linear" stroke="var(--color-battery)" strokeWidth={2} fill="var(--color-battery)" fillOpacity={0.12} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
