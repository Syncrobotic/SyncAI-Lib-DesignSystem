// @syncrobotic/joint-state v0.51.0 · update: npx shadcn add @syncrobotic/joint-state --overwrite
"use client"

import * as React from "react"
import { OctagonAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { RobotArm } from "@/registry/syncrobotic/ui/robot-icons"
import { formatClockTime } from "@/registry/syncrobotic/lib/clock-time"
import { numberFormat, resolveLocale } from "@/registry/syncrobotic/lib/format-number"

/** The SI unit ROS sends a joint in: radians for a revolute joint, metres for a prismatic one. */
export type JointUnit = "rad" | "m"

/**
 * One joint, as ROS describes it: the position, velocity and effort from `sensor_msgs/JointState`, and the limits from the
 * URDF's `<limit>`. Values are in SI units, as ROS sends them; the panel converts them for people.
 */
export type JointStateJoint = {
  /** The joint's name from the URDF: "shoulder_pan_joint". Also its key, so keep it unique. */
  name: string
  /** In radians (revolute) or metres (prismatic). */
  position: number
  /** "rad" for a revolute joint (shown in degrees), "m" for a prismatic one (shown in millimetres). Defaults to "rad". */
  unit?: JointUnit
  /** The URDF's lower limit, in the joint's unit. Without both limits (a continuous joint) there is no track. */
  lower?: number
  /** The URDF's upper limit, in the joint's unit. */
  upper?: number
  /** In rad/s or m/s. */
  velocity?: number
  /** In N·m (revolute) or N (prismatic). */
  effort?: number
  /** The URDF's effort limit, in the same unit as `effort`. With it, effort is shown as a percentage of the limit. */
  effortLimit?: number
}

/**
 * Where a joint is against its limits. `near` is inside the margin, `at` is on the limit (within 0.1 % of the range, since
 * a joint resting on a hard stop jitters around it), `beyond` is past it. `none` has no limits to be near.
 */
export type JointLimitLevel = "none" | "within" | "near" | "at" | "beyond"
export type JointLimitState = { level: JointLimitLevel; side?: "lower" | "upper" }

/** What the panel shows, as `data-state` on its root. */
export type JointStatePanelState = "loading" | "empty" | "live" | "stale"

export type JointStateLabels = {
  /** The panel's name when there is no `label`. */
  title: string
  /** Column headings on a wide panel; on a narrow one they are written before each value. */
  joint: string
  position: string
  velocity: string
  effort: string
  /** A revolute position, given already formatted: "42.0" → "42.0°". */
  degrees: (value: string) => string
  /** A prismatic position: "120.5" → "120.5 mm". */
  millimetres: (value: string) => string
  degreesPerSecond: (value: string) => string
  millimetresPerSecond: (value: string) => string
  /** Effort without an effort limit, revolute. */
  newtonMetres: (value: string) => string
  /** Effort without an effort limit, prismatic. */
  newtons: (value: string) => string
  /** Effort as a share of the effort limit: "34" → "34 %". */
  effortPercent: (value: string) => string
  /** The limits, read by screen readers (the track's end numbers are drawn for the eye). */
  range: (lower: string, upper: string) => string
  /** Written where the track would be for a joint without limits. */
  noLimits: string
  nearLower: string
  nearUpper: string
  atLower: string
  atUpper: string
  beyondLower: string
  beyondUpper: string
  stale: string
  /** After "Stale": when the last joint state arrived. */
  lastUpdate: (time: string) => string
  /** The time of the last update. 24-hour clock by default; with `locale`, that locale's 24-hour time. */
  formatTime: (date: Date, locale?: string) => string
  loading: string
  empty: string
  emptyHint: string
}

export const defaultJointStateLabels: JointStateLabels = {
  title: "Joint states",
  joint: "Joint",
  position: "Position",
  velocity: "Velocity",
  effort: "Effort",
  degrees: (v) => `${v}°`,
  millimetres: (v) => `${v} mm`,
  degreesPerSecond: (v) => `${v} °/s`,
  millimetresPerSecond: (v) => `${v} mm/s`,
  newtonMetres: (v) => `${v} N·m`,
  newtons: (v) => `${v} N`,
  effortPercent: (v) => `${v} %`,
  range: (lower, upper) => `range ${lower} to ${upper}`,
  noLimits: "No limits (continuous)",
  nearLower: "Near lower limit",
  nearUpper: "Near upper limit",
  atLower: "At lower limit",
  atUpper: "At upper limit",
  beyondLower: "Past lower limit",
  beyondUpper: "Past upper limit",
  stale: "Stale",
  lastUpdate: (time) => `last update ${time}`,
  formatTime: (d, locale) => formatClockTime(d, locale),
  loading: "Loading joint states…",
  empty: "No joint states yet",
  emptyHint: "Positions show here once the robot publishes them.",
}

/** A joint's value in the unit people read: degrees for radians, millimetres for metres. */
export function toDisplayUnit(value: number, unit: JointUnit = "rad"): number {
  return unit === "m" ? value * 1000 : (value * 180) / Math.PI
}

/**
 * Where `position` sits against `lower` and `upper` (all in the joint's own unit). `margin` is a fraction of the range:
 * 0.05 flags the outer 5 % at each end as near.
 */
export function classifyJointLimit(position: number, lower: number | undefined, upper: number | undefined, margin = 0.05): JointLimitState {
  // An infinite limit (how some URDF tools write a continuous joint) is no limit on that side, and the margin is a share of
  // a range that needs both, so the joint has no level rather than a range of Infinity that puts the marker nowhere.
  if (lower !== undefined && !Number.isFinite(lower)) lower = undefined
  if (upper !== undefined && !Number.isFinite(upper)) upper = undefined
  if (lower === undefined || upper === undefined || !(upper > lower) || !Number.isFinite(position)) return { level: "none" }
  const range = upper - lower
  // A joint on its hard stop reads a hair either side of the limit; within 0.1 % of the range it counts as on it.
  const tolerance = range * 0.001
  const near = range * Math.min(Math.max(margin, 0), 0.5)
  if (position < lower - tolerance) return { level: "beyond", side: "lower" }
  if (position > upper + tolerance) return { level: "beyond", side: "upper" }
  if (position <= lower + tolerance) return { level: "at", side: "lower" }
  if (position >= upper - tolerance) return { level: "at", side: "upper" }
  if (position < lower + near) return { level: "near", side: "lower" }
  if (position > upper - near) return { level: "near", side: "upper" }
  return { level: "within" }
}

// The formatter is cached per locale and precision (numberFormat): a panel redraws many times a second.
function formatJointNumber(value: number, digits: number, locale: string) {
  const f = numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  // Rounded first, half away from zero on both sides, so -0.05 and 0.05 round to the same size; and a reading of -0.04
  // shows as 0.0 rather than an alarming "-0.0". Math.round alone rounds -0.5 up to -0 but 0.5 up to 1.
  const step = 10 ** digits
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * step)) / step
  return f.format(rounded === 0 ? 0 : rounded)
}

