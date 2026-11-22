// @syncrobotic/attitude v0.29.0 · update: npx shadcn add @syncrobotic/attitude --overwrite
"use client"

import * as React from "react"
import { OctagonAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { meterSaid, meterTone, type MeterTone } from "@/registry/syncrobotic/ui/meter"

/*
  Two instruments for a robot's state now, drawn in SVG in the kit's chart language (graphite and one accent, no
  gradients) and always written out in numbers and words beside the drawing:
  - AttitudeIndicator: roll and pitch as an artificial horizon, the heading on a compass ring, from an IMU;
  - Gauge: one value with a known range on a 270° dial (speed, a motor's temperature, a wheel's current), with Meter's
    thresholds and words.
  Both take plain props, and for a stream at 20 to 50 Hz a `push` on the ref or a `subscribe` function: a reading moves the
  drawing on the next animation frame without rendering React, and the numbers and words are rendered at most four times a
  second (at once when a limit is crossed), so they stay readable and React stays idle.
*/

// ---------- Numbers ----------

/** As streaming-chart: English without a locale, the same on the server and in every browser; a tag Intl cannot read is English. */
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
/** A reading as the instruments write it: fixed decimals, no "−0", and a true minus sign (U+2212). */
export function formatReading(value: number, digits = 0, locale?: string): string {
  const tag = resolveLocale(locale)
  const d = Math.min(Math.max(0, Math.floor(digits)), 6)
  const key = `${tag}|${d}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(tag, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false })
    formatters.set(key, f)
  }
  const step = 10 ** d
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * step)) / step
  const text = f.format(rounded === 0 ? 0 : Math.abs(rounded))
  return rounded < 0 ? `−${text}` : text
}

const pad = (n: number) => String(n).padStart(2, "0")
const clockTime = (d: Date, locale?: string) =>
  locale
    ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    : [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(":")

/** A heading kept in 0–360 (0 is north, clockwise), rounded to whole degrees, 360 written as 0. */
export const normalizeHeading = (deg: number) => {
  const h = Math.round(((deg % 360) + 360) % 360)
  return h === 360 ? 0 : h
}

/** The 8-point compass point of a heading: 0 N, 1 NE, 2 E … 7 NW. */
export const compassPoint = (deg: number) => Math.round(normalizeHeading(deg) / 45) % 8

// ---------- The live reading, outside React ----------

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())
/** Numbers and words are rendered at most this often; the drawing follows every frame. */
const TEXT_EVERY_MS = 250

type Reading = Record<string, number | undefined>
type ReadingSample<R extends Reading> = { [K in keyof R]?: number | null }

/**
 * The latest reading of an instrument, kept out of React. `push` stores it and asks for an animation frame; the frame
 * moves the drawing straight in the DOM (`draw`) and, at most every 250 ms or at once when `key` changes (a limit
 * crossed), hands the reading to React (`publish`) for the numbers and words. Under reduced motion the drawing steps with
 * the numbers instead of following every frame.
 */
class LiveReading<R extends Reading> {
  values: R
  /** When the last update arrived, on this browser's clock (performance.now). */
  receivedAt = -Infinity
  /** The last update's own time, ms since the epoch: the message's stamp, or when it arrived. */
  sampleTime = NaN
  private reduced = false
  private draw: ((values: R) => void) | null = null
  private publish: ((values: R) => void) | null = null
  private key: ((values: R) => string) | null = null
  private raf = 0
  private timer: ReturnType<typeof setTimeout> | undefined
  private lastText = -Infinity
  private lastKey: string | null = null
  private readonly empty: R

  constructor(values: R) {
    this.values = values
    this.empty = Object.fromEntries(Object.keys(values).map((k) => [k, undefined])) as R
  }

  hasData() {
    return this.receivedAt > -Infinity
  }

  /**
   * The render's hooks, set after each render: `draw` moves the drawing, `key` names the limits crossed (a change is
   * written at once), `publish` hands the reading to React for the numbers and words.
   */
  connect(hooks: { draw: (values: R) => void; key: (values: R) => string; publish: (values: R) => void }) {
    this.draw = hooks.draw
    this.key = hooks.key
    this.publish = hooks.publish
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced
  }

  /** Forgets the reading: every value unknown, waiting for data. */
  clear = () => {
    this.values = { ...this.empty }
    this.receivedAt = -Infinity
    this.sampleTime = NaN
    this.flush()
  }

  // Bound once, so the handle and `subscribe` get the same function for the instrument's life.
  /** Stores a reading: a key left out keeps its value, null or NaN makes it unknown. False when nothing was in it. */
  push = (sample: ReadingSample<R>, time?: number): boolean => {
    let any = false
    const next = { ...this.values }
    for (const k of Object.keys(sample) as (keyof R)[]) {
      const v = sample[k]
      if (v === undefined) continue
      next[k] = (typeof v === "number" && Number.isFinite(v) ? v : undefined) as R[keyof R]
      any = true
    }
    if (!any) return false
    this.values = next
    this.receivedAt = now()
    this.sampleTime = time !== undefined && Number.isFinite(time) ? time : Date.now()
    this.schedule()
    return true
  }

  private schedule() {
    if (this.raf) return
    if (typeof requestAnimationFrame === "undefined") return this.frame()
    this.raf = requestAnimationFrame(this.frame)
  }

  /** Draws and publishes now: a change of props, which React is rendering anyway. */
  flush() {
    this.lastText = -Infinity
    this.frame()
  }

  private frame = () => {
    this.raf = 0
    const t = now()
    const key = this.key?.(this.values) ?? ""
    const due = t - this.lastText >= TEXT_EVERY_MS || key !== this.lastKey
    if (!this.reduced || due) this.draw?.(this.values)
    if (due) {
      this.lastText = t
      this.lastKey = key
      if (this.timer !== undefined) clearTimeout(this.timer)
      this.timer = undefined
      this.publish?.(this.values)
    } else if (this.timer === undefined) {
      // The last reading of a burst is always written, even when no reading follows it.
      this.timer = setTimeout(() => {
        this.timer = undefined
        this.frame()
      }, TEXT_EVERY_MS - (t - this.lastText))
    }
  }

  dispose() {
    if (this.raf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this.raf)
    this.raf = 0
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.timer = undefined
  }
}

/** Reduced motion, followed while mounted. */
function useReducedMotion(engine: { setReduced: (reduced: boolean) => void }) {
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => engine.setReduced(q.matches)
    apply()
    q.addEventListener?.("change", apply)
    return () => q.removeEventListener?.("change", apply)
  }, [engine])
}

/** Stale after `staleAfterMs` without an update, checked four times a second, set only when it changes. */
function useStale(engine: { hasData: () => boolean; receivedAt: number; sampleTime: number }, staleAfterMs: number | undefined) {
  const [stale, setStale] = React.useState<{ at: number } | null>(null)
  React.useEffect(() => {
    if (staleAfterMs === undefined || !Number.isFinite(staleAfterMs)) return
    const check = () => {
      const is = engine.hasData() && now() - engine.receivedAt > staleAfterMs
      setStale((was) => (is ? (was && was.at === engine.sampleTime ? was : { at: engine.sampleTime }) : null))
    }
    const id = setInterval(check, 250)
    return () => clearInterval(id)
  }, [engine, staleAfterMs])
  return staleAfterMs !== undefined && Number.isFinite(staleAfterMs) ? stale : null
}

/**
 * A polite announcement when a limit is crossed, and when everything is back within limits; never per reading. At most one
 * every `everyMs`, except a step up to critical, which is said at once. A crossing held back is said when the wait is
 * over, if it still holds.
 */
class Announcer {
  private last = -Infinity
  private said = ""
  private pending = false
  /** `worst` is the worst tone now, `text` what to say about it. Returns the words to put in the live region, or null. */
  next(worst: MeterTone, prev: MeterTone, text: string, everyMs: number): string | null {
    const t = now()
    const changed = worst !== prev
    if (!changed && !this.pending) return null
    const urgent = worst === "danger" && prev !== "danger"
    if (!urgent && t - this.last < everyMs) {
      this.pending = true
      return null
    }
    this.pending = false
    // Nothing to say when it went back and forth while held: the last thing said still holds.
    if (!changed && text === this.said) return null
    this.last = t
    this.said = text
    return text
  }
}

const toneRank: Record<MeterTone, number> = { normal: 0, warning: 1, danger: 2 }
const worstOf = (...tones: MeterTone[]) => tones.reduce((a, b) => (toneRank[b] > toneRank[a] ? b : a), "normal")

/** The kit's status shapes for a tone: triangle warning, square danger (StatusGlyph), as limit marks on the drawings. */
function LimitMark({ x, y, kind, on, size = 8 }: { x: number; y: number; kind: "warning" | "danger"; on: boolean; size?: number }) {
  const h = size / 2
  return kind === "warning" ? (
    <path
      data-slot="attitude-limit-mark"
      data-on={on || undefined}
      d={`M${x} ${y - h}L${x + h} ${y + h}H${x - h}Z`}
      className={cn("fill-muted-foreground", on && "fill-warning")}
    />
  ) : (
    <rect
      data-slot="attitude-limit-mark"
      data-on={on || undefined}
      x={x - h}
      y={y - h}
      width={size}
      height={size}
      rx={1}
      className={cn("fill-muted-foreground", on && "fill-danger")}
    />
  )
}

/** A tone in words beside its shape, coloured only on those: Lucide's warning triangle and danger octagon, as joint-state. */
function ToneWord({ tone, children, className }: { tone: MeterTone; children: React.ReactNode; className?: string }) {
  if (tone === "normal") return null
  const Icon = tone === "danger" ? OctagonAlert : TriangleAlert
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-medium", tone === "danger" ? "text-danger" : "text-warning", className)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </span>
  )
}

// ---------- AttitudeIndicator ----------

/** A limit on roll or pitch, in degrees either side of level: warning from `warning`, danger from `critical`. */
export type AttitudeLimit = { warning?: number; critical?: number }

/** Roll and pitch limits, each the same either side: a tip-over warning at 25° roll is `{ roll: { warning: 25 } }`. */
export type AttitudeLimits = { roll?: AttitudeLimit; pitch?: AttitudeLimit }

/**
 * One reading, in degrees, with REP 103's signs: positive roll is the right side down, positive pitch the nose down.
 * `heading` is a compass heading, clockwise from north. A key left out keeps its last value; null makes it unknown.
 * `imuToAttitude` from `ros` gives one from a sensor_msgs/Imu.
 */
export type AttitudeSample = { roll?: number | null; pitch?: number | null; heading?: number | null }

/** What `ref` gives: push readings without a React render, and forget them. */
export type AttitudeHandle = {
  /** Adds a reading, timestamped in ms since the epoch (the message's stamp when there is one; now by default). */
  push: (sample: AttitudeSample, time?: number) => void
  /** Forgets the reading: every value unknown, waiting for data. */
  clear: () => void
}

/** What the indicator says about its data, as `data-state` on its root. */
export type AttitudeState = "waiting" | "live" | "stale"

export type AttitudeIndicatorLabels = {
  roll: string
  pitch: string
  heading: string
  /** A value in degrees, given already formatted: "12" → "12°". */
  degrees: (value: string) => string
  /** Roll with its side down: ("12°", "left") → "12° left". */
  directed: (value: string, direction: string) => string
  /** Which side is down. */
  left: string
  right: string
  noseUp: string
  noseDown: string
  /** The 8 compass points from north, clockwise: N, NE, E, SE, S, SW, W, NW. N, E, S and W are drawn on the ring. */
  compassPoints: readonly string[]
  /** A heading with its compass point: ("271°", "W") → "271° W". */
  headingText: (value: string, point: string) => string
  /** Past a `warning` limit. */
  overLimit: string
  /** Past a `critical` limit. */
  critical: string
  /** A value with the limit it is past, as screen readers hear it: ("27° right", "Over limit") → "27° right, over limit". */
  withState: (value: string, state: string) => string
  /** Said when everything is back within its limits. */
  withinLimits: string
  /** Where a value is unknown. */
  noValue: string
  waiting: string
  stale: string
  /** After "Stale": when the last reading was taken. */
  lastUpdate: (time: string) => string
  /** The values in one sentence, as screen readers hear the instrument: "Roll 12° left, pitch 3° nose down, heading 271° W". */
  summary: (parts: { roll?: string; pitch?: string; heading?: string }) => string
  /** A time of day, 24-hour with seconds by default; with `locale`, that locale's 24-hour time. */
  formatTime: (date: Date, locale?: string) => string
}

export const defaultAttitudeIndicatorLabels: AttitudeIndicatorLabels = {
  roll: "Roll",
  pitch: "Pitch",
  heading: "Heading",
  degrees: (v) => `${v}°`,
  directed: (v, d) => `${v} ${d}`,
  left: "left",
  right: "right",
  noseUp: "nose up",
  noseDown: "nose down",
  compassPoints: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  headingText: (v, p) => `${v} ${p}`,
  overLimit: "Over limit",
  critical: "Critical",
  withState: (v, s) => `${v}, ${s.toLowerCase()}`,
  withinLimits: "Roll and pitch within limits",
  noValue: "–",
  waiting: "Waiting for data",
  stale: "Stale",
  lastUpdate: (time) => `last update ${time}`,
  summary: ({ roll, pitch, heading }) => {
    const s = [roll && `roll ${roll}`, pitch && `pitch ${pitch}`, heading && `heading ${heading}`].filter(Boolean).join(", ")
    return s.charAt(0).toUpperCase() + s.slice(1)
  },
  formatTime: clockTime,
}

export type AttitudeIndicatorProps = {
  /** Degrees, REP 103: positive is the right side down. For a stream, push instead (`ref` or `subscribe`). */
  roll?: number
  /** Degrees, REP 103: positive is the nose down. */
  pitch?: number
  /** Compass heading in degrees, clockwise from north. Left out (and never pushed), the ring shows no compass. */
  heading?: number
  /** What the instrument shows, for screen readers: "Attitude, Patrol dog 7F3A". */
  label: string
  /** push and clear, called from anywhere without rendering. */
  ref?: React.Ref<AttitudeHandle>
  /**
   * Connects a source once: called with `push` when it mounts (and again if this function changes); return the function
   * that disconnects. Keep it stable (module level, or one the React Compiler memoises).
   * `(push) => ros.subscribe("/imu/data", "sensor_msgs/Imu", (m) => push(imuToAttitude(m), stampToMs(m.header?.stamp)))`.
   */
  subscribe?: (push: AttitudeHandle["push"]) => (() => void) | void
  /** Warning and critical limits for roll and pitch, either side of level. Marked on the drawing; past one, the value says so. */
  limits?: AttitudeLimits
  /** When the props' reading was taken (the message's stamp): a new stamp is an update, and it is the time Stale shows. */
  updatedAt?: number
  /** With no update for this long, the instrument dims and says Stale with the last update's time. Left out, never stale. */
  staleAfterMs?: number
  /** How often, at most, screen readers hear a limit crossed (a step up to critical is said at once). */
  announceEveryMs?: number
  /** md 192 px (the default) or lg 256 px. */
  size?: "md" | "lg"
  /** BCP 47 tag for numbers and times ("zh-TW"): pass the app's locale. Left out, English on the server and in every browser. */
  locale?: string
  labels?: Partial<AttitudeIndicatorLabels>
  className?: string
}

type AttitudeReading = { roll: number | undefined; pitch: number | undefined; heading: number | undefined }

const INSTRUMENT_PX = { md: 192, lg: 256 } as const
const ROLL_TICKS = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]
/** Rungs every 10°; only ±10 and ±20 carry a number, the ones read most. */
const LADDER = [-80, -70, -60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60, 70, 80]
const LADDER_LABELLED = new Set([-20, -10, 10, 20])
/** A bank tick this close to a limit gives the limit's mark its room. */
const TICK_CLEARANCE = 7

/**
 * The instrument's geometry in CSS pixels, from the outside in (md: c 96, R 66, ladder 42):
 * 8 px for the heading mark above the ring; the compass ring (ticks, then the letters inside them); the horizon disc,
 * whose outer 24 px hold the bank scale, its limit marks and pointer, and the robot's wings; and the ladder's disc inside
 * that, where the pitch rungs and their numbers live. `k` is px per degree of pitch, so the ±20° rungs and their numbers
 * fit inside the ladder's disc when level.
 */
function instrumentGeometry(size: keyof typeof INSTRUMENT_PX) {
  const px = INSTRUMENT_PX[size]
  const c = px / 2
  const ring = c - 8
  const R = c - 30
  const ladder = R - 24
  // The limit marks on the bank scale, about the kit's 12 px status glyph: big enough to read, placed on the disc's edge so a
  // warning and a critical limit 10° apart (the patrol dog's 25° and 35°) stay two shapes at md.
  const mark = size === "lg" ? 12 : 10
  return { px, c, ring, R, ladder, k: ladder / 32, mark }
}

const axisTone = (v: number | undefined, limit: AttitudeLimit | undefined): MeterTone =>
  v === undefined || !limit ? "normal" : meterTone(Math.abs(v), { low: limit.warning, critical: limit.critical, higherIsWorse: true })

const clampPitch = (p: number) => Math.min(90, Math.max(-90, p))
/** The point at `angle` degrees clockwise from the top, `r` from the centre. */
const polar = (angle: number, r: number) => ({ x: r * Math.sin((angle * Math.PI) / 180), y: -r * Math.cos((angle * Math.PI) / 180) })

/**
 * A robot's attitude now: roll and pitch on an artificial horizon, the heading on a compass ring, each also written in
 * degrees with its direction in words ("12° left", "3° nose down", "271° W"). Limits are marked on the drawing with the
 * kit's status shapes; past one, the value, the marks and the robot's symbol turn warning or danger and say so in a word.
 * Fed by props, or by `push` at 20 to 50 Hz without a React render per reading.
 */
export function AttitudeIndicator({
  roll,
  pitch,
  heading,
  label,
  ref,
  subscribe,
  limits,
  updatedAt,
  staleAfterMs,
  announceEveryMs = 5000,
  size = "md",
  locale,
  labels: labelsProp,
  className,
}: AttitudeIndicatorProps) {
  const l = { ...defaultAttitudeIndicatorLabels, ...labelsProp }
  const timeLocale = locale === undefined ? undefined : resolveLocale(locale)

  const [engine] = React.useState(() => new LiveReading<AttitudeReading>({ roll, pitch, heading }))
  const [announcer] = React.useState(() => new Announcer())
  // The numbers and words: rendered from the props, then from the engine at most four times a second.
  const [shown, setShown] = React.useState<AttitudeReading>({ roll, pitch, heading })
  const [announcement, setAnnouncement] = React.useState("")
  // A change of props shows at once, in the render that brings it.
  const propsKey = `${roll}|${pitch}|${heading}|${updatedAt}`
  const [propsBefore, setPropsBefore] = React.useState(propsKey)
  if (propsBefore !== propsKey) {
    setPropsBefore(propsKey)
    setShown((s) => ({ roll: roll ?? s.roll, pitch: pitch ?? s.pitch, heading: heading ?? s.heading }))
  }

  const rollTone = axisTone(shown.roll, limits?.roll)
  const pitchTone = axisTone(shown.pitch, limits?.pitch)
  const worst = worstOf(rollTone, pitchTone)

  // Each value as its number and its direction in words, shown apart ("12°" big, "left" beside it) and read together.
  const deg = (v: number) => l.degrees(formatReading(Math.abs(v), 0, locale))
  const rollParts = (v: number | undefined) =>
    v === undefined ? undefined : { number: deg(v), direction: Math.round(v) === 0 ? "" : v > 0 ? l.right : l.left }
  const pitchParts = (v: number | undefined) =>
    v === undefined ? undefined : { number: deg(v), direction: Math.round(v) === 0 ? "" : v > 0 ? l.noseDown : l.noseUp }
  const headingParts = (v: number | undefined) =>
    v === undefined ? undefined : { number: l.degrees(formatReading(normalizeHeading(v), 0, locale)), direction: l.compassPoints[compassPoint(v)] ?? "" }
  const joined = (p: { number: string; direction: string } | undefined, heading = false) =>
    p === undefined ? undefined : !p.direction ? p.number : heading ? l.headingText(p.number, p.direction) : l.directed(p.number, p.direction)
  const rollText = (v: number | undefined) => joined(rollParts(v))
  const pitchText = (v: number | undefined) => joined(pitchParts(v))
  const headingText = (v: number | undefined) => joined(headingParts(v), true)
  const toneWord = (t: MeterTone) => (t === "danger" ? l.critical : t === "warning" ? l.overLimit : "")
  const withTone = (text: string | undefined, t: MeterTone) => (text === undefined || t === "normal" ? text : l.withState(text, toneWord(t)))

  const summaryOf = (r: AttitudeReading) =>
    l.summary({
      roll: withTone(rollText(r.roll), axisTone(r.roll, limits?.roll)),
      pitch: withTone(pitchText(r.pitch), axisTone(r.pitch, limits?.pitch)),
      heading: headingText(r.heading),
    })

  // The engine's hooks into this render: what to draw, what a limit crossing is, and what to say about it.
  const svgRef = React.useRef<SVGSVGElement>(null)
  const compassG = React.useRef<SVGGElement>(null)
  React.useEffect(() => {
    const { k } = instrumentGeometry(size)
    const draw = (v: AttitudeReading) => {
      const svg = svgRef.current
      if (!svg) return
      const rollAt = `rotate(${-(v.roll ?? 0)})`
      const pitchAt = `translate(0 ${-clampPitch(v.pitch ?? 0) * k})`
      for (const g of svg.querySelectorAll("[data-slot=attitude-roll-layer]")) g.setAttribute("transform", rollAt)
      for (const g of svg.querySelectorAll("[data-slot=attitude-pitch-layer]")) g.setAttribute("transform", pitchAt)
      const c = compassG.current
      if (c) {
        c.setAttribute("transform", `rotate(${-(v.heading ?? 0)})`)
        // The letters turn back as the card turns, so they stay upright.
        for (const t of c.querySelectorAll("[data-slot=attitude-compass-point]"))
          t.setAttribute("transform", `rotate(${v.heading ?? 0} ${t.getAttribute("x")} ${t.getAttribute("y")})`)
        if (v.heading === undefined) c.setAttribute("visibility", "hidden")
        else c.removeAttribute("visibility")
      }
    }
    const key = (v: AttitudeReading) => `${axisTone(v.roll, limits?.roll)}|${axisTone(v.pitch, limits?.pitch)}`
    const publish = (v: AttitudeReading) => {
      setShown({ ...v })
      // What is past a limit when the data first arrives is shown, not announced: only a crossing is.
      if (shown.roll === undefined && shown.pitch === undefined) return
      const prev = worstOf(axisTone(shown.roll, limits?.roll), axisTone(shown.pitch, limits?.pitch))
      const next = worstOf(axisTone(v.roll, limits?.roll), axisTone(v.pitch, limits?.pitch))
      // Only the axes past a limit, in the summary's words: "Roll 27° right, over limit".
      const rollNow = axisTone(v.roll, limits?.roll)
      const pitchNow = axisTone(v.pitch, limits?.pitch)
      const crossed = l.summary({
        roll: rollNow === "normal" ? undefined : withTone(rollText(v.roll), rollNow),
        pitch: pitchNow === "normal" ? undefined : withTone(pitchText(v.pitch), pitchNow),
      })
      const said = announcer.next(next, prev, next === "normal" ? l.withinLimits : crossed, announceEveryMs)
      if (said !== null) setAnnouncement(said)
    }
    engine.connect({ draw, key, publish })
  })

  // One push for the instrument's life, the same on the handle and in `subscribe`.
  React.useImperativeHandle(ref, () => ({ push: engine.push, clear: engine.clear }))

  // Props are an update like a push, drawn and written at once.
  React.useEffect(() => {
    if (engine.push({ roll, pitch, heading }, updatedAt)) engine.flush()
  }, [engine, roll, pitch, heading, updatedAt])

  React.useEffect(() => {
    if (!subscribe) return
    const stop = subscribe(engine.push)
    return typeof stop === "function" ? stop : undefined
  }, [subscribe, engine])

  useReducedMotion(engine)
  React.useEffect(() => () => engine.dispose(), [engine])
  const stale = useStale(engine, staleAfterMs)

  const hasData = shown.roll !== undefined || shown.pitch !== undefined || shown.heading !== undefined
  const state: AttitudeState = stale ? "stale" : hasData ? "live" : "waiting"
  const staleText = stale ? `${l.stale}, ${l.lastUpdate(l.formatTime(new Date(stale.at), timeLocale))}` : ""

  // The drawing's geometry, in CSS pixels (the viewBox is the instrument's own size, so text is drawn at 12 px).
  const { px, c, ring, R, ladder, k, mark } = instrumentGeometry(size)
  const rollLimit = limits?.roll
  const pitchLimit = limits?.pitch
  const rollMarks = [rollLimit?.warning, rollLimit?.critical].filter((v) => v !== undefined)
  // The drawing's transforms come from the props only: a pushed reading is drawn by the engine, and React leaves an
  // attribute alone while the prop behind it does not change, so the two never fight.
  const headingShown = heading ?? shown.heading
  const cardinal = [0, 2, 4, 6].map((i) => l.compassPoints[i] ?? "")

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="attitude"
      data-state={state}
      data-tone={worst}
      className={cn("flex w-full flex-wrap items-center gap-6 text-sm", className)}
    >
      <span role="status" className="sr-only">
        {staleText}
      </span>
      <span data-slot="attitude-announcer" aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <div
        role="img"
        aria-label={hasData ? summaryOf(shown) : l.waiting}
        data-slot="attitude-instrument"
        className={cn("shrink-0", size === "lg" ? "size-64" : "size-48", stale && "opacity-50")}
      >
        <svg ref={svgRef} aria-hidden="true" viewBox={`${-c} ${-c} ${px} ${px}`} className="size-full">
          <Horizon R={R} ladder={ladder} k={k} roll={roll} pitch={pitch} rollTone={rollTone} pitchTone={pitchTone} pitchLimit={pitchLimit} locale={locale} />
          {/* The bank scale, fixed to the frame: the pointer on the horizon turns against it. Its limits are the kit's status
              shapes at the glyph's size (a triangle for warning, a square for critical), grey until the roll is past them;
              the ticks nearest a limit give it room. */}
          <g data-slot="attitude-roll-scale">
            {ROLL_TICKS.filter((a) => !rollMarks.some((m) => Math.abs(Math.abs(a) - m) < TICK_CLEARANCE)).map((a) => {
              const major = a % 30 === 0
              const p1 = polar(a, R)
              const p2 = polar(a, R - (major ? 10 : 6))
              return <line key={a} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth={2} className="stroke-muted-foreground" />
            })}
            {(
              [
                ["warning", rollLimit?.warning],
                ["danger", rollLimit?.critical],
              ] as const
            ).map(([kind, v]) =>
              v === undefined
                ? null
                : [-1, 1].map((s) => {
                    const p = polar(s * v, R - mark / 2 - 0.5)
                    const on = kind === "danger" ? rollTone === "danger" : rollTone !== "normal"
                    return <LimitMark key={`${kind}${s}`} x={p.x} y={p.y} kind={kind} on={on} size={mark} />
                  }),
            )}
          </g>
          {/* The robot, fixed: a centre dot and wings in the ring between the ladder and the disc's edge, so no rung or
              number ever runs under them. In the ink, in the tone's colour past a limit. */}
          <g
            data-slot="attitude-robot"
            className={cn("stroke-foreground", worst === "warning" && "stroke-warning", worst === "danger" && "stroke-danger")}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          >
            <path d={`M${-(R - 6)} 0H${-(ladder + 4)}M${ladder + 4} 0H${R - 6}`} />
            <circle r={2} />
          </g>
          <circle r={R} fill="none" strokeWidth={1} className="stroke-border" />
          {/* The compass ring: the card turns so the heading is under the mark above the ring; the letters sit inside the
              ticks and turn back to stay upright, and the mark never covers one. */}
          <circle r={ring} fill="none" strokeWidth={1} className="stroke-border" />
          <g
            ref={compassG}
            data-slot="attitude-compass"
            transform={`rotate(${-(heading ?? 0)})`}
            visibility={headingShown === undefined ? "hidden" : undefined}
          >
            {Array.from({ length: 36 }, (_, i) => i * 10).map((a) => {
              if (a % 90 === 0) return null
              const p1 = polar(a, ring - 1)
              const p2 = polar(a, ring - (a % 30 === 0 ? 9 : 5))
              return <line key={a} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth={a % 30 === 0 ? 2 : 1} className="stroke-muted-foreground" />
            })}
            {cardinal.map((name, i) => {
              const p = polar(i * 90, ring - 12)
              return (
                <text
                  key={i}
                  x={p.x}
                  y={p.y}
                  data-slot="attitude-compass-point"
                  transform={`rotate(${heading ?? 0} ${p.x} ${p.y})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn("text-xs", i === 0 ? "fill-foreground font-bold" : "fill-muted-foreground font-medium")}
                >
                  {name}
                </text>
              )
            })}
          </g>
          <path
            data-slot="attitude-lubber"
            d={`M0 ${-(ring + 1)}L5 ${-(c - 1)}H-5Z`}
            visibility={headingShown === undefined ? "hidden" : undefined}
            className="fill-foreground"
          />
        </svg>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <dl data-slot="attitude-readouts" className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2">
          <Readout name={l.roll} value={rollParts(shown.roll)} noValue={l.noValue} tone={rollTone} word={toneWord(rollTone)} stale={!!stale} slot="roll" />
          <Readout name={l.pitch} value={pitchParts(shown.pitch)} noValue={l.noValue} tone={pitchTone} word={toneWord(pitchTone)} stale={!!stale} slot="pitch" />
          {(heading !== undefined || shown.heading !== undefined || !hasData) && (
            <Readout name={l.heading} value={headingParts(shown.heading)} noValue={l.noValue} tone="normal" word="" stale={!!stale} slot="heading" />
          )}
        </dl>
        {(stale || !hasData) && (
          <p data-slot="attitude-status" aria-hidden="true" className="flex flex-wrap items-center gap-x-2 text-xs">
            {stale ? (
              <>
                <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
                <span className="font-medium text-warning">{l.stale}</span>
                <span className="text-muted-foreground tabular-nums">· {l.lastUpdate(l.formatTime(new Date(stale.at), timeLocale))}</span>
              </>
            ) : (
              <>
                <StatusGlyph status="offline" />
                <span className="text-muted-foreground">{l.waiting}</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The moving part, in two layers that turn and slide together: the ground and the horizon line on the whole disc, with the
 * bank pointer; and the pitch ladder with its limit lines on a smaller disc inside it, clear of the bank scale and the
 * robot's wings. Each layer is clipped in the frame's coordinates, outside its own transforms. A rung's number sits past
 * its right end, so it never lies on a line, and a pitch limit is a dashed rung.
 */
function Horizon({
  R,
  ladder,
  k,
  roll,
  pitch,
  rollTone,
  pitchTone,
  pitchLimit,
  locale,
}: {
  R: number
  ladder: number
  k: number
  roll: number | undefined
  pitch: number | undefined
  rollTone: MeterTone
  pitchTone: MeterTone
  pitchLimit: AttitudeLimit | undefined
  locale?: string
}) {
  // Ids that are safe inside url(#…): React's ids carry characters a CSS url reference would need escaped.
  const id = React.useId().replace(/[^\w-]/g, "")
  const disc = `attitude-disc-${id}`
  const inner = `attitude-ladder-${id}`
  const far = R * 6
  const rollAt = `rotate(${-(roll ?? 0)})`
  const pitchAt = `translate(0 ${-clampPitch(pitch ?? 0) * k})`
  const w = ladder * 0.2
  const limitsAt = [pitchLimit?.warning, pitchLimit?.critical]
  return (
    <>
      <defs>
        <clipPath id={disc}>
          <circle r={R} />
        </clipPath>
        <clipPath id={inner}>
          <circle r={ladder} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${disc})`}>
        <g data-slot="attitude-roll-layer" transform={rollAt}>
          <g data-slot="attitude-pitch-layer" transform={pitchAt}>
            {/* The sky is the card; the ground the quiet track grey. No gradients. */}
            <rect x={-far} y={0} width={far * 2} height={far} className="fill-track" />
            {/* The horizon: the one accent, the mark to read. */}
            <line data-slot="attitude-horizon" x1={-far} x2={far} y1={0} y2={0} strokeWidth={2} style={{ stroke: "var(--chart-1)" }} />
          </g>
          {/* The bank pointer turns with the horizon and points at the scale, inside the limit marks. */}
          <path
            data-slot="attitude-roll-pointer"
            d={`M0 ${-(R - 14)}L6 ${-(R - 22)}H-6Z`}
            className={cn("fill-foreground", rollTone === "warning" && "fill-warning", rollTone === "danger" && "fill-danger")}
          />
        </g>
      </g>
      <g clipPath={`url(#${inner})`}>
        <g data-slot="attitude-roll-layer" transform={rollAt}>
          <g data-slot="attitude-pitch-layer" transform={pitchAt}>
            {LADDER.map((p) => {
              const y = -p * k
              return (
                <g key={p} data-slot="attitude-rung">
                  {/* A limit draws its own dashed line here instead. */}
                  {!limitsAt.includes(Math.abs(p)) && <line x1={-w} x2={w} y1={y} y2={y} strokeWidth={1} className="stroke-muted-foreground" />}
                  {LADDER_LABELLED.has(p) && (
                    <text x={w + 4} y={y} textAnchor="start" dominantBaseline="central" className="fill-muted-foreground text-xs tabular-nums">
                      {formatReading(Math.abs(p), 0, locale)}
                    </text>
                  )}
                </g>
              )
            })}
            {/* Pitch limits: dashed rungs, as a chart draws its limits, in the tone's colour once crossed. No mark: on a
                ladder that slides, a shape at the rung's end is cut by the disc or crowds the centre; the readout says it. */}
            {(
              [
                ["warning", pitchLimit?.warning],
                ["danger", pitchLimit?.critical],
              ] as const
            ).map(([kind, v]) =>
              v === undefined
                ? null
                : [-1, 1].map((s) => {
                    const y = -s * v * k
                    const on = kind === "danger" ? pitchTone === "danger" : pitchTone !== "normal"
                    return (
                      <g key={`${kind}${s}`} data-slot="attitude-pitch-limit">
                        <line
                          x1={-w}
                          x2={w}
                          y1={y}
                          y2={y}
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          className={cn("stroke-muted-foreground", on && (kind === "danger" ? "stroke-danger" : "stroke-warning"))}
                        />
                      </g>
                    )
                  }),
            )}
          </g>
        </g>
      </g>
    </>
  )
}

function Readout({
  name,
  value,
  noValue,
  tone,
  word,
  stale,
  slot,
}: {
  name: string
  value: { number: string; direction: string } | undefined
  noValue: string
  tone: MeterTone
  word: string
  stale: boolean
  slot: string
}) {
  const number = value?.number ?? noValue
  const rest = value?.direction ?? ""
  return (
    <>
      <dt className="text-muted-foreground">{name}</dt>
      {/* The number and its direction stay on one line; the limit's word goes under them when the column is narrow. */}
      <dd data-slot={`attitude-${slot}`} data-tone={tone} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              stale ? "text-muted-foreground" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "",
            )}
          >
            {number}
          </span>
          {rest && <span className="text-muted-foreground">{rest}</span>}
        </span>
        <ToneWord tone={tone}>{word}</ToneWord>
      </dd>
    </>
  )
}

// ---------- Gauge ----------

/** What `ref` gives: push readings without a React render, and forget them. */
export type GaugeHandle = {
  /** Adds a reading (null: unknown), timestamped in ms since the epoch (the message's stamp; now by default). */
  push: (value: number | null, time?: number) => void
  clear: () => void
}

export type GaugeLabels = {
  /** A value with its unit, for screen readers: ("1.2", "m/s") → "1.2 m/s"; degrees take no space: "42°". */
  withUnit: (value: string, unit: string) => string
  /** Past `low` when higher is worse (a temperature, a current), shown beside the warning triangle. */
  high: string
  /** Past `low` when lower is worse (a battery, a pressure). */
  low: string
  /** Past `critical`. */
  critical: string
  /** Said when the value is back within its thresholds. */
  backToNormal: string
  /** A reading with a state, for screen readers: ("1.2 m/s", "Stale") → "1.2 m/s, stale". */
  withState: (value: string, state: string) => string
  noValue: string
  waiting: string
  stale: string
  lastUpdate: (time: string) => string
  formatTime: (date: Date, locale?: string) => string
}

export const defaultGaugeLabels: GaugeLabels = {
  withUnit: (v, unit) => (!unit ? v : unit === "°" ? `${v}°` : `${v} ${unit}`),
  high: "High",
  low: "Low",
  critical: "Critical",
  backToNormal: "back to normal",
  withState: (v, s) => `${v}, ${s.toLowerCase()}`,
  noValue: "–",
  waiting: "Waiting for data",
  stale: "Stale",
  lastUpdate: (time) => `last update ${time}`,
  formatTime: clockTime,
}

export type GaugeProps = {
  /** The value now. For a stream, push instead (`ref` or `subscribe`). */
  value?: number
  min?: number
  max: number
  /** Warning from here: below it, or at and above it when `higherIsWorse` (Meter's thresholds, Meter's words). */
  low?: number
  /** Danger from here. */
  critical?: number
  /** A value that is worse as it rises: a temperature, a current, a speed over a limit. */
  higherIsWorse?: boolean
  /** What is measured: "Speed", "Left motor temperature". Written under the dial, and read with the value. */
  label: string
  /** Written under the number and after it for screen readers: "m/s", "°C", "A". */
  unit?: string
  /** Decimals. Defaults to 1. */
  digits?: number
  /** sm 96 px, md 144 px (the default), lg 192 px. */
  size?: "sm" | "md" | "lg"
  ref?: React.Ref<GaugeHandle>
  /**
   * Connects a source once, as AttitudeIndicator's: `(push) => ros.subscribe("/odom", "nav_msgs/Odometry", (m) =>
   * push(odometryToSpeed(m), stampToMs(m.header?.stamp)))`. Keep it stable.
   */
  subscribe?: (push: GaugeHandle["push"]) => (() => void) | void
  updatedAt?: number
  /** With no update for this long the gauge dims and says Stale. Left out, never stale. */
  staleAfterMs?: number
  announceEveryMs?: number
  locale?: string
  labels?: Partial<GaugeLabels>
  className?: string
}

const GAUGE_PX = { sm: 96, md: 144, lg: 192 } as const
const GAUGE_NUMBER = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" } as const
const SWEEP = 270
const START = -135

type GaugeReading = { value: number | undefined }

/**
 * One value with a known range on a 270° dial: a robot's speed, a motor's temperature, a wheel's current. The arc is
 * graphite like Meter's bar and turns warning or danger only past `low` or `critical`, where a shape and a word say so too;
 * the value is always written in the middle with its unit, the range's ends at the arc's ends. role="meter".
 */
export function Gauge({
  value,
  min = 0,
  max,
  low,
  critical,
  higherIsWorse = false,
  label,
  unit = "",
  digits = 1,
  size = "md",
  ref,
  subscribe,
  updatedAt,
  staleAfterMs,
  announceEveryMs = 5000,
  locale,
  labels: labelsProp,
  className,
}: GaugeProps) {
  const l = { ...defaultGaugeLabels, ...labelsProp }
  const timeLocale = locale === undefined ? undefined : resolveLocale(locale)
  const u = unit.trim()

  const [engine] = React.useState(() => new LiveReading<GaugeReading>({ value }))
  // One push for the gauge's life, the same on the handle and in `subscribe`.
  const [gaugePush] = React.useState(() => (v: number | null, time?: number) => void engine.push({ value: v }, time))
  const [announcer] = React.useState(() => new Announcer())
  const [shown, setShown] = React.useState<number | undefined>(value)
  const [announcement, setAnnouncement] = React.useState("")
  const propsKey = `${value}|${updatedAt}`
  const [propsBefore, setPropsBefore] = React.useState(propsKey)
  if (propsBefore !== propsKey) {
    setPropsBefore(propsKey)
    if (value !== undefined) setShown(value)
  }

  const toneOf = (v: number | undefined): MeterTone => (v === undefined ? "normal" : meterTone(v, { low, critical, higherIsWorse }))
  const tone = toneOf(shown)
  const word = tone === "danger" ? l.critical : tone === "warning" ? (higherIsWorse ? l.high : l.low) : ""
  const fmt = (v: number) => formatReading(v, digits, locale)
  const said = (v: number) => {
    const t = toneOf(v)
    const lower = (s: string) => s.toLocaleLowerCase(timeLocale)
    return `${l.withUnit(fmt(v), u)}${meterSaid(t, higherIsWorse, { critical: lower(l.critical), high: lower(l.high), low: lower(l.low) })}`
  }

  // Geometry, in CSS pixels: an 8 px track (as Meter's bar) on a 270° arc open at the bottom, room outside it for the marks.
  const px = GAUGE_PX[size]
  const c = px / 2
  const r = c - 14
  const at = (f: number) => {
    const a = ((START + SWEEP * Math.min(1, Math.max(0, f))) * Math.PI) / 180
    return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) }
  }
  const s0 = at(0)
  const s1 = at(1)
  const arc = `M${s0.x} ${s0.y}A${r} ${r} 0 1 1 ${s1.x} ${s1.y}`
  const span = max - min || 1
  const frac = (v: number) => (v - min) / span
  const dash = (v: number | undefined) => (v === undefined ? "0 200" : `${Math.min(100, Math.max(0, frac(v) * 100))} 200`)

  const valueArc = React.useRef<SVGPathElement>(null)
  React.useEffect(() => {
    const draw = (v: GaugeReading) => {
      const el = valueArc.current
      if (!el) return
      el.setAttribute("stroke-dasharray", dash(v.value))
      if (v.value === undefined || frac(v.value) <= 0) el.setAttribute("visibility", "hidden")
      else el.removeAttribute("visibility")
    }
    const key = (v: GaugeReading) => toneOf(v.value)
    const publish = (v: GaugeReading) => {
      const prev = toneOf(shown)
      setShown(v.value)
      if (v.value === undefined || shown === undefined) return
      const next = toneOf(v.value)
      const text = next === "normal" ? l.withState(`${label} ${l.withUnit(fmt(v.value), u)}`, l.backToNormal) : `${label} ${said(v.value)}`
      const out = announcer.next(next, prev, text, announceEveryMs)
      if (out !== null) setAnnouncement(out)
    }
    engine.connect({ draw, key, publish })
  })

  React.useImperativeHandle(ref, () => ({ push: gaugePush, clear: engine.clear }))

  React.useEffect(() => {
    if (engine.push({ value }, updatedAt)) engine.flush()
  }, [engine, value, updatedAt])

  React.useEffect(() => {
    if (!subscribe) return
    const stop = subscribe(gaugePush)
    return typeof stop === "function" ? stop : undefined
  }, [subscribe, gaugePush])

  useReducedMotion(engine)
  React.useEffect(() => () => engine.dispose(), [engine])
  const stale = useStale(engine, staleAfterMs)

  // The arc comes from the prop only: a pushed reading is drawn by the engine (see AttitudeIndicator).
  const shownValue = value
  const marks = (
    [
      ["warning", low],
      ["danger", critical],
    ] as const
  ).filter(([, v]) => v !== undefined && v > min && v < max)
  const valueText = shown === undefined ? l.waiting : stale ? l.withState(said(shown), l.stale) : said(shown)

  return (
    <div data-slot="gauge" data-tone={tone} data-state={stale ? "stale" : shown === undefined ? "waiting" : "live"} className={cn("inline-flex w-fit flex-col items-center gap-1", className)}>
      <span data-slot="gauge-announcer" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <div
        role={shown === undefined ? "img" : "meter"}
        aria-label={shown === undefined ? `${label}, ${l.waiting}` : label}
        aria-valuenow={shown === undefined ? undefined : Number(shown.toFixed(Math.min(Math.max(0, digits), 6)))}
        aria-valuemin={shown === undefined ? undefined : min}
        aria-valuemax={shown === undefined ? undefined : max}
        aria-valuetext={shown === undefined ? undefined : valueText}
        className={cn("relative shrink-0", size === "sm" ? "size-24" : size === "lg" ? "size-48" : "size-36")}
      >
        <svg aria-hidden="true" viewBox={`0 0 ${px} ${px}`} className={cn("size-full", stale && "opacity-50")}>
          <path d={arc} fill="none" strokeWidth={8} strokeLinecap="round" className="stroke-track" />
          <path
            ref={valueArc}
            data-slot="gauge-value"
            d={arc}
            pathLength={100}
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={dash(shownValue)}
            visibility={shownValue === undefined || frac(shownValue) <= 0 ? "hidden" : undefined}
            className={cn("stroke-muted-foreground", tone === "warning" && "stroke-warning", tone === "danger" && "stroke-danger")}
          />
          {/* Thresholds: a 2 px gap in the card's colour across the track, and the kit's status shape outside it. */}
          {marks.map(([kind, v]) => {
            const f = frac(v!)
            const a = ((START + SWEEP * f) * Math.PI) / 180
            const p = (rr: number) => ({ x: c + rr * Math.sin(a), y: c - rr * Math.cos(a) })
            const g1 = p(r - 5)
            const g2 = p(r + 5)
            const m = p(r + 10)
            const on = kind === "danger" ? tone === "danger" : tone !== "normal"
            return (
              <g key={kind} data-slot="gauge-threshold">
                <line x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y} strokeWidth={2} className="stroke-card" />
                <LimitMark x={m.x} y={m.y} kind={kind} on={on} size={6} />
              </g>
            )
          })}
          <text x={s0.x} y={s0.y + 18} textAnchor="middle" className="fill-muted-foreground text-xs tabular-nums">
            {fmt(min)}
          </text>
          <text x={s1.x} y={s1.y + 18} textAnchor="middle" className="fill-muted-foreground text-xs tabular-nums">
            {fmt(max)}
          </text>
        </svg>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            data-slot="gauge-number"
            className={cn(
              GAUGE_NUMBER[size],
              "leading-none font-bold tabular-nums",
              stale ? "text-muted-foreground" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "",
            )}
          >
            {shown === undefined ? l.noValue : fmt(shown)}
          </span>
          {u && <span className="pt-1 text-xs text-muted-foreground">{u}</span>}
        </div>
      </div>
      <span data-slot="gauge-label" aria-hidden="true" className="max-w-full text-center text-muted-foreground">
        {label}
      </span>
      {/* One line kept for the word, so the page does not jump when a threshold is crossed. */}
      <span data-slot="gauge-state" aria-hidden="true" className="flex min-h-5 flex-wrap items-center justify-center gap-x-2 text-center text-xs">
        {stale ? (
          <>
            <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
            <span className="font-medium text-warning">{l.stale}</span>
            <span className="text-muted-foreground tabular-nums">{l.formatTime(new Date(stale.at), timeLocale)}</span>
          </>
        ) : shown === undefined ? (
          <span className="text-muted-foreground">{l.waiting}</span>
        ) : (
          <ToneWord tone={tone}>{word}</ToneWord>
        )}
      </span>
      {stale && (
        <span role="status" className="sr-only">
          {`${label}: ${l.stale}, ${l.lastUpdate(l.formatTime(new Date(stale.at), timeLocale))}`}
        </span>
      )}
    </div>
  )
}
