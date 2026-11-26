// @syncrobotic/console-overview v0.40.0 · update: npx shadcn add @syncrobotic/console-overview --overwrite
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { FleetTable, sampleRobots } from "@/registry/syncrobotic/blocks/fleet-table"
import { StatsCards } from "@/registry/syncrobotic/blocks/stats-cards"
import { feedback } from "@/registry/syncrobotic/lib/feedback"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const sampleAlarms: AlarmData[] = [
  { id: "a1", priority: "low", title: "Lidar cleaning due", source: "Patrol dog 2B10", time: "13:40:12", active: true, acknowledged: true, acknowledgedAt: "13:42" },
  { id: "a2", priority: "high", title: "Battery 14 %, 12 min left", source: "Patrol dog 9C44", time: "14:01:05", active: true, acknowledged: false },
  { id: "a3", priority: "critical", title: "Emergency stop · Warehouse", source: "Patrol dog 4D21", time: "14:02:31", active: true, acknowledged: false },
]

/** The time an operator acknowledged, as the list shows it: "14:03". */
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

/**
 * Operations console: what needs a person first, then the fleet's numbers and the robots, on one screen. The site's
 * emergency stop stays at the bottom of the screen while the page scrolls, one tap away.
 */
export function ConsoleOverview() {
  const [alarms, setAlarms] = React.useState(sampleAlarms)
  // The stop as in the dock: ready, sending until the robots confirm, then stopped with slide to release.
  const [stop, setStop] = React.useState<"ready" | "sending" | "stopped">("ready")
  // One update for one or many: the row's Acknowledge and the header's "Acknowledge all" both record when.
  const acknowledge = (ids: string[]) => {
    const at = clock()
    setAlarms((l) => l.map((a) => (ids.includes(a.id) ? { ...a, acknowledged: true, acknowledgedAt: at } : a)))
  }
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#overview"
      title="Overview"
      environment="staging"
      user={sampleUser}
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
          <AlarmList alarms={alarms} onAcknowledge={(id) => acknowledge([id])} onAcknowledgeAll={acknowledge} />
        )}
        <StatsCards />
        <section aria-labelledby="overview-robots" className="flex min-w-0 flex-col gap-4">
          <SectionHeader id="overview-robots" title="Robots" count={sampleRobots.length} />
          <FleetTable />
        </section>
        {/* The stop for every robot on the site sticks to the bottom of the scrolling page (full width on a phone, the
            corner from 640 px), so it is one tap away wherever the reader is, as in the dock and the map workspace. */}
        <div className="sticky bottom-4 z-10 sm:ml-auto sm:w-72">
          {stop === "stopped" ? (
            <SlideToRelease tag="All robots" onRelease={() => window.setTimeout(() => setStop("ready"), 500)} />
          ) : (
            <StopButton
              state={stop}
              tag="All robots"
              onStop={() => {
                setStop("sending")
                // The robots confirm: the app says so to the hand, then offers release.
                window.setTimeout(() => {
                  feedback("stopConfirmed")
                  setStop("stopped")
                }, 800)
              }}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}
