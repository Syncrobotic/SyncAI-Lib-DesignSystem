// @syncrobotic/heartbeat-strip v0.56.0 · update: npx shadcn add @syncrobotic/heartbeat-strip --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { formatAbsolute, formatDuration, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { ChartViewSwitch, SegmentedControl, SegmentedControlItem, type ChartViewSwitchLabels } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

/** One stretch of the window, as the server counted it: check-ins received and expected, and a problem if one was seen. */
export type HeartbeatBucket = {
  /** The stretch's start. */
  at: DateInput
  beats: number
  /** What a device on schedule would have sent in the stretch. */
  expected: number
  /** A problem the device reported in the stretch (degraded, a disk nearly full). Absent: nothing wrong. */
  level?: "warning" | "danger"
  /** The problem in words, for the tooltip and the table ("Disk 94 % full"). */
  note?: string
}

/** Something that happened at a moment: a restart, an update. Drawn as a numbered mark on the strip. */
export type HeartbeatEvent = { at: DateInput; label: string }

/** How a stretch is drawn: a full grey cell, a half one, an empty dashed one, or the problem's colour. */
export type HeartbeatCell = "full" | "partial" | "silent" | "warning" | "danger"

/** A stretch with no check-ins is silent whatever else it says; a problem outranks how full it was. */
export function heartbeatCell(b: Pick<HeartbeatBucket, "beats" | "expected" | "level">): HeartbeatCell {
  if (b.beats <= 0) return "silent"
  if (b.level) return b.level
  return b.beats >= 0.9 * Math.max(1, b.expected) ? "full" : "partial"
}

/** The runs of silent stretches, as [from, to) in ms since the epoch. */
export function heartbeatGaps(buckets: HeartbeatBucket[], bucketMs: number): { from: number; to: number }[] {
  const gaps: { from: number; to: number }[] = []
  for (const b of buckets) {
    const t = toTime(b.at)
    if (t === null || b.beats > 0) continue
    const last = gaps[gaps.length - 1]
    if (last && last.to === t) last.to = t + bucketMs
    else gaps.push({ from: t, to: t + bucketMs })
  }
  return gaps
}

export type HeartbeatStripLabels = {
  /** Names the strip of cells. */
  strip: string
  full: string
  partial: string
  silent: string
  warning: string
  danger: string
  /** A stretch's count: "57 of 60 check-ins", or "60 check-ins" once full. */
  beats: (beats: string, expected: string, full: boolean) => string
  /** The whole window in words, beside the strip; `full` when it got every check-in expected (or more: clocks jitter). */
  summary: (beats: string, expected: string, gaps: number, silent: string, full: boolean) => string
  /** Names the window switch. */
  window: string
  time: string
  checkIns: string
  state: string
  events: string
  view: Partial<ChartViewSwitchLabels>
}

export const defaultHeartbeatStripLabels: HeartbeatStripLabels = {
  strip: "Check-ins, one cell per stretch",
  full: "Checked in",
  partial: "Some missed",
  silent: "No check-ins",
  warning: "Degraded",
  danger: "Failing",
  beats: (beats, expected, full) => (full ? `${beats} check-ins` : `${beats} of ${expected} check-ins`),
  summary: (beats, expected, gaps, silent, full) =>
    (full ? `${beats} check-ins` : `${beats} of ${expected} check-ins`) + (gaps ? `, ${gaps} ${gaps === 1 ? "gap" : "gaps"} (${silent} silent)` : ", no gaps"),
  window: "Time window",
  time: "Time",
  checkIns: "Check-ins",
  state: "State",
  events: "Events",
  view: {},
}

// Grey where it checked in, colour only for a reported problem. Silent is an empty dashed outline in the field-edge grey
// (3:1 on the card), never a lighter fill, so it never reads as a calm stretch; partial is half a cell, a shape not a tint.
const fill: Record<HeartbeatCell, string> = {
  full: "h-full bg-input",
  partial: "h-1/2 bg-input",
  silent: "h-full border border-dashed border-input",
  warning: "h-full bg-warning",
  danger: "h-full bg-danger",
}

