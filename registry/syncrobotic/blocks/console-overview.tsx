// @syncrobotic/console-overview v0.17.2 · update: npx shadcn add @syncrobotic/console-overview --overwrite
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { StatsCards } from "@/registry/syncrobotic/blocks/stats-cards"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"

const sampleAlarms: AlarmData[] = [
  { id: "a1", priority: "low", title: "Lidar cleaning due", source: "Patrol dog 2B10", time: "13:40", active: true, acknowledged: true },
  { id: "a2", priority: "high", title: "Battery 18 %, 12 min left", source: "Patrol dog 9C44", time: "14:01", active: true, acknowledged: false },
  { id: "a3", priority: "critical", title: "Emergency stop · Warehouse", source: "Patrol dog 4D21", time: "14:02", active: true, acknowledged: false },
]

/** Operations console: what needs a person first, then the fleet's numbers and the robots, on one screen. */
export function ConsoleOverview() {
  const [alarms, setAlarms] = React.useState(sampleAlarms)
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#overview"
      title="Overview"
      environment="staging"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        // On phones the action is its icon (named for screen readers) so the page title is not cut.
        <Button size="sm" className="max-sm:w-(--h-sm) max-sm:px-0">
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">New mission</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* What needs someone comes first, above the numbers: on a phone it is the first thing on screen, not three screens down.
            With nothing active the list leaves, and the numbers move up. */}
        {alarms.some((a) => a.active) && (
          <AlarmList alarms={alarms} onAcknowledge={(id) => setAlarms((l) => l.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))} />
        )}
        <StatsCards />
        <section aria-label="Robots" className="min-w-0">
          <FleetTable />
        </section>
      </div>
    </AppShell>
  )
}
