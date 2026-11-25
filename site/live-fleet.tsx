"use client"

import * as React from "react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { GeoMap, type GeoMapRobot, type GeoPoint } from "@/registry/syncrobotic/ui/geo-map"
import { useLive } from "./live"

// A fleet for the home page: four patrol dogs in a city park, reporting their pose every 2 s, on a real street map (OpenStreetMap). Two
// patrol, one docked robot charges, and one runs low and drives back to its dock, which the map and the list both say.
// Every frame is a function of the step, so it is the same on every machine. Routes are laid out in metres on a 300 ×
// 180 m patch of the park (x east, y south from its north-west corner) and turned into latitude and longitude.
const EVERY = 2000
const CYCLE = 50
// The still frame: the low robot on its way to the dock, its route drawn.
const STILL_AT = 7

type RobotMapPoint = [number, number]
// The north-west corner of the patch, inside Daan Forest Park, Taipei.
const LAT0 = 25.0313
const LON0 = 121.5345
const M_PER_DEG = 111_320
const geo = ([x, y]: RobotMapPoint): GeoPoint => ({
  lat: LAT0 - y / M_PER_DEG,
  lon: LON0 + x / (M_PER_DEG * Math.cos((LAT0 * Math.PI) / 180)),
})
const CENTER = geo([150, 90])

// Basemap tiles: OpenStreetMap's own, which need no key, credited on the map as its licence asks. They are drawn in
// colour; the map turns them grey (and, on a dark page, dark), so a calm fleet still sits on grey.
const tiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const attribution = "© OpenStreetMap contributors"

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

const lawn: RobotMapPoint[] = [[50, 125], [210, 125], [210, 15], [50, 15]]
const south: RobotMapPoint[] = [[70, 160], [280, 160], [280, 170], [70, 170]]
const home: RobotMapPoint[] = [[150, 125], [40, 125], [40, 45], [15, 45]]
const SPEED = 8 // metres a step (4 m/s, so the 2 s steps show on a map of the whole patch)

type Row = Omit<GeoMapRobot, "lat" | "lon"> & { x: number; y: number; battery: number; place: string }

function fleetAt(step: number): { robots: Row[]; route: RobotMapPoint[] } {
  const s = step % CYCLE
  // 9C44 drives home on what is left of its battery, then charges.
  const homeLen = home.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - home[i][0], p[1] - home[i][1]), 0)
  const homeAt = along(home, s * SPEED, false)
  const docked = s * SPEED >= homeLen
  const homeBattery = docked ? 12 + (s - homeLen / SPEED) * 0.5 : 14 - s * 0.08
  const p7 = along(lawn, 200 + step * SPEED)
  const p1 = along(south, 150 + step * SPEED)
  const robots: Row[] = [
    { id: "7F3A", name: "7F3A", ...p7, status: "active", statusLabel: "Patrolling", battery: 72 - (step % 200) * 0.05, place: "Central lawn" },
    { id: "1A08", name: "1A08", ...p1, status: "active", statusLabel: "Patrolling", battery: 55 - (step % 200) * 0.05, place: "South path" },
    {
      id: "9C44",
      name: "9C44",
      ...homeAt,
      status: docked ? "normal" : "warning",
      statusLabel: docked ? "Charging" : "Returning to dock",
      battery: homeBattery,
      place: docked ? "Dock 2" : "Central lawn",
    },
    { id: "2B10", name: "2B10", x: 15, y: 27, heading: 90, status: "normal", statusLabel: "Docked", battery: 100, place: "Dock 1" },
  ]
  // The way home is a process under way: the one blue line on the map.
  const route: RobotMapPoint[] = docked ? [] : [[homeAt.x, homeAt.y], ...home.slice(legIndex(s * SPEED) + 1)]
  return { robots, route }
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
  const { robots, route } = fleetAt(still ? STILL_AT : step)
  const onMap: GeoMapRobot[] = robots.map(({ x, y, battery: _b, place: _p, ...r }) => ({ ...r, ...geo([x, y]) }))
  return (
    <div ref={ref} className={frame}>
      <div className="h-64 sm:h-72 lg:h-full [&_image]:opacity-80 [&_image]:grayscale dark:[&_image]:opacity-60 dark:[&_image]:invert">
        <GeoMap
          label="Map of the park patrol"
          tileUrl={tiles}
          attribution={attribution}
          center={CENTER}
          zoom={17.25}
          robots={onMap}
          route={route.map(geo)}
          routeActive
          fill
          className="h-full"
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
