import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartNoAxesColumn } from "lucide-react"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { ChartContainer, ChartLegend, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Charts" }
export default meta
type S = StoryObj

/**
 * Every chart with axes has a table view (the Chart / Table switch): exact values, and a way in for anyone who cannot
 * tell two hues apart. The title sits beside the switch; `table` is what the Table side shows.
 */
function Switchable({ title, table, children, className }: { title: React.ReactNode; table: React.ReactNode; children: React.ReactNode; className?: string }) {
  const [view, setView] = React.useState("chart")
  return (
    <div className={className ?? "flex w-full max-w-3xl flex-col gap-3"}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
          <SegmentedControlItem value="table">Table</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "chart" ? children : table}
    </div>
  )
}

const hours = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
const speed = hours.map((t, i) => ({ t, north: [1.1, 1.4, 1.6, 1.2, 1.5, 1.7, 1.3, 1.0][i], south: [0.8, 1.0, 1.3, 1.4, 1.1, 1.2, 1.5, 1.2][i] }))
const speedConfig = { north: { label: "North site", color: 1, unit: "m/s" }, south: { label: "South site", color: 2, unit: "m/s" } } satisfies ChartConfig

/** Two series over time: legend on top, crosshair tooltip, and the same numbers as a table. */
function SpeedChart() {
  return (
    <Switchable
      title={
        <>
          Average patrol speed <span className="font-normal text-muted-foreground">· m/s</span>
        </>
      }
      table={<ChartTable data={speed} x="t" xLabel="Time" config={speedConfig} />}
    >
      <ChartContainer config={speedConfig} label="Average patrol speed by hour, north and south site">
        <LineChart data={speed} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="preserveStartEnd" minTickGap={12} />
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
    </Switchable>
  )
}
export const ChartLine: S = { render: () => <SpeedChart /> }

const battery = hours.map((t, i) => ({ t, battery: [96, 88, 77, 69, 58, 47, 92, 85][i] }))
const batteryConfig = { battery: { label: "Battery", color: 1, unit: "%" } } satisfies ChartConfig

/** One series: no legend (the title names it), a soft fill under the line. */
function BatteryChart() {
  return (
    <Switchable
      title={
        <>
          Battery · Patrol dog 7F3A <span className="font-normal text-muted-foreground">· %</span>
        </>
      }
      table={<ChartTable data={battery} x="t" xLabel="Time" config={batteryConfig} />}
    >
      <ChartContainer config={batteryConfig} label="Battery of patrol dog 7F3A by hour" className="h-48">
        <AreaChart data={battery} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="preserveStartEnd" minTickGap={12} />
          <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={40} />
          <ChartTooltip />
          <Area dataKey="battery" type="linear" stroke="var(--color-battery)" strokeWidth={2} fill="var(--color-battery)" fillOpacity={0.12} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </Switchable>
  )
}
export const ChartArea: S = { render: () => <BatteryChart /> }

const missions = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({ d, done: [18, 22, 19, 24, 21][i], aborted: [2, 1, 4, 1, 3][i] }))
const missionConfig = { done: { label: "Completed", color: 1 }, aborted: { label: "Aborted", color: 3 } } satisfies ChartConfig

/**
 * Grouped bars: 4 px rounded ends on the data side, a 2 px gap between neighbours, a band behind the hovered day. Filled
 * marks take the accent and the mid grey (3): a bar in the strong grey (2) would outweigh the accent.
 */
