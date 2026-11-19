// @syncrobotic/map-workspace v0.17.2 · update: npx shadcn add @syncrobotic/map-workspace --overwrite
"use client"

import * as React from "react"
import { Crosshair, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChargingDock } from "@/registry/syncrobotic/ui/robot-icons"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { IslandAlarm } from "@/registry/syncrobotic/shell/island"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { feedback } from "@/registry/syncrobotic/lib/feedback"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"

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
  { id: "9C44", x: 72, y: 22, tone: "warning", status: "Needs attention", battery: 18 },
  { id: "4D21", x: 48, y: 70, tone: "danger", status: "Stopped", battery: 64 },
  { id: "2B10", x: 85, y: 78, tone: "normal", status: "Docked", battery: 100 },
]

const alarms: AlarmData[] = [
  { id: "a1", priority: "critical", title: "Emergency stop", source: "4D21, Warehouse", time: "14:02", active: true, acknowledged: false },
  { id: "a2", priority: "high", title: "Battery 18 %", source: "9C44", time: "14:01", active: true, acknowledged: false },
]

/**
 * Map workspace: the site map fills the screen; floating trays hold the selected robot, the most urgent alarm
 * and the emergency stop. The map here is a drawing; swap in your map or video component.
 */
export function MapWorkspace() {
  const [selected, setSelected] = React.useState("7F3A")
  // The stop as in the dock: ready, sending until the robot confirms, then stopped with slide to release.
  const [stop, setStop] = React.useState<"ready" | "sending" | "stopped">("ready")
  const [list, setList] = React.useState(alarms)
  const robot = robots.find((r) => r.id === selected)!

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#map"
      title="Map · North site"
      environment="staging"
      user={sampleUser}
      bleed
    >
      {/*
        On a phone the trays would cover a third of the map, and a focused marker under one cannot be seen (WCAG 2.4.11):
        there the robot's tray sits above the map and the stop below it. From sm up they float over the map's corners.
      */}
      <div className="flex h-full min-h-96 flex-col gap-4 overflow-hidden bg-map sm:relative sm:block">
        <Tray className="z-10 m-4 mb-0 shrink-0 sm:absolute sm:top-4 sm:left-4 sm:m-0 sm:w-72">
          <div className="flex flex-col gap-3 rounded-md bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold">Patrol dog {robot.id}</h2>
              <InlineStatus status={robot.tone}>{robot.status}</InlineStatus>
            </div>
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

        {/* On phones the map gives way: the tray and the stop keep their size, so the stop is on screen on any phone. */}
        <div className="relative min-h-0 flex-1 sm:absolute sm:inset-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i} className="stroke-edge" strokeWidth="0.15">
                <line x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
                <line x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
              </g>
            ))}
            <rect x="40" y="58" width="22" height="24" className="fill-none stroke-map-point" strokeWidth="0.3" />
            {robot.route && (
              <polyline points={robot.route.map((p) => p.join(",")).join(" ")} className="fill-none stroke-info" strokeWidth="0.5" strokeDasharray="1.5 1" />
            )}
          </svg>

          {robots.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-label={`${r.id}, ${r.status}`}
              aria-pressed={r.id === selected}
              onClick={() => setSelected(r.id)}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
              className={cn(
                "press absolute flex size-(--h-md) -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm",
                r.id === selected && "ring-2 ring-foreground",
              )}
            >
              <StatusGlyph status={r.tone} className="size-4" />
              <span className="absolute top-full font-mono text-xs">{r.id}</span>
            </button>
          ))}
        </div>

        {/* Only while an alarm shows: an empty tray would float as a bare pill. The island stays mounted so it hears new alarms. */}
        <Tray className="absolute top-4 right-4 z-10 hidden w-96 lg:has-[[role=group]]:flex">
          <IslandAlarm alarms={list} onAcknowledge={(id) => setList((l) => l.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))} />
        </Tray>

        <div className="z-10 m-4 mt-0 shrink-0 sm:absolute sm:right-4 sm:bottom-4 sm:m-0 sm:w-72">
          {stop === "stopped" ? (
            <SlideToRelease tag={robot.id} onRelease={() => window.setTimeout(() => setStop("ready"), 500)} />
          ) : (
            <StopButton
              state={stop}
              tag={robot.id}
              onStop={() => {
                setStop("sending")
                // The robot confirms: the app says so to the hand, then offers release.
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
