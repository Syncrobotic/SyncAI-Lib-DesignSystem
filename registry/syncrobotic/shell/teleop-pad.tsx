// @syncrobotic/teleop-pad v0.28.0 · update: npx shadcn add @syncrobotic/teleop-pad --overwrite
"use client"

import * as React from "react"
import { CircleAlert, CirclePause, Joystick, Lock, Move } from "lucide-react"
import { cn } from "@/lib/utils"
import { feedback } from "@/registry/syncrobotic/lib/feedback"

/**
 * One drive command. ROS REP 103 axes, so it maps straight onto a `geometry_msgs/Twist`: `linear` is forward (+) and
 * back (−), `angular` turns left (+, counter-clockwise) and right (−). Both are fractions of the robot's top speed,
 * −1…1, already scaled by `maxSpeed`; the app multiplies by the robot's real limits.
 */
export type TeleopCommand = { linear: number; angular: number }

/** Why driving stopped. Everything but `release` and `key` means the operator's input was lost, not ended. */
export type TeleopStopReason =
  | "release" //  the finger, mouse button or last drive key was let go
  | "key" //      Space or Escape
  | "cancel" //   the browser cancelled the pointer (a system gesture, a palm, a call coming in)
  | "blur" //     the pad or the window lost focus
  | "hidden" //   the page was hidden: another app, the screen locked, the tab switched
  | "timeout" //  no pointer event for `timeoutMs`
  | "disabled" // `disabled` turned on while driving
  | "unmount" //  the pad left the page while driving

const lost = new Set<TeleopStopReason>(["cancel", "blur", "hidden", "timeout"])

/** Every string the pad shows or reads out. Pass `labels` to localise. */
export type TeleopPadLabels = {
  /** The pad's accessible name. Name the robot when there is more than one: "Drive 7F3A". */
  name: string
  /** Read after the role name, instead of "application". */
  roleDescription: string
  /** First line of the description, and the status before the first drive. */
  hint: string
  release: string
  keys: string
  driving: string
  speedUnit: string
  stopped: string
  /** Stopped because input was lost (cancel, blur, hidden, timeout): the operator must lift and press again. */
  lost: string
  disabled: string
  /** Before the cap, e.g. "Speed limit 60 %". */
  limit: string
}

export const defaultTeleopPadLabels: TeleopPadLabels = {
  name: "Drive the robot",
  roleDescription: "drive pad",
  hint: "Hold to drive",
  release: "Release to stop",
  keys: "Arrow keys or W A S D drive while held. Space stops.",
  driving: "Driving",
  speedUnit: "m/s",
  stopped: "Stopped",
  lost: "Stopped: input lost. Hold again to drive",
  disabled: "Disabled",
  limit: "Speed limit",
}

const ZERO: TeleopCommand = { linear: 0, angular: 0 }
const round = (n: number) => Math.round(n * 1000) / 1000 || 0 // `|| 0` turns −0 into 0

/**
 * Stick position to command. `x` is right (+), `y` is down (+), both −1…1 of the stick's travel. Outside the unit circle
 * the vector is cut to it; inside `deadZone` it is zero; past it the magnitude ramps from 0 again, so the first
 * millimetre after the dead zone is a crawl, not a jump. Exported for tests and for apps that draw their own pad.
 */
export function shapeTeleopCommand(x: number, y: number, deadZone = 0.1, maxSpeed = 1): TeleopCommand {
  let m = Math.hypot(x, y)
  if (m > 1) {
    x /= m
    y /= m
    m = 1
  }
  const dz = Math.min(Math.max(deadZone, 0), 0.9)
  if (m <= dz || m === 0) return ZERO
  const k = (((m - dz) / (1 - dz)) / m) * Math.min(Math.max(maxSpeed, 0), 1)
  return { linear: round(-y * k), angular: round(-x * k) }
}

