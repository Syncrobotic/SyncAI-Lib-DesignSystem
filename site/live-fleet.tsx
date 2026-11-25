"use client"

import * as React from "react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { RobotMap, type RobotMapPath, type RobotMapPoint, type RobotMapRobot, type RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
import { useLive } from "./live"

// A fleet for the home page: four patrol dogs on a 60 × 36 m site, reporting their pose every 2 s. Two patrol, one docked
// robot charges, and one runs low and drives back to its dock, which the map and the list both say. Every frame is a
// function of the step, so it is the same on every machine.
const EVERY = 2000
const CYCLE = 50
// The still frame: the low robot on its way to the dock, its route drawn.
const STILL_AT = 7

const W = 60
const H = 36
const zones: RobotMapZone[] = [
  { id: "cold", kind: "restricted", label: "Cold store", points: [[44, 0], [60, 0], [60, 18], [44, 18]] },
  { id: "bay", kind: "slow", label: "Loading bay", points: [[10, 28], [60, 28], [60, 36], [10, 36]] },
  { id: "docks", kind: "charging", label: "Docks", points: [[0, 4], [6, 4], [6, 14], [0, 14]] },
]

/** Walls and racks as hairlines, in metres. */
function Floor() {
  return (
    <g className="fill-none stroke-map-point" strokeWidth="1">
      {[14, 20, 26, 32, 38].map((x) => (
        <rect key={x} x={x} y={6} width={2} height={16} vectorEffect="non-scaling-stroke" />
      ))}
      <path d="M44 0V18H60" vectorEffect="non-scaling-stroke" />
      <path d="M0 28H10M18 28H60" vectorEffect="non-scaling-stroke" />
    </g>
  )
}

/** Where a robot is after `d` metres along a route (closed when `loop`), and which way it faces. */
function along(points: RobotMapPoint[], d: number, loop = true) {
  const legs = (loop ? [...points, points[0]] : points).slice(1).map((b, i) => {
    const a = points[i]
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }
  })
  const total = legs.reduce((s, l) => s + l.len, 0)
  let rest = loop ? ((d % total) + total) % total : Math.min(Math.max(d, 0), total)
  for (const { a, b, len } of legs) {
    if (rest <= len || len === 0) {
      const k = len ? rest / len : 0
      const heading = (Math.atan2(b[0] - a[0], a[1] - b[1]) * 180) / Math.PI
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, heading: (heading + 360) % 360 }
    }
    rest -= len
  }
  const [a, b] = [points.at(-2)!, points.at(-1)!]
  return { x: b[0], y: b[1], heading: ((Math.atan2(b[0] - a[0], a[1] - b[1]) * 180) / Math.PI + 360) % 360 }
}

const aisle: RobotMapPoint[] = [[10, 25], [42, 25], [42, 3], [10, 3]]
const bay: RobotMapPoint[] = [[14, 32], [56, 32], [56, 34], [14, 34]]
const home: RobotMapPoint[] = [[30, 25], [8, 25], [8, 9], [3, 9]]
const SPEED = 1.6 // metres a step (0.8 m/s)

type Row = RobotMapRobot & { battery: number; place: string }

function fleetAt(step: number): { robots: Row[]; paths: RobotMapPath[] } {
  const s = step % CYCLE
  // 9C44 drives home on what is left of its battery, then charges.
  const homeLen = home.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - home[i][0], p[1] - home[i][1]), 0)
  const homeAt = along(home, s * SPEED, false)
  const docked = s * SPEED >= homeLen
  const homeBattery = docked ? 12 + (s - homeLen / SPEED) * 0.5 : 14 - s * 0.08
  const p7 = along(aisle, 40 + step * SPEED)
  const p1 = along(bay, 30 + step * SPEED)
  const robots: Row[] = [
    { id: "7F3A", name: "7F3A", ...p7, status: "active", statusLabel: "Patrolling", battery: 72 - (step % 200) * 0.05, place: "Aisles" },
    { id: "1A08", name: "1A08", ...p1, status: "active", statusLabel: "Patrolling", battery: 55 - (step % 200) * 0.05, place: "Loading bay" },
    {
      id: "9C44",
      name: "9C44",
      ...homeAt,
      status: docked ? "normal" : "warning",
      statusLabel: docked ? "Charging" : "Returning to dock",
      battery: homeBattery,
      place: docked ? "Dock 2" : "Aisles",
    },
    { id: "2B10", name: "2B10", x: 3, y: 5.5, heading: 90, status: "normal", statusLabel: "Docked", battery: 100, place: "Dock 1" },
  ]
  // The way home is a process under way: the one blue line on the map.
  const paths: RobotMapPath[] = docked
    ? []
    : [{ id: "9c44-home", kind: "planned", robotId: "9C44", points: [[homeAt.x, homeAt.y], ...home.slice(legIndex(s * SPEED) + 1)] }]
  return { robots, paths }
}

/** The index of the route corner a robot `d` metres along `home` has passed. */
function legIndex(d: number) {
  let rest = d
  for (let i = 1; i < home.length; i++) {
    const len = Math.hypot(home[i][0] - home[i - 1][0], home[i][1] - home[i - 1][1])
    if (rest < len) return i - 1
    rest -= len
  }
  return home.length - 1
}

const frame = "grid h-full gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"

export default function LiveFleet() {
  const [step, setStep] = React.useState(0)
  const { ref, still } = useLive<HTMLDivElement>(EVERY, () => setStep((s) => s + 1))
  const { robots, paths } = fleetAt(still ? STILL_AT : step)
  return (
    <div ref={ref} className={frame}>
      <div className="h-64 sm:h-72 lg:h-full">
        <RobotMap label="Map of North site" width={W} height={H} floorplan={<Floor />} zones={zones} robots={robots} paths={paths} fill className="h-full" />
      </div>
      <ul role="list" className="flex flex-col rounded-md bg-card ring-1 ring-border">
        {robots.map((r) => (
          <li key={r.id} className="flex h-20 flex-col justify-center gap-2 border-b border-border px-4 last:border-b-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">Patrol dog {r.name}</span>
              <span className="truncate text-sm text-muted-foreground">{r.place}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <InlineStatus status={r.status}>{r.statusLabel}</InlineStatus>
              <Meter value={Math.round(r.battery)} label={`Battery, Patrol dog ${r.name}`} low={15} inline />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
