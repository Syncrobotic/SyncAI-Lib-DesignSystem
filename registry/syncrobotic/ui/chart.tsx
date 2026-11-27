// @syncrobotic/chart v0.51.0 · update: npx shadcn add @syncrobotic/chart --overwrite
"use client"

import * as React from "react"
import { Area, Bar, Legend, Line, ResponsiveContainer, Tooltip, type LegendProps, type TooltipContentProps } from "recharts"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/registry/syncrobotic/lib/format-number"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/**
 * One entry per series, most important first. `color` is the palette slot: 1 the accent, 2 and 3 graphite, 4 light
 * grey for "Other", 5 a baseline. Keep the slot with the series, so hiding one never repaints the others. Order sets the
 * line style (solid, dashed, dotted); three series and Other is the limit.
 */
export type ChartConfig = Record<string, { label: string; color: 1 | 2 | 3 | 4 | 5; unit?: string }>

/** Line styles by series order: solid, dashed (6 4), dotted (1.5 3.5). A fourth line (Other) is solid, in light grey. */
export const chartDashes = [undefined, "6 4", "1.5 3.5"] as const

/**
 * A series' line style from its place in the config: solid, then dashed, then dotted. ChartContainer, the legend and the
 * tooltip apply it, so series are told apart without colour.
 */
export const chartDash = (config: ChartConfig, key: string): string | undefined => chartDashes[Object.keys(config).indexOf(key)]

type Marks = Record<string, "line" | "bar">
const ChartContext = React.createContext<{ config: ChartConfig; marks: Marks } | null>(null)
const useChart = () => {
  const chart = React.useContext(ChartContext)
  if (!chart) throw new Error("Chart parts must be inside <ChartContainer>")
  return chart
}
export const useChartConfig = () => useChart().config

/**
 * Gives each Line and unstacked Area its line style by series order (unless it sets one), opens grouped bars to the kit's 2 px
 * gap, and notes which series are lines and which are bars, so the legend draws the right swatch.
 */
function withSeriesStyles(chart: React.ReactElement, config: ChartConfig) {
  const marks: Marks = {}
  const props = chart.props as { children?: React.ReactNode; barGap?: number }
  const children = React.Children.map(props.children, (child) => {
    if (!React.isValidElement(child)) return child
    const p = child.props as { dataKey?: unknown; strokeDasharray?: string; stackId?: unknown }
    const key = typeof p.dataKey === "string" && p.dataKey in config ? p.dataKey : null
    if (!key) return child
    // Bars, and stacked areas (bands of a whole, set apart by a 2 px stroke in the card colour), are told apart by their
    // fill and their place in the stack: a square swatch, no dash.
    if (child.type === Bar || (child.type === Area && p.stackId != null)) {
      marks[key] = "bar"
      return child
    }
    if (child.type !== Line && child.type !== Area) return child
    marks[key] = "line"
    const dash = chartDash(config, key)
    return p.strokeDasharray === undefined && dash ? React.cloneElement(child as React.ReactElement<{ strokeDasharray?: string }>, { strokeDasharray: dash }) : child
  })
  const hasBars = Object.values(marks).includes("bar")
  return { marks, chart: React.cloneElement(chart as React.ReactElement<{ barGap?: number }>, hasBars && props.barGap === undefined ? { barGap: 2 } : {}, children) }
}

/**
 * A number as charts write it: grouped, up to three decimals, in English so server and browser agree, with a true minus
 * (U+2212). For ticks, tooltips and the table; a non-number comes back as it is.
 */
export const chartNumber = (n: number | string) => {
  const v = typeof n === "number" ? n : Number(n)
  if (typeof n === "string" && (n.trim() === "" || Number.isNaN(v))) return n
  const text = formatNumber(Math.abs(v))
  return v < 0 && text !== "0" ? `\u2212${text}` : text
}

/**
 * Sizes a Recharts chart to its box and maps each series to `var(--color-<key>)`, with line styles by order and a 2 px gap
 * between grouped bars; text, grid and tooltip use the theme tokens. Give it a height; the width follows the container.
 */
