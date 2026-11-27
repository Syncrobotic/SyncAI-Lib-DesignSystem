// @syncrobotic/relative-time v0.56.0 · update: npx shadcn add @syncrobotic/relative-time --overwrite
/**
 * How long ago (or how far ahead) a moment is, and the moment itself, through Intl in any locale: for timestamps a
 * server sends. formatRelative ("3 minutes ago", "3 分鐘前"), formatAbsolute, formatDuration, and relativeParts for a
 * product's own message keys. English when no locale is given, so the server and the browser agree. Read `now` with
 * use-now in a component, never `Date.now()` during render.
 */
import { formatNumber, resolveLocale } from "@/registry/syncrobotic/lib/format-number"

/** A moment as an API sends it: a Date, ms since the epoch, or an ISO 8601 string. */
export type DateInput = Date | number | string

/** Ms since the epoch, or null for nothing or a value that is not a date. */
export function toTime(value: DateInput | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const t = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value)
  return Number.isFinite(t) ? t : null
}

export type RelativeUnit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * The largest unit that fits and a whole count of it, negative in the past: `{ value: -3, unit: "minute" }`. Counts
 * round toward zero, so 59 minutes stays "59 minutes ago" and never jumps to "1 hour ago" early. For next-intl or ICU
 * messages of your own; formatRelative writes the same parts through Intl.
 */
export function relativeParts(date: DateInput, now: number): { value: number; unit: RelativeUnit } {
  const ms = (toTime(date) ?? now) - now
  const a = Math.abs(ms)
  const n = (size: number) => Math.trunc(ms / size) || 0
  if (a < MINUTE) return { value: n(SECOND), unit: "second" }
  if (a < HOUR) return { value: n(MINUTE), unit: "minute" }
  if (a < DAY) return { value: n(HOUR), unit: "hour" }
  if (a < 7 * DAY) return { value: n(DAY), unit: "day" }
  if (a < 30 * DAY) return { value: n(7 * DAY), unit: "week" }
  if (a < 365 * DAY) return { value: n(30 * DAY), unit: "month" }
  return { value: n(365 * DAY), unit: "year" }
}

const rtfs = new Map<string, Intl.RelativeTimeFormat>()
function rtf(locale: string | undefined, options: Intl.RelativeTimeFormatOptions) {
  const tag = resolveLocale(locale)
  const key = `${tag}|${options.style}|${options.numeric}`
  let f = rtfs.get(key)
  if (!f) {
    f = new Intl.RelativeTimeFormat(tag, options)
    rtfs.set(key, f)
  }
  return f
}

export type RelativeOptions = {
  /** The moment to measure from, in ms since the epoch: use-now's value in a component. */
  now: number
  /** BCP 47 tag; English when none is given. */
  locale?: string
  /** "long" (3 minutes ago, the default), "short" (3 min. ago) or "narrow". */
  style?: Intl.RelativeTimeFormatStyle
  /** The smallest unit said. "minute" says "this minute" under a minute, so the text need not change every second. */
  minUnit?: "second" | "minute"
  /** "clamp" says a moment ahead of `now` (a clock running fast) as now; "allow" (the default) says "in 3 minutes". */
  future?: "allow" | "clamp"
}

/**
 * How long ago or how far ahead `date` is from `now`, in words: "now", "3 minutes ago", "in 2 days", "3 分鐘前". Under
 * ten seconds it is "now"; an invalid date is "".
 */
export function formatRelative(date: DateInput, { now, locale, style = "long", minUnit = "second", future = "allow" }: RelativeOptions): string {
  const t = toTime(date)
  if (t === null) return ""
  const at = future === "clamp" ? Math.min(t, now) : t
  const { value, unit } = relativeParts(at, now)
  const auto = rtf(locale, { style, numeric: "auto" })
  if (unit === "second" && minUnit === "minute") return auto.format(0, "minute")
  if (unit === "second" && Math.abs(value) < 10) return auto.format(0, "second")
  return rtf(locale, { style, numeric: "always" }).format(value, unit)
}

const dtfs = new Map<string, Intl.DateTimeFormat>()

export type AbsoluteOptions = {
  locale?: string
  /** IANA zone. Without it the runtime's, which the server and the browser rarely share: format once in the browser, or pass it. */
  timeZone?: string
  /** "minute" (the default) or "second"; "date" for the day alone, "day" without the year, "time" without the day (axes). */
  precision?: "date" | "day" | "time" | "minute" | "second"
  /** Adds the zone's short name ("UTC", "GMT+8"), for a moment people in several zones read. */
  withZone?: boolean
}

/** The moment itself, date and 24-hour time: "Nov 27, 2026, 14:02" in English, "2026年11月27日 14:02" in zh-TW. */
export function formatAbsolute(date: DateInput, { locale, timeZone, precision = "minute", withZone = false }: AbsoluteOptions = {}): string {
  const t = toTime(date)
  if (t === null) return ""
  const tag = resolveLocale(locale)
  const key = `${tag}|${timeZone ?? ""}|${precision}|${withZone}`
  let f = dtfs.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(tag, {
      ...(precision === "time" ? {} : { month: "short", day: "numeric" }),
      ...(precision === "time" || precision === "day" ? {} : { year: "numeric" }),
      ...(precision === "date" || precision === "day" ? {} : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      ...(precision === "second" ? { second: "2-digit" } : {}),
      ...(withZone ? { timeZoneName: "short" } : {}),
      timeZone,
    })
    dtfs.set(key, f)
  }
  return f.format(t)
}

/**
 * A length of time in its two largest units, as Intl writes units: "2 hr 15 min", "45 sec", "2 小時 15 分鐘". Under a
 * second it is "0 sec"; negative lengths are written as their size.
 */
export function formatDuration(ms: number, { locale }: { locale?: string } = {}): string {
  const a = Math.abs(ms)
  const parts: [number, string][] = [
    [Math.floor(a / DAY), "day"],
    [Math.floor((a % DAY) / HOUR), "hour"],
    [Math.floor((a % HOUR) / MINUTE), "minute"],
    [Math.floor((a % MINUTE) / SECOND), "second"],
  ]
  const first = parts.findIndex(([n]) => n > 0)
  if (first < 0) return formatNumber(0, { locale, style: "unit", unit: "second", unitDisplay: "short" })
  return parts
    .slice(first, first + 2)
    .filter(([n]) => n > 0)
    .map(([n, unit]) => formatNumber(n, { locale, style: "unit", unit, unitDisplay: "short" }))
    .join(" ")
}

/** How often relative text about `date` can change: every second under a minute, every minute under an hour, else hourly. */
export function refreshInterval(date: DateInput, now: number): number {
  const a = Math.abs((toTime(date) ?? now) - now)
  return a < MINUTE ? SECOND : a < HOUR ? MINUTE : HOUR
}
