import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartNoAxesColumn } from "lucide-react"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
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
          <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={40} />
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
          <YAxis {...chartAxis} allowDecimals={false} width={40} />
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

const sites = ["North", "South", "Hall B", "Parking"].map((site, i) => ({
  site,
  patrol: [42, 31, 18, 12][i],
  charging: [9, 11, 6, 4][i],
  idle: [3, 6, 2, 5][i],
}))
const hoursConfig = {
  patrol: { label: "Patrolling", color: 1, unit: "h" },
  charging: { label: "Charging", color: 2, unit: "h" },
  idle: { label: "Idle", color: 3, unit: "h" },
} satisfies ChartConfig

/**
 * Parts of a whole per site: stacked segments with a 2 px gap in the surface colour, rounded only at the top of the stack.
 * The gap is drawn in --card, so the chart sits on a card, as it does on a dashboard.
 */
export const ChartStackedBar: S = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
      <p className="text-sm font-medium">
        Robot hours by site <span className="font-normal text-muted-foreground">· this week</span>
      </p>
      <ChartContainer config={hoursConfig} label="Patrolling, charging and idle hours per site this week">
        <BarChart data={sites} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
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
    </div>
  ),
}

const incidents = [
  { cause: "Blocked path", n: 23 },
  { cause: "Door closed", n: 14 },
  { cause: "Low battery", n: 9 },
  { cause: "Lost localization", n: 5 },
  { cause: "Other", n: 3 },
]
const incidentConfig = { n: { label: "Stops", color: 1 } } satisfies ChartConfig

/** Ranked categories with long names: horizontal bars, sorted, one series so no legend. */
export const ChartHorizontalBar: S = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">Why robots stopped · last 30 days</p>
      <ChartContainer config={incidentConfig} label="Number of robot stops by cause, last 30 days" className="h-56">
        <BarChart data={incidents} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" {...chartAxis} allowDecimals={false} />
          <YAxis type="category" dataKey="cause" {...chartAxis} width={112} />
          <ChartTooltip />
          <Bar dataKey="n" fill="var(--color-n)" radius={[0, 4, 4, 0]} maxBarSize={20} {...chartMotion} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
}

const temp = hours.map((t, i) => ({ t, motor: [41, 44, 52, 61, 66, 63, 55, 47][i] }))
const tempConfig = { motor: { label: "Motor", color: 1, unit: "°C" } } satisfies ChartConfig

/** A limit drawn as a labelled dashed line in text colour: the line marks it, the label says it. */
export const ChartThreshold: S = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">
        Motor temperature · 7F3A <span className="font-normal text-muted-foreground">· °C</span>
      </p>
      <ChartContainer config={tempConfig} label="Motor temperature of 7F3A by hour, with the 60 °C limit" className="h-48">
        <LineChart data={temp} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} />
          <YAxis {...chartAxis} domain={[30, 80]} ticks={[30, 40, 50, 60, 70, 80]} width={40} />
          <ChartTooltip />
          <ReferenceLine
            y={60}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{ value: "Limit 60 °C", position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Line
            dataKey="motor"
            stroke="var(--color-motor)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            {...chartMotion}
          />
        </LineChart>
      </ChartContainer>
    </div>
  ),
}

const load = hours.map((t, i) => ({ t, robots: [2, 4, 6, 6, 5, 6, 4, 3][i] }))
const loadConfig = { robots: { label: "Robots out", color: 1 } } satisfies ChartConfig

/** A count that changes in jumps: a step line, not a smooth curve that invents values between hours. */
export const ChartStepLine: S = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">Robots out on patrol</p>
      <ChartContainer config={loadConfig} label="Number of robots out on patrol by hour" className="h-40">
        <AreaChart data={load} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} />
          <YAxis {...chartAxis} allowDecimals={false} domain={[0, 6]} width={40} />
          <ChartTooltip />
          <Area dataKey="robots" type="stepAfter" stroke="var(--color-robots)" strokeWidth={2} fill="var(--color-robots)" fillOpacity={0.12} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </div>
  ),
}

const fleetBattery = ["7F3A", "DAA6", "9E37"].map((id, r) => ({
  id,
  data: hours.map((t, i) => ({ t, battery: Math.max(8, [96, 80, 70][r] - i * [9, 6, 11][r] + (i > 5 ? 40 : 0)) })),
}))

/** One chart per robot on the same scale: compare shapes without a crowded legend. */
export const ChartSmallMultiples: S = {
  render: () => (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
      {fleetBattery.map((r) => (
        <div key={r.id} className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {r.id} <span className="font-normal text-muted-foreground">· battery %</span>
          </p>
          <ChartContainer config={batteryConfig} label={`Battery of ${r.id} by hour`} className="h-28">
            <AreaChart data={r.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="t" {...chartAxis} ticks={["06:00", "20:00"]} />
              <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 50, 100]} width={32} />
              <ChartTooltip />
              <Area
                dataKey="battery"
                type="linear"
                stroke="var(--color-battery)"
                strokeWidth={2}
                fill="var(--color-battery)"
                fillOpacity={0.12}
                {...chartMotion}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      ))}
    </div>
  ),
}

/** No data yet: keep the title and the frame, and say why instead of drawing empty axes. */
export const ChartNoData: S = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm font-medium">Missions this week</p>
      <div className="grid h-64 place-items-center rounded-md ring-1 ring-border">
        <EmptyState icon={ChartNoAxesColumn} title="No missions yet this week" description="Charts fill in after the first mission ends." />
      </div>
    </div>
  ),
}
