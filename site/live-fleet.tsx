"use client"

import * as React from "react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { PointCloud } from "@/registry/syncrobotic/ui/point-cloud"
import type { RobotMapPoint, RobotMapRobot } from "@/registry/syncrobotic/ui/robot-map"
import { useLive } from "./live"

// A fleet for the home page: four patrol dogs on a 60 × 36 m site, reporting their pose every 2 s. Two patrol, one docked
// robot charges, and one runs low and drives back to its dock, which the list says. The 3D view is that robot's own lidar:
// the site's walls, racks and the other robots, scanned from where it is, so the view turns and moves as it drives home.
// Every frame is a function of the step, so it is the same on every machine.
const EVERY = 2000
const CYCLE = 50
// The still frame: the low robot on its way to the dock, its route drawn.
const STILL_AT = 7

const W = 60
const H = 36
/** A seeded random generator: every load draws the same site. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The site as a lidar would return it, in map metres (x east, y south, z up), with an intensity per point: the floor, the
// outer walls, the cold store's wall, five racks and the loading bay's wall. Drawn once.
type World = { xyz: Float32Array; intensity: Float32Array }
let world: World | null = null
function site(): World {
  if (world) return world
  const rand = seeded(11)
  const xyz: number[] = []
  const inten: number[] = []
  const add = (x: number, y: number, z: number, i: number) => {
    xyz.push(x, y, z)
    inten.push(i + (rand() - 0.5) * 12)
  }
  const wall = (x0: number, y0: number, x1: number, y1: number, h: number, n: number, i = 40) => {
    for (let k = 0; k < n; k++) {
      const t = rand()
      add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, rand() * h, i)
    }
  }
  for (let k = 0; k < 9000; k++) add(rand() * W, rand() * H, 0, 28)
  wall(0, 0, W, 0, 4, 2400)
  wall(0, H, W, H, 4, 2400)
  wall(0, 0, 0, H, 4, 1500)
  wall(W, 0, W, H, 4, 1500)
  wall(44, 0, 44, 18, 4, 1100)
  wall(44, 18, W, 18, 4, 1000)
  wall(0, 28, 10, 28, 1.2, 400)
  wall(18, 28, W, 28, 1.2, 1600)
  for (const x of [14, 20, 26, 32, 38]) {
    // A rack: its two long faces, uprights with reflective tape, and boxes on three levels.
    for (let k = 0; k < 1500; k++) {
      const y = 6 + rand() * 16
      const face = rand() < 0.5 ? x : x + 2
      const z = [0.15, 1.2, 2.25][Math.floor(rand() * 3)]! + rand() * 0.8
      add(face, y, z, 70)
    }
    for (let post = 6; post <= 22; post += 2.7) for (let k = 0; k < 60; k++) add(x + (rand() < 0.5 ? 0 : 2), post, rand() * 3.2, rand() < 0.15 ? 230 : 95)
  }
  world = { xyz: new Float32Array(xyz), intensity: new Float32Array(inten) }
  return world
}

const RANGE = 14 // metres the lidar reaches

/** The site and the other robots as `robot`'s lidar sees them: x forward, y left, z up, within its range. */
function scanFrom(robot: { x: number; y: number; heading?: number }, others: { x: number; y: number }[]) {
  const w = site()
  const h = ((robot.heading ?? 0) * Math.PI) / 180
  // Forward and left on the map (y runs south), from the heading (0 is north, clockwise).
  const fx = Math.sin(h)
  const fy = -Math.cos(h)
  const lx = -Math.cos(h)
  const ly = -Math.sin(h)
  const xyz: number[] = []
  const inten: number[] = []
  const take = (x: number, y: number, z: number, i: number) => {
    const dx = x - robot.x
    const dy = y - robot.y
    if (dx * dx + dy * dy > RANGE * RANGE) return
    xyz.push(dx * fx + dy * fy, dx * lx + dy * ly, z)
    inten.push(i)
  }
  for (let k = 0; k < w.intensity.length; k++) take(w.xyz[k * 3]!, w.xyz[k * 3 + 1]!, w.xyz[k * 3 + 2]!, w.intensity[k]!)
  // The other robots: a 0.9 × 0.6 m body, 0.7 m tall, on their reflective side panels.
  const rand = seeded(3)
  for (const o of others) for (let k = 0; k < 160; k++) take(o.x + (rand() - 0.5) * 0.9, o.y + (rand() - 0.5) * 0.6, rand() * 0.7, 200)
  return { points: new Float32Array(xyz), intensity: new Float32Array(inten) }
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

function fleetAt(step: number): { robots: Row[] } {
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
  return { robots }
}

// The line under the view (point count, colour scale) and its gap: the view takes the rest of the box.
const FOOTER = 32
const frame = "grid h-full gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"

export default function LiveFleet() {
  const [step, setStep] = React.useState(0)
  const { ref, still } = useLive<HTMLDivElement>(EVERY, () => setStep((s) => s + 1))
  const { robots } = fleetAt(still ? STILL_AT : step)
  const low = robots.find((r) => r.id === "9C44")!
  const scan = scanFrom(low, robots.filter((r) => r.id !== low.id))
  // The view takes the box's own proportions, so it fills it at every width.
  const box = React.useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = React.useState(16 / 9)
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && e.contentRect.height > 0 && setRatio(e.contentRect.width / Math.max(1, e.contentRect.height - FOOTER)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className={frame}>
      {/* The view sits over its box, so its own height never feeds back into the box it is measured from. */}
      <div ref={box} className="relative h-64 sm:h-72 lg:h-full">
        <PointCloud
          label="Front lidar, Patrol dog 9C44"
          points={scan.points}
          intensity={scan.intensity}
          robot
          aspectRatio={ratio}
          staleAfterMs={null}
          className="absolute inset-0"
        />
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