/**
 * What counts as a new update without a stamp: the values themselves, not the array. A parent that builds `joints` afresh
 * on every render (a `.map` in its body) would otherwise look like an update every render and never go stale.
 */
const valuesKey = (joints: JointStateJoint[]) => joints.map((j) => `${j.name}:${j.position}:${j.velocity}:${j.effort}`).join("|")

export type JointStateProps = {
  /** The joints, in the order to list them (usually the URDF's chain order). Leave it empty while there are none. */
  joints: JointStateJoint[]
  /** The arm's name, written above the list and naming the panel for screen readers: "Arm 2 · UR10e". */
  label?: string
  /** Waiting for the first joint state: a skeleton the size of the list. */
  loading?: boolean
  /**
   * When this joint state was measured, in ms since the epoch (the message's `header.stamp`). Given, only a new value is an
   * update (a re-sent old message is not), and it is the time "Stale · last update" shows. Without it, a change in any
   * joint's position, velocity or effort is an update (a new array with the same values is not), so an arm standing
   * perfectly still reads Stale after `staleAfterMs`: pass the stamp to tell a quiet arm from a silent one. Either way the
   * wait is timed by this browser's clock.
   */
  updatedAt?: number
  /**
   * With no update for this long, the panel says "Stale" with the last update's time and dims the values. 1000 ms by
   * default: joint states come at 50 Hz or more (ros2_control's joint_state_broadcaster), so a second is 50 missed
   * messages. `null` never goes stale.
   */
  staleAfterMs?: number | null
  /** How close to a limit counts as near, as a fraction of each joint's range. */
  margin?: number
  /**
   * BCP 47 tag for the numbers and the time ("zh-TW", "de"): pass the app's locale. Left out, numbers are written in English
   * ("en") and the time on a 24-hour clock, the same on the server and in every browser, so the page hydrates cleanly. A
   * tag Intl cannot read falls back to "en".
   */
  locale?: string
  labels?: Partial<JointStateLabels>
  className?: string
}