function Swatch({ cell }: { cell: HeartbeatCell }) {
  return (
    <span aria-hidden="true" className="flex size-3 items-end">
      <span className={cn("w-full rounded-xs", fill[cell])} />
    </span>
  )
}

/**
 * A device's check-ins over a window, one cell per stretch: grey where it reported, an outline where it was silent, colour
 * only for a reported problem. A stretch that missed some is half height; events are numbered marks on the same time
 * axis; the table view lists every stretch.
 */
export function HeartbeatStrip({
  buckets,
  bucketMs,
  events = [],
  windows,
  window: windowValue,
  onWindowChange,
  view: viewProp,
  defaultView = "chart",
  onViewChange,
  locale,
  timeZone,
  labels,
  className,
}: {
  /** The window's stretches, oldest first, as the server aggregated them. */
  buckets: HeartbeatBucket[]
  /** Each stretch's length. */
  bucketMs: number
  events?: HeartbeatEvent[]
  /** The windows to offer (`[{ value: "24h", label: "24 h" }]`); the product fetches the buckets for the one chosen. */
  windows?: { value: string; label: string }[]
  window?: string
  onWindowChange?: (value: string) => void
  /** "chart" or "table"; uncontrolled from `defaultView` when omitted. */
  view?: "chart" | "table"
  defaultView?: "chart" | "table"
  onViewChange?: (view: "chart" | "table") => void
  locale?: string
  /** IANA zone for times; the browser's when omitted. */
  timeZone?: string
  labels?: Partial<HeartbeatStripLabels>
  className?: string
}) {
  const l = { ...defaultHeartbeatStripLabels, ...labels }
  const [innerView, setInnerView] = React.useState(defaultView)
  const view = viewProp ?? innerView
  const [active, setActive] = React.useState(Math.max(0, buckets.length - 1))
  const cells = React.useRef<(HTMLSpanElement | null)[]>([])
  const count = buckets.length
  const from = toTime(buckets[0]?.at) ?? 0
  const to = (toTime(buckets[count - 1]?.at) ?? from) + bucketMs
  const span = Math.max(1, to - from)
  const short = span <= 86_400_000
  const tick = (t: number) => formatAbsolute(t, { locale, timeZone, precision: short ? "time" : "day" })
  const when = (t: DateInput) => formatAbsolute(t, { locale, timeZone })
  const num = (n: number) => formatCount(n, { locale })

  const beats = buckets.reduce((s, b) => s + b.beats, 0)
  const expected = buckets.reduce((s, b) => s + b.expected, 0)
  const gaps = heartbeatGaps(buckets, bucketMs)
  const silentMs = gaps.reduce((s, g) => s + g.to - g.from, 0)
  const summary = l.summary(num(beats), num(expected), gaps.length, formatDuration(silentMs, { locale }), beats >= expected)
  const kinds = buckets.map(heartbeatCell)
  const legend: HeartbeatCell[] = ["full", "partial", "silent", ...(["warning", "danger"] as const).filter((k) => kinds.includes(k))]
  const placed = events
    .map((e) => ({ ...e, t: toTime(e.at) }))
    .filter((e): e is HeartbeatEvent & { t: number } => e.t !== null && e.t >= from && e.t <= to)
    .sort((a, b) => a.t - b.t)
  // Marks closer than 3 % of the width share one label ("1, 2"): an update and the restart it caused land minutes apart.
  const marks: { at: number; n: number[] }[] = []
  placed.forEach((e, i) => {
    const at = ((e.t - from) / span) * 100
    const last = marks[marks.length - 1]
    if (last && at - last.at < 3) last.n.push(i + 1)
    else marks.push({ at, n: [i + 1] })
  })
  const eventsIn = (b: HeartbeatBucket) => {
    const t = toTime(b.at) ?? 0
    return placed.map((e, i) => ({ ...e, n: i + 1 })).filter((e) => e.t >= t && e.t < t + bucketMs)
  }
  const describe = (b: HeartbeatBucket) =>
    [when(b.at), l.beats(num(b.beats), num(b.expected), b.beats >= b.expected), l[heartbeatCell(b)], b.note, ...eventsIn(b).map((e) => `${e.n}. ${e.label}`)].filter(Boolean).join(" · ")
  const go = (i: number) => {
    const next = Math.max(0, Math.min(count - 1, i))
    setActive(next)
    cells.current[next]?.focus()
  }
  const setView = (v: string) => {
    const next = v === "table" ? "table" : "chart"
    setInnerView(next)
    onViewChange?.(next)
  }

  return (
    <div data-slot="heartbeat-strip" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {windows && windows.length > 1 ? (
          <SegmentedControl value={windowValue} onValueChange={onWindowChange} aria-label={l.window} className="h-(--h-sm) w-auto">
            {windows.map((w) => (
              <SegmentedControlItem key={w.value} value={w.value}>
                {w.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        ) : (
          <span />
        )}
        <ChartViewSwitch value={view} onValueChange={setView} labels={l.view} />
      </div>
      <p data-slot="heartbeat-strip-summary" className="text-sm tabular-nums text-muted-foreground">
        {summary}
      </p>
      {view === "chart" ? (
        <>
          <div className="flex flex-col gap-1">
            {/* Cells carry their gap inside (pr-px), so a cell, its tooltip and an event's mark all sit at the same ratio. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow keys bubbled from the roving-tabindex cells move between them */}
            <span
              role="group"
              aria-label={l.strip}
              className="flex h-8 w-full"
              onKeyDown={(e) => {
                const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }
                const next = keys[e.key]
                if (next === undefined) return
                e.preventDefault()
                go(next)
              }}
            >
              {buckets.map((b, i) => {
                const text = describe(b)
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <span
                        ref={(el) => {
                          cells.current[i] = el
                        }}
                        role="img"
                        aria-label={text}
                        data-cell={heartbeatCell(b)}
                        tabIndex={i === active ? 0 : -1}
                        onFocus={() => setActive(i)}
                        className="flex h-full min-w-0 flex-1 items-end pr-px transition-opacity duration-(--motion-fast) ease-(--ease-standard) hover:opacity-70"
                      >
                        <span className={cn("w-full rounded-xs", fill[heartbeatCell(b)])} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{text}</TooltipContent>
                  </Tooltip>
                )
              })}
            </span>
            {placed.length > 0 && (
              <span aria-hidden="true" className="relative h-4 w-full">
                {marks.map((m) => (
                  <span
                    key={m.n[0]}
                    className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-xs leading-none font-medium tabular-nums text-foreground"
                    style={{ left: `${Math.min(97, Math.max(3, m.at))}%` }}
                  >
                    {m.n.join(", ")}
                  </span>
                ))}
              </span>
            )}
            <span aria-hidden="true" className="flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{tick(from)}</span>
              <span className="hidden sm:inline">{tick(from + span / 2)}</span>
              <span>{tick(to)}</span>
            </span>
          </div>
          {placed.length > 0 && (
            <ol data-slot="heartbeat-strip-events" aria-label={l.events} className="flex flex-col gap-1 text-xs">
              {placed.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-medium tabular-nums">{i + 1}</span>
                  <span className="tabular-nums text-muted-foreground">{when(e.t)}</span>
                  <span>{e.label}</span>
                </li>
              ))}
            </ol>
          )}
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {legend.map((k) => (
              <li key={k} className="flex items-center gap-1">
                <Swatch cell={k} /> {l[k]}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{l.time}</TableHead>
              <TableHead className="text-right">{l.checkIns}</TableHead>
              <TableHead>{l.state}</TableHead>
              <TableHead>{l.events}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buckets.map((b, i) => (
              <TableRow key={i}>
                <TableCell className="tabular-nums whitespace-nowrap">{when(b.at)}</TableCell>
                <TableCell className="text-right tabular-nums">{l.beats(num(b.beats), num(b.expected), b.beats >= b.expected)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Swatch cell={heartbeatCell(b)} />
                    {[l[heartbeatCell(b)], b.note].filter(Boolean).join(": ")}
                  </span>
                </TableCell>
                <TableCell>
                  {eventsIn(b)
                    .map((e) => e.label)
                    .join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
