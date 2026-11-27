// @syncrobotic/share-bar v0.53.0 · update: npx shadcn add @syncrobotic/share-bar --overwrite
import type * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/registry/syncrobotic/lib/format-number"

/** The chart palette: the accent, two graphite steps, then the light grey for "other" (slot 4). */
const tones = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  other: "bg-chart-4",
} as const

export type ShareSegment = {
  key: string
  label: string
  value: number
  /**
   * Chart colour in a fixed order, or "other". Defaults to the segment's place in the list (the first in the accent,
   * then two greys, then Other), so colour follows the order you give, never the size. Give at most three parts and
   * fold the rest into one "Other" segment.
   */
  tone?: keyof typeof tones
  /** Where this part leads, such as the list filtered to it: its legend entry becomes a link named with its share. */
  href?: string
}

/** A segment's tone: its own, or its place in the list (accent, two greys, then Other). Shared, so a legend matches its bars. */
const toneOf = (s: { tone?: keyof typeof tones }, i: number) => s.tone ?? (Math.min(i + 1, 4) as 1 | 2 | 3 | 4)

/**
 * How a whole splits, as one thin bar in the chart palette light enough for a table cell, with optional label, total
 * and linked legend; ShareLegend is one legend for several bars. Read as one sentence. Outside a cell show the
 * `legend`, so identity never rests on colour; a segment's `href` links its legend entry.
 */
export function ShareBar({
  segments,
  label,
  total: totalProp,
  legend = false,
  unit,
  size = "md",
  locale,
  linkAs: Link = "a",
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
  /** Formats the numbers and shares (a BCP 47 tag such as "zh-TW"). Left out, English, so the server and the browser write the same. */
  locale?: string
  /** Your router's link (e.g. next/link), for segments with href. */
  linkAs?: React.ElementType
  className?: string
}) {
  const fmt = (n: number) => formatNumber(n, { locale })
  const share = (n: number) => formatNumber(n, { locale, minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })
  // In a link's name: whole numbers as they are ("42 %"), others to one decimal.
  const said = (n: number) => formatNumber(n, { locale, maximumFractionDigits: 1, useGrouping: false })
  const total = totalProp ?? segments.reduce((n, s) => n + s.value, 0)
  const shown = segments.map((s, i) => ({ ...s, tone: toneOf(s, i) })).filter((s) => s.value > 0)
  const rest = total - shown.reduce((n, s) => n + s.value, 0)
  const pct = (v: number) => (100 * v) / Math.max(total, 1)
  const bar = (
    <div
      role="img"
      aria-label={`${label}: ${shown.map((s) => `${s.label} ${fmt(s.value)}`).join(", ")}`}
      data-slot="share-bar"
      className={cn("flex w-full gap-0.5 overflow-hidden rounded-full", size === "sm" ? "h-2" : "h-2.5", !legend && className)}
    >
      {shown.map((s) => (
        <span key={s.key} title={`${s.label}: ${fmt(s.value)} (${share(pct(s.value))} %)`} className={cn("h-full", tones[s.tone])} style={{ width: `${pct(s.value)}%` }} />
      ))}
      {/* The part of the whole not shown is the track; the 2 px gaps between parts show the surface, so Other never merges
          with its neighbour or with the track. */}
      {(rest > 0 || shown.length === 0) && <span data-rest="" className="h-full flex-1 bg-track" />}
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
        {shown.map((s) => {
          const key = <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tones[s.tone])} />
          return (
            <li key={s.key} className="inline-flex items-center gap-2 tabular-nums">
              {s.href ? (
                // The whole entry is the target, 36 px tall with a mouse and 44 on touch (--h-sm); the share is read after
                // what it shows, so the name starts with the words on screen.
                <Link data-slot="share-bar-link"
                  href={s.href}
                  className="inline-flex min-h-(--h-sm) items-center gap-2 rounded-2xs text-foreground underline decoration-muted-foreground underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {key}
                  <span>
                    {s.label} {fmt(s.value)}
                    <span className="sr-only"> ({said(pct(s.value))} %)</span>
                  </span>
                </Link>
              ) : (
                <>
                  {key}
                  {s.label} {fmt(s.value)}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export type ShareLegendSegment = Pick<ShareSegment, "key" | "label" | "tone"> & {
  /** Shown after the label when given: a total across the list, say. */
  value?: number
}

/**
 * One legend above a list of ShareBars. Give the same segments in the same order (values optional) so the colours match;
 * each bar keeps its own accessible name.
 */
export function ShareLegend({
  segments,
  locale,
  className,
}: {
  segments: ShareLegendSegment[]
  /** Formats the values (a BCP 47 tag such as "zh-TW"). Left out, English, so the server and the browser write the same. */
  locale?: string
  className?: string
}) {
  return (
    <ul data-slot="share-legend" className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {segments.map((s, i) => (
        <li key={s.key} className="inline-flex items-center gap-2 tabular-nums">
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tones[toneOf(s, i)])} />
          {s.label}
          {s.value !== undefined && ` ${formatNumber(s.value, { locale })}`}
        </li>
      ))}
    </ul>
  )
}