export function ChartContainer({
  config,
  className,
  children,
  label,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement; /** What the chart shows, for screen readers. */ label: string }) {
  const vars = Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, `var(--chart-${v.color})`])) as React.CSSProperties
  const { chart, marks } = withSeriesStyles(children, config)
  return (
    <ChartContext.Provider value={{ config, marks }}>
      <div
        data-slot="chart"
        role="figure"
        aria-label={label}
        style={vars}
        className={cn(
          "h-64 w-full animate-fade-in text-xs",
          // Recessive frame: muted axis text, hairline grid, no axis lines; the data carries the contrast.
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border",
          "[&_.recharts-reference-line_line]:stroke-muted-foreground",
          "[&_.recharts-tooltip-cursor]:stroke-muted-foreground [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/**
 * Recharts times its animation in JavaScript with named easings only, so it cannot follow the motion tokens: marks draw
 * without it and the chart fades in on mount. Spread onto Line, Area and Bar: `<Line {...chartMotion} />`.
 */
export const chartMotion = { isAnimationActive: false } as const

/** The hover layer. Line and area charts get a crosshair (the default cursor); bars a band. */
export function ChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return <Tooltip isAnimationActive={false} content={<ChartTooltipContent />} {...props} />
}

/** The swatch for a series: a short stretch of its line, in its line style, for lines and areas; a square for bars. */
export function ChartSwatch({ dataKey }: { dataKey: string }) {
  const { config, marks } = useChart()
  if (marks[dataKey] === "line")
    return (
      <svg aria-hidden="true" viewBox="0 0 20 12" className="h-3 w-5 shrink-0">
        <line x1="0" y1="6" x2="20" y2="6" stroke={`var(--color-${dataKey})`} strokeWidth="2" strokeDasharray={chartDash(config, dataKey)} />
      </svg>
    )
  return <span aria-hidden="true" className="size-3 shrink-0 rounded-xs" style={{ background: `var(--color-${dataKey})` }} />
}

/**
 * The card under the pointer: the x value, then one row per series with its swatch, name and value.
 * Text stays in text colours; the swatch alone carries the series colour and line style.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: Partial<TooltipContentProps<number, string>> & {
  labelFormatter?: (label: unknown) => React.ReactNode
  formatter?: (value: number, key: string) => React.ReactNode
}) {
  const config = useChartConfig()
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-overlay ring-1 ring-border">
      <p className="pb-1 font-medium">{labelFormatter ? labelFormatter(label) : String(label)}</p>
      <ul className="flex flex-col gap-1">
        {payload.map((p) => {
          const key = String(p.dataKey)
          const c = config[key]
          return (
            <li key={key} className="flex items-center gap-2">
              <ChartSwatch dataKey={key} />
              <span className="flex-1 text-muted-foreground">{c?.label ?? key}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatter ? formatter(Number(p.value), key) : `${typeof p.value === "number" ? chartNumber(p.value) : p.value}${c?.unit ? ` ${c.unit}` : ""}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Always shown for two series or more, above the plot, with each series' line style, so a series is never identified by colour alone. */
export function ChartLegend(props: Omit<LegendProps, "ref">) {
  return <Legend verticalAlign="top" align="left" content={<ChartLegendContent />} {...props} />
}

export function ChartLegendContent({ payload }: { payload?: readonly { dataKey?: unknown; value?: unknown }[] }) {
  const config = useChartConfig()
  if (!payload?.length) return null
  // In the order the series are configured, which is the order of emphasis, whatever order Recharts draws them in.
  const keys = Object.keys(config)
  const items = [...payload].sort((a, b) => keys.indexOf(String(a.dataKey)) - keys.indexOf(String(b.dataKey)))
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-3 text-xs">
      {items.map((p) => {
        const key = String(p.dataKey)
        return (
          <li key={key} className="flex items-center gap-2 text-muted-foreground">
            <ChartSwatch dataKey={key} />
            {config[key]?.label ?? key}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The same data as a table: for exact values, screen readers and anyone who cannot tell two series apart.
 * Offer it beside every chart (a Chart / Table switch).
 */
export function ChartTable<T extends Record<string, unknown>>({
  data,
  x,
  xLabel,
  config,
  className,
}: {
  data: T[]
  x: keyof T & string
  xLabel: string
  config: ChartConfig
  className?: string
}) {
  const keys = Object.keys(config)
  return (
    <div className={cn("max-h-64 overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{xLabel}</TableHead>
            {Object.entries(config).map(([k, series]) => (
              <TableHead key={k} className="text-right">
                {series.label}
                {series.unit ? ` (${series.unit})` : ""}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{String(row[x])}</TableCell>
              {keys.map((k) => (
                <TableCell key={k} className="text-right tabular-nums">
                  {row[k] == null ? "–" : typeof row[k] === "number" ? chartNumber(row[k]) : String(row[k])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Shared axis props: no axis lines or ticks, 8 px from the plot, muted 12 px text. Spread onto XAxis and YAxis. */
export const chartAxis = { axisLine: false, tickLine: false, tickMargin: 8 } as const
