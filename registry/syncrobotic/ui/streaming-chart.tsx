// @syncrobotic/streaming-chart v0.35.0 · update: npx shadcn add @syncrobotic/streaming-chart --overwrite
"use client"

import * as React from "react"
import { Ellipsis, Pause, Play, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { ChartViewSwitch, SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/**
 * One entry per series, the one the reader should look at first, as `chart`'s ChartConfig: `color` is the palette slot
 * (1 the accent, 2 and 3 graphite, 4 the light grey for Other, 5 a baseline) and the order sets the line style, solid,
 * dashed, dotted. Three series and Other at most, all in one unit: two measures on different scales are two charts.
 */
export type StreamingChartConfig = Record<
  string,
  {
    label: string
    color: 1 | 2 | 3 | 4 | 5
    /** Written after each value: "A", "°C", "m/s". */
    unit?: string
    /** Decimals in the legend, the tooltip and the table. Defaults to 1. */
    digits?: number
  }
>

/** A limit drawn as a dashed line with its label at the end. A series past it says so in words in the legend. */
export type StreamingChartLimit = {
  value: number
  /** Written at the line's end. Defaults to `labels.limit` with the value. */
  label?: string
  /** Which side is past the limit: "above" (a temperature, a current) or "below" (a battery voltage). Defaults to "above". */
  over?: "above" | "below"
}

/** A range shaded behind the lines (a derating zone, a normal operating range), with its name. It only marks the range. */
export type StreamingChartBand = { from: number; to: number; label?: string }

/** One reading per series key, in the config's unit. A key left out has no sample this time; null or NaN is a gap in the line. */
export type StreamingChartSample = Record<string, number | null | undefined>

/** Adds readings, timestamped in ms since the epoch (the message's stamp when there is one; now by default). */
export type StreamingChartPush = (values: StreamingChartSample, time?: number) => void

/** What `ref` gives: push and clear readings, and pause or go back to live, without a React render per sample. */
export type StreamingChartHandle = {
  push: StreamingChartPush
  /** Forgets every reading. */
  clear: () => void
  /** Freezes the view; readings keep arriving into the buffer. */
  pause: () => void
  /** Back to the live edge. */
  resume: () => void
}

/** What the chart says about its data, as `data-state` on its root. */
export type StreamingChartState = "waiting" | "live" | "paused" | "stale"

export type StreamingChartLabels = {
  live: string
  paused: string
  waiting: string
  /** No reading for `staleAfterMs`. */
  stale: string
  /** After Stale: when the last reading was taken. */
  lastSample: (time: string) => string
  pause: string
  resume: string
  /** On the button while the view has been moved back in time. */
  jumpToLive: string
  /** Names the window switch. */
  window: string
  /** A window, as written on its segment: 30 000 → "30 s", 120 000 → "2 min". */
  windowOption: (ms: number) => string
  /** Names the Chart / Table switch. */
  view: string
  /** The menu (⋯) that holds the window and Chart / Table switches on a narrow chart. */
  viewOptions: string
  chart: string
  table: string
  /** The table's first column. */
  time: string
  /** The time axis's right end while live. */
  now: string
  /** A time axis tick, given the number already formatted: "30" → "−30 s". */
  secondsAgo: (value: string) => string
  minutesAgo: (value: string) => string
  overLimit: string
  underLimit: string
  /** A limit line without its own label: "60 °C" → "Limit 60 °C". */
  limit: (value: string) => string
  /** A value with its unit: ("12.4", "A") → "12.4 A"; degrees take no space: "42.0°". */
  withUnit: (value: string, unit: string) => string
  /** Where a series has no reading. */
  noValue: string
  /** A series and its value, as screen readers hear the current values: ("Left motor", "12.4 A") → "Left motor 12.4 A". */
  reading: (series: string, value: string) => string
  /** How to use the chart from the keyboard, read when it takes focus. */
  keys: string
  /** A time of day, 24-hour with seconds by default; with `locale`, that locale's 24-hour time. */
  formatTime: (date: Date, locale?: string) => string
}

const pad = (n: number) => String(n).padStart(2, "0")

export const defaultStreamingChartLabels: StreamingChartLabels = {
  live: "Live",
  paused: "Paused",
  waiting: "Waiting for data",
  stale: "No new data",
  lastSample: (time) => `last reading ${time}`,
  pause: "Pause",
  resume: "Resume",
  jumpToLive: "Jump to live",
  window: "Time window",
  windowOption: (ms) => (ms < 60_000 ? `${Math.round(ms / 1000)} s` : ms < 3_600_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 3_600_000)} h`),
  view: "Show as",
  viewOptions: "View options",
  chart: "Chart",
  table: "Table",
  time: "Time",
  now: "Now",
  secondsAgo: (v) => `−${v} s`,
  minutesAgo: (v) => `−${v} min`,
  overLimit: "Over limit",
  underLimit: "Under limit",
  limit: (v) => `Limit ${v}`,
  withUnit: (v, unit) => (unit === "°" ? `${v}°` : `${v} ${unit}`),
  noValue: "–",
  reading: (series, value) => `${series} ${value}`,
  keys: "Space pauses or resumes. Left and right arrows move back and forward in time. End returns to live.",
  formatTime: (d, locale) =>
    locale
      ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      : [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(":"),
}

// ---------- The ring buffer ----------

/**
 * A fixed-size ring of timestamped readings for one series: pushing past `capacity` overwrites the oldest, so memory stays
 * flat however long the stream runs, and nothing is allocated per sample. Times only move forward: a reading older than
 * the newest (a late or reordered message) is dropped.
 */
export class StreamBuffer {
  readonly capacity: number
  private readonly times: Float64Array
  private readonly values: Float64Array
  private start = 0
  size = 0

  constructor(capacity: number) {
    this.capacity = Math.max(2, Math.floor(Number.isFinite(capacity) ? capacity : 2))
    this.times = new Float64Array(this.capacity)
    this.values = new Float64Array(this.capacity)
  }

  /** Adds a reading; false when it was dropped (no finite time, or older than the newest). NaN as the value is a gap. */
  push(time: number, value: number): boolean {
    if (!Number.isFinite(time)) return false
    if (this.size > 0 && time < this.time(this.size - 1)) return false
    const at = (this.start + this.size) % this.capacity
    this.times[at] = time
    this.values[at] = Number.isFinite(value) ? value : NaN
    if (this.size < this.capacity) this.size++
    else this.start = (this.start + 1) % this.capacity
    return true
  }

  /** The storage itself, for loops that walk thousands of readings a frame: index `(start + i) % capacity`. */
  raw(): { times: Float64Array; values: Float64Array; start: number } {
    return { times: this.times, values: this.values, start: this.start }
  }

  /** The i-th reading's time, oldest first. */
  time(i: number): number {
    return this.times[(this.start + i) % this.capacity]!
  }

  value(i: number): number {
    return this.values[(this.start + i) % this.capacity]!
  }

  /** The index of the first reading at or after `t` (`size` when there is none). */
  lowerBound(t: number): number {
    let lo = 0
    let hi = this.size
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (this.time(mid) < t) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  /** The index of the last reading at or before `t`, or -1. */
  lastAtOrBefore(t: number): number {
    let lo = 0
    let hi = this.size
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (this.time(mid) <= t) lo = mid + 1
      else hi = mid
    }
    return lo - 1
  }

  clear() {
    this.start = 0
    this.size = 0
  }
}

// ---------- Axes ----------

const TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].map((s) => s * 1000)

/** The time axis's step: the smallest round step that keeps at most `maxTicks` intervals across the window. */
export function streamingTimeStep(windowMs: number, maxTicks = 6): number {
  const most = Math.max(1, Math.floor(maxTicks))
  return TIME_STEPS.find((s) => windowMs / s <= most) ?? Math.ceil(windowMs / most / 3_600_000) * 3_600_000
}

/** Round bounds and ticks for a value range: steps of 1, 2, 2.5 or 5 × 10ⁿ, about `count` intervals. */
export function streamingNiceScale(min: number, max: number, count = 4): { min: number; max: number; step: number; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] }
  if (max < min) [min, max] = [max, min]
  if (max === min) {
    const spread = Math.abs(max) > 0 ? Math.abs(max) * 0.1 : 1
    min -= spread
    max += spread
  }
  const raw = (max - min) / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag
  const lo = Math.floor(min / step + 1e-9) * step
  const hi = Math.ceil(max / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step)
  return { min: lo, max: hi, step, ticks }
}

// ---------- Numbers ----------

/** As joint-state: English without a locale, the same on the server and in every browser; a tag Intl cannot read is English. */
const checkedLocales = new Map<string, string>()
function resolveLocale(locale: string | undefined): string {
  if (locale === undefined) return "en"
  let ok = checkedLocales.get(locale)
  if (ok === undefined) {
    try {
      ok = Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : "en"
    } catch {
      ok = "en"
    }
    checkedLocales.set(locale, ok)
  }
  return ok
}

const formatters = new Map<string, Intl.NumberFormat>()
/** A reading as the chart writes it: fixed decimals, no "−0.0", and a true minus sign (U+2212) as `chart` writes negatives. */
export function formatStreamingValue(value: number, digits = 1, locale?: string): string {
  const tag = resolveLocale(locale)
  const d = Math.min(Math.max(0, Math.floor(digits)), 6)
  const key = `${tag}|${d}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(tag, { minimumFractionDigits: d, maximumFractionDigits: d })
    formatters.set(key, f)
  }
  const step = 10 ** d
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * step)) / step
  const text = f.format(rounded === 0 ? 0 : Math.abs(rounded))
  return rounded < 0 ? `−${text}` : text
}

