// @syncrobotic/share-bar v0.12.0 · update: npx shadcn add @syncrobotic/share-bar --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/** The chart palette in order (validated for colour-vision deficiency, and off the status hues), then grey for "other". */
const tones = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  5: "bg-chart-5",
  other: "bg-muted-foreground",
} as const

export type ShareSegment = {
  key: string
  label: string
  value: number
  /** Chart colour 1–5 in a fixed order, or "other". Defaults to the segment's place in the list, so colour follows the order you give, never the size. */
  tone?: keyof typeof tones
}

const fmt = (n: number) => n.toLocaleString()

/**
 * How a whole splits, as one thin bar: segments in the chart palette, 2 px apart, each with its share on hover. Light
 * enough for a table cell. Read by screen readers as one sentence; identity never rests on colour alone, so outside a
 * table cell show the `legend`, which names every value.
 */
export function ShareBar({
  segments,
  label,
  total: totalProp,
  legend = false,
  unit,
  size = "md",
  className,
}: {
  segments: ShareSegment[]
  /** What the bar shows, e.g. "Images by use". The accessible name, and the heading when `legend` is on. */
  label: string
  /** Defaults to the sum of the segments. Larger when part of the whole is not shown. */
  total?: number
  /** Show the label, the total and a legend under the bar. */
  legend?: boolean
  /** After the total: "images". */
  unit?: string
  /** sm: 8 px, for a table cell; md: 10 px. */
  size?: "sm" | "md"
  className?: string
}) {
  const total = totalProp ?? segments.reduce((n, s) => n + s.value, 0)
  const shown = segments.map((s, i) => ({ ...s, tone: s.tone ?? (((i % 5) + 1) as 1 | 2 | 3 | 4 | 5) })).filter((s) => s.value > 0)
  const pct = (v: number) => (100 * v) / Math.max(total, 1)
  const bar = (
    <div
      role="img"
      aria-label={`${label}: ${shown.map((s) => `${s.label} ${fmt(s.value)}`).join(", ")}`}
      data-slot="share-bar"
      className={cn("flex w-full gap-0.5 overflow-hidden rounded-full bg-muted", size === "sm" ? "h-2" : "h-2.5", !legend && className)}
    >
      {shown.map((s) => (
        <span key={s.key} title={`${s.label}: ${fmt(s.value)} (${pct(s.value).toFixed(1)} %)`} className={cn("h-full", tones[s.tone])} style={{ width: `${pct(s.value)}%` }} />
      ))}
    </div>
  )
  if (!legend) return bar
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmt(total)}
          {unit && ` ${unit}`}
        </span>
      </div>
      {bar}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {shown.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2 tabular-nums">
            <span aria-hidden="true" className={cn("size-2 rounded-full", tones[s.tone])} />
            {s.label} {fmt(s.value)}
          </li>
        ))}
      </ul>
    </div>
  )
}
