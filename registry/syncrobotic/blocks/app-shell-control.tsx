// @syncrobotic/app-shell-control v0.51.0 · update: npx shadcn add @syncrobotic/app-shell-control --overwrite
"use client"

import * as React from "react"
import { BatteryLow, Bell, Check, CircleAlert, LayoutGrid, Map as MapIcon, MapPin, Settings, Square } from "lucide-react"
import { feedback } from "@/registry/syncrobotic/lib/feedback"
import { Dock, DockNav, type NavItem } from "@/registry/syncrobotic/shell/dock"
import {
  Island,
  IslandNotice,
  IslandNotifications,
  IslandRobots,
  IslandStatus,
  type IslandNotification,
  type IslandRobot,
  type IslandZone,
} from "@/registry/syncrobotic/shell/island"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"

export const sampleControlTabs: NavItem[] = [
  { key: "today", label: "Today", icon: LayoutGrid },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "events", label: "Events", icon: Bell, badge: 2 },
  { key: "settings", label: "Settings", icon: Settings },
]

export const sampleControlRobots: IslandRobot[] = [
  { id: "7F3A", name: "Patrol dog 7F3A", status: "active", state: "Patrolling · North gate", battery: 72 },
  { id: "9E37", name: "Patrol dog 9E37", status: "warning", state: "Stuck at the loading bay", battery: 12, attention: true },
  { id: "DAA6", name: "Patrol dog DAA6", status: "normal", state: "Docked · Dock 2", battery: 100 },
  { id: "C2B0", name: "Patrol dog C2B0", status: "offline", state: "Offline · last seen 21:40" },
]

const sampleNotifications: IslandNotification[] = [
  { id: "n1", title: "9E37 is stuck at the loading bay", meta: "Needs someone to clear the path", time: "14:06", unread: true, tone: "warning", icon: CircleAlert },
  { id: "n2", title: "Battery 12 % on 9E37", meta: "Returning to the dock after this round", time: "14:01", unread: true, icon: BatteryLow },
  { id: "n3", title: "Night patrol finished", meta: "7F3A · 3 rounds, no incidents", time: "06:02", icon: Check },
  { id: "n4", title: "Route changed: North gate", meta: "By Mei Lin", time: "Yesterday", icon: MapPin },
]

// Sample data for the page inside the shell: the robot's rounds today.
const rounds = [
  { id: "r4", title: "North gate · round 4", meta: "Started 14:00 · 2 of 6 checkpoints", status: "active" as const, word: "Under way" },
  { id: "r3", title: "North gate · round 3", meta: "12:00 – 12:41 · 6 of 6 checkpoints", status: "normal" as const, word: "Done" },
  { id: "r2", title: "Car park · round 2", meta: "10:00 – 10:38 · door 3 left open", status: "warning" as const, word: "1 finding" },
  { id: "r1", title: "North gate · round 1", meta: "08:00 – 08:40 · 6 of 6 checkpoints", status: "normal" as const, word: "Done" },
]

function SampleToday() {
  return (
    <section aria-labelledby="control-today" className="flex flex-col gap-2">
      <h2 id="control-today" className="text-sm font-medium text-muted-foreground">
        Rounds today
      </h2>
      <ListGroup>
        {rounds.map((r) => (
          <ListRow key={r.id} title={r.title} meta={r.meta} trailing={<InlineStatus status={r.status}>{r.word}</InlineStatus>} />
        ))}
      </ListGroup>
    </section>
  )
}

/**
 * The phone app that controls one robot: the dynamic island at the top, the page, and the dock with the emergency stop
 * in thumb reach above the tabs. Stopping turns the island's edge danger until the robot is released. For the fleet
 * console on a phone use `app-shell-mobile-tabs`.
 */
