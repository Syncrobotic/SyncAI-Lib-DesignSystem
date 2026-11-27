// @syncrobotic/notification-center v0.51.0 · update: npx shadcn add @syncrobotic/notification-center --overwrite
"use client"

import * as React from "react"
import { Bell, Check, CheckCheck, CircleAlert, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

/**
 * Something that happened which a person may want to look at later: a mission finished, a report is ready, firmware was
 * installed. Not an alarm: an abnormal condition that needs an operator action is an Alarm (AlarmList, the island), and
 * never lands only here.
 */
export type FleetNotification = {
  id: string
  /** What happened, as a sentence: "Night patrol B finished: 6 of 6 checkpoints". */
  title: string
  /** The robot it is about, when there is one. */
  robot?: string
  site: string
  /** ISO 8601. */
  at: string
  /** The thing it is about: the mission, the report, the robot. */
  href: string
  read: boolean
}

/** The clock the sample is written against, so its days group the same on every machine. */
export const sampleNow = new Date("2026-11-20T15:30:00+08:00")

export const sampleNotifications: FleetNotification[] = [
  {
    id: "n1",
    title: "Night patrol B finished: 6 of 6 checkpoints",
    robot: "Patrol dog 7F3A",
    site: "Taoyuan plant",
    at: "2026-11-20T14:58:00+08:00",
    href: "#missions/night-patrol-b",
    read: false,
  },
  {
    id: "n2",
    title: "Weekly patrol report is ready",
    site: "Taipei HQ",
    at: "2026-11-20T09:00:00+08:00",
    href: "#reports/week-47",
    read: false,
  },
  {
    id: "n3",
    title: "Firmware 2.6.0 installed while docked",
    robot: "Patrol dog 9E37",
    site: "Taoyuan plant",
    at: "2026-11-20T03:12:00+08:00",
    href: "#robots/9e37",
    read: false,
  },
  {
    id: "n4",
    title: "Map of Loading bay updated by Kai Chen",
    site: "Taoyuan plant",
    at: "2026-11-19T17:40:00+08:00",
    href: "#maps/loading-bay",
    read: true,
  },
  {
    id: "n5",
    title: "Dataset export finished: 1,284 clips, 18 GB",
    site: "Hsinchu lab",
    at: "2026-11-19T11:05:00+08:00",
    href: "#datasets/night-clips",
    read: true,
  },
  {
    id: "n6",
    title: "Lidar cleaning is due next week",
    robot: "Patrol dog 2B10",
    site: "Taipei HQ",
    at: "2026-11-17T08:30:00+08:00",
    href: "#maintenance/2b10",
    read: true,
  },
]

export const unreadCount = (items: FleetNotification[]) => items.filter((n) => !n.read).length

/** Day key in the given time zone, e.g. "2026-11-20", so "today" means the reader's today. */
const dayKey = (d: Date, timeZone?: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)

/**
 * Notifications grouped by day, newest first: "Today", "Yesterday", then the weekday and date. Exported for tests and
 * for lists outside the panel.
 */
export function groupByDay(items: FleetNotification[], now: Date, { locale = "en-GB", timeZone }: { locale?: string; timeZone?: string } = {}) {
  const today = dayKey(now, timeZone)
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000), timeZone)
  const dateLabel = new Intl.DateTimeFormat(locale, { timeZone, weekday: "short", day: "numeric", month: "short" })
  const groups: { key: string; label: string; items: FleetNotification[] }[] = []
  for (const n of [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    const d = new Date(n.at)
    const key = dayKey(d, timeZone)
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, label: key === today ? "Today" : key === yesterday ? "Yesterday" : dateLabel.format(d), items: [] }
      groups.push(group)
    }
    group.items.push(n)
  }
  return groups
}

type Filter = "all" | "unread"

type PanelProps = {
  notifications: FleetNotification[]
  onMarkRead: (ids: string[]) => void
  /** "loading" until the first answer; "error" when it failed (say so, offer to try again). */
  status?: "ready" | "loading" | "error"
  onRetry?: () => void
  now: Date
  locale?: string
  /** The reader's time zone; leave it out to use the browser's. */
  timeZone?: string
  /** Where the notification settings live (the settings-notifications block). */
  settingsHref?: string
  linkAs?: React.ElementType
  /** Called when a notification's link is followed, so the overlay can close. */
  onNavigate?: () => void
  /** The panel's own heading; the sheet passes its SheetTitle instead. */
  heading?: React.ReactNode
}

/**
 * The list inside the bell's overlay. Exported so it can also sit in a page (a full notifications screen) or a test,
 * without the overlay.
 */
