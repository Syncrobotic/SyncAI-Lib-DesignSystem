// @syncrobotic/app-shell-mobile-tabs v0.53.0 · update: npx shadcn add @syncrobotic/app-shell-mobile-tabs --overwrite
"use client"

import * as React from "react"
import { Bell, Bot, LayoutGrid, Map as MapIcon, Search } from "lucide-react"
import { DockNav, type NavItem } from "@/registry/syncrobotic/shell/dock"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"

export const sampleTabs: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "robots", label: "Robots", icon: Bot },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "events", label: "Events", icon: Bell, badge: 3 },
]

// Sample data for the page inside the shell.
const robots: { id: string; tone: Status; state: string; where: string; battery: number }[] = [
  { id: "7F3A", tone: "active", state: "Patrolling", where: "North gate", battery: 72 },
  { id: "9E37", tone: "warning", state: "Needs attention", where: "Loading bay", battery: 14 },
  { id: "DAA6", tone: "normal", state: "Docked", where: "Dock 2", battery: 100 },
  { id: "1715", tone: "active", state: "Patrolling", where: "Car park", battery: 55 },
  { id: "C2B0", tone: "offline", state: "Offline", where: "Last seen at Dock 1", battery: 38 },
]

// The battery in a row's line: the number, and below 15 % the warning shape before it and the word read out, never danger.
// A DOM space before the word, which a positioned sr-only ", low" would read as " , low".
const Battery = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-2">
    {value < 15 && <StatusGlyph status="warning" />}
    {value} %
    {value < 15 && (
      <>
        {" "}
        <span className="sr-only">low</span>
      </>
    )}
  </span>
)

const row = "flex min-h-(--h-row) items-center gap-3 border-b border-border py-2 last:border-b-0" // icon-gap-ok: the tile is the robot's id, not an icon

function SampleRobots() {
  return (
    <ul className="flex flex-col">
      {robots.map((r) => (
        <li key={r.id} className={row}>
          <Avatar shape="square" size="lg" aria-hidden="true">
            <AvatarFallback className="font-mono text-xs">{r.id}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">Patrol dog {r.id}</span>
            <span className="truncate text-xs text-muted-foreground tabular-nums">
              {r.where} · <Battery value={r.battery} />
            </span>
          </span>
          {/* The state is the row's trailing word with its shape, coloured only when it needs someone; so is the battery below 15 %. */}
          <InlineStatus status={r.tone}>{r.state}</InlineStatus>
        </li>
      ))}
    </ul>
  )
}

/**
 * A phone frame: the page title on top and up to four sections as tabs in a floating dock, in thumb reach. Anything
 * more goes in a page, not in the bar.
 */
export function AppShellMobileTabs({
  product = "Fleet console",
  tabs = sampleTabs,
  defaultTab = "robots",
  onTabChange,
  children,
}: {
  product?: string
  tabs?: NavItem[]
  defaultTab?: string
  onTabChange?: (key: string) => void
  /** The current tab's page. */
  children?: React.ReactNode
}) {
  const [active, setActive] = React.useState(defaultTab)
  const current = tabs.find((t) => t.key === active) ?? tabs[0]
  // The bar's height follows its two lines of text, so it is measured: --shell-top is its bottom edge, where a sticky
  // tab row (TabsList sticky) or a product's filter bar pins under it.
  const bar = React.useRef<HTMLElement>(null)
  const [barHeight, setBarHeight] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = bar.current
    if (!el) return
    const ro = new ResizeObserver(() => setBarHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      style={barHeight === null ? undefined : ({ "--shell-top": `${barHeight}px` } as React.CSSProperties)}
      className="flex min-h-[var(--app-shell-height,100dvh)] flex-col bg-background [--shell-surface:var(--color-background)] [--shell-top:var(--h-lg)]"
    >
      <header ref={bar} className="sticky top-0 z-20 flex min-h-(--h-lg) items-center justify-between gap-3 border-b border-border bg-background px-4 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">{product}</span>
          {/* An empty tab list has no current tab, so the title is left blank rather than throwing. */}
          <h1 className="truncate text-base font-bold">{current?.label}</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label={`Search ${product}`}>
          <Search aria-hidden="true" />
        </Button>
      </header>
      <main className="flex-1 px-4 pt-2 pb-8">
        {children ?? <SampleRobots />}
        {/* Room for the dock (its height, its padding and its gap to the edge), so the last row is never under it. */}
        <div aria-hidden="true" className="mt-4 h-(--h-lg)" />
      </main>
      {/* A phone's dock: on a wider screen it stays phone-wide, centred, instead of stretching four tabs across the glass. */}
      <Tray className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-md">
        <DockNav
          items={tabs}
          active={active}
          onSelect={(k) => {
            setActive(k)
            onTabChange?.(k)
          }}
        />
      </Tray>
    </div>
  )
}
