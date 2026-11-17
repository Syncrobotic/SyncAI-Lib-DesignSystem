// @syncrobotic/bar-chart-variance v0.9.0 · update: npx shadcn add @syncrobotic/bar-chart-variance --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"

const config = { delta: { label: "Against plan", color: 1, unit: "min" } } satisfies ChartConfig
// Sample data: minutes each robot's patrol ran over (+) or under (−) its plan today.
const data = ["7F3A", "DAA6", "9E37", "1715", "B54C", "5384"].map((r, i) => ({ r, delta: [-4, 2, -11, 6, 1, -2][i] }))

/** Above and below zero: one hue, the zero line drawn, the biggest miss named in words. */
export function BarChartVariance() {
  const worst = data.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a))
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">
          Patrol time against plan <span className="font-normal text-muted-foreground">· min</span>
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          Biggest gap: {worst.r}, {Math.abs(worst.delta)} min {worst.delta < 0 ? "short" : "over"}
        </p>
      </div>
      <ChartContainer config={config} label="Minutes each robot's patrol ran over or under plan today" className="h-48">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="r" {...chartAxis} />
          <YAxis {...chartAxis} domain={[-12, 12]} ticks={[-12, -6, 0, 6, 12]} width={40} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          <ChartTooltip />
          <Bar dataKey="delta" fill="var(--color-delta)" radius={4} maxBarSize={24} {...chartMotion} />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}
