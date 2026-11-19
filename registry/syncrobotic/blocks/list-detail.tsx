// @syncrobotic/list-detail v0.13.1 · update: npx shadcn add @syncrobotic/list-detail --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, MapPin, Pause, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChargingDock } from "@/registry/syncrobotic/ui/robot-icons"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { sampleRobots, type Robot } from "@/registry/syncrobotic/blocks/fleet-table"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Separator } from "@/registry/syncrobotic/ui/separator"

const status: Record<Robot["status"], { tone: Status; label: string }> = {
  patrolling: { tone: "active", label: "Patrolling" },
  docked: { tone: "normal", label: "Docked" },
  attention: { tone: "warning", label: "Needs attention" },
  stopped: { tone: "danger", label: "Stopped" },
  offline: { tone: "offline", label: "Offline" },
}

/** List and detail: pick a robot on the left, read and act on it on the right. On phones the detail replaces the list. */
export function ListDetail({ robots = sampleRobots }: { robots?: Robot[] }) {
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<string | null>(null)
  // Wide screens open on the first robot; phones start on the list.
  React.useEffect(() => {
    if (window.matchMedia("(min-width: 48rem)").matches) setSelected((s) => s ?? robots[0]?.id ?? null)
  }, [robots])
  const shown = robots.filter((r) => `${r.name} ${r.site}`.toLowerCase().includes(query.toLowerCase()))
  const robot = robots.find((r) => r.id === selected)

  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Robots" environment="staging" user={{ name: "Mei Lin", initials: "ML" }} bleed>
      <div className="flex h-full">
        <div className={cn("flex w-full flex-col border-r border-border md:w-80", robot && "hidden md:flex")}>
          <div className="border-b border-border p-3">
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <Input type="search" aria-label="Filter robots" placeholder="Filter by name or site" value={query} onChange={(e) => setQuery(e.target.value)} />
            </InputGroup>
          </div>
          <ul className="flex-1 overflow-y-auto p-2" aria-label="Robots">
            {shown.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-current={r.id === selected ? "true" : undefined}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    "press flex min-h-(--h-row) w-full flex-col items-start justify-center rounded-xs px-3 text-left hover:bg-accent",
                    r.id === selected && "bg-muted font-medium",
                  )}
                >
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <InlineStatus status={status[r.status].tone}>{status[r.status].label}</InlineStatus> · {r.site}
                  </span>
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="p-4 text-sm text-muted-foreground">No robots match “{query}”.</li>}
          </ul>
        </div>

        <section aria-label="Robot detail" className={cn("min-w-0 flex-1 overflow-y-auto p-6", !robot && "hidden md:block")}>
          {robot ? (
            <div className="flex max-w-3xl flex-col gap-6">
              <div className="flex flex-wrap items-start gap-3">
                <Button variant="ghost" size="icon-sm" aria-label="Back to robots" className="md:hidden" onClick={() => setSelected(null)}>
                  <ArrowLeft aria-hidden="true" />
                </Button>
                <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                  <h2 className="text-xl font-bold">{robot.name}</h2>
                  <InlineStatus status={status[robot.status].tone}>{status[robot.status].label}</InlineStatus>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Pause aria-hidden="true" /> Pause
                  </Button>
                  <Button variant="secondary" size="sm">
                    <ChargingDock aria-hidden="true" /> Return to dock
                  </Button>
                </div>
              </div>
              <DescriptionList
                items={[
                  { label: "Battery", value: <Meter value={robot.battery} low={30} label="Battery" inline /> },
                  {
                    label: "Site",
                    value: (
                      <span className="flex items-center gap-2">
                        <MapPin aria-hidden="true" className="size-4 text-muted-foreground" /> {robot.site}
                      </span>
                    ),
                  },
                  { label: "Last seen", value: robot.lastSeen },
                ]}
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold">Recent activity</h3>
                <ul className="rounded-md bg-card ring-1 ring-border">
                  {["14:02 · Route Perimeter B started", "13:40 · Charged to 100 %", "12:15 · Lidar self-check passed"].map((e, i) => (
                    <li key={e}>
                      {i > 0 && <Separator />}
                      <p className="px-4 py-3 text-sm">{e}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState title="Pick a robot" description="Its status, battery and recent activity appear here." />
          )}
        </section>
      </div>
    </AppShell>
  )
}