/** Is `value` past `limit`? */
export const pastLimit = (value: number, limit: StreamingChartLimit) =>
  Number.isFinite(value) && ((limit.over ?? "above") === "above" ? value > limit.value : value < limit.value)

// ---------- The engine: buffers, the view and the drawing, outside React ----------

const DASHES: (number[] | undefined)[] = [undefined, [6, 4], [1.5, 3.5]]
const DASH_TEXT = [undefined, "6 4", "1.5 3.5"]
const LEGEND_EVERY_MS = 250
const REDUCED_EVERY_MS = 1000
const DEFAULT_CAPACITY = 36_000

type Palette = { series: Record<number, string>; text: string; grid: string; limit: string; band: string; card: string; cursor: string; font: string }
type Series = { key: string; slot: number; dash: number[] | undefined; buffer: StreamBuffer }
type Settings = {
  config: StreamingChartConfig
  windowMs: number
  domain?: readonly [number, number]
  limits: readonly StreamingChartLimit[]
  band?: StreamingChartBand
  staleAfterMs: number
  announceEveryMs: number
  locale?: string
  labels: StreamingChartLabels
}
export type StreamingChartRow = { time: number; values: Record<string, number | null> }

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

/**
 * Everything that happens per sample and per frame, kept out of React: React renders the frame of the chart once, and the
 * engine pushes readings into ring buffers, draws the canvas on requestAnimationFrame, and writes the legend's values, the
 * crosshair and the screen-reader text straight into their elements. A push never renders.
 */
class StreamingEngine {
  series: Series[] = []
  settings: Settings
  capacity: number
  // The data's own clock: the live edge is the newest reading's time, carried forward by this browser's elapsed time, so a
  // robot whose clock is off by seconds still draws at the right edge.
  private skew = NaN
  private skewAt = 0
  lastReceived = -Infinity
  lastSampleTime = NaN
  private paused = false
  private viewEnd = 0
  // The chart's root and canvas; the parts the engine writes into (legend values, the crosshair's card, the screen-reader
  // text, the paused time) are found inside the root by their data-slot.
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private root: HTMLElement | null = null
  // Frame state
  private width = 0
  private height = 0
  private dpr = 1
  private palette: Palette | null = null
  private hoverX: number | null = null
  private plotWidth = 0
  private raf = 0
  private dirty = true
  private lastDraw = -Infinity
  private lastLegend = -Infinity
  private lastAnnounce = -Infinity
  private over = new Set<string>()
  private visible = true
  private shown = true
  private reduced = false
  private observers: (() => void)[] = []
  /** Told when the data's state changes (first reading, cleared), so React can say so; never per sample. */
  private onData: (() => void) | null = null

  listen(onData: (() => void) | null) {
    this.onData = onData
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced
    this.dirty = true
    this.wake()
  }

  constructor(settings: Settings, capacity: number) {
    this.settings = settings
    this.capacity = capacity
    this.setSeries(settings.config)
  }

  // Bound once, so the handle and `subscribe` get the same functions for the chart's life.
  push: StreamingChartPush = (values, time) => {
    const t = time ?? Date.now()
    if (!Number.isFinite(t)) return
    const had = this.lastReceived > -Infinity
    let any = false
    for (const s of this.series) {
      if (!(s.key in values)) continue
      const v = values[s.key]
      if (s.buffer.push(t, v == null ? NaN : v)) any = true
    }
    if (!any) return
    const at = now()
    const offset = t - at
    // The skew follows the newest reading; it may fall back only after it has held for 2 s, so network jitter does not
    // shake the edge back and forth.
    if (!(offset <= this.skew) || at - this.skewAt > 2000) {
      this.skew = offset
      this.skewAt = at
    }
    this.lastReceived = at
    this.lastSampleTime = Number.isFinite(this.lastSampleTime) ? Math.max(this.lastSampleTime, t) : t
    if (!had) {
      this.dirty = true
      this.onData?.()
    }
    this.wake()
  }