export function AppShellControl({
  robots = sampleControlRobots,
  defaultRobot = robots[0]?.id,
  tabs = sampleControlTabs,
  defaultTab = "today",
  onTabChange,
  children,
}: {
  robots?: IslandRobot[]
  defaultRobot?: string
  tabs?: NavItem[]
  defaultTab?: string
  onTabChange?: (key: string) => void
  /** The current tab's page. */
  children?: React.ReactNode
}) {
  const [current, setCurrent] = React.useState(defaultRobot)
  const [open, setOpen] = React.useState<IslandZone | null>(null)
  const [items, setItems] = React.useState(sampleNotifications)
  const [tab, setTab] = React.useState(defaultTab)
  const [stop, setStop] = React.useState<"ready" | "sending" | "stopped">("ready")
  // The sample robot's reply to a stop or a release; cleared on unmount so it never lands on a page that is gone.
  const reply = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(reply.current), [])
  // The page starts under the island, which grows with a notice (a stop, a lost connection): its height is measured.
  // An open panel lies over the page like a menu instead, so the page does not move while one is open.
  const root = React.useRef<HTMLDivElement>(null)
  const [islandBottom, setIslandBottom] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = root.current?.querySelector<HTMLElement>("[data-slot=island]")
    if (!el) return
    const update = () => {
      if (!el.hasAttribute("data-panel")) setIslandBottom(el.getBoundingClientRect().bottom - (root.current?.getBoundingClientRect().top ?? 0))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const robot = robots.find((r) => r.id === current) ?? robots[0]
  if (!robot) return null
  const stopped = stop === "stopped"
  const unread = items.filter((n) => n.unread).length
  return (
    <div ref={root} className="flex min-h-[var(--app-shell-height,100dvh)] flex-col bg-background [--shell-surface:var(--color-background)]">
      {/* A phone's island and dock: on a wider screen they stay phone-wide and centred. */}
      <Island
        className="mx-auto max-w-md"
        name={robot.name}
        status={stopped ? "danger" : robot.status}
        battery={robot.battery}
        online={robot.status !== "offline"}
        attention={robots.some((r) => r.attention && r.id !== robot.id)}
        unread={unread}
        edge={stopped ? "danger" : undefined}
        open={open}
        onOpenChange={setOpen}
        panels={{
          name: (
            <IslandRobots
              robots={robots}
              current={robot.id}
              onSelect={(id) => {
                setCurrent(id)
                setOpen(null)
              }}
            />
          ),
          status: <IslandStatus link={robot.status === "offline" ? "offline" : "wifi"} battery={robot.battery} updated="14:06:31" />,
          bell: (
            <IslandNotifications
              items={items}
              onOpen={(id) => setItems((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n)))}
              onMarkAllRead={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))}
            />
          ),
        }}
      >
        {stopped ? <IslandNotice tone="danger" icon={Square} title={`${robot.name} stopped from this phone`} meta="Slide to release when it is safe" persistent /> : undefined}
      </Island>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4 pb-8">
        {/* Room for the island above and the dock below (their rows, from the same tokens), so nothing is ever under either. */}
        <div aria-hidden="true" className="h-(--h-row) shrink-0" style={islandBottom === null ? undefined : { height: islandBottom }} />
        {children ?? <SampleToday />}
        <div aria-hidden="true" className="flex shrink-0 flex-col gap-4">
          <div className="h-(--h-stop)" />
          <div className="h-(--h-lg)" />
        </div>
      </main>
      <Dock
        className="z-20 mx-auto max-w-md"
        state={
          stopped ? (
            <SlideToRelease onRelease={() => (reply.current = setTimeout(() => setStop("ready"), 500))} />
          ) : (
            <StopButton
              state={stop === "sending" ? "sending" : robot.status === "offline" ? "dead" : "ready"}
              tag={robot.id}
              onStop={() => {
                setStop("sending")
                // The robot confirms: the app says so to the hand, then offers release.
                reply.current = setTimeout(() => {
                  feedback("stopConfirmed")
                  setStop("stopped")
                }, 800)
              }}
            />
          )
        }
        nav={
          <DockNav
            items={tabs.map((t) => (t.key === "events" ? { ...t, badge: unread || undefined } : t))}
            active={tab}
            onSelect={(k) => {
              setTab(k)
              onTabChange?.(k)
            }}
          />
        }
      />
    </div>
  )
}
