// @syncrobotic/island v0.8.0 · update: npx shadcn add @syncrobotic/island --overwrite
"use client"

import * as React from "react"
import { Battery, BatteryCharging, Bell, ChevronDown, TriangleAlert, Wifi, WifiOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { StatusGlyph, toneSubtle, toneText, type Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { alarmPriority, defaultAlarmLabels, topAlarm, type AlarmData, type AlarmLabels } from "@/registry/syncrobotic/ui/alarm"

type Zone = "name" | "status" | "bell"

/** Screen-reader strings. Pass `labels` to localise. */
export type IslandLabels = {
  attention: string
  status: string
  notifications: (unread: number) => string
}

export const defaultIslandLabels: IslandLabels = {
  attention: "Another dog needs attention",
  status: "Device status",
  notifications: (unread) => `Notifications, ${unread} unread`,
}

type IslandProps = {
  name: string
  avatar?: React.ReactNode
  /** Shape at the avatar's corner: the dog's current state. */
  tone: Tone
  /** Another dog needs attention: a triangle after the name. Show it only for new issues. */
  attention?: boolean
  online?: boolean
  battery?: number
  charging?: boolean
  unread?: number
  /** Which zone is expanded. Each zone has its own panel. */
  open?: Zone | null
  onOpenChange?: (zone: Zone | null) => void
  /** Persistent state (offline, stopped): changes the tray edge colour. */
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
  tone,
  attention,
  online = true,
  battery = 72,
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
  const lastChildren = React.useRef<React.ReactNode>(children)
  if (children) lastChildren.current = children
  const slot = usePresence(!!children)
  const l = { ...defaultIslandLabels, ...labels }
  const toggle = (z: Zone) => onOpenChange?.(open === z ? null : z)
  const zone = (z: Zone) => cn("press flex h-(--h-md) items-center gap-2 rounded-md px-2", open === z && "bg-muted")
  const low = battery < 30
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
            {avatar ?? <span className="block size-8 rounded-full bg-muted" />}
            <StatusGlyph tone={tone} className="absolute -right-0.5 -bottom-0.5 rounded-full bg-float" />
          </span>
          <span className="truncate text-sm font-medium">{name}</span>
          {attention && <TriangleAlert aria-label={l.attention} className="size-4 shrink-0 text-warning" />}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-expanded={open === "status"}
          aria-label={low && !loading ? `${l.status}, battery ${battery}%` : l.status}
          onClick={() => toggle("status")}
          className={zone("status")}
        >
          {loading ? (
            <>
              <span className="block h-3 w-5 animate-breath rounded-xs bg-muted" />
              <span className="block h-3 w-6 animate-breath rounded-xs bg-muted" />
            </>
          ) : (
            <>
              {online ? <Wifi aria-hidden="true" className="size-4" /> : <WifiOff aria-hidden="true" className="size-4 text-muted-foreground" />}
              <BatteryIcon aria-hidden="true" className={cn("size-5", low && "text-warning")} />
              {low && <span className="text-xs font-medium text-warning">{battery}%</span>}
            </>
          )}
        </button>
        <button
          type="button"
          aria-expanded={open === "bell"}
          aria-label={l.notifications(unread)}
          onClick={() => toggle("bell")}
          className={cn(zone("bell"), "relative")}
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
          {children ?? lastChildren.current}
        </div>
      )}
    </Tray>
  )
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
    <div role="status" className={cn("flex min-h-(--h-row) animate-appear items-center gap-2 rounded-md px-2", tint)}>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-sm", toneText[tone])}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{title}</span>
        {meta && <span className="truncate text-xs text-muted-foreground">{meta}</span>}
      </span>
      {action && (
        <button type="button" onClick={action.onClick} className="press h-(--h-sm) shrink-0 rounded-xs bg-background/40 px-3 text-sm font-medium">
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
    </div>
  )
}

type IslandAlarmProps = {
  alarms: AlarmData[]
  onAcknowledge?: (id: string) => void
  /** Opens the full alarm list. Shown when more than one alarm is unacknowledged. */
  onShowAll?: () => void
  labels?: Partial<AlarmLabels> & { more?: (n: number) => string; moreAlarms?: string }
}

/**
 * The control app's alarm surface: the island shows the most urgent unacknowledged alarm, above any notice.
 * Same data as AlarmList, so the phone and the dashboard never disagree. Pair it with `edge={alarmEdge(topAlarm(alarms))}`.
 * Renders nothing when every alarm is acknowledged.
 */
export function IslandAlarm({ alarms, onAcknowledge, onShowAll, labels }: IslandAlarmProps) {
  const l = { ...defaultAlarmLabels, more: (n: number) => `+${n}`, moreAlarms: "more unacknowledged", ...labels }
  const current = topAlarm(alarms)
  // When the last alarm is acknowledged, it fades out where it was (disappear) rather than vanishing.
  const last = React.useRef(current)
  if (current) last.current = current
  const presence = usePresence(!!current)
  const top = current ?? last.current
  if (!presence.mounted || !top) return null
  const others = alarms.filter((a) => !a.acknowledged).length - 1
  const p = alarmPriority[top.priority]
  const Icon = p.icon
  return (
    <div
      role="group"
      aria-label={`${l[top.priority]}: ${top.title}`}
      key={top.id}
      aria-hidden={presence.leaving || undefined}
      onAnimationEnd={(e) => e.target === e.currentTarget && presence.done()}
      className={cn(
        "flex min-h-(--h-row) items-center gap-2 rounded-md px-2",
        presence.leaving ? "animate-disappear" : "animate-appear",
        top.priority === "critical" ? p.tint : "bg-muted",
      )}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center", p.text)}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">
          <span className={p.text}>{l[top.priority]}</span> · {top.title}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {[top.source, top.time, others > 0 && !onShowAll ? l.more(others) : null].filter(Boolean).join(" · ")}
        </span>
      </span>
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
          className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-foreground ring-inset"
        >
          {l.acknowledge}
        </button>
      )}
    </div>
  )
}
