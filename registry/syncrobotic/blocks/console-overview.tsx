// @syncrobotic/console-overview v0.8.0 · update: npx shadcn add @syncrobotic/console-overview --overwrite
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

/** Operations console: the fleet's numbers, the robots, and what needs a person, on one screen. */
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
      onSearch={() => {}}
      actions={
        // On phones the action is its icon (named for screen readers) so the page title is not cut.
        <Button size="sm" className="max-sm:w-(--h-sm) max-sm:px-0">
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">New mission</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <StatsCards />
        <div className="grid gap-6 2xl:grid-cols-[1fr_22rem]">
          <section aria-label="Robots" className="min-w-0">
            <FleetTable />
          </section>
          <AlarmList alarms={alarms} onAcknowledge={(id) => setAlarms((l) => l.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))} />
        </div>
      </div>
    </AppShell>
  )
}