function MissionChart() {
  return (
    <Switchable title="Missions this week" table={<ChartTable data={missions} x="d" xLabel="Day" config={missionConfig} />}>
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
    </Switchable>
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
  charging: { label: "Charging", color: 3, unit: "h" },
  idle: { label: "Idle", color: 4, unit: "h" },
} satisfies ChartConfig

/**
 * Parts of a whole per site: stacked segments with a 2 px gap in the surface colour, rounded only at the top of the stack.
 * The gap is drawn in --card, so the chart sits on a card, as it does on a dashboard. A stack is filled marks: the accent,
 * then the mid grey (3) and Other's light grey (4), never the strong grey (2), which would outweigh the accent.
 */
export const ChartStackedBar: S = {
  render: () => (
    <Switchable
      className="flex w-full max-w-3xl flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border"
      title={
        <>
          Robot hours by site <span className="font-normal text-muted-foreground">· this week</span>
        </>
      }
      table={<ChartTable data={sites} x="site" xLabel="Site" config={hoursConfig} />}
    >
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
    </Switchable>
  ),
}

const incidents = [
  { cause: "Blocked path", n: 23 },
  { cause: "Door closed", n: 14 },
  { cause: "Low battery", n: 9 },
  { cause: "Lost localisation", n: 5 },
  { cause: "Other", n: 3 },
]
const incidentConfig = { n: { label: "Stops", color: 1 } } satisfies ChartConfig

/** Ranked categories with long names: horizontal bars, sorted, one series so no legend. */
export const ChartHorizontalBar: S = {
  render: () => (
    <Switchable title="Why robots stopped · last 30 days" table={<ChartTable data={incidents} x="cause" xLabel="Cause" config={incidentConfig} />}>
      <ChartContainer config={incidentConfig} label="Number of robot stops by cause, last 30 days" className="h-56">
        <BarChart data={incidents} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" {...chartAxis} allowDecimals={false} />
          <YAxis type="category" dataKey="cause" {...chartAxis} width={112} />
          <ChartTooltip />
          <Bar dataKey="n" fill="var(--color-n)" radius={[0, 4, 4, 0]} maxBarSize={20} {...chartMotion} />
        </BarChart>
      </ChartContainer>
    </Switchable>
  ),
}

const temp = hours.map((t, i) => ({ t, motor: [41, 44, 52, 61, 66, 63, 55, 47][i] }))
const tempConfig = { motor: { label: "Motor", color: 1, unit: "°C" } } satisfies ChartConfig

/** A limit drawn as a labelled dashed line in text colour: the line marks it, the label says it. */
export const ChartThreshold: S = {
  render: () => (
    <Switchable
      title={
        <>
          Motor temperature · 7F3A <span className="font-normal text-muted-foreground">· °C</span>
        </>
      }
      table={<ChartTable data={temp} x="t" xLabel="Time" config={tempConfig} />}
    >
      <ChartContainer config={tempConfig} label="Motor temperature of 7F3A by hour, with the 60 °C limit" className="h-48">
        <LineChart data={temp} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="preserveStartEnd" minTickGap={12} />
          {/* interval 0: every tick given is drawn. Recharts otherwise drops one it thinks is crowded (70 went missing). */}
          <YAxis {...chartAxis} domain={[30, 80]} ticks={[30, 40, 50, 60, 70, 80]} interval={0} width={40} />
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
    </Switchable>
  ),
}

const load = hours.map((t, i) => ({ t, robots: [2, 4, 6, 6, 5, 6, 4, 3][i] }))
const loadConfig = { robots: { label: "Robots out", color: 1 } } satisfies ChartConfig

/** A count that changes in jumps: a step line, not a smooth curve that invents values between hours. */
export const ChartStepLine: S = {
  render: () => (
    <Switchable title="Robots out on patrol" table={<ChartTable data={load} x="t" xLabel="Time" config={loadConfig} />}>
      <ChartContainer config={loadConfig} label="Number of robots out on patrol by hour" className="h-40">
        <AreaChart data={load} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="preserveStartEnd" minTickGap={12} />
          <YAxis {...chartAxis} allowDecimals={false} domain={[0, 6]} width={40} />
          <ChartTooltip />
          <Area dataKey="robots" type="stepAfter" stroke="var(--color-robots)" strokeWidth={2} fill="var(--color-robots)" fillOpacity={0.12} {...chartMotion} />
        </AreaChart>
      </ChartContainer>
    </Switchable>
  ),
}

const fleetBattery = ["7F3A", "DAA6", "9E37"].map((id, r) => ({
  id,
  data: hours.map((t, i) => ({ t, battery: Math.max(8, [96, 80, 70][r] - i * [9, 6, 11][r] + (i > 5 ? 40 : 0)) })),
}))

const fleetTable = hours.map((t, i) => Object.fromEntries([["t", t], ...fleetBattery.map((r) => [r.id, r.data[i].battery])]))
const fleetConfig = Object.fromEntries(fleetBattery.map((r) => [r.id, { label: r.id, color: 1, unit: "%" }])) as ChartConfig

/** One chart per robot on the same scale: compare shapes without a crowded legend. One switch, one table for the set. */
export const ChartSmallMultiples: S = {
  render: () => (
    <Switchable title="Battery by robot" table={<ChartTable data={fleetTable} x="t" xLabel="Time" config={fleetConfig} />}>
      <div className="grid w-full gap-4 sm:grid-cols-3">
        {fleetBattery.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {r.id} <span className="font-normal text-muted-foreground">· battery %</span>
            </p>
            <ChartContainer config={batteryConfig} label={`Battery of ${r.id} by hour`} className="h-28">
              <AreaChart data={r.data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="t" {...chartAxis} ticks={["06:00", "20:00"]} />
                <YAxis {...chartAxis} domain={[0, 100]} ticks={[0, 50, 100]} width={40} />
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
    </Switchable>
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

const weekCompare = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  d,
  now: [21, 24, 19, 26, 23, 14, 12][i],
  before: [18, 20, 21, 19, 22, 13, 11][i],
}))
const compareConfig = { now: { label: "This week", color: 1 }, before: { label: "Last week", color: 5 } } satisfies ChartConfig

/** This period against the last: the earlier one dashed, so it reads as a reference. */
export const ChartPreviousPeriod: S = {
  render: () => (
    <Switchable title="Missions per day" table={<ChartTable data={weekCompare} x="d" xLabel="Day" config={compareConfig} />}>
      <ChartContainer config={compareConfig} label="Missions per day, this week against last week">
        <LineChart data={weekCompare} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="d" {...chartAxis} />
          <YAxis {...chartAxis} allowDecimals={false} width={40} />
          <ChartTooltip />
          <ChartLegend />
          <Line dataKey="before" stroke="var(--color-before)" strokeWidth={2} strokeDasharray="4 4" dot={false} {...chartMotion} />
          <Line
            dataKey="now"
            stroke="var(--color-now)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            {...chartMotion}
          />
        </LineChart>
      </ChartContainer>
    </Switchable>
  ),
}

const states = hours.map((t, i) => ({ t, patrol: [2, 4, 5, 5, 4, 5, 3, 2][i], charging: [3, 1, 1, 1, 2, 1, 2, 3][i], idle: [1, 1, 0, 0, 0, 0, 1, 1][i] }))
const statesConfig = {
  patrol: { label: "Patrolling", color: 1 },
  charging: { label: "Charging", color: 3 },
  idle: { label: "Idle", color: 4 },
} satisfies ChartConfig

/** How the fleet's time splits over the day: stacked areas that always add up to the fleet, in the accent, 3 and 4. */
export const ChartStackedArea: S = {
  render: () => (
    <Switchable
      title={
        <>
          Fleet by state <span className="font-normal text-muted-foreground">· 6 robots</span>
        </>
      }
      table={<ChartTable data={states} x="t" xLabel="Time" config={statesConfig} />}
    >
      <ChartContainer config={statesConfig} label="Number of robots patrolling, charging and idle by hour">
        <AreaChart data={states} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="t" {...chartAxis} interval="preserveStartEnd" minTickGap={12} />
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
    </Switchable>
  ),
}

const drift = ["7F3A", "DAA6", "9E37", "1715", "B54C"].map((r, i) => ({ r, delta: [-4, 2, -11, 6, 1][i] }))
const driftConfig = { delta: { label: "Change", color: 1, unit: "min" } } satisfies ChartConfig

/** Above and below zero: patrol time against plan, one hue, the zero line marked. */
export const ChartAboveBelowZero: S = {
  render: () => (
    <Switchable
      title={
        <>
          Patrol time against plan <span className="font-normal text-muted-foreground">· min</span>
        </>
      }
      table={<ChartTable data={drift} x="r" xLabel="Robot" config={driftConfig} />}
    >
      <ChartContainer config={driftConfig} label="Minutes each robot's patrol ran over or under plan" className="h-48">
        <BarChart data={drift} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="r" {...chartAxis} />
          <YAxis {...chartAxis} domain={[-12, 12]} ticks={[-12, -6, 0, 6, 12]} width={40} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          <ChartTooltip />
          <Bar dataKey="delta" fill="var(--color-delta)" radius={4} maxBarSize={24} {...chartMotion} />
        </BarChart>
      </ChartContainer>
    </Switchable>
  ),
}
