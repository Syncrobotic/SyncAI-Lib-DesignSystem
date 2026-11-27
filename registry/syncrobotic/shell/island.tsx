// @syncrobotic/island v0.51.0 · update: npx shadcn add @syncrobotic/island --overwrite
"use client"

import * as React from "react"
import { Battery, BatteryCharging, Bell, Bluetooth, Check, ChevronDown, TriangleAlert, Wifi, WifiOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { StatusGlyph, toneSubtle, toneText, type Status, type Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { AlarmAnnouncer, alarmPriority, defaultAlarmLabels, sortAlarms, topAlarm, useAlarmSignals, type AlarmData, type AlarmLabels } from "@/registry/syncrobotic/ui/alarm"

/** The three zones of the island, each with its own panel: the robot, its device status, the notifications. */
export type IslandZone = "name" | "status" | "bell"
type Zone = IslandZone

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
  /** The open panels' names, read when one opens. */
  robotsPanel: string
  statusPanel: string
  notificationsPanel: string
}

export const defaultIslandLabels: IslandLabels = {
  attention: "Another dog needs attention",
  status: "Device status",
  offline: "offline",
  charging: "charging",
  battery: (n) => `battery ${n}%`,
  batteryUnknown: "battery unknown",
  notifications: (unread) => `Notifications, ${unread} unread`,
  robotsPanel: "Switch robot",
  statusPanel: "Device status",
  notificationsPanel: "Notifications",
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
  /** Which zone is expanded, controlled. Leave it out and the island keeps it itself (`defaultOpen`). */
  open?: Zone | null
  defaultOpen?: Zone | null
  onOpenChange?: (zone: Zone | null) => void
  /**
   * What each zone opens: IslandRobots under the name, IslandStatus under the device status, IslandNotifications under the
   * bell. The open zone's panel shows under any notice or alarm, which stay in view. Esc, or a tap outside the island,
   * closes it and focus goes back to the zone.
   */
  panels?: Partial<Record<Zone, React.ReactNode>>
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
  open: openProp,
  defaultOpen = null,
  onOpenChange,
  panels,
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
  const [openState, setOpenState] = React.useState<Zone | null>(defaultOpen)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = (z: Zone | null) => {
    if (openProp === undefined) setOpenState(z)
    onOpenChange?.(z)
  }
  const toggle = (z: Zone) => setOpen(open === z ? null : z)
  const id = React.useId()
  const tray = React.useRef<HTMLDivElement>(null)
  const panel = open ? panels?.[open] : undefined
  // The panel that is leaving keeps its content while it fades, as the notice slot does.
  const [lastPanel, setLastPanel] = React.useState<{ zone: Zone; node: React.ReactNode } | null>(null)
  if (open && panel && (lastPanel?.zone !== open || lastPanel.node !== panel)) setLastPanel({ zone: open, node: panel })
  const panelSlot = usePresence(!!panel)
  // A tap outside closes the open panel (Esc does too, below, and gives focus back to its zone).
  const closeOutside = React.useEffectEvent((target: Node) => {
    if (tray.current && !tray.current.contains(target)) setOpen(null)
  })
  const panelOpen = !!panel
  React.useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: PointerEvent) => closeOutside(e.target as Node)
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [panelOpen])
  const zone = (z: Zone) => cn("press flex h-(--h-md) items-center gap-2 rounded-md px-2", open === z && "bg-muted")
  // Warning below 15 %, the fleet-wide battery threshold (never danger: a low battery is not a fault).
  const known = battery !== undefined && Number.isFinite(battery)
  const low = known && battery < 15
  const BatteryIcon = charging ? BatteryCharging : Battery
  return (
    <Tray
      ref={tray}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open || !panels?.[open]) return
        e.stopPropagation()
        const zoneButton = tray.current?.querySelector<HTMLElement>(`[data-zone="${open}"]`)
        setOpen(null)
        zoneButton?.focus()
      }}
      data-slot="island"
      data-panel={panelSlot.mounted || undefined}
      className={cn(
        "fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-10",
        // Translucent over the map, but a panel is a column of text: opaque while one is open, so the page never shows
        // through its rows.
        "transition-colors duration-(--motion-base) ease-(--ease-standard) data-panel:bg-card",
        edge === "danger" && "ring-danger",
        edge === "warning" && "ring-warning",
        className,
      )}
    >
      <div className="flex h-(--h-md) items-center gap-1">
        <button
          type="button"
          data-zone="name"
          aria-expanded={open === "name"}
          aria-controls={panels?.name ? `${id}-name` : undefined}
          onClick={() => toggle("name")} className={cn(zone("name"), "min-w-0 flex-1 text-left")}>
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
          data-zone="status"
          aria-expanded={open === "status"}
          aria-controls={panels?.status ? `${id}-status` : undefined}
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
          data-zone="bell"
          aria-expanded={open === "bell"}
          aria-controls={panels?.bell ? `${id}-bell` : undefined}
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
      {panelSlot.mounted && lastPanel && (
        <div
          id={`${id}-${lastPanel.zone}`}
          role="region"
          aria-label={{ name: l.robotsPanel, status: l.statusPanel, bell: l.notificationsPanel }[lastPanel.zone]}
          aria-hidden={panelSlot.leaving || undefined}
          className={cn("max-h-96 overflow-y-auto overscroll-contain", panelSlot.leaving ? "animate-disappear" : "animate-appear")}
          onAnimationEnd={(e) => e.target === e.currentTarget && panelSlot.done()}
        >
          {panel ?? lastPanel.node}
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
 * The island's alarm surface: the most urgent unacknowledged alarm (same data as AlarmList), or nothing. Pair it with
 * `edge={alarmEdge(topAlarm(alarms)) ?? stateEdge}`, so a stopped robot keeps its edge when only a low alarm shows.
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

// ---------- The zones' panels ----------

/** One robot the person can switch to, for IslandRobots. */
export type IslandRobot = {
  id: string
  name: string
  /** Its state, by shape (and colour only when it needs someone). */
  status: Status
  /** The state in words ("Patrolling", "Needs attention"). */
  state: string
  /** Percent; leave it out when the robot has not reported one. */
  battery?: number
  /** It needs attention: a triangle after its name, as in the island. */
  attention?: boolean
}

export type IslandRobotsLabels = { current: string; attention: string; battery: (percent: number) => string }
const defaultIslandRobotsLabels: IslandRobotsLabels = { current: "current", attention: "needs attention", battery: (n) => `${n} %` }

/**
 * The name zone's panel: the robots this phone can control, to switch to another. The current one is ticked; one that
 * needs attention carries the island's triangle. A row is a button the height of a list row.
 */
export function IslandRobots({
  robots,
  current,
  onSelect,
  labels,
}: {
  robots: readonly IslandRobot[]
  /** The id of the robot the island shows now. */
  current?: string
  onSelect?: (id: string) => void
  labels?: Partial<IslandRobotsLabels>
}) {
  const l = { ...defaultIslandRobotsLabels, ...labels }
  return (
    <ul className="flex flex-col">
      {robots.map((r) => {
        const here = r.id === current
        const low = r.battery !== undefined && r.battery < 15
        return (
          <li key={r.id}>
            <button
              type="button"
              aria-current={here || undefined}
              onClick={() => onSelect?.(r.id)}
              className={cn("press flex min-h-(--h-row) w-full items-center gap-3 rounded-md px-2 text-left hover:bg-accent", here && "bg-muted")} // icon-gap-ok: the robot's avatar leads the row
            >
              <span className="relative shrink-0">
                <Avatar shape="square" aria-hidden="true">
                  <AvatarFallback>{initialsOf(r.name)}</AvatarFallback>
                </Avatar>
                <StatusGlyph status={r.status} className="absolute -right-0.5 -bottom-0.5 rounded-full bg-float" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  {r.attention && <TriangleAlert aria-label={l.attention} className="size-4 shrink-0 text-warning" />}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {r.state}
                  {r.battery !== undefined && (
                    <>
                      {" · "}
                      <span className={cn("tabular-nums", low && "text-warning")}>{l.battery(r.battery)}</span>
                    </>
                  )}
                </span>
              </span>
              {here && (
                <>
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sr-only">{l.current}</span>
                </>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export type IslandStatusLabels = {
  connection: string
  wifi: string
  bluetooth: string
  offline: string
  battery: string
  charging: string
  notCharging: string
  unknown: string
  updated: string
}
const defaultIslandStatusLabels: IslandStatusLabels = {
  connection: "Connection",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth only: emergency stop and status still work",
  offline: "Offline",
  battery: "Battery",
  charging: "Charging",
  notCharging: "Not charging",
  unknown: "Not reported yet",
  updated: "Last update",
}

/**
 * The device status zone's panel: how the phone reaches the robot, its battery (a Meter that warns below 15 % and never
 * turns danger) and when it last reported. Offline is said in words with its icon, never in colour.
 */
export function IslandStatus({
  link = "wifi",
  battery,
  charging,
  updated,
  labels,
}: {
  /** How the phone reaches the robot. */
  link?: "wifi" | "bluetooth" | "offline"
  battery?: number
  charging?: boolean
  /** When the robot last reported ("14:02:31", "2 min ago"). */
  updated?: string
  labels?: Partial<IslandStatusLabels>
}) {
  const l = { ...defaultIslandStatusLabels, ...labels }
  const LinkIcon = link === "wifi" ? Wifi : link === "bluetooth" ? Bluetooth : WifiOff
  const known = battery !== undefined && Number.isFinite(battery)
  const row = "flex min-h-(--h-md) items-center justify-between gap-3 px-2 text-sm"
  return (
    <div className="flex flex-col gap-1 py-1">
      <div className={row}>
        <span className="text-muted-foreground">{l.connection}</span>
        <span className={cn("flex min-w-0 items-center gap-2 text-right", link === "bluetooth" && "text-warning", link === "offline" && "text-muted-foreground")}>
          <LinkIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0">{link === "wifi" ? l.wifi : link === "bluetooth" ? l.bluetooth : l.offline}</span>
        </span>
      </div>
      <div className="flex flex-col gap-1 px-2 py-1">
        {known ? (
          <Meter value={battery} label={l.battery} low={15} />
        ) : (
          <div className="flex min-h-(--h-md) items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{l.battery}</span>
            <span className="text-muted-foreground">{l.unknown}</span>
          </div>
        )}
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {charging ? <BatteryCharging aria-hidden="true" className="size-4" /> : <Battery aria-hidden="true" className="size-4" />}
          {charging ? l.charging : l.notCharging}
        </span>
      </div>
      {updated && (
        <div className={row}>
          <span className="text-muted-foreground">{l.updated}</span>
          <span className="font-mono text-xs tabular-nums">{updated}</span>
        </div>
      )}
    </div>
  )
}

/** One notification, for IslandNotifications. */
export type IslandNotification = {
  id: string
  title: string
  meta?: string
  time?: string
  unread?: boolean
  /** Only for what needs someone: warning or danger. Everything else stays neutral. */
  tone?: Tone
  icon?: React.ElementType
}

export type IslandNotificationsLabels = { markAllRead: string; empty: string; unread: string }
const defaultIslandNotificationsLabels: IslandNotificationsLabels = { markAllRead: "Mark all read", empty: "No notifications", unread: "unread" }

/**
 * The bell zone's panel: the latest notifications, newest first, unread ones marked with a dot and in bold. A row opens
 * what it is about; "Mark all read" clears the bell's count. Alarms are not here: the most urgent one is in the island
 * itself, and the full list is AlarmList's.
 */
export function IslandNotifications({
  items,
  onOpen,
  onMarkAllRead,
  labels,
}: {
  items: readonly IslandNotification[]
  onOpen?: (id: string) => void
  onMarkAllRead?: () => void
  labels?: Partial<IslandNotificationsLabels>
}) {
  const l = { ...defaultIslandNotificationsLabels, ...labels }
  if (items.length === 0) return <p className="flex min-h-(--h-row) items-center justify-center text-sm text-muted-foreground">{l.empty}</p>
  return (
    <div className="flex flex-col">
      {onMarkAllRead && items.some((n) => n.unread) && (
        <button type="button" onClick={onMarkAllRead} className="press ml-auto h-(--h-sm) rounded-xs px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
          {l.markAllRead}
        </button>
      )}
      <ul className="flex flex-col">
        {items.map((n) => {
          const Icon = n.icon ?? Bell
          return (
            <li key={n.id}>
              <button type="button" onClick={() => onOpen?.(n.id)} className="press flex min-h-(--h-row) w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-accent" /* icon-gap-ok: a 32 px tile leads a two-line row */>
                <span className={cn("flex size-8 shrink-0 items-center justify-center", n.tone ? toneText[n.tone] : "text-muted-foreground")}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("line-clamp-2 text-sm break-words", n.unread ? "font-bold" : "font-medium")}>
                    {n.unread && <span className="sr-only">{l.unread}: </span>}
                    {n.title}
                  </span>
                  {(n.time || n.meta) && (
                    <span className="truncate text-xs text-muted-foreground">
                      {n.time && <span className="font-mono tabular-nums">{n.time}</span>}
                      {n.time && n.meta && " · "}
                      {n.meta}
                    </span>
                  )}
                </span>
                {n.unread && <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-foreground" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
