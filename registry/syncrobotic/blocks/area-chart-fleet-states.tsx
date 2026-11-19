// @syncrobotic/area-chart-fleet-states v0.15.0 · update: npx shadcn add @syncrobotic/area-chart-fleet-states --overwrite
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"

const config = {
  patrol: { label: "Patrolling", color: 1 },
  charging: { label: "Charging", color: 2 },
  idle: { label: "Idle", color: 3 },
} satisfies ChartConfig
// Sample data: how many of 6 robots were in each state, per hour. The three always add up to the fleet.
const data = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((t, i) => ({
  t,
  patrol: [2, 4, 5, 5, 4, 5, 3, 2][i],
  charging: [3, 1, 1, 1, 2, 1, 2, 3][i],
  idle: [1, 1, 0, 0, 0, 0, 1, 1][i],
}))

/** How the fleet's time splits over the day: stacked step areas, so every hour adds up to the fleet. */
export function AreaChartFleetStates() {
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">
          Fleet by state <span className="font-normal text-muted-foreground">· 6 robots</span>
        </h3>
        <p className="text-xs text-muted-foreground">Today, per 2 hours</p>
      </div>
      <ChartContainer config={config} label="Number of robots patrolling, charging and idle by hour today">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="equidistantPreserveStart" />
          <YAxis {...chartAxis} allowDecimals={false} domain={[0, 6]} width={40} />
          <ChartTooltip />
          <ChartLegend />
          <Area dataKey="patrol" stackId="s" type="stepAfter" stroke="var(--color-patrol)" fill="var(--color-patrol)" fillOpacity={0.5} {...chartMotion} />
          <Area
            dataKey="charging"
            stackId="s"
            type="stepAfter"
            stroke="var(--color-charging)"
            fill="var(--color-charging)"
            fillOpacity={0.5}
            {...chartMotion}
          />
          <Area dataKey="idle" stackId="s" type="stepAfter" stroke="var(--color-idle)" fill="var(--color-idle)" fillOpacity={0.5} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