type Columns = "both" | "velocity" | "effort" | "none"
// Written out in full so Tailwind sees each class. The name, track and position always; velocity and effort when any joint has them.
const wideGrid: Record<Columns, string> = {
  both: "@xl:grid-cols-[minmax(7rem,11rem)_minmax(6rem,1fr)_5.5rem_6.5rem_5rem]",
  velocity: "@xl:grid-cols-[minmax(7rem,11rem)_minmax(6rem,1fr)_5.5rem_6.5rem]",
  effort: "@xl:grid-cols-[minmax(7rem,11rem)_minmax(6rem,1fr)_5.5rem_5rem]",
  none: "@xl:grid-cols-[minmax(7rem,11rem)_minmax(6rem,1fr)_5.5rem]",
}

/**
 * A robot arm's joints, for watching rather than driving: each position against its limits, with velocity and effort.
 * Near or past a limit it says so in words beside a warning or danger shape; when updates stop it says "Stale".
 */
export function JointState({
  joints,
  label,
  loading = false,
  updatedAt,
  staleAfterMs = 1000,
  margin = 0.05,
  locale,
  labels: labelsProp,
  className,
}: JointStateProps) {
  const l = { ...defaultJointStateLabels, ...labelsProp }
  const name = label ?? l.title
  const numberLocale = resolveLocale(locale)
  // The time keeps its own default (a fixed 24-hour clock) without a locale, and gets only a tag Intl can read with one.
  const timeLocale = locale === undefined ? undefined : numberLocale

  // Which update went stale, and the time to show for it. Stale only while that same update is still the latest, so a new
  // update clears it in the render that brings it, without an effect setting state back.
  // With a stamp, only a new stamp is an update, so a bridge re-sending the robot's last message still reads Stale. Without
  // one, new values are an update, compared as a string so a rebuilt array with the same values is the same update.
  const update: number | string = updatedAt ?? valuesKey(joints)
  const [staleOf, setStaleOf] = React.useState<{ update: number | string; at: number } | null>(null)
  const watching = !loading && joints.length > 0
  React.useEffect(() => {
    // setTimeout reads Infinity (and NaN) as 0, which would make "never stale" stale at once; it waits for nothing instead.
    if (!watching || staleAfterMs === null || !Number.isFinite(staleAfterMs)) return
    // The wait counts from when this browser received the update, never from the robot's stamp: the two clocks are rarely
    // in step, and a robot a few seconds ahead would otherwise never look stale, one behind always would.
    const received = Date.now()
    const timer = setTimeout(() => setStaleOf({ update, at: typeof update === "number" ? update : received }), staleAfterMs)
    return () => clearTimeout(timer)
  }, [watching, update, staleAfterMs])
  const stale = watching && staleOf !== null && staleOf.update === update

  const state: JointStatePanelState = loading ? "loading" : joints.length === 0 ? "empty" : stale ? "stale" : "live"
  const lastTime = stale && staleOf ? l.formatTime(new Date(staleOf.at), timeLocale) : ""

  const hasVelocity = joints.some((j) => j.velocity !== undefined && Number.isFinite(j.velocity))
  const hasEffort = joints.some((j) => j.effort !== undefined && Number.isFinite(j.effort))
  const columns: Columns = hasVelocity && hasEffort ? "both" : hasVelocity ? "velocity" : hasEffort ? "effort" : "none"
  const grid = cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1", wideGrid[columns])

  const position = (value: number, unit: JointUnit) => {
    const text = formatJointNumber(toDisplayUnit(value, unit), 1, numberLocale)
    return unit === "m" ? l.millimetres(text) : l.degrees(text)
  }

  return (
    <div
      data-slot="joint-state"
      data-state={state}
      role="region"
      aria-label={name}
      aria-busy={loading || undefined}
      className={cn("@container flex flex-col gap-2 text-sm", className)}
    >
      {/* Spoken when updates stop, and emptied when they resume, so a live panel publishing at 10 Hz says nothing. */}
      <span role="status" className="sr-only">
        {stale ? `${l.stale}, ${l.lastUpdate(lastTime)}` : ""}
      </span>

      <div data-slot="joint-state-header" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 font-medium">{name}</p>
        {stale && (
          <p data-slot="joint-state-stale" className="flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="size-4 self-center text-warning" />
            <span className="font-medium text-warning">{l.stale}</span>
            <span className="text-muted-foreground tabular-nums">· {l.lastUpdate(lastTime)}</span>
          </p>
        )}
      </div>

      {state === "loading" ? (
        <div className="flex flex-col gap-3">
          <LoadingLine>{l.loading}</LoadingLine>
          {/* Six rows, the joints of a common arm, so the panel keeps its height when the first joint state arrives. */}
          <div aria-hidden="true" className="flex flex-col divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={cn(grid, "py-2")}>
                <Bone className="h-4 w-24" />
                <Bone className="h-4 w-14 justify-self-end @xl:col-start-3 @xl:row-start-1" />
                <Bone className="col-span-2 h-1 rounded-full @xl:col-span-1 @xl:col-start-2 @xl:row-start-1 @xl:self-center" />
              </div>
            ))}
          </div>
        </div>
      ) : state === "empty" ? (
        <EmptyState icon={RobotArm} title={l.empty} description={l.emptyHint} />
      ) : (
        <div>
          {/* Column headings for the eye on a wide panel; each value carries its own name for screen readers and narrow panels. */}
          <div aria-hidden="true" className={cn(grid, "hidden border-b border-border pb-1 text-xs text-muted-foreground @xl:grid")}>
            <span>{l.joint}</span>
            <span />
            <span className="text-right">{l.position}</span>
            {hasVelocity && <span className="text-right">{l.velocity}</span>}
            {hasEffort && <span className="text-right">{l.effort}</span>}
          </div>
          <ul role="list" data-slot="joint-state-list" className="flex flex-col divide-y divide-border">
            {joints.map((joint) => (
              <JointRow
                key={joint.name}
                joint={joint}
                grid={grid}
                stale={stale}
                margin={margin}
                locale={numberLocale}
                labels={l}
                position={position}
                hasVelocity={hasVelocity}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function JointRow({
  joint,
  grid,
  stale,
  margin,
  locale,
  labels: l,
  position,
  hasVelocity,
}: {
  joint: JointStateJoint
  grid: string
  stale: boolean
  margin: number
  locale: string
  labels: JointStateLabels
  position: (value: number, unit: JointUnit) => string
  hasVelocity: boolean
}) {
  const unit = joint.unit ?? "rad"
  const limit = classifyJointLimit(joint.position, joint.lower, joint.upper, margin)
  const hasLimits = limit.level !== "none"
  const serious = limit.level === "at" || limit.level === "beyond"
  const words =
    limit.level === "near"
      ? limit.side === "lower"
        ? l.nearLower
        : l.nearUpper
      : limit.level === "at"
        ? limit.side === "lower"
          ? l.atLower
          : l.atUpper
        : limit.level === "beyond"
          ? limit.side === "lower"
            ? l.beyondLower
            : l.beyondUpper
          : null

  // The marker sits on the track even past a limit, pinned to the end it went past; the words say how far.
  const pct =
    hasLimits && joint.lower !== undefined && joint.upper !== undefined
      ? Math.min(100, Math.max(0, ((joint.position - joint.lower) / (joint.upper - joint.lower)) * 100))
      : 0
  const edge = Math.min(Math.max(margin, 0), 0.5) * 100
  const values = stale ? "text-muted-foreground" : "text-foreground"

  const velocity =
    joint.velocity !== undefined && Number.isFinite(joint.velocity)
      ? (unit === "m" ? l.millimetresPerSecond : l.degreesPerSecond)(formatJointNumber(toDisplayUnit(joint.velocity, unit), 1, locale))
      : null
  const effort =
    joint.effort !== undefined && Number.isFinite(joint.effort)
      ? joint.effortLimit !== undefined && joint.effortLimit > 0
        ? l.effortPercent(formatJointNumber((Math.abs(joint.effort) / joint.effortLimit) * 100, 0, locale))
        : (unit === "m" ? l.newtons : l.newtonMetres)(formatJointNumber(joint.effort, 1, locale))
      : null

  return (
    <li
      data-slot="joint-state-row"
      data-limit={limit.level}
      data-side={limit.side}
      className={cn(grid, "items-center py-2")}
    >
      <div className="min-w-0">
        <p className="font-medium wrap-anywhere">{joint.name}</p>
        {words && (
          <p className={cn("flex items-center gap-2 text-xs font-medium", serious ? "text-danger" : "text-warning")}>
            {serious ? <OctagonAlert aria-hidden="true" className="size-4 shrink-0" /> : <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />}
            {words}
          </p>
        )}
      </div>

      <p className={cn("justify-self-end text-right font-medium tabular-nums @xl:col-start-3 @xl:row-start-1", values)}>
        <span className="sr-only">{l.position} </span>
        {position(joint.position, unit)}
      </p>

      <div className="col-span-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground tabular-nums @xl:col-span-1 @xl:col-start-2 @xl:row-start-1">
        {hasLimits && joint.lower !== undefined && joint.upper !== undefined ? (
          <>
            <span className="sr-only">{l.range(position(joint.lower, unit), position(joint.upper, unit))}</span>
            <span aria-hidden="true" className="shrink-0">
              {position(joint.lower, unit)}
            </span>
            <span aria-hidden="true" data-slot="joint-state-track" className="relative h-3 min-w-12 flex-1">
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-track" />
              {/* Quiet ticks where "near" begins at each end, so a marker drifting toward a limit can be seen coming. */}
              {edge > 0 && (
                <>
                  <span className="absolute inset-y-0.5 w-px bg-input" style={{ left: `${edge}%` }} />
                  <span className="absolute inset-y-0.5 w-px bg-input" style={{ left: `${100 - edge}%` }} />
                </>
              )}
              <span
                data-slot="joint-state-marker"
                className={cn(
                  "absolute inset-y-0 w-0.5 -translate-x-1/2",
                  stale ? "bg-muted-foreground" : serious ? "bg-danger" : limit.level === "near" ? "bg-warning" : "bg-foreground",
                )}
                style={{ left: `${pct}%` }}
              />
            </span>
            <span aria-hidden="true" className="shrink-0">
              {position(joint.upper, unit)}
            </span>
          </>
        ) : (
          <span>{l.noLimits}</span>
        )}
      </div>

      {(velocity !== null || effort !== null) && (
        <p className={cn("col-span-2 flex justify-end gap-x-3 text-xs tabular-nums @xl:contents @xl:text-sm", values)}>
          {velocity !== null && (
            <span className="text-right @xl:col-start-4 @xl:row-start-1">
              <span className="text-muted-foreground @xl:sr-only">{l.velocity} </span>
              {velocity}
            </span>
          )}
          {effort !== null && (
            <span className={cn("text-right @xl:row-start-1", hasVelocity ? "@xl:col-start-5" : "@xl:col-start-4")}>
              <span className="text-muted-foreground @xl:sr-only">{l.effort} </span>
              {effort}
            </span>
          )}
        </p>
      )}
    </li>
  )
}