type Dir = "up" | "down" | "left" | "right"
// Arrow keys by name; W A S D by physical position (`code`), so they sit under the same fingers on any layout.
const byKey: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }
const byCode: Record<string, Dir> = { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right" }
const keyVector = (keys: Set<Dir>) => ({
  x: (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0),
  y: (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0),
})

type Status = "idle" | "driving" | "stopped" | "lost"

type Props = {
  /** Called at `rateHz` while the stick is held, the first time at the press, and once with zero at every stop. */
  onCommand: (command: TeleopCommand) => void
  /** Called once when driving ends, after the zero command, with why. */
  onStop?: (reason: TeleopStopReason) => void
  /** Fraction of the stick's travel that sends zero, so a resting thumb does not creep the robot. Default 0.1. */
  deadZone?: number
  /** Cap, 0…1: full stick sends this fraction of top speed. Below 1 the pad draws its scale and says the limit. */
  maxSpeed?: number
  /** Commands per second while held. Default 10. The robot should stop by itself when they stop arriving. */
  rateHz?: number
  /**
   * Stop when no pointer event arrives for this long, in ms. Default 2000. A held key is not timed: its release is
   * reliable. A mouse held perfectly still sends no events, so it trips this too ("input lost": press again).
   * `false` turns it off: only when the robot runs its own watchdog on the command stream (it stops when commands stop
   * arriving), which `rateHz` keeps fed while the stick is held.
   */
  timeoutMs?: number | false
  /** The robot's measured speed in m/s, shown while driving ("Driving · 0.4 m/s"). */
  speed?: number
  /** The robot cannot be driven by hand now. Say why in `disabledReason`. */
  disabled?: boolean
  /** Shown after "Disabled:", e.g. "robot in autonomous mode". */
  disabledReason?: string
  labels?: Partial<TeleopPadLabels>
  className?: string
}

/**
 * Manual driving for a mobile robot: a dead-man stick. The robot moves only while the operator holds it. Letting go,
 * a cancelled pointer, lost focus, a hidden page or `timeoutMs` without pointer events send a zero command at once and
 * call `onStop`. While held, commands go out at a fixed rate so the robot can run its own watchdog: if they stop
 * arriving (a frozen tab, a dropped link), the robot must stop by itself. This pad cannot do that for it.
 *
 * Not an emergency stop: put the kit's StopButton beside it.
 */
export function TeleopPad({
  onCommand,
  onStop,
  deadZone = 0.1,
  maxSpeed = 1,
  rateHz = 10,
  timeoutMs = 2000,
  speed,
  disabled = false,
  disabledReason,
  labels,
  className,
}: Props) {
  const l = { ...defaultTeleopPadLabels, ...labels }
  const descId = React.useId()
  const padRef = React.useRef<HTMLDivElement>(null)
  const knobRef = React.useRef<HTMLSpanElement>(null)

  const [status, setStatus] = React.useState<Status>("idle")
  const [knob, setKnob] = React.useState({ x: 0, y: 0 })

  // Everything the event handlers read lives in refs: pointer events arrive faster than renders, and a stop must never
  // act on a stale closure.
  const latest = React.useRef({ onCommand, onStop, deadZone, maxSpeed, rateHz, timeoutMs })
  React.useLayoutEffect(() => {
    latest.current = { onCommand, onStop, deadZone, maxSpeed, rateHz, timeoutMs }
  })
  const engaged = React.useRef<null | "pointer" | "keys">(null)
  const command = React.useRef<TeleopCommand>(ZERO)
  const pointer = React.useRef<{ id: number; x: number; y: number; travel: number } | null>(null)
  const keys = React.useRef(new Set<Dir>())
  // After Space, or after input was lost, held keys do nothing until every drive key is up: driving restarts only
  // from a fresh press, never from a key that was already down.
  const keysLatched = React.useRef(false)
  const tick = React.useRef<number | null>(null)
  const watchdog = React.useRef<number | null>(null)

  const clearTimers = () => {
    if (tick.current !== null) window.clearTimeout(tick.current)
    if (watchdog.current !== null) window.clearTimeout(watchdog.current)
    tick.current = watchdog.current = null
  }

  const stop = (reason: TeleopStopReason) => {
    if (!engaged.current) return
    const by = engaged.current
    engaged.current = null
    clearTimers()
    command.current = ZERO
    if (by === "pointer" && pointer.current) {
      try {
        padRef.current?.releasePointerCapture(pointer.current.id)
      } catch {
        // Already released.
      }
    }
    pointer.current = null
    if (by === "keys" && reason !== "release") keysLatched.current = true
    latest.current.onCommand(ZERO)
    latest.current.onStop?.(reason)
    if (reason === "unmount") return
    feedback("driveStop")
    setKnob({ x: 0, y: 0 })
    setStatus(reason === "disabled" ? "idle" : lost.has(reason) ? "lost" : "stopped")
  }
  // The listeners and timers below call the latest stop. It is swapped in after each commit, never during render.
  const stopRef = React.useRef(stop)
  React.useLayoutEffect(() => {
    stopRef.current = stop
  })

  // A fixed rate, by a self-scheduling timeout: each send queues the next, so a slow handler delays, never bunches.
  const send = () => {
    if (!engaged.current) return
    latest.current.onCommand(command.current)
    tick.current = window.setTimeout(send, 1000 / Math.max(1, latest.current.rateHz))
  }

  const armWatchdog = () => {
    if (watchdog.current !== null) window.clearTimeout(watchdog.current)
    const ms = latest.current.timeoutMs
    if (ms === false) return
    watchdog.current = window.setTimeout(() => stopRef.current("timeout"), ms)
  }

  const aim = (x: number, y: number) => {
    const m = Math.hypot(x, y)
    const v = m > 1 ? { x: x / m, y: y / m } : { x, y }
    command.current = shapeTeleopCommand(v.x, v.y, latest.current.deadZone, latest.current.maxSpeed)
    setKnob(v)
  }

  const start = (by: "pointer" | "keys") => {
    engaged.current = by
    setStatus("driving")
    feedback("driveStart")
    send()
  }

  // Focus, page and unmount: the ways input can vanish without an "up" event.
  React.useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") stopRef.current("hidden")
    }
    // Key-ups that happen in another window never arrive here, so forget every key.
    const onBlur = () => {
      stopRef.current("blur")
      keys.current.clear()
      keysLatched.current = false
    }
    const onPageHide = () => stopRef.current("hidden")
    document.addEventListener("visibilitychange", onHidden)
    window.addEventListener("blur", onBlur)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      document.removeEventListener("visibilitychange", onHidden)
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("pagehide", onPageHide)
      stopRef.current("unmount")
    }
  }, [])

  React.useEffect(() => {
    if (disabled) stopRef.current("disabled")
  }, [disabled])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || engaged.current || (e.pointerType === "mouse" && e.button !== 0)) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // No capture (an old browser, a synthetic event): pointerup on the pad and the watchdog still stop it.
    }
    const pad = e.currentTarget.clientWidth
    const knobSize = knobRef.current?.offsetWidth ?? 0
    // The stick starts where the finger lands, not at the pad's centre: pressing never moves the robot by itself.
    pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, travel: Math.max(1, (pad - knobSize) / 2) }
    command.current = ZERO
    start("pointer")
    armWatchdog()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointer.current
    if (engaged.current !== "pointer" || !p || e.pointerId !== p.id) return
    armWatchdog()
    aim((e.clientX - p.x) / p.travel, (e.clientY - p.y) / p.travel)
  }

  // Called from the handlers themselves, not curried in render, so building the markup never touches the refs.
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>, reason: TeleopStopReason) => {
    if (engaged.current === "pointer" && pointer.current?.id === e.pointerId) stop(reason)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === " " || e.key === "Escape") {
      e.preventDefault()
      if (engaged.current) stop("key")
      if (keys.current.size) keysLatched.current = true
      return
    }
    const dir = byKey[e.key] ?? byCode[e.code]
    if (!dir) return
    e.preventDefault() // arrows and Space would scroll the page
    keys.current.add(dir)
    if (disabled || keysLatched.current || engaged.current === "pointer") return
    const v = keyVector(keys.current)
    aim(v.x, v.y)
    if (!engaged.current) start("keys")
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dir = byKey[e.key] ?? byCode[e.code]
    if (!dir) return
    keys.current.delete(dir)
    if (keys.current.size === 0) {
      keysLatched.current = false
      if (engaged.current === "keys") stop("release")
      return
    }
    if (engaged.current === "keys") {
      const v = keyVector(keys.current)
      aim(v.x, v.y)
    }
  }

  const onBlur = () => {
    stop("blur")
    keys.current.clear()
    keysLatched.current = false
  }

  const driving = status === "driving"
  const capped = maxSpeed < 1
  const pct = (f: number) => `${Math.round(Math.max(0, f) * 100)} %`
  const limit = capped ? `${l.limit} ${pct(maxSpeed)}` : undefined
  const disabledText = disabledReason ? `${l.disabled}: ${disabledReason}` : l.disabled

  const word = disabled ? disabledText : driving ? l.driving : status === "stopped" ? l.stopped : status === "lost" ? l.lost : l.hint
  const Icon = disabled ? Lock : driving ? Move : status === "stopped" ? CirclePause : status === "lost" ? CircleAlert : Joystick
  const speedText =
    driving && !disabled && speed !== undefined
      ? `${speed.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${l.speedUnit}`
      : undefined

  // The pad is four stop-heights across (224 px, 256 in glove density) and the knob one: the knob is as big a target
  // as the stop, and its centre travels 1.5 stop-heights each way.
  const H = "var(--h-stop)"
  const at = (f: number) => `calc(50% + ${f} * 1.5 * ${H})`
  const ring = (f: number) => ({ inset: `calc(2 * ${H} - ${f} * 1.5 * ${H})` })

  return (
    <div data-slot="teleop-pad" className={cn("flex flex-col items-center gap-3", className)}>
      <div
        ref={padRef}
        role="application"
        aria-roledescription={l.roleDescription}
        aria-label={l.name}
        aria-describedby={descId}
        aria-disabled={disabled || undefined}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => onPointerEnd(e, "release")}
        onPointerCancel={(e) => onPointerEnd(e, "cancel")}
        onLostPointerCapture={(e) => onPointerEnd(e, "cancel")}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        data-state={disabled ? "disabled" : status}
        className={cn(
          "peer relative shrink-0 touch-none select-none rounded-full border border-input bg-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          disabled ? "cursor-not-allowed" : driving ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ width: `calc(4 * ${H})`, height: `calc(4 * ${H})` }}
      >
        {/* Guides: the axes, and where the stick's travel ends. */}
        <span aria-hidden="true" className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-border" />
        <span aria-hidden="true" className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-border" />
        <span aria-hidden="true" className="absolute rounded-full border border-border" style={ring(1)} />
        {capped && (
          <>
            <span aria-hidden="true" className="absolute rounded-full border border-dashed border-border" style={ring(0.5)} />
            {[1, 0.5].map((f) => (
              <span
                key={f}
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-muted px-1 text-xs tabular-nums text-muted-foreground"
                style={{ top: at(-f) }}
              >
                {pct(maxSpeed * f)}
              </span>
            ))}
          </>
        )}
        <span
          ref={knobRef}
          aria-hidden="true"
          className={cn(
            "absolute flex size-(--h-stop) -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-float",
            disabled
              ? "border-border bg-muted text-muted-foreground shadow-none"
              : driving
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-muted-foreground",
            // Springs back to the centre on release; follows the finger without lag while held. Reduced motion makes
            // the spring instant (the theme sets the motion tokens to 0).
            !driving && "transition-[left,top] duration-(--motion-fast) ease-(--ease-standard)",
          )}
          style={{ left: at(knob.x), top: at(knob.y) }}
        >
          {disabled ? <Lock className="size-5" strokeWidth={2} /> : <Joystick className="size-5" strokeWidth={2} />}
        </span>
      </div>

      {/* Disabled, it says why and nothing more: reading the drive keys of a pad that cannot drive only misleads. */}
      <span id={descId} className="sr-only">
        {disabled ? `${disabledText}.` : `${l.hint}. ${l.release}. ${l.keys}${limit ? ` ${limit}.` : ""}`}
      </span>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <p className={cn("flex items-center gap-2", driving && !disabled ? "text-foreground" : "text-muted-foreground")}>
          <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
          <span>
            <span role="status">{word}</span>
            {speedText && <span className="tabular-nums"> · {speedText}</span>}
          </span>
        </p>
        {limit && <p className="text-muted-foreground tabular-nums">{limit}</p>}
      </div>
      {/* The keys, for whoever arrived by keyboard: shown while the pad has keyboard focus. */}
      <p aria-hidden="true" className="hidden text-center text-xs text-muted-foreground peer-focus-visible:block">
        {l.keys}
      </p>
    </div>
  )
}
