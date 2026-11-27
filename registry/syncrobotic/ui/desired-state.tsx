// @syncrobotic/desired-state v0.56.0 · update: npx shadcn add @syncrobotic/desired-state --overwrite
"use client"

import * as React from "react"
import { Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { formatAbsolute, formatRelative, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { FreshnessStamp, freshnessOf, type FreshnessStampLabels, type FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"

/**
 * Where an order stands: `pending` until the device reports it, `overdue` past `overdueAfterMs`, `blocked` when it
 * cannot arrive (check-ins refused, or the device stopped reporting), `in-effect` once reported.
 */
export type DesiredPhase = "pending" | "overdue" | "blocked" | "in-effect"

export type DesiredPhaseInput = {
  /** The device has reported the desired state. */
  inEffect?: boolean
  /** Why the order cannot arrive, when the product knows (Portal refuses this device's check-ins). */
  blocked?: boolean
  orderedAt?: DateInput | null
  /** Past this long since `orderedAt`, a wait is overdue. */
  overdueAfterMs?: number
  lastCheckInAt?: DateInput | null
  thresholds?: FreshnessThresholds
  /** The server's liveness verdict, as freshnessOf takes it. */
  offline?: boolean
  /** It never checks in: the order is applied by hand, so a silent device is not blocking it. */
  airGapped?: boolean
}

/** The phase of an order from what the server knows. A device past its stale threshold blocks it: the order travels on a check-in. */
export function desiredPhaseOf(input: DesiredPhaseInput, now: number): DesiredPhase {
  if (input.inEffect) return "in-effect"
  if (input.blocked) return "blocked"
  if (!input.airGapped && input.thresholds && freshnessOf(input.lastCheckInAt, input.thresholds, { now, offline: input.offline }) === "stale") return "blocked"
  const t = toTime(input.orderedAt)
  if (t !== null && input.overdueAfterMs !== undefined && now - t >= input.overdueAfterMs) return "overdue"
  return "pending"
}

export type DesiredStateLabels = {
  /** The heading per phase. */
  pending: string
  overdue: string
  blocked: string
  inEffect: string
  /** What happens next, per phase. */
  pendingBody: string
  pendingAirGappedBody: string
  overdueBody: string
  blockedBody: string
  inEffectBody: string
  /** Row names. */
  ordered: string
  believed: string
  lastCheckIn: string
  /** When it was ordered: relative, then exact. */
  since: (ago: string, absolute: string) => string
  freshness: Partial<FreshnessStampLabels>
}

export const defaultDesiredStateLabels: DesiredStateLabels = {
  pending: "Ordered, not yet in effect",
  overdue: "Not in effect yet, later than expected",
  blocked: "Cannot take effect yet",
  inEffect: "In effect",
  pendingBody: "It takes effect at the device's next check-in. Until the device reports it back, treat the earlier state as still in place.",
  pendingAirGappedBody: "It takes effect once the signed file is applied on the device; an air-gapped device does not check in to confirm it.",
  overdueBody: "The device has not confirmed it yet. Treat the earlier state as still in place, and check that the device is reaching the server.",
  blockedBody: "It travels on a check-in, and none is arriving. Until one does, the earlier state stays in place on the device.",
  inEffectBody: "The device has reported it.",
  ordered: "Ordered",
  believed: "Believed on the device",
  lastCheckIn: "Last check-in",
  since: (ago, absolute) => `${ago} (${absolute})`,
  freshness: {},
}

/**
 * An order that is not yet in effect: what was ordered beside what the device last reported (revoking is not revoked),
 * with when it takes effect. Optionally the last check-in. Quiet while it waits; colour only when it is overdue or cannot
 * arrive.
 */
export function DesiredState({
  desired,
  reported,
  inEffect,
  blocked,
  blockedReason,
  orderedAt,
  overdueAfterMs,
  lastCheckInAt,
  thresholds,
  offline,
  airGapped,
  now: nowProp,
  locale,
  timeZone,
  labels,
  headingAs: Heading = "h3",
  children,
  className,
}: DesiredPhaseInput & {
  /** What was ordered, in words ("Revoked: every module off"). */
  desired: React.ReactNode
  /** What the device last reported ("Running 4 modules"), shown as believed, never as fact. */
  reported: React.ReactNode
  /** The reason it cannot arrive, in place of `blockedBody` ("Check-ins are refused while the device is suspended."). */
  blockedReason?: React.ReactNode
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<DesiredStateLabels>
  /** The heading's level: h3 by default, h2 right under the page's h1, h4 under an h3. */
  headingAs?: "h2" | "h3" | "h4"
  /** Actions that end the wait some other way: cancel the order, or close it out by force. */
  children?: React.ReactNode
  className?: string
}) {
  const l = { ...defaultDesiredStateLabels, ...labels }
  const clock = useNow(nowProp === undefined ? 30_000 : null)
  const now = nowProp ?? clock
  const headingId = React.useId()
  const phase = now === null ? (inEffect ? "in-effect" : blocked ? "blocked" : "pending") : desiredPhaseOf({ inEffect, blocked, orderedAt, overdueAfterMs, lastCheckInAt, thresholds, offline, airGapped }, now)
  const loud = phase === "overdue" || phase === "blocked"
  const title = phase === "in-effect" ? l.inEffect : l[phase]
  const body =
    phase === "in-effect" ? l.inEffectBody : phase === "blocked" ? (blockedReason ?? l.blockedBody) : phase === "overdue" ? l.overdueBody : airGapped ? l.pendingAirGappedBody : l.pendingBody
  const since = now !== null && toTime(orderedAt) !== null ? l.since(formatRelative(orderedAt as DateInput, { now, locale, minUnit: "minute", future: "clamp" }), formatAbsolute(orderedAt as DateInput, { locale, timeZone })) : null
  return (
    <section
      data-slot="desired-state"
      data-phase={phase}
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border", className)}
    >
      <header className="flex flex-col gap-1">
        <Heading id={headingId} className={cn("flex items-center gap-2 text-sm font-medium", loud && "text-warning")}>
          {phase === "pending" ? (
            <Hourglass aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <StatusGlyph status={loud ? "warning" : "normal"} className="size-4" />
          )}
          {title}
        </Heading>
        <p className="text-sm text-muted-foreground">{body}</p>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-xs text-muted-foreground">{l.ordered}</dt>
          <dd className="text-sm font-medium">{desired}</dd>
          {since && <dd className="text-xs text-muted-foreground">{since}</dd>}
        </div>
        {phase !== "in-effect" && (
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{l.believed}</dt>
            <dd className="text-sm font-medium">{reported}</dd>
            {thresholds && !airGapped && (
              <dd className="text-xs">
                <span className="sr-only">{`${l.lastCheckIn}: `}</span>
                <FreshnessStamp lastAt={lastCheckInAt} thresholds={thresholds} offline={offline} now={now ?? undefined} locale={locale} timeZone={timeZone} labels={l.freshness} />
              </dd>
            )}
          </div>
        )}
      </dl>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </section>
  )
}
