// @syncrobotic/map-workspace v0.45.1 · update: npx shadcn add @syncrobotic/map-workspace --overwrite
"use client"

import * as React from "react"
import { Crosshair, LayoutList, Pause, X } from "lucide-react"
import { ChargingDock } from "@/registry/syncrobotic/ui/robot-icons"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { IslandAlarm } from "@/registry/syncrobotic/shell/island"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { feedback } from "@/registry/syncrobotic/lib/feedback"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"
import { RobotMap, RobotMapList, type RobotMapRobot, type RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { ViewportOverlay } from "@/registry/syncrobotic/ui/viewport-overlay"

type MapRobot = { id: string; x: number; y: number; tone: Status; status: string; battery: number; route?: [number, number][] }

const robots: MapRobot[] = [
  {
    id: "7F3A",
    x: 30,
    y: 35,
    tone: "active",
    status: "Patrolling",
    battery: 72,
    route: [
      [12, 20],
      [30, 35],
      [55, 35],
      [70, 60],
    ],
  },
  { id: "9C44", x: 72, y: 22, tone: "warning", status: "Needs attention", battery: 14 },
  { id: "4D21", x: 48, y: 70, tone: "danger", status: "Stopped", battery: 64 },
  { id: "2B10", x: 85, y: 78, tone: "normal", status: "Docked", battery: 100 },
]

// The site is 100 × 100 m; positions are in metres from its top-left corner.
const site = { width: 100, height: 100 }
const zones: RobotMapZone[] = [
  {
    id: "bay",
    kind: "other",
    label: "Loading bay",
    points: [
      [40, 58],
      [62, 58],
      [62, 82],
      [40, 82],
    ],
  },
]
const headings: Record<string, number> = { "7F3A": 90, "9C44": 180, "4D21": 270, "2B10": 0 }
const mapRobots: RobotMapRobot[] = robots.map((r) => ({ id: r.id, name: r.id, x: r.x, y: r.y, heading: headings[r.id], status: r.tone, statusLabel: r.status }))

const alarms: AlarmData[] = [
  { id: "a1", priority: "critical", title: "Emergency stop", source: "4D21, Warehouse", time: "14:02", active: true, acknowledged: false },
  { id: "a2", priority: "high", title: "Battery 14 %", source: "9C44", time: "14:01", active: true, acknowledged: false },
]

/**
 * Map workspace: the site map fills the screen; floating trays hold the selected robot, the most urgent alarm
 * and the emergency stop. The map is RobotMap (pass your floor plan); its robots are also listed, as text, in a Robots
 * sheet from the top bar.
 */
export function MapWorkspace() {
  const [selected, setSelected] = React.useState("7F3A")
  // The stop as in the dock: ready, sending until the robot confirms, then stopped with slide to release.
  const [stop, setStop] = React.useState<"ready" | "sending" | "stopped">("ready")
  // The sample's reply (the robot confirming, the server answering); cleared on unmount so it never lands on a page
  // that is gone.
  const reply = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(reply.current), [])
  const [list, setList] = React.useState(alarms)
  const robot = robots.find((r) => r.id === selected)!
  const [listOpen, setListOpen] = React.useState(false)
  const pick = (id: string | null) => {
    // The tray always shows a robot: a click on the empty map keeps the one selected.
    if (id) setSelected(id)
  }

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#map"
      title="Map · North site"
      environment="staging"
      user={sampleUser}
      bleed
      actions={
        // The map is one Tab stop; the robots, one per row, are here, as a chart's numbers are in its table.
        <Sheet open={listOpen} onOpenChange={setListOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <LayoutList aria-hidden="true" /> Robots
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetClose
              aria-label="Close"
              className="press absolute top-2 right-2 flex size-(--h-md) items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <X aria-hidden="true" className="size-5" />
            </SheetClose>
            <SheetHeader className="pr-8">
              <SheetTitle>Robots on North site</SheetTitle>
            </SheetHeader>
            <RobotMapList
              label="Robots on North site"
              robots={mapRobots}
              zones={zones}
              selectedId={selected}
              onSelect={(id) => {
                pick(id)
                setListOpen(false)
              }}
            />
          </SheetContent>
        </Sheet>
      }
    >
      {/*
        On a phone the trays would cover a third of the map, and a focused marker under one cannot be seen (WCAG 2.4.11):
        there the robot's tray and the alarm sit above the map and the stop below it. From sm up they float over the map's
        corners: the robot top left, the alarm top right, or under the robot when the two do not fit side by side.
      */}
      <div className="flex h-full min-h-96 flex-col gap-4 overflow-hidden bg-map sm:relative sm:block">
        <ViewportOverlay position="top" className="z-10 shrink-0 max-sm:static max-sm:m-4 max-sm:mb-0 max-sm:items-stretch sm:flex-row sm:flex-wrap sm:justify-between">
          <Tray className="pointer-events-auto shrink-0 sm:w-72">
            <div className="flex flex-col gap-3 rounded-md bg-card p-4">
              <SectionHeader variant="surface" as="h2" title={`Patrol dog ${robot.id}`} actions={<InlineStatus status={robot.tone}>{robot.status}</InlineStatus>} />
              <Meter value={robot.battery} low={15} label="Battery" />
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  <Pause aria-hidden="true" /> Pause
                </Button>
                <Button variant="secondary" size="sm">
                  <ChargingDock aria-hidden="true" /> Dock
                </Button>
                <Button variant="secondary" size="icon-sm" aria-label="Centre map on robot">
                  <Crosshair aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Tray>

          {/*
            A critical alarm never disappears: it shows at every width (on phones as one compact row between the robot and
            the map, never over the stop). Only while an alarm shows: an empty tray would float as a bare pill. The island
            stays mounted so it hears new alarms.
          */}
          <Tray className="pointer-events-auto hidden min-w-0 has-[[role=group]]:flex sm:w-72 lg:w-96">
            <IslandAlarm alarms={list} onAcknowledge={(id) => setList((l) => l.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))} />
          </Tray>
        </ViewportOverlay>

        {/* On phones the map gives way: the tray and the stop keep their size, so the stop is on screen on any phone. */}
        <div className="relative min-h-0 flex-1 sm:absolute sm:inset-0">
          <RobotMap
            label="Map of North site"
            {...site}
            zones={zones}
            robots={mapRobots}
            paths={robot.route ? [{ id: `${robot.id}-route`, kind: "planned", robotId: robot.id, points: robot.route }] : []}
            selectedId={selected}
            onSelect={pick}
            fill
            className="absolute inset-0 rounded-none ring-0"
          />
        </div>

        {/* The stop takes the bottom right, the corner the other chrome keeps clear for it; on a phone it sits under the map. */}
        <ViewportOverlay position="bottom-right" className="z-10 shrink-0 max-sm:static max-sm:m-4 max-sm:mt-0">
          <div className="pointer-events-auto w-full sm:w-72">
            {stop === "stopped" ? (
              <SlideToRelease tag={robot.id} onRelease={() => (reply.current = setTimeout(() => setStop("ready"), 500))} />
            ) : (
              <StopButton
                state={stop}
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
            )}
          </div>
        </ViewportOverlay>
      </div>
    </AppShell>
  )
}
