// @syncrobotic/chart v0.7.0 · update: npx shadcn add @syncrobotic/chart --overwrite
"use client"

import * as React from "react"
import { Legend, ResponsiveContainer, Tooltip, type LegendProps, type TooltipContentProps } from "recharts"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/**
 * One entry per series. `color` is the slot in the categorical palette (--chart-1…5), assigned in a fixed order and
 * kept with the series: a filter that hides one series never repaints the others. Five is the limit; fold the rest into
 * "Other" or split the chart.
 */
export type ChartConfig = Record<string, { label: string; color: 1 | 2 | 3 | 4 | 5; unit?: string }>

const ChartContext = React.createContext<ChartConfig | null>(null)
export const useChartConfig = () => {
  const config = React.useContext(ChartContext)
  if (!config) throw new Error("Chart parts must be inside <ChartContainer>")
  return config
}

/**
 * Sizes a Recharts chart to its box and maps each series to its palette slot as `var(--color-<key>)`, so marks write
 * `stroke="var(--color-speed)"`. Axis text, grid and tooltip use the theme's text and line tokens, so the chart reads the
 * same in light and dark. Give it a height (class or style); the width follows the container.
 */
export function ChartContainer({
  config,
  className,
  children,
  label,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement; /** What the chart shows, for screen readers. */ label: string }) {
  const vars = Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, `var(--chart-${v.color})`])) as React.CSSProperties
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        role="figure"
        aria-label={label}
        style={vars}
        className={cn(
          "h-64 w-full animate-fade-in text-xs",
          // Recessive frame: muted axis text, hairline grid, no axis lines; the data carries the contrast.
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border",
          "[&_.recharts-reference-line_line]:stroke-muted-foreground [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none",
          "[&_.recharts-tooltip-cursor]:stroke-muted-foreground [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/**
 * Motion for marks. Recharts times its own animation in JavaScript and takes only named easings, so it cannot follow the
 * motion tokens; marks therefore draw without it, and the whole chart arrives with the fade pattern (ChartContainer's
 * animate-fade-in, --motion-base) when it mounts. Spread onto Line, Area and Bar: `<Line {...chartMotion} />`.
 */
export const chartMotion = { isAnimationActive: false } as const
/** @deprecated Use `chartMotion`; kept so existing code compiles. */
export const useChartMotion = () => chartMotion

/** The hover layer. Line and area charts get a crosshair (the default cursor); bars a band. */
export function ChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return <Tooltip isAnimationActive={false} content={<ChartTooltipContent />} {...props} />
}

/**
 * The card under the pointer: the x value, then one row per series with its swatch, name and value.
 * Text stays in text colours; the swatch alone carries the series colour.
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
              <span aria-hidden="true" className="size-3 shrink-0 rounded-xs" style={{ background: `var(--color-${key})` }} />
              <span className="flex-1 text-muted-foreground">{c?.label ?? key}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatter ? formatter(Number(p.value), key) : `${p.value}${c?.unit ? ` ${c.unit}` : ""}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Always shown for two series or more, above the plot, so a series is never identified by colour alone. */
export function ChartLegend(props: Omit<LegendProps, "ref">) {
  return <Legend verticalAlign="top" align="left" content={<ChartLegendContent />} {...props} />
}

export function ChartLegendContent({ payload }: { payload?: readonly { dataKey?: unknown; value?: unknown }[] }) {
  const config = useChartConfig()
  if (!payload?.length) return null
  // In the order the series are configured, which is the palette order, whatever order Recharts draws them in.
  const keys = Object.keys(config)
  const items = [...payload].sort((a, b) => keys.indexOf(String(a.dataKey)) - keys.indexOf(String(b.dataKey)))
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-3 text-xs">
      {items.map((p) => {
        const key = String(p.dataKey)
        return (
          <li key={key} className="flex items-center gap-2 text-muted-foreground">
            <span aria-hidden="true" className="size-3 rounded-xs" style={{ background: `var(--color-${key})` }} />
            {config[key]?.label ?? key}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The same data as a table: for exact values, screen readers and anyone who cannot tell two hues apart.
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
            {keys.map((k) => (
              <TableHead key={k} className="text-right">
                {config[k].label}
                {config[k].unit ? ` (${config[k].unit})` : ""}
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
                  {String(row[k] ?? "–")}
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
