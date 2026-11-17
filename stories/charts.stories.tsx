import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Charts" }
export default meta
type S = StoryObj

const hours = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
const speed = hours.map((t, i) => ({ t, north: [1.1, 1.4, 1.6, 1.2, 1.5, 1.7, 1.3, 1.0][i], south: [0.8, 1.0, 1.3, 1.4, 1.1, 1.2, 1.5, 1.2][i] }))
const speedConfig = { north: { label: "North site", color: 1, unit: "m/s" }, south: { label: "South site", color: 2, unit: "m/s" } } satisfies ChartConfig

/** Two series over time: legend on top, crosshair tooltip, and the same numbers as a table. */
function SpeedChart() {
  const [view, setView] = React.useState("chart")
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          Average patrol speed <span className="font-normal text-muted-foreground">· m/s</span>
        </p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
          <SegmentedControlItem value="table">Table</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "chart" ? (
        <ChartContainer config={speedConfig} label="Average patrol speed by hour, north and south site">
          <LineChart data={speed} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" {...chartAxis} />
            <YAxis {...chartAxis} domain={[0, 2]} ticks={[0, 0.5, 1, 1.5, 2]} width={32} />
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
        <ChartTable data={speed} x="t" xLabel="Time" config={speedConfig} />
      )}
    </div>
  )
}
export const ChartLine: S = { render: () => <SpeedChart /> }

const battery = hours.map((t, i) => ({ t, battery: [96, 88, 77, 69, 58, 47, 92, 85][i] }))
const batteryConfig = { battery: { label: "Battery", color: 1, unit: "%" } } satisfies ChartConfig

/** One series: no legend (the title names it), a soft fill under the line. */
function BatteryChart() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">
        Battery · Patrol dog 7F3A <span className="font-normal text-muted-foreground">· %</span>
      </p>
      <ChartContainer config={batteryConfig} label="Battery of patrol dog 7F3A by hour" className="h-48">
        <AreaChart data={battery} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} />
          <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={32} />
          <ChartTooltip />
          <Area dataKey="battery" type="linear" stroke="var(--color-battery)" strokeWidth={2} fill="var(--color-battery)" fillOpacity={0.12} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
export const ChartArea: S = { render: () => <BatteryChart /> }

const missions = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({ d, done: [18, 22, 19, 24, 21][i], aborted: [2, 1, 4, 1, 3][i] }))
const missionConfig = { done: { label: "Completed", color: 1 }, aborted: { label: "Aborted", color: 2 } } satisfies ChartConfig

/** Grouped bars: 4 px rounded ends on the data side, a 2 px gap between neighbours, a band behind the hovered day. */
function MissionChart() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">Missions this week</p>
      <ChartContainer config={missionConfig} label="Completed and aborted missions per day this week">
        <BarChart data={missions} barGap={2} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="d" {...chartAxis} />
          <YAxis {...chartAxis} allowDecimals={false} width={32} />
          <ChartTooltip />
          <ChartLegend />
          <Bar dataKey="done" fill="var(--color-done)" radius={[4, 4, 0, 0]} maxBarSize={24} {...chartMotion} />
          <Bar dataKey="aborted" fill="var(--color-aborted)" radius={[4, 4, 0, 0]} maxBarSize={24} {...chartMotion} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
export const ChartBar: S = { render: () => <MissionChart /> }