  clear = () => {
    for (const s of this.series) s.buffer.clear()
    this.skew = NaN
    this.lastReceived = -Infinity
    this.lastSampleTime = NaN
    this.dirty = true
    this.onData?.()
    this.wake()
  }

  hasData() {
    return this.lastReceived > -Infinity
  }

  /** The live edge, in the data's clock. */
  liveEdge() {
    return Number.isFinite(this.skew) ? now() + this.skew : Date.now()
  }

  /**
   * The right edge of what is shown. With reduced motion the view steps once a second, so the edge is held on whole
   * seconds of the data's clock: the axis keeps round labels between steps, and two frames drawn a few milliseconds apart
   * within the same second are the same picture.
   */
  end() {
    if (this.paused) return this.viewEnd
    const edge = this.liveEdge()
    return this.reduced ? Math.floor(edge / REDUCED_EVERY_MS) * REDUCED_EVERY_MS : edge
  }

  isPaused() {
    return this.paused
  }

  setSeries(config: StreamingChartConfig) {
    const old = new Map(this.series.map((s) => [s.key, s]))
    this.series = Object.entries(config).map(([key, c], i) => ({
      key,
      slot: c.color,
      dash: DASHES[i],
      buffer: old.get(key)?.buffer ?? new StreamBuffer(this.capacity),
    }))
    this.dirty = true
  }

  update(settings: Settings) {
    if (settings.config !== this.settings.config) this.setSeries(settings.config)
    this.settings = settings
    this.dirty = true
    this.lastLegend = -Infinity
    this.writeFrozenTime()
    this.wake()
  }

  /** Freezes the view at the live edge, or goes back to live. */
  setPaused(paused: boolean) {
    if (paused && !this.paused) this.viewEnd = this.liveEdge()
    this.paused = paused
    this.dirty = true
    this.lastLegend = -Infinity
    this.writeFrozenTime()
    this.wake()
  }

  /**
   * Moves a paused view by `ms` (negative is back in time), never past the live edge or before the oldest reading. True
   * while the view is behind the live edge.
   */
  panBy(ms: number) {
    if (!this.paused) this.setPaused(true)
    let oldest = Infinity
    for (const s of this.series) if (s.buffer.size) oldest = Math.min(oldest, s.buffer.time(0))
    const live = this.liveEdge()
    const floor = Number.isFinite(oldest) ? Math.min(live, oldest + this.settings.windowMs) : live
    this.viewEnd = Math.min(live, Math.max(floor, this.viewEnd + ms))
    this.dirty = true
    this.lastLegend = -Infinity
    this.writeFrozenTime()
    this.wake()
    return live - this.viewEnd >= 1
  }

  /** The value of each series at time `t` (the last reading at or before it, unless the line has a gap there). */
  valuesAt(t: number): Record<string, number | null> {
    const out: Record<string, number | null> = {}
    for (const s of this.series) {
      const i = s.buffer.lastAtOrBefore(t)
      const v = i >= 0 && t - s.buffer.time(i) <= this.settings.staleAfterMs ? s.buffer.value(i) : NaN
      out[s.key] = Number.isFinite(v) ? v : null
    }
    return out
  }

  /** One row per time-axis tick across the view, newest first: the table view's rows. */
  rows(step: number): StreamingChartRow[] {
    const end = this.end()
    const out: StreamingChartRow[] = []
    for (let t = end; t >= end - this.settings.windowMs - 1; t -= step) out.push({ time: t, values: this.valuesAt(t) })
    return out
  }

  // ----- Elements -----

