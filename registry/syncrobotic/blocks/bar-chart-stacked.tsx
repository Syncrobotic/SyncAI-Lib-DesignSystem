// @syncrobotic/bar-chart-stacked v0.9.0 · update: npx shadcn add @syncrobotic/bar-chart-stacked --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartLegend, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"

const config = {
  patrol: { label: "Patrolling", color: 1, unit: "h" },
  charging: { label: "Charging", color: 2, unit: "h" },
  idle: { label: "Idle", color: 3, unit: "h" },
} satisfies ChartConfig
// Sample data: robot hours per site this week.
const data = ["North", "South", "Hall B", "Parking"].map((site, i) => ({
  site,
  patrol: [42, 31, 18, 12][i],
  charging: [9, 11, 6, 4][i],
  idle: [3, 6, 2, 5][i],
}))

/** Parts of a whole per category: stacked segments separated by a 2 px gap in the card colour, rounded only at the top. */
export function BarChartStacked() {
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">
          Robot hours by site <span className="font-normal text-muted-foreground">· this week</span>
        </h3>
      </div>
      <ChartContainer config={config} label="Patrolling, charging and idle hours per site this week">
        <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="site" {...chartAxis} />
          <YAxis {...chartAxis} width={40} />
          <ChartTooltip />
          <ChartLegend />
          <Bar dataKey="patrol" stackId="h" fill="var(--color-patrol)" stroke="var(--card)" strokeWidth={2} maxBarSize={32} {...chartMotion} />
          <Bar dataKey="charging" stackId="h" fill="var(--color-charging)" stroke="var(--card)" strokeWidth={2} maxBarSize={32} {...chartMotion} />
          <Bar
            dataKey="idle"
            stackId="h"
            fill="var(--color-idle)"
            stroke="var(--card)"
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            {...chartMotion}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}