export function NotificationPanel({
  notifications,
  onMarkRead,
  status = "ready",
  onRetry,
  now,
  locale = "en-GB",
  timeZone,
  settingsHref,
  linkAs: Link = "a",
  onNavigate,
  // The popover's heading is a SectionHeader, 16 px bold, as a card's title: the popover is a surface over the page. On a
  // phone the sheet's own title (20) names it instead.
  heading = <SectionHeader title="Notifications" />,
}: PanelProps) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [announce, setAnnounce] = React.useState("")
  const root = React.useRef<HTMLDivElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const unread = unreadCount(notifications)
  const shown = filter === "unread" ? notifications.filter((n) => !n.read) : notifications
  const groups = groupByDay(shown, now, { locale, timeZone })
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

  const links = () => Array.from(list.current?.querySelectorAll<HTMLElement>("[data-notification-link]") ?? [])
  // After a row changes (its button goes, or under Unread the row itself goes), focus lands on the row now at that
  // place, or the panel when none is left, never on the page behind the overlay.
  const refocus = (index: number) =>
    requestAnimationFrame(() => {
      const all = links()
      ;(all[Math.min(index, all.length - 1)] ?? root.current)?.focus()
    })

  const markOne = (n: FleetNotification) => {
    const index = links().findIndex((l) => l.dataset.notificationLink === n.id)
    onMarkRead([n.id])
    setAnnounce(`Marked as read: ${n.title}`)
    refocus(index)
  }
  const markAll = () => {
    onMarkRead(notifications.filter((n) => !n.read).map((n) => n.id))
    setAnnounce(`${unread} marked as read`)
    refocus(0)
  }

  // Arrow keys move between notifications, Home and End to the ends; Tab still reaches each row's own button.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return
    const all = links()
    if (!all.length) return
    const row = (e.target as HTMLElement).closest("li")
    const at = all.findIndex((l) => row?.contains(l))
    const next = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : e.key === "ArrowDown" ? Math.min(at + 1, all.length - 1) : Math.max(at - 1, 0)
    e.preventDefault()
    all[at === -1 && e.key === "ArrowUp" ? all.length - 1 : next]?.focus()
  }

  return (
    // focus-ring: the panel takes focus only as a fallback, when the last row it held has gone; the outline shows on it then.
    <div ref={root} tabIndex={-1} className="flex min-h-0 flex-col gap-3 rounded-xs">
      <div className="flex items-center justify-between gap-3">
        {heading}
        {status === "ready" && unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll} className="-mr-2">
            <CheckCheck aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </div>
      {status === "ready" && notifications.length > 0 && (
        <SegmentedControl value={filter} onValueChange={(v) => v && setFilter(v as Filter)} aria-label="Show">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="unread">Unread {unread > 0 && <span className="tabular-nums">{unread}</span>}</SegmentedControlItem>
        </SegmentedControl>
      )}

      <p role="status" className="sr-only">
        {announce}
      </p>

      {status === "loading" ? (
        <div className="flex flex-col gap-4 py-2">
          <LoadingLine>Loading notifications</LoadingLine>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 px-3">
              <Bone className="mt-1 size-2 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone className="h-4 w-4/5" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : status === "error" ? (
        <EmptyState
          icon={CircleAlert}
          title="Notifications did not load"
          description="Your robots are not affected, and alarms still reach you."
          action={
            onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                <RotateCw aria-hidden="true" />
                Try again
              </Button>
            )
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={notifications.length === 0 ? "No notifications yet" : "You're all caught up"}
          description={
            notifications.length === 0
              ? "Finished missions, reports and updates show up here."
              : "Nothing unread. Alarms that need you stay on the alarm list until someone acknowledges them."
          }
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- arrow keys bubbled from the notification links move between them; the links are the Tab stops
        <div ref={list} onKeyDown={onKeyDown} className="-mx-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-1">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`notif-day-${g.key}`} className="flex flex-col gap-1">
              <h3 id={`notif-day-${g.key}`} className="px-2 text-xs font-medium text-muted-foreground">
                {g.label}
              </h3>
              <ul className="flex flex-col">
                {g.items.map((n) => (
                  <li key={n.id} className="flex items-start gap-1">
                    <Link data-slot="notification-center-link"
                      href={n.href}
                      data-notification-link={n.id}
                      onClick={() => {
                        if (!n.read) onMarkRead([n.id])
                        onNavigate?.()
                      }}
                      className="press flex min-w-0 flex-1 gap-3 rounded-sm px-2 py-2 -outline-offset-2 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent"
                    >
                      {/* Unread is a dot and weight, never colour alone; the words say it to a screen reader. */}
                      <span aria-hidden="true" className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-foreground")} />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className={cn("text-sm text-pretty", n.read ? "text-muted-foreground" : "font-medium text-foreground")}>
                          {!n.read && <span className="sr-only">Unread: </span>}
                          {n.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {[n.robot, n.site].filter(Boolean).join(" · ")} · <time dateTime={n.at}>{time.format(new Date(n.at))}</time>
                        </span>
                      </span>
                    </Link>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Mark as read: ${n.title}`}
                        onClick={() => markOne(n)}
                        className="mt-1 pointer-coarse:size-(--h-md)"
                      >
                        <Check aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {settingsHref && (
        <div className="border-t border-border pt-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={settingsHref} onClick={onNavigate}>
              Notification settings
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

/** Wide screens get a popover under the bell; phones a bottom sheet, the kit's overlay for anything longer than a menu. */
function useWide() {
  const [wide, setWide] = React.useState(true)
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 40rem)")
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return wide
}

type NotificationCenterProps = Omit<PanelProps, "notifications" | "onMarkRead" | "now" | "onNavigate" | "heading"> & {
  /** Defaults to the sample. Kept in the block's state once given: marking read updates it at once. */
  notifications?: FleetNotification[]
  /** Called with the ids just marked read, to tell the server. */
  onMarkRead?: (ids: string[]) => void
  /** "Today" is measured from here. Defaults to the current time (the sample's own clock when showing the sample). */
  now?: Date
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. Later openings focus as usual. */
  focusOnOpen?: boolean
}

/**
 * The bell for the app's top bar (AppShell `actions`) with the unread count: the notifications in a popover, or a bottom
 * sheet on phones, grouped by day, newest first. Alarms, which need someone to act, belong to AlarmList and the island,
 * never only here.
 */
export function NotificationCenter({
  notifications: given,
  onMarkRead,
  now,
  defaultOpen,
  focusOnOpen = true,
  ...panel
}: NotificationCenterProps) {
  const [items, setItems] = React.useState(given ?? sampleNotifications)
  // A new list from the product replaces the local one (which marks rows read at once), during the render that brings
  // it rather than in an effect that renders twice.
  const [prevGiven, setPrevGiven] = React.useState(given)
  if (given !== prevGiven) {
    setPrevGiven(given)
    if (given) setItems(given)
  }
  const [open, setOpen] = React.useState(!!defaultOpen)
  // Only the opening on load (a preview) may keep the page's focus; once someone opens it, focus goes into the list.
  const skipFocus = React.useRef(!!defaultOpen && !focusOnOpen)
  const change = (o: boolean) => {
    skipFocus.current = false
    setOpen(o)
  }
  const wide = useWide()
  const unread = panel.status === "ready" || !panel.status ? unreadCount(items) : 0
  const clock = now ?? (given ? new Date() : sampleNow)

  const markRead = (ids: string[]) => {
    if (!ids.length) return
    setItems((all) => all.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
    onMarkRead?.(ids)
  }

  // On open, focus goes to the first notification (or the panel), not to "Mark all as read", where a stray Enter would
  // clear everything.
  const onOpenAutoFocus = (e: Event) => {
    e.preventDefault()
    if (skipFocus.current) return
    const content = e.currentTarget as HTMLElement
    ;(content.querySelector<HTMLElement>("[data-notification-link]") ?? content).focus()
  }

  const bell = (
    <button data-slot="notification-center-trigger"
      type="button"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="press relative flex size-(--h-md) items-center justify-center rounded-sm transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent"
    >
      <Bell aria-hidden="true" className="size-5" />
      {/* Neutral: unread notifications are worth knowing later, not alarms (those keep the danger count). */}
      <CountBadge count={unread} tone="neutral" aria-hidden="true" className="absolute top-0 right-0" />
    </button>
  )

  const body = (heading?: React.ReactNode) => (
    <NotificationPanel {...panel} heading={heading} notifications={items} onMarkRead={markRead} now={clock} onNavigate={() => change(false)} />
  )

  return wide ? (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>{bell}</PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="Notifications"
        onOpenAutoFocus={onOpenAutoFocus}
        className="flex max-h-(--radix-popover-content-available-height) w-96 flex-col p-4"
      >
        <div className="flex max-h-128 min-h-0 flex-col">{body()}</div>
      </PopoverContent>
    </Popover>
  ) : (
    <Sheet open={open} onOpenChange={change}>
      <SheetTrigger asChild>{bell}</SheetTrigger>
      <SheetContent side="bottom" onOpenAutoFocus={onOpenAutoFocus}>
        <SheetDescription className="sr-only">Mission results, reports and updates across your sites.</SheetDescription>
        {body(<SheetTitle>Notifications</SheetTitle>)}
      </SheetContent>
    </Sheet>
  )
}
