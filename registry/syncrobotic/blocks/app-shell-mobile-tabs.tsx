// @syncrobotic/app-shell-mobile-tabs v0.15.0 · update: npx shadcn add @syncrobotic/app-shell-mobile-tabs --overwrite
"use client"

import * as React from "react"
import { Bell, Bot, LayoutGrid, Map as MapIcon, Search } from "lucide-react"
import { DockNav, type NavItem } from "@/registry/syncrobotic/shell/dock"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Tray } from "@/registry/syncrobotic/shell/tray"
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

const row = "flex min-h-(--h-row) items-center gap-3 border-b border-border py-2 last:border-b-0" // icon-gap-ok: the tile is the robot's id, not an icon

function SampleRobots() {
  return (
    <ul className="flex flex-col">
      {robots.map((r) => (
        <li key={r.id} className={row}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-muted font-mono text-xs font-bold">{r.id}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">Patrol dog {r.id}</span>
            <span className="flex items-center gap-2 truncate text-xs text-muted-foreground">
              <StatusGlyph status={r.tone} /> {r.state} · {r.where}
            </span>
          </span>
          <span className={r.battery < 15 ? "text-sm font-medium text-warning tabular-nums" : "text-sm text-muted-foreground tabular-nums"}>{r.battery} %</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The phone frame of a tool: the page's name at the top, its content, and the main sections as tabs in a floating
 * dock at the bottom, in thumb reach. Four tabs at most; anything more goes in a page, not in the bar.
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
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex min-h-(--h-lg) items-center justify-between gap-3 border-b border-border bg-background px-4 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">{product}</span>
          <h1 className="truncate text-lg font-bold">{current.label}</h1>
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
      <Tray className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20">
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
