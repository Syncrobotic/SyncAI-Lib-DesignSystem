// @syncrobotic/histogram-battery v0.22.0 · update: npx shadcn add @syncrobotic/histogram-battery --overwrite
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts"
import { BatteryLow } from "lucide-react"
import { Card, CardDataHeader, CardFigure } from "@/registry/syncrobotic/ui/card"
import { ChartContainer, ChartTable, ChartTooltip, chartAxis, chartMotion, type ChartConfig } from "@/registry/syncrobotic/ui/chart"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type HistogramBin = { from: number; to: number; count: number }

/**
 * Counts values into `bins` equal-width bins from `min` to `max`. Each bin holds `from ≤ v < to`; the last also holds
 * `max` itself (`from ≤ v ≤ to`), so every value in range lands in exactly one bin and 100 % is not dropped. Values below
 * `min`, above `max` or not finite are counted in `outside`, never folded into the end bins.
 */
export function binEqualWidth(values: readonly number[], { min, max, bins }: { min: number; max: number; bins: number }) {
  if (!(max > min) || !Number.isInteger(bins) || bins < 1) throw new Error("binEqualWidth needs max > min and a whole number of bins")
  const span = max - min
  // Edges from the index, not by adding the width up: 0.1 added ten times is not 1.
  const out: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({ from: min + (span * i) / bins, to: min + (span * (i + 1)) / bins, count: 0 }))
  let outside = 0
  for (const v of values) {
    if (!Number.isFinite(v) || v < min || v > max) {
      outside++
      continue
    }
    // v is within [min, max] here, so the index lands in 0 … bins − 1 and the bin exists.
    out[Math.min(bins - 1, Math.floor(((v - min) * bins) / span))]!.count++
  }
  return { bins: out, outside }
}

/** The middle value (the mean of the two middle ones for an even count). */
export function median(values: readonly number[]) {
  const s = [...values].sort((a, b) => a - b)
  if (s.length === 0) return NaN
  const m = s.length >> 1
  // The list is not empty (checked above), so m and m − 1 are both inside it.
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

const config = { n: { label: "Dockings", color: 3 } } satisfies ChartConfig
const LOW = 15
// Sample data: battery level (%) each time a robot docked to charge, last 30 days, 240 dockings. A fixed generator, so the
// picture is the same on every render: most robots dock between 25 and 55 %, a tail docks late.
const readings = (() => {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 240 }, (_, i) => {
    const late = i % 16 === 0
    const v = late ? 4 + rand() * 14 : 22 + (rand() + rand() + rand()) * 13
    return Math.round(Math.min(100, v))
  })
})()

const { bins } = binEqualWidth(readings, { min: 0, max: 100, bins: 20 })
// The bin's middle places it on the number axis; its edges are what people read.
const data = bins.map((b) => ({ mid: (b.from + b.to) / 2, range: `${b.from}–${b.to} %`, n: b.count, low: b.to <= LOW }))
const med = median(readings)
const lowCount = readings.filter((v) => v < LOW).length
const rangeOf = (mid: unknown) => data.find((d) => d.mid === Number(mid))?.range ?? String(mid)

/**
 * How one value is spread: battery level at docking in 5 % bins, the median as a labelled dashed line, and the bins
 * under 15 % in warning, because docking that low is the thing to act on. Every other bin is one neutral hue.
 */
export function HistogramBattery() {
  const [view, setView] = React.useState("chart")
  return (
    <Card>
      <CardDataHeader
        title="Battery when robots dock"
        actions={
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        }
      >
        <CardFigure value={`${med} %`} note={`median of ${readings.length} dockings, last 30 days`} />
        {lowCount > 0 && (
          <p className="flex items-center gap-2 text-sm text-warning tabular-nums">
            <BatteryLow aria-hidden="true" className="size-4" />
            {lowCount} docked below {LOW} %
          </p>
        )}
      </CardDataHeader>
      {view === "chart" ? (
        <ChartContainer config={config} label={`Dockings by battery level in 5 % steps, median ${med} %, ${lowCount} below ${LOW} %`} className="h-56">
          {/* Right margin: the 100 % label is centred on the plot's edge and has to stay inside the card. */}
          <BarChart data={data} barCategoryGap={1} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            {/* A number axis, so ticks sit on the bin edges and the reference lines on their exact value. */}
            <XAxis
              dataKey="mid"
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              interval={0}
              tickFormatter={(v: number) => `${v} %`}
              {...chartAxis}
            />
            <YAxis {...chartAxis} allowDecimals={false} width={32} />
            <ChartTooltip labelFormatter={rangeOf} />
            <Bar dataKey="n" fill="var(--color-n)" radius={[2, 2, 0, 0]} {...chartMotion}>
              {data.map((d) => (
                <Cell key={d.mid} fill={d.low ? "var(--warning)" : "var(--color-n)"} />
              ))}
            </Bar>
            <ReferenceLine
              x={LOW}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: `${LOW} %`, position: "top", fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <ReferenceLine
              x={med}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{ value: `Median ${med} %`, position: "top", fill: "var(--foreground)", fontSize: 12 }}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="flex flex-col gap-2">
          <ChartTable data={data} x="range" xLabel="Battery at docking" config={config} />
          <p className="text-xs text-muted-foreground tabular-nums">
            Each bin includes its lower edge, not its upper; the last includes 100 %. Median {med} % · {lowCount} below {LOW} %
          </p>
        </div>
      )}
    </Card>
  )
}