  attachCanvas(canvas: HTMLCanvasElement | null) {
    if (canvas === this.canvas) return
    this.observers.forEach((stop) => stop())
    this.observers = []
    this.canvas = canvas
    this.ctx = null
    // A new canvas starts at the browser's 300 × 150: forget the last size, so resize() sets this one even when its box
    // has not changed (back from the table view).
    this.width = 0
    this.height = 0
    if (!canvas) return
    try {
      this.ctx = canvas.getContext("2d")
    } catch {
      this.ctx = null
    }
    const box = canvas.parentElement
    if (box && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => this.resize())
      ro.observe(box)
      this.observers.push(() => ro.disconnect())
    }
    // Off screen, nothing is drawn; readings keep going into the buffer.
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1]
        if (!last) return
        this.visible = last.isIntersecting
        this.dirty = true
        this.wake()
      })
      io.observe(canvas)
      this.observers.push(() => io.disconnect())
    }
    if (typeof document !== "undefined") {
      const onVisibility = () => {
        this.shown = document.visibilityState !== "hidden"
        this.dirty = true
        this.wake()
      }
      onVisibility()
      document.addEventListener("visibilitychange", onVisibility)
      this.observers.push(() => document.removeEventListener("visibilitychange", onVisibility))
    }
    this.resize()
  }

  attachRoot(root: HTMLElement | null) {
    if (root === this.root) return
    this.root = root
    this.lastLegend = -Infinity
    this.readPalette()
  }

  private part(slot: string) {
    return this.root?.querySelector<HTMLElement>(`[data-slot=${slot}]`) ?? null
  }

  /** Writes when the paused view ends into the status line and its words for screen readers. */
  writeFrozenTime() {
    const { locale, labels: l } = this.settings
    const text = this.paused ? l.formatTime(new Date(this.viewEnd), locale === undefined ? undefined : resolveLocale(locale)) : ""
    this.root?.querySelectorAll<HTMLElement>("[data-slot=streaming-chart-frozen-time]").forEach((el) => {
      if (el.textContent !== text) el.textContent = text
    })
  }

  setHover(x: number | null) {
    this.hoverX = x
    this.dirty = true
    this.wake()
  }

  /** Reads the theme's colours and font, again whenever the theme, the contrast or forced colours change. */
  readPalette = () => {
    const root = this.root
    if (!root || typeof getComputedStyle === "undefined") return
    const probe = document.createElement("span")
    probe.style.display = "none"
    root.appendChild(probe)
    const read = (css: string) => {
      probe.style.color = ""
      probe.style.color = css
      return getComputedStyle(probe).color
    }
    const series: Record<number, string> = {}
    for (const n of [1, 2, 3, 4, 5]) series[n] = read(`var(--chart-${n})`)
    this.palette = {
      series,
      text: read("var(--muted-foreground)"),
      grid: read("var(--border)"),
      limit: read("var(--muted-foreground)"),
      band: read("color-mix(in oklab, var(--track) 45%, transparent)"),
      card: read("var(--card)"),
      cursor: read("var(--muted-foreground)"),
      font: getComputedStyle(root).fontFamily,
    }
    probe.remove()
    this.dirty = true
    this.wake()
  }

  private resize() {
    const canvas = this.canvas
    const box = canvas?.parentElement
    if (!canvas || !box) return
    const w = box.clientWidth
    const h = box.clientHeight
    const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1
    if (w === this.width && h === this.height && dpr === this.dpr) return
    this.width = w
    this.height = h
    this.dpr = dpr
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    this.dirty = true
    // Drawn now, in the same task: a resized canvas is blank until it is drawn again.
    this.frame()
  }

  // ----- The loop -----

  /** Starts the frame loop if there is something to draw and it can be seen. */
  wake() {
    if (this.raf || typeof requestAnimationFrame === "undefined") return
    if (!this.visible || !this.shown) return
    if (!this.dirty && this.paused) return
    this.raf = requestAnimationFrame(this.tick)
  }

  stop() {
    if (this.raf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  dispose() {
    this.stop()
    this.observers.forEach((stop) => stop())
    this.observers = []
    // Forgotten, so a remount (Strict Mode, a Suspense boundary) attaches them again.
    this.canvas = null
    this.ctx = null
    this.root = null
  }

  private tick = () => {
    this.raf = 0
    if (!this.visible || !this.shown) return
    const t = now()
    // Live, a frame is drawn once the view has moved half a device pixel: every frame for 30 s across a wide plot, about
    // four a second for 10 minutes, where redrawing 60 times a second would move nothing. Reduced motion: the view steps
    // once a second instead of gliding. A hover, a pause or a resize draws at once.
    const halfPixel = this.settings.windowMs / Math.max(1, this.plotWidth * this.dpr) / 2
    const every = this.reduced ? Math.max(REDUCED_EVERY_MS, halfPixel) : halfPixel
    if (this.dirty || (!this.paused && t - this.lastDraw >= every)) this.frame()
    else if (!this.paused && t - this.lastLegend >= LEGEND_EVERY_MS) {
      this.lastLegend = t
      this.writeLegend(this.end())
    }
    // Live, the loop runs on; paused, it sleeps until something changes.
    if (!this.paused || this.dirty) this.raf = requestAnimationFrame(this.tick)
  }

  /** Draws one frame and, a few times a second, writes the legend's values. */
  frame() {
    const t = now()
    this.dirty = false
    this.lastDraw = t
    const end = this.end()
    this.draw(end)
    if (t - this.lastLegend >= LEGEND_EVERY_MS) {
      this.lastLegend = t
      this.writeLegend(end)
    }
  }

  private writeLegend(end: number) {
    const { config, limits, locale, labels: l, announceEveryMs } = this.settings
    // Live, the newest reading of each series; paused, the reading at the right edge of the frozen view.
    const values = this.paused ? this.valuesAt(end) : this.latest()
    const readings: string[] = []
    const crossed: string[] = []
    for (const s of this.series) {
      const c = config[s.key]
      if (!c) continue
      const v = values[s.key]
      const text = v == null ? l.noValue : c.unit ? l.withUnit(formatStreamingValue(v, c.digits ?? 1, locale), c.unit) : formatStreamingValue(v, c.digits ?? 1, locale)
      const past = v == null ? undefined : limits.find((lim) => pastLimit(v, lim))
      const el = this.root?.querySelector<HTMLElement>(`[data-slot=streaming-chart-legend] > [data-key="${s.key}"]`)
      if (el) {
        const value = el.querySelector<HTMLElement>("[data-slot=streaming-chart-value]")
        if (value && value.textContent !== text) value.textContent = text
        const word = el.querySelector<HTMLElement>("[data-slot=streaming-chart-over]")
        if (word) {
          const w = past ? ((past.over ?? "above") === "above" ? l.overLimit : l.underLimit) : ""
          const span = word.querySelector<HTMLElement>("[data-slot=streaming-chart-over-word]")
          if (span && span.textContent !== w) span.textContent = w
          if (past) word.setAttribute("data-over", "")
          else word.removeAttribute("data-over")
        }
      }
      readings.push(l.reading(c.label, text))
      // A series that has just gone past a limit is said at once, live data only.
      if (past && !this.over.has(s.key) && !this.paused) crossed.push(`${l.reading(c.label, text)}, ${(past.over ?? "above") === "above" ? l.overLimit : l.underLimit}`)
      if (past) this.over.add(s.key)
      else this.over.delete(s.key)
    }
    const a = this.part("streaming-chart-announcer")
    if (!a) return
    const t = now()
    if (crossed.length) {
      a.textContent = crossed.join(". ")
      this.lastAnnounce = t
    } else if (!this.paused && this.root?.contains(document.activeElement) && t - this.lastAnnounce >= announceEveryMs && readings.length) {
      // The current values, every few seconds, only while someone is on the chart: a page of live charts stays quiet.
      a.textContent = readings.join(", ")
      this.lastAnnounce = t
    }
  }

  private latest(): Record<string, number | null> {
    const out: Record<string, number | null> = {}
    for (const s of this.series) {
      const n = s.buffer.size
      const v = n ? s.buffer.value(n - 1) : NaN
      out[s.key] = Number.isFinite(v) ? v : null
    }
    return out
  }

  // ----- Drawing -----

  private draw(end: number) {
    const ctx = this.ctx
    const p = this.palette
    const { width: w, height: h, dpr } = this
    if (!ctx || !p || w <= 0 || h <= 0) return
    const { windowMs, config, limits, band, domain, staleAfterMs, locale, labels: l } = this.settings
    const start = end - windowMs
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.font = `12px ${p.font}`
    ctx.textBaseline = "middle"

    // The value range: fixed, or round bounds around what is in view and the limits, so a limit is always on the plot.
    let lo = Infinity
    let hi = -Infinity
    if (domain) {
      lo = domain[0]
      hi = domain[1]
    } else {
      for (const s of this.series) {
        const b = s.buffer
        const from = Math.max(0, b.lowerBound(start) - 1)
        const to = Math.min(b.size, b.lastAtOrBefore(end) + 2)
        const { values, start: first } = b.raw()
        const cap = b.capacity
        for (let i = from, at = (first + from) % cap; i < to; i++, at = at + 1 === cap ? 0 : at + 1) {
          const v = values[at]!
          if (v < lo) lo = v
          if (v > hi) hi = v
        }
      }
      for (const lim of limits) {
        lo = Math.min(lo, lim.value)
        hi = Math.max(hi, lim.value)
      }
      if (band) {
        lo = Math.min(lo, band.from, band.to)
        hi = Math.max(hi, band.from, band.to)
      }
    }
    const plotTop = 8
    const plotBottom = h - 24
    const scale = streamingNiceScale(lo, hi, Math.max(3, Math.min(5, Math.floor((plotBottom - plotTop) / 44))))
    const yMin = domain ? domain[0] : scale.min
    const yMax = domain ? domain[1] : scale.max
    const ticks = scale.ticks.filter((v) => v >= yMin - 1e-9 && v <= yMax + 1e-9)
    const unit = Object.values(config).find((c) => c.unit)?.unit
    const tickDigits = Math.max(0, -Math.floor(Math.log10(scale.step) + 1e-9)) + (scale.step % 1 && (scale.step * 10) % 1 ? 1 : 0)
    const tickText = ticks.map((v) => formatStreamingValue(v, tickDigits, locale))
    let gutter = 0
    for (const s of tickText) gutter = Math.max(gutter, ctx.measureText(s).width)
    const plotLeft = Math.ceil(gutter) + 8
    const plotRight = w - 1
    const pw = Math.max(1, plotRight - plotLeft)
    this.plotWidth = pw
    const ph = Math.max(1, plotBottom - plotTop)
    const x = (t: number) => plotLeft + ((t - start) / windowMs) * pw
    const y = (v: number) => plotBottom - ((v - yMin) / (yMax - yMin || 1)) * ph

    // Band, behind everything.
    if (band) {
      const y1 = y(Math.max(band.from, band.to))
      const y2 = y(Math.min(band.from, band.to))
      ctx.fillStyle = p.band
      ctx.fillRect(plotLeft, Math.max(plotTop, y1), pw, Math.min(plotBottom, y2) - Math.max(plotTop, y1))
      if (band.label) {
        ctx.fillStyle = p.text
        ctx.textAlign = "left"
        ctx.fillText(band.label, plotLeft + 8, Math.max(plotTop, y1) + 10)
      }
    }

    // A horizontal hairline grid and the value ticks; no axis lines.
    ctx.lineWidth = 1
    ctx.strokeStyle = p.grid
    ctx.fillStyle = p.text
    ctx.textAlign = "right"
    ctx.setLineDash([])
    ticks.forEach((v, i) => {
      const ty = Math.round(y(v)) + 0.5
      ctx.beginPath()
      ctx.moveTo(plotLeft, ty)
      ctx.lineTo(plotRight, ty)
      ctx.stroke()
      ctx.fillText(tickText[i]!, plotLeft - 8, ty)
    })

    // Time ticks, fixed to the right edge: the data moves under them, the labels never do.
    const step = streamingTimeStep(windowMs, Math.max(1, Math.floor(pw / 72)))
    ctx.textBaseline = "alphabetic"
    // The right end says Now while live, and the frozen time while paused.
    const edgeText = this.paused ? l.formatTime(new Date(end), locale === undefined ? undefined : resolveLocale(locale)) : l.now
    const edgeWidth = ctx.measureText(edgeText).width
    ctx.textAlign = "right"
    ctx.fillText(edgeText, plotRight, h - 6)
    for (let k = 1; k * step <= windowMs + 1; k++) {
      const tx = plotRight - (k * step * pw) / windowMs
      const s = (k * step) / 1000
      const text = step < 60_000 ? l.secondsAgo(formatStreamingValue(s, 0, locale)) : l.minutesAgo(formatStreamingValue(s / 60, 0, locale))
      const tw = ctx.measureText(text).width
      // Kept clear of the right end's label; the oldest tick sits inside the plot's left edge.
      if (tx + tw / 2 > plotRight - edgeWidth - 8) continue
      const atLeft = tx - tw / 2 < plotLeft
      ctx.textAlign = atLeft ? "left" : "center"
      ctx.fillText(text, atLeft ? plotLeft : tx, h - 6)
    }

    // Limits: dashed in the muted ink with the label at the end.
    ctx.textBaseline = "alphabetic"
    for (const lim of limits) {
      if (lim.value < yMin || lim.value > yMax) continue
      const ly = Math.round(y(lim.value)) + 0.5
      ctx.strokeStyle = p.limit
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(plotLeft, ly)
      ctx.lineTo(plotRight, ly)
      ctx.stroke()
      ctx.fillStyle = p.limit
      ctx.textAlign = "right"
      const text = lim.label ?? l.limit(unit ? l.withUnit(formatStreamingValue(lim.value, tickDigits, locale), unit) : formatStreamingValue(lim.value, tickDigits, locale))
      ctx.fillText(text, plotRight - 4, ly - 4)
    }
    ctx.setLineDash([])

    // The lines, clipped to the plot.
    ctx.save()
    ctx.beginPath()
    ctx.rect(plotLeft, plotTop - 2, pw + 1, ph + 4)
    ctx.clip()
    ctx.lineWidth = 2
    ctx.lineJoin = "round"
    ctx.lineCap = "butt"
    const pxPerMs = pw / windowMs
    // Draw the emphasised series last, so it lies on top.
    for (let si = this.series.length - 1; si >= 0; si--) {
      const s = this.series[si]!
      ctx.strokeStyle = p.series[s.slot] ?? p.text
      const b = s.buffer
      if (!b.size) continue
      const from = Math.max(0, b.lowerBound(start) - 1)
      const to = Math.min(b.size, b.lastAtOrBefore(end) + 2)
      if (to - from < 1) continue
      if (s.dash) {
        // The dashes stay with the data as it scrolls, rather than crawling along the line.
        const period = s.dash[0]! + s.dash[1]!
        ctx.setLineDash(s.dash)
        ctx.lineDashOffset = -((((b.time(from) * pxPerMs) % period) + period) % period)
      } else ctx.setLineDash([])
      ctx.beginPath()
      this.trace(ctx, b, from, to, x, y, staleAfterMs, to - from > pw * 2)
      ctx.stroke()
    }
    ctx.restore()
    ctx.setLineDash([])

    // The crosshair: a vertical line, a dot on each series, the card with the values.
    this.drawHover(ctx, p, start, end, plotLeft, plotRight, plotTop, plotBottom, x, y)
  }

  /**
   * One series as a path. Sparse readings are joined point to point; dense ones (more than two per pixel) are reduced to
   * each pixel column's first, lowest, highest and last value, so a peak is never lost and a 10-minute window at 50 Hz
   * draws about four points per pixel instead of 30 000. A gap (NaN, or no reading for `staleAfterMs`) lifts the pen.
   */
  private trace(
    ctx: CanvasRenderingContext2D,
    b: StreamBuffer,
    from: number,
    to: number,
    x: (t: number) => number,
    y: (v: number) => number,
    gapMs: number,
    dense: boolean,
  ) {
    let pen = false
    let prevT = NaN
    // The ring's own arrays, walked with a wrapping index: no call and no modulo per reading.
    const { times, values, start } = b.raw()
    const cap = b.capacity
    const next = (at: number) => (at + 1 === cap ? 0 : at + 1)
    if (!dense) {
      for (let i = from, at = (start + from) % cap; i < to; i++, at = next(at)) {
        const t = times[at]!
        const v = values[at]!
        if (!Number.isFinite(v) || t - prevT > gapMs) pen = false
        prevT = t
        if (!Number.isFinite(v)) continue
        if (pen) ctx.lineTo(x(t), y(v))
        else {
          ctx.moveTo(x(t), y(v))
          pen = true
        }
      }
      return
    }
    let col = NaN
    let firstX = 0
    let firstY = 0
    let lastX = 0
    let lastY = 0
    let minY = 0
    let maxY = 0
    let minI = 0
    let maxI = 0
    let count = 0
    const flush = () => {
      if (!count) return
      const cx = col + 0.5
      if (pen) ctx.lineTo(firstX, firstY)
      else ctx.moveTo(firstX, firstY)
      pen = true
      if (count > 2) {
        // Lowest and highest in the order they came, so a spike reads as up then down.
        if (minI < maxI) {
          ctx.lineTo(cx, minY)
          ctx.lineTo(cx, maxY)
        } else {
          ctx.lineTo(cx, maxY)
          ctx.lineTo(cx, minY)
        }
      }
      if (count > 1) ctx.lineTo(lastX, lastY)
      count = 0
    }
    for (let i = from, at = (start + from) % cap; i < to; i++, at = next(at)) {
      const t = times[at]!
      const v = values[at]!
      if (!Number.isFinite(v) || t - prevT > gapMs) {
        flush()
        pen = false
      }
      prevT = t
      if (!Number.isFinite(v)) continue
      const px = x(t)
      const py = y(v)
      const c = Math.floor(px)
      if (c !== col) {
        flush()
        col = c
        firstX = px
        firstY = py
        minY = maxY = py
        minI = maxI = i
      } else {
        // Screen y grows downward: the lowest value is the largest y.
        if (py > minY) {
          minY = py
          minI = i
        }
        if (py < maxY) {
          maxY = py
          maxI = i
        }
      }
      lastX = px
      lastY = py
      count++
    }
    flush()
  }

  private drawHover(
    ctx: CanvasRenderingContext2D,
    p: Palette,
    start: number,
    end: number,
    left: number,
    right: number,
    top: number,
    bottom: number,
    x: (t: number) => number,
    y: (v: number) => number,
  ) {
    const tip = this.part("streaming-chart-tip")
    const hx = this.hoverX
    if (hx === null || hx < left || hx > right) {
      if (tip) tip.hidden = true
      return
    }
    const { windowMs, config, staleAfterMs, locale, labels: l } = this.settings
    const t = start + ((hx - left) / (right - left)) * windowMs
    ctx.strokeStyle = p.cursor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.round(hx) + 0.5, top)
    ctx.lineTo(Math.round(hx) + 0.5, bottom)
    ctx.stroke()
    const texts: Record<string, string> = {}
    for (const s of this.series) {
      const b = s.buffer
      const i = b.lastAtOrBefore(t)
      const v = i >= 0 && t - b.time(i) <= staleAfterMs ? b.value(i) : NaN
      const c = config[s.key]
      if (!Number.isFinite(v) || !c) {
        texts[s.key] = l.noValue
        continue
      }
      texts[s.key] = c.unit ? l.withUnit(formatStreamingValue(v, c.digits ?? 1, locale), c.unit) : formatStreamingValue(v, c.digits ?? 1, locale)
      ctx.beginPath()
      ctx.arc(x(b.time(i)), y(v), 4, 0, Math.PI * 2)
      ctx.fillStyle = p.series[s.slot] ?? p.text
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = p.card
      ctx.stroke()
    }
    if (!tip) return
    const head = tip.querySelector<HTMLElement>("[data-slot=streaming-chart-tip-time]")
    const ago = (end - t) / 1000
    const when = `${l.formatTime(new Date(t), locale === undefined ? undefined : resolveLocale(locale))} · ${ago < 0.05 ? l.now : l.secondsAgo(formatStreamingValue(ago, 1, locale))}`
    if (head && head.textContent !== when) head.textContent = when
    for (const cell of tip.querySelectorAll<HTMLElement>("[data-key]")) {
      const text = texts[cell.dataset.key ?? ""] ?? l.noValue
      if (cell.textContent !== text) cell.textContent = text
    }
    tip.hidden = false
    // Beside the crosshair, on whichever side has room.
    const tw = tip.offsetWidth
    const left2 = hx + 12 + tw > right ? hx - 12 - tw : hx + 12
    tip.style.transform = `translate(${Math.max(0, left2)}px, ${top}px)`
  }
}

