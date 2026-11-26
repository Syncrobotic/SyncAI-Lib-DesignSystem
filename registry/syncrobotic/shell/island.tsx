// @syncrobotic/island v0.40.0 · update: npx shadcn add @syncrobotic/island --overwrite
"use client"

import * as React from "react"
import { Battery, BatteryCharging, Bell, ChevronDown, TriangleAlert, Wifi, WifiOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { StatusGlyph, toneSubtle, toneText, type Status, type Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { AlarmAnnouncer, alarmPriority, defaultAlarmLabels, sortAlarms, topAlarm, useAlarmSignals, type AlarmData, type AlarmLabels } from "@/registry/syncrobotic/ui/alarm"

type Zone = "name" | "status" | "bell"

/** Screen-reader strings. Pass `labels` to localise. */
export type IslandLabels = {
  attention: string
  status: string
  offline: string
  charging: string
  battery: (percent: number) => string
  /** No battery reading yet (or the robot does not report one). */
  batteryUnknown: string
  notifications: (unread: number) => string
}

export const defaultIslandLabels: IslandLabels = {
  attention: "Another dog needs attention",
  status: "Device status",
  offline: "offline",
  charging: "charging",
  battery: (n) => `battery ${n}%`,
  batteryUnknown: "battery unknown",
  notifications: (unread) => `Notifications, ${unread} unread`,
}

type IslandProps = {
  name: string
  avatar?: React.ReactNode
  /** Shape at the avatar's corner: the dog's current state. */
  status?: Status
  /** Another dog needs attention: a triangle after the name. Show it only for new issues. */
  attention?: boolean
  online?: boolean
  /** Percent. Leave it out until the robot reports one: the island says the level is unknown instead of inventing one. */
  battery?: number
  charging?: boolean
  unread?: number
  /** Which zone is expanded. Each zone has its own panel. */
  open?: Zone | null
  onOpenChange?: (zone: Zone | null) => void
  /** Persistent fault (stopped): changes the tray edge colour. Offline is neutral: say it, do not colour it. */
  edge?: Tone
  /** Status zone while the first status has not arrived. */
  loading?: boolean
  /** IslandNotice or a panel. */
  children?: React.ReactNode
  labels?: Partial<IslandLabels>
  className?: string
}

/**
 * Three zones — name, device status, notifications — each opens on its own.
 * Notices live inside the island as a child, assembled like the e-stop in the dock.
 */
export function Island({
  name,
  avatar,
  status = "offline",
  attention,
  online = true,
  battery,
  charging,
  unread = 0,
  open = null,
  onOpenChange,
  edge,
  loading,
  children,
  labels,
  className,
}: IslandProps) {
  // The last notice or panel stays in the slot while it leaves. It is state set during render, not a ref, so the React
  // Compiler can see the value the markup depends on.
  const [lastChildren, setLastChildren] = React.useState<React.ReactNode>(children)
  if (children && children !== lastChildren) setLastChildren(children)
  const slot = usePresence(!!children)
  const l = { ...defaultIslandLabels, ...labels }
  const toggle = (z: Zone) => onOpenChange?.(open === z ? null : z)
  const zone = (z: Zone) => cn("press flex h-(--h-md) items-center gap-2 rounded-md px-2", open === z && "bg-muted")
  // Warning below 15 %, the fleet-wide battery threshold (never danger: a low battery is not a fault).
  const known = battery !== undefined && Number.isFinite(battery)
  const low = known && battery < 15
  const BatteryIcon = charging ? BatteryCharging : Battery
  return (
    <Tray
      className={cn(
        "fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-10",
        edge === "danger" && "ring-danger",
        edge === "warning" && "ring-warning",
        className,
      )}
    >
      <div className="flex h-(--h-md) items-center gap-1">
        <button type="button" aria-expanded={open === "name"} onClick={() => toggle("name")} className={cn(zone("name"), "min-w-0 flex-1 text-left")}>
          <span className="relative shrink-0">
            {/* A robot is a thing, so its avatar is square (people are round), with initials rather than an empty shape. */}
            {avatar ?? (
              <Avatar shape="square" aria-hidden="true">
                <AvatarFallback>{initialsOf(name)}</AvatarFallback>
              </Avatar>
            )}
            <StatusGlyph status={status} className="absolute -right-0.5 -bottom-0.5 rounded-full bg-float" />
          </span>
          <span className="truncate text-sm font-medium">{name}</span>
          {attention && <TriangleAlert aria-label={l.attention} className="size-4 shrink-0 text-warning" />}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-expanded={open === "status"}
          // Every state the icons show is also said: offline and charging matter as much as a low battery.
          aria-label={loading ? l.status : [l.status, !online && l.offline, charging && l.charging, !known ? l.batteryUnknown : (low || charging) && l.battery(battery)].filter(Boolean).join(", ")}
          onClick={() => toggle("status")}
          className={zone("status")}
        >
          {loading ? (
            <>
              <span className="block h-3 w-5 animate-breath rounded-xs bg-track" />
              <span className="block h-3 w-6 animate-breath rounded-xs bg-track" />
            </>
          ) : (
            <>
              {online ? <Wifi aria-hidden="true" className="size-4" /> : <WifiOff aria-hidden="true" className="size-4 text-muted-foreground" />}
              <BatteryIcon aria-hidden="true" className={cn("size-5", low && "text-warning", !known && "text-muted-foreground")} />
              {low && <span className="text-xs font-medium text-warning">{battery}%</span>}
              {!known && <span className="text-xs text-muted-foreground tabular-nums">–%</span>}
            </>
          )}
        </button>
        <button
          type="button"
          aria-expanded={open === "bell"}
          aria-label={l.notifications(unread)}
          onClick={() => toggle("bell")}
          // As wide as it is tall: the bell alone was a 36 px target.
          className={cn(zone("bell"), "relative min-w-(--h-md) justify-center")}
        >
          <Bell aria-hidden="true" className="size-5" />
          {unread > 0 && <CountBadge count={unread} className="absolute top-0 right-0" />}
        </button>
      </div>
      {slot.mounted && (
        // A notice or panel leaves the way it came (disappear), instead of the tray snapping shut under it.
        <div
          aria-hidden={slot.leaving || undefined}
          className={slot.leaving ? "animate-disappear" : undefined}
          onAnimationEnd={(e) => e.target === e.currentTarget && slot.done()}
        >
          {children ?? lastChildren}
        </div>
      )}
    </Tray>
  )
}

/** Two letters for an avatar without a picture: the first letters of the first two words ("Patrol dog 7F3A" → "PD"). */
function initialsOf(name: string) {
  const [first = "", second] = name.trim().split(/\s+/)
  return (second ? first.slice(0, 1) + second.slice(0, 1) : first.slice(0, 2)).toUpperCase()
}

type NoticeProps = {
  tone: Tone
  icon: React.ElementType
  title: string
  meta?: string
  action?: { label: string; onClick: () => void }
  /** Offline, stopped: no close button, stays until the state changes. */
  persistent?: boolean
  /** Severe events and failures use a danger tint and do not auto-dismiss. */
  emphasis?: boolean
  onDismiss?: () => void
  dismissLabel?: string
}

/** A notice inside the island. Normal: 4 s. Reversible (has an undo action): 8 s. Failures: until handled. */

export function IslandNotice({ tone, icon: Icon, title, meta, action, persistent, emphasis, onDismiss, dismissLabel = "Dismiss" }: NoticeProps) {
  const tint = persistent || emphasis ? toneSubtle[tone] : "bg-muted"
  return (
    <div role="status" className={cn("flex min-h-(--h-row) animate-appear flex-wrap items-center gap-2 rounded-md px-2 py-2", tint)}>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-sm", toneText[tone])}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      {/* What happened is never cut: it wraps to a second line (clamped only past that), and when the buttons would
          squeeze it under 160 px they move to a row of their own instead. */}
      <span className="flex min-w-0 flex-1 basis-40 flex-col">
        <span className="line-clamp-2 text-sm font-medium break-words">{title}</span>
        {meta && <span className="line-clamp-2 text-xs text-muted-foreground break-words">{meta}</span>}
      </span>
      {(action || (!persistent && onDismiss)) && (
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              // Translucent over the alarm tint; in high contrast, where nothing is translucent, opaque with an edge.
              className="press h-(--h-sm) shrink-0 rounded-xs bg-background/40 px-3 text-sm font-medium in-data-[contrast=more]:bg-background in-data-[contrast=more]:ring-1 in-data-[contrast=more]:ring-input"
            >
              {action.label}
            </button>
          )}
          {!persistent && onDismiss && (
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={onDismiss}
              className="press flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </span>
      )}
    </div>
  )
}

type IslandAlarmProps = {
  alarms: AlarmData[]
  onAcknowledge?: (id: string) => void
  /** Opens the full alarm list. Shown when more than one alarm is unacknowledged. */
  onShowAll?: () => void
  labels?: Partial<AlarmLabels> & { more?: (n: number) => string; moreAlarms?: string; many?: (n: number) => string }
  /** Buzz and sound for a new critical or high alarm, and repeat critical until acknowledged. On by default: on a phone the island is the alarm surface. Turn off if an AlarmList on the same screen already signals. */
  feedback?: boolean
}

/**
 * The control app's alarm surface: the island shows the most urgent unacknowledged alarm, above any notice.
 * Same data as AlarmList, so the phone and the dashboard never disagree. Pair it with `edge={alarmEdge(topAlarm(alarms)) ?? stateEdge}`, so a persistent fault (stopped) keeps its edge when only a low alarm shows.
 * Renders nothing when every alarm is acknowledged.
 */
export function IslandAlarm({ alarms, onAcknowledge, onShowAll, labels, feedback = true }: IslandAlarmProps) {
  const l = { ...defaultAlarmLabels, more: (n: number) => `+${n}`, moreAlarms: "more unacknowledged", ...labels }
  // The same signals as AlarmList: touch, sound and screen-reader announcements, kept mounted even when nothing shows.
  const announce = useAlarmSignals(alarms, { feedback, labels })
  const current = topAlarm(alarms)
  // When the last alarm is acknowledged, it fades out where it was (disappear) rather than vanishing.
  const [last, setLast] = React.useState(current)
  if (current && current !== last) setLast(current)
  const presence = usePresence(!!current)
  const top = current ?? last
  if (!presence.mounted || !top) return <AlarmAnnouncer announce={announce} />
  // Counted from the live list, so shelved, suppressed and out-of-service alarms are not "more" the list will not show.
  const others = sortAlarms(alarms).filter((a) => !a.acknowledged).length - 1
  const p = alarmPriority[top.priority]
  const Icon = p.icon
  return (
    <>
      <AlarmAnnouncer announce={announce} />
      <div
        role="group"
      aria-label={`${l[top.priority]}: ${top.title}`}
      key={top.id}
      aria-hidden={presence.leaving || undefined}
      onAnimationEnd={(e) => e.target === e.currentTarget && presence.done()}
      className={cn(
        "flex min-h-(--h-row) flex-wrap items-center gap-2 rounded-md px-2 py-2",
        presence.leaving ? "animate-disappear" : "animate-appear",
        // Never tinted, as in AlarmList: the tray's edge, the glyph and the word carry the priority's colour.
        "bg-muted",
      )}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center", p.text)}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      {/* The alarm is never cut: two lines, and the buttons move to their own row before they squeeze it under 160 px. */}
      <span className="flex min-w-0 flex-1 basis-40 flex-col">
        <span className="line-clamp-2 text-sm font-bold break-words">
          <span className={cn("mr-2 font-medium", p.text)}>{l[top.priority]}</span>
          <span className="sr-only">: </span>
          {top.title}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {/* Time first, in tabular figures, as in AlarmList's rows. */}
          {top.time && <span className="font-mono tabular-nums">{top.time}</span>}
          {top.time && (top.source || (others > 0 && !onShowAll)) && " · "}
          {[top.source, others > 0 && !onShowAll ? l.more(others) : null].filter(Boolean).join(" · ")}
        </span>
      </span>
      {((others > 0 && onShowAll) || onAcknowledge) && (
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {others > 0 && onShowAll && (
            <button type="button" onClick={onShowAll} className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-border ring-inset">
              {l.more(others)}
              <span className="sr-only"> {l.moreAlarms}</span>
            </button>
          )}
          {onAcknowledge && (
            <button
              type="button"
              onClick={() => onAcknowledge(top.id)}
              // Light, as in AlarmList: the bold title and the edge already say it is waiting.
              className="press h-(--h-sm) shrink-0 rounded-xs bg-card px-3 text-sm font-medium ring-1 ring-input ring-inset hover:bg-accent"
            >
              {l.acknowledge}
            </button>
          )}
        </span>
      )}
      </div>
    </>
  )
}