// ---------- The component ----------

export type StreamingChartProps = {
  /** The series, in order of emphasis: the first is the accent and solid, then dashed, then dotted. */
  config: StreamingChartConfig
  /** What the chart shows, for screen readers: "Drive motor currents, Patrol dog 7F3A". */
  label: string
  /** push, clear, pause and resume, called from anywhere without rendering. */
  ref?: React.Ref<StreamingChartHandle>
  /**
   * Connects a source once: called with the chart's `push` when it mounts (and again if this function changes); return the
   * function that disconnects. Keep it stable (a module-level function, or one the React Compiler memoises), or every render
   * reconnects. `(push) => ros.subscribe("/battery", "sensor_msgs/BatteryState", (m) => push({ voltage: m.voltage }))`.
   */
  subscribe?: (push: StreamingChartPush) => (() => void) | void
  /** The windows to choose from, in ms. One window hides the switch. */
  windows?: number[]
  /** The window shown, in ms (controlled). */
  window?: number
  defaultWindow?: number
  onWindowChange?: (ms: number) => void
  /** Frozen (controlled). Readings keep arriving into the buffer while paused. */
  paused?: boolean
  defaultPaused?: boolean
  onPausedChange?: (paused: boolean) => void
  /** A fixed value range. Without it the range follows what is in view, in round steps; fix it for a value with known bounds. */
  domain?: readonly [number, number]
  limits?: readonly StreamingChartLimit[]
  band?: StreamingChartBand
  /** Readings kept per series. The default, 36 000, holds 10 minutes at 60 Hz; longer windows at high rates need more. */
  capacity?: number
  /** With no reading for this long the chart says so, and a gap this long breaks the line instead of joining across it. */
  staleAfterMs?: number
  /** How often screen readers hear the current values while focus is on the chart. A crossed limit is said at once. */
  announceEveryMs?: number
  /** The window switch, the Chart / Table switch and Pause. Off for small multiples driven by one set of controls. */
  controls?: boolean
  /**
   * BCP 47 tag for numbers and times ("zh-TW", "de"): pass the app's locale. Left out, English on the server and in every
   * browser alike; a tag Intl cannot read falls back to English.
   */
  locale?: string
  labels?: Partial<StreamingChartLabels>
  className?: string
  /** The plot's height. Defaults to h-64. */
  plotClassName?: string
}

const DEFAULT_WINDOWS = [30_000, 120_000, 600_000]
const NO_LIMITS: readonly StreamingChartLimit[] = []

/**
 * A live line chart for telemetry arriving many times a second: speed, motor current, temperature, battery voltage. The
 * time axis keeps a fixed window ending now; Pause freezes the view while readings keep buffering, the arrow keys move a
 * paused view through the buffer, and Resume or Jump to live returns to the edge. Drawn on a canvas from ring buffers the
 * chart owns, on requestAnimationFrame, only while it is on screen and the tab is visible: a reading never renders React.
 */
export function StreamingChart({
  config,
  label,
  ref,
  subscribe,
  windows = DEFAULT_WINDOWS,
  window: windowProp,
  defaultWindow,
  onWindowChange,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  domain,
  limits = NO_LIMITS,
  band,
  capacity = DEFAULT_CAPACITY,
  staleAfterMs = 2000,
  announceEveryMs = 5000,
  controls = true,
  locale,
  labels: labelsProp,
  className,
  plotClassName,
}: StreamingChartProps) {
  const l = { ...defaultStreamingChartLabels, ...labelsProp }
  const [windowInner, setWindowInner] = React.useState(defaultWindow ?? windows[0] ?? 30_000)
  const windowMs = windowProp ?? windowInner
  const [pausedInner, setPausedInner] = React.useState(defaultPaused)
  const paused = pausedProp ?? pausedInner
  const [view, setView] = React.useState<"chart" | "table">("chart")
  // Whether the paused view has been moved back from where it froze: the button then says Jump to live, not Resume.
  const [behind, setBehind] = React.useState(false)
  const [pausedBefore, setPausedBefore] = React.useState(paused)
  if (pausedBefore !== paused) {
    setPausedBefore(paused)
    if (!paused) setBehind(false)
  }
  const [dataState, setDataState] = React.useState<"waiting" | "live" | "stale">("waiting")
  const [staleAt, setStaleAt] = React.useState(NaN)
  const [rows, setRows] = React.useState<StreamingChartRow[]>([])
  const descId = React.useId()

  const [engine] = React.useState(
    () => new StreamingEngine({ config, windowMs, domain, limits, band, staleAfterMs, announceEveryMs, locale, labels: l }, capacity),
  )

  // The settings reach the engine after each render; it redraws on its next frame. Renders are rare: never per reading.
  React.useEffect(() => {
    engine.update({ config, windowMs, domain, limits, band, staleAfterMs, announceEveryMs, locale, labels: l })
  })

  const setPaused = (next: boolean) => {
    if (pausedProp === undefined) setPausedInner(next)
    onPausedChange?.(next)
  }
  const pan = (ms: number) => {
    if (!paused) setPaused(true)
    setBehind(engine.panBy(ms))
  }
  const chooseWindow = (next: number) => {
    if (windowProp === undefined) setWindowInner(next)
    onWindowChange?.(next)
  }

  React.useImperativeHandle(ref, () => ({
    push: engine.push,
    clear: engine.clear,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  }))

  // Waiting, live or stale: told by the engine when the first reading arrives, checked four times a second after that,
  // and set only when it changes, never per reading. Declared before `subscribe`, so a source's history is heard.
  React.useEffect(() => {
    const check = () => {
      const has = engine.hasData()
      const stale = has && now() - engine.lastReceived > staleAfterMs
      setDataState(!has ? "waiting" : stale ? "stale" : "live")
      setStaleAt(stale ? engine.lastSampleTime : NaN)
    }
    engine.listen(check)
    const id = setInterval(check, 250)
    return () => {
      clearInterval(id)
      engine.listen(null)
    }
  }, [engine, staleAfterMs])

  React.useEffect(() => {
    if (!subscribe) return
    const stop = subscribe(engine.push)
    return typeof stop === "function" ? stop : undefined
  }, [subscribe, engine])

  // Pausing freezes the edge where it is now (after `subscribe`, so a chart paused from the start freezes on its history);
  // resuming jumps back to live.
  React.useEffect(() => {
    if (paused !== engine.isPaused()) engine.setPaused(paused)
  }, [paused, engine])

  // Reduced motion: the view steps once a second instead of gliding.
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => engine.setReduced(q.matches)
    apply()
    q.addEventListener?.("change", apply)
    return () => q.removeEventListener?.("change", apply)
  }, [engine])

  // The theme's colours, read again when the theme or contrast changes, since a canvas cannot use CSS variables.
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") return
    const mo = new MutationObserver(engine.readPalette)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-contrast"] })
    const queries = ["(prefers-color-scheme: dark)", "(prefers-contrast: more)", "(forced-colors: active)"]
      .map((q) => (typeof window.matchMedia === "function" ? window.matchMedia(q) : null))
      .filter((q) => !!q)
    queries.forEach((q) => q.addEventListener?.("change", engine.readPalette))
    // Webfonts arrive after the first frame; the tick labels are measured again in the real face.
    void document.fonts?.ready.then(engine.readPalette)
    return () => {
      mo.disconnect()
      queries.forEach((q) => q.removeEventListener?.("change", engine.readPalette))
    }
  }, [engine])

  // The engine finds its root and canvas after each commit that can change them: the Chart / Table switch mounts and
  // unmounts the canvas, and a pause renders the spans its time is written into.
  const rootRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const root = rootRef.current
    engine.attachRoot(root)
    engine.attachCanvas(root?.querySelector("canvas") ?? null)
    engine.writeFrozenTime()
  })

  React.useEffect(() => () => engine.dispose(), [engine])

  // The table: a row per time tick across the view, read when it opens, then every second while live.
  const step = streamingTimeStep(windowMs, 10)
  React.useEffect(() => {
    if (view !== "table") return
    const read = () => setRows(engine.rows(step))
    const first = setTimeout(read)
    const id = paused ? undefined : setInterval(read, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [view, paused, step, windowMs, engine])


  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === " ") {
      e.preventDefault()
      setPaused(!paused)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      pan((e.key === "ArrowLeft" ? -1 : 1) * windowMs * (e.shiftKey ? 0.5 : 0.1))
    } else if (e.key === "End") {
      e.preventDefault()
      setPaused(false)
    }
  }
  const hover = (e: React.PointerEvent<HTMLElement>) => engine.setHover(e.clientX - e.currentTarget.getBoundingClientRect().left)

  const timeLocale = locale === undefined ? undefined : resolveLocale(locale)
  const state: StreamingChartState = paused ? "paused" : dataState
  const keys = Object.keys(config)
  const staleText = `${l.stale} · ${Number.isFinite(staleAt) ? l.lastSample(l.formatTime(new Date(staleAt), timeLocale)) : ""}`

  return (
    <div ref={rootRef} data-slot="streaming-chart" data-state={state} className={cn("@container flex min-w-0 flex-col gap-3 text-sm", className)}>
      {/* Spoken when the data stops or the view is paused, and emptied while live, so a running chart says nothing here.
          The time the paused view ends is written by the engine into its span, as the view moves. */}
      <span role="status" className="sr-only">
        {state === "paused" ? (
          <>
            {l.paused} <span data-slot="streaming-chart-frozen-time" />
          </>
        ) : state === "stale" ? (
          staleText
        ) : (
          ""
        )}
      </span>
      {/* The current values, said politely: a crossed limit at once, the rest every few seconds while focus is on the chart. */}
      <span data-slot="streaming-chart-announcer" aria-live="polite" className="sr-only" />

      {/* One row at every width. From 36 rem the window and Chart / Table switches show; narrower, they fold into a menu
          (⋯) beside Pause, so the status and Pause stay in view and the plot is not pushed down by three rows of buttons. */}
      <div data-slot="streaming-chart-toolbar" className="flex items-center justify-between gap-x-4">
        <p
          data-slot="streaming-chart-status"
          aria-hidden="true"
          className={cn("flex min-h-(--h-sm) min-w-0 items-center gap-2", state === "stale" ? "text-warning" : "text-muted-foreground")}
        >
          {state === "paused" ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : state === "stale" ? (
            <TriangleAlert aria-hidden="true" className="size-4" />
          ) : (
            <StatusGlyph status={state === "live" ? "active" : "offline"} className={state === "live" ? "text-foreground" : undefined} />
          )}
          <span className={cn("tabular-nums", state === "live" && "font-medium text-foreground", state === "stale" && "font-medium")}>
            {state === "paused" ? (
              <>
                {l.paused} · <span data-slot="streaming-chart-frozen-time" />
              </>
            ) : state === "stale" ? (
              staleText
            ) : state === "waiting" ? (
              l.waiting
            ) : (
              l.live
            )}
          </span>
        </p>
        {controls && (
          <div className="flex shrink-0 items-center gap-2">
            {windows.length > 1 && (
              <SegmentedControl
                value={String(windowMs)}
                onValueChange={(v) => v && chooseWindow(Number(v))}
                aria-label={l.window}
                className="hidden h-(--h-sm) w-auto @xl:inline-flex"
              >
                {windows.map((ms) => (
                  <SegmentedControlItem key={ms} value={String(ms)} className="tabular-nums">
                    {l.windowOption(ms)}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )}
            <ChartViewSwitch
              value={view}
              onValueChange={(v) => setView(v === "table" ? "table" : "chart")}
              labels={{ view: l.view, chart: l.chart, table: l.table }}
              className="hidden @xl:inline-flex"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label={l.viewOptions} data-slot="streaming-chart-more" className="@xl:hidden">
                  <Ellipsis aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {windows.length > 1 && (
                  <>
                    <DropdownMenuLabel>{l.window}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={String(windowMs)} onValueChange={(v) => chooseWindow(Number(v))}>
                      {windows.map((ms) => (
                        <DropdownMenuRadioItem key={ms} value={String(ms)} className="tabular-nums">
                          {l.windowOption(ms)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLabel>{l.view}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={view} onValueChange={(v) => setView(v === "table" ? "table" : "chart")}>
                  <DropdownMenuRadioItem value="chart">{l.chart}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="table">{l.table}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" data-slot="streaming-chart-pause" onClick={() => setPaused(!paused)}>
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              {paused ? (behind ? l.jumpToLive : l.resume) : l.pause}
            </Button>
          </div>
        )}
      </div>

      {/* The legend: each series' line style, its name and its value now. Always shown, so a series is never only a colour. */}
      <ul role="list" data-slot="streaming-chart-legend" className="flex flex-wrap gap-x-6 gap-y-1">
        {keys.map((key, i) => {
          const c = config[key]!
          return (
            <li key={key} data-key={key} className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 20 12" className="h-3 w-5 shrink-0">
                <line x1="0" y1="6" x2="20" y2="6" stroke={`var(--chart-${c.color})`} strokeWidth="2" strokeDasharray={DASH_TEXT[i]} />
              </svg>
              <span className="text-muted-foreground">{c.label}</span>
              <span data-slot="streaming-chart-value" className="font-mono font-medium tabular-nums" />
              <span data-slot="streaming-chart-over" className="hidden items-center gap-2 text-xs font-medium text-warning data-over:flex">
                <TriangleAlert aria-hidden="true" className="size-4" />
                <span data-slot="streaming-chart-over-word" />
              </span>
            </li>
          )
        })}
      </ul>

      {view === "chart" ? (
        <div
          data-slot="streaming-chart-plot"
          role="figure"
          aria-label={label}
          aria-describedby={descId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerMove={hover}
          onPointerDown={hover}
          onPointerLeave={() => engine.setHover(null)}
          onPointerCancel={() => engine.setHover(null)}
          className={cn("relative h-64 w-full touch-pan-y rounded-xs outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring", plotClassName)}
        >
          <span id={descId} className="sr-only">
            {l.keys}
          </span>
          <canvas aria-hidden="true" className="absolute inset-0 size-full" />
          {/* The crosshair's card, written by the engine as the pointer moves; screen readers have the legend and the table. */}
          <div
            hidden
            aria-hidden="true"
            data-slot="streaming-chart-tip"
            className="pointer-events-none absolute top-0 left-0 min-w-40 rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-overlay ring-1 ring-border"
          >
            <p data-slot="streaming-chart-tip-time" className="pb-1 font-medium tabular-nums" />
            <ul className="flex flex-col gap-1">
              {keys.map((key, i) => {
                const c = config[key]!
                return (
                  <li key={key} className="flex items-center gap-2">
                    <svg aria-hidden="true" viewBox="0 0 20 12" className="h-3 w-5 shrink-0">
                      <line x1="0" y1="6" x2="20" y2="6" stroke={`var(--chart-${c.color})`} strokeWidth="2" strokeDasharray={DASH_TEXT[i]} />
                    </svg>
                    <span className="flex-1 text-muted-foreground">{c.label}</span>
                    <span data-key={key} className="font-mono font-medium tabular-nums" />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div data-slot="streaming-chart-table" className={cn("h-64 overflow-auto", plotClassName)}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{l.time}</TableHead>
                {keys.map((key) => (
                  <TableHead key={key} className="text-right">
                    {config[key]!.label}
                    {config[key]!.unit ? ` (${config[key]!.unit})` : ""}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.time}>
                  <TableCell className="tabular-nums">{l.formatTime(new Date(row.time), timeLocale)}</TableCell>
                  {keys.map((key) => {
                    const v = row.values[key]
                    return (
                      <TableCell key={key} className="text-right tabular-nums">
                        {v == null ? l.noValue : formatStreamingValue(v, config[key]!.digits ?? 1, locale)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
