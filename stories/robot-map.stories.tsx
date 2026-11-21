import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  RobotMap,
  RobotMapList,
  rosToPlan,
  type RobotMapGrid,
  type RobotMapPath,
  type RobotMapRobot,
  type RobotMapScan,
  type RobotMapZone,
} from "@/registry/syncrobotic/ui/robot-map"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Charts/Robot map" }
export default meta
type S = StoryObj

// North site: a 60 × 36 m warehouse. Racks down the middle, a cold store top right, the loading bay along the bottom
// and the charging docks on the left wall.
const site = { width: 60, height: 36 }

/** The floor plan, drawn in metres: walls and racks as hairlines. A product passes its own plan, or an image URL. */
function NorthSiteFloor() {
  const racks = [14, 20, 26, 32, 38]
  return (
    <g className="fill-none stroke-map-point" strokeWidth="1" vectorEffect="non-scaling-stroke">
      {racks.map((x) => (
        <rect key={x} x={x} y={6} width={2} height={16} vectorEffect="non-scaling-stroke" />
      ))}
      <path d="M44 0V18H60" vectorEffect="non-scaling-stroke" />
      <path d="M0 28H10M18 28H60" vectorEffect="non-scaling-stroke" />
    </g>
  )
}

const zones: RobotMapZone[] = [
  {
    id: "cold",
    kind: "restricted",
    label: "Cold store",
    points: [
      [44, 0],
      [60, 0],
      [60, 18],
      [44, 18],
    ],
  },
  {
    id: "bay",
    kind: "slow",
    label: "Loading bay",
    points: [
      [10, 28],
      [60, 28],
      [60, 36],
      [10, 36],
    ],
  },
  {
    id: "docks",
    kind: "charging",
    label: "Docks 1–3",
    points: [
      [0, 4],
      [6, 4],
      [6, 14],
      [0, 14],
    ],
  },
]

const robots: RobotMapRobot[] = [
  { id: "amr-07", name: "AMR-07", x: 23, y: 24, heading: 90, status: "active", statusLabel: "On mission" },
  { id: "amr-11", name: "AMR-11", x: 41, y: 12, heading: 180, status: "warning", statusLabel: "Battery 12 %" },
  { id: "amr-03", name: "AMR-03", x: 30, y: 32, heading: 270, status: "danger", statusLabel: "Stopped" },
  { id: "amr-14", name: "AMR-14", x: 3, y: 9, heading: 0, status: "normal", statusLabel: "Charging" },
]

const paths: RobotMapPath[] = [
  {
    id: "amr-07-track",
    kind: "travelled",
    robotId: "amr-07",
    points: [
      [4, 16],
      [10, 16],
      [10, 24],
      [23, 24],
    ],
  },
  {
    id: "amr-07-route",
    kind: "planned",
    robotId: "amr-07",
    points: [
      [23, 24],
      [42, 24],
      [42, 31],
      [52, 31],
    ],
  },
]

/** A map with its text view, as a chart has its table: a Map / List switch above it. */
function WithList({ title, defaultSelected = null, ...props }: { title: string; defaultSelected?: string | null } & Partial<React.ComponentProps<typeof RobotMap>>) {
  const [view, setView] = React.useState("map")
  const [selected, setSelected] = React.useState<string | null>(defaultSelected)
  const shared = { label: `Map of ${title}`, robots, zones, selectedId: selected, onSelect: (id: string | null) => setSelected(id), ...props }
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="map">Map</SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "map" ? <RobotMap {...site} floorplan={<NorthSiteFloor />} paths={paths} {...shared} /> : <RobotMapList {...shared} />}
    </div>
  )
}

/** North site with its zones and four robots. Only the two that need someone are coloured, and they say why. */
export const RobotMapSite: S = {
  render: () => <WithList title="North site" />,
}

/**
 * A robot selected from the list: a ring and bold name on the map, a bar and bold name in the list, never only colour.
 * Map and list side by side on a wide screen; the north arrow shows because the site's plan is not drawn north up.
 */
function SideBySide() {
  const [selected, setSelected] = React.useState<string | null>("amr-07")
  return (
    <div className="grid w-full gap-4 lg:grid-cols-[2fr_1fr]">
      <RobotMap
        label="Map of North site"
        {...site}
        floorplan={<NorthSiteFloor />}
        zones={zones}
        robots={robots}
        paths={paths}
        northDeg={30}
        selectedId={selected}
        onSelect={setSelected}
      />
      <RobotMapList label="Robots on North site" robots={robots} zones={zones} selectedId={selected} onSelect={setSelected} />
    </div>
  )
}

export const RobotMapSelected: S = {
  render: () => <SideBySide />,
}

/** No robots on the site: the plan and zones still show, and the map says there are none rather than looking empty. */
export const RobotMapEmpty: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <RobotMap label="Map of North site" {...site} floorplan={<NorthSiteFloor />} zones={zones} robots={[]} />
      <RobotMapList label="Robots on North site" robots={[]} zones={zones} />
    </div>
  ),
}

export const RobotMapLoading: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <RobotMap label="Map of North site" {...site} loading />
      <RobotMapList label="Robots on North site" loading />
    </div>
  ),
}

export const RobotMapError: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <RobotMap label="Map of North site" {...site} error="The map of North site could not be loaded. The fleet server did not answer." onRetry={() => {}} />
      <RobotMapList label="Robots on North site" error="Robot positions could not be loaded." onRetry={() => {}} />
    </div>
  ),
}

// ---------------------------------------------------------------------------------------------------------------------
// The same warehouse as a robot maps it: a ROS occupancy grid at 5 cm a cell (1200 × 720), made here from the plan's
// rectangles so the stories load nothing. The map frame's origin is off the corner, as SLAM leaves it.
// ---------------------------------------------------------------------------------------------------------------------

const RES = 0.05
const ORIGIN = { x: -12.5, y: -8 }
/** Walls and racks in plan metres: x, y (top-left), width, height. The cold store has a door at y 14–16. */
const solid: [number, number, number, number][] = [
  [0, 0, 60, 0.2],
  [0, 35.8, 60, 0.2],
  [0, 0, 0.2, 36],
  [59.8, 0, 0.2, 36],
  [44, 0, 0.2, 14],
  [44, 16, 0.2, 2],
  [44, 17.8, 16, 0.2],
  [0, 27.9, 10, 0.2],
  [18, 27.9, 42, 0.2],
  ...[14, 20, 26, 32, 38].map((x): [number, number, number, number] => [x, 6, 2, 16]),
]
/** How far a point is from the nearest wall or rack, in metres (0 inside one). */
const clearance = (x: number, y: number) =>
  Math.min(...solid.map(([rx, ry, rw, rh]) => Math.hypot(Math.max(rx - x, 0, x - rx - rw), Math.max(ry - y, 0, y - ry - rh))))
/** A small seeded generator, so the speckle along the walls is the same on every render and screenshot. */
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)

/** Each cell from its centre on the plan; row 0 is the bottom row, as in nav_msgs/OccupancyGrid. */
function makeGrid(resolution: number, cell: (x: number, y: number, rnd: () => number) => number): RobotMapGrid {
  const width = Math.round(site.width / resolution)
  const height = Math.round(site.height / resolution)
  const data = new Int8Array(width * height)
  const rnd = seeded(7)
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) data[row * width + col] = cell((col + 0.5) * resolution, site.height - (row + 0.5) * resolution, rnd)
  return { width, height, resolution, origin: ORIGIN, data }
}

let warehouse: RobotMapGrid | undefined
/** Made once, on first use, and kept: the map draws a grid again only when its data array changes. */
const warehouseGrid = () =>
  (warehouse ??= makeGrid(RES, (x, y, rnd) => {
    // Inside the cold store, beyond its door, the robot has never seen: unknown.
    if (x > 44.2 && y < 17.8 && !(x < 47 && y > 13 && y < 17)) return -1
    const d = clearance(x, y)
    if (d === 0) return 100
    // Scan noise along the walls: a few cells the robot is unsure about.
    if (d < 0.15 && rnd() < 0.35) return 40 + Math.round(rnd() * 40)
    return 0
  }))

let costs: RobotMapGrid | undefined
/** The global costmap at 10 cm: lethal in a wall, falling off over 1.5 m of inflation around it. */
const warehouseCostmap = () =>
  (costs ??= makeGrid(0.1, (x, y) => {
    const d = clearance(x, y)
    if (d === 0) return 100
    if (d < 0.35) return 99
    return d < 1.5 ? Math.round(98 * Math.exp(-2.5 * (d - 0.35))) : 0
  }))

const frame = { width: site.width, height: site.height, origin: ORIGIN }
/** Robots as they arrive from ROS (map frame, yaw in radians), converted for the map. */
const fromRos = (id: string, name: string, x: number, y: number, yaw: number, status: RobotMapRobot["status"], statusLabel?: string): RobotMapRobot => {
  const p = rosToPlan(frame, { x, y, yaw })
  return { id, name, x: p.x, y: p.y, heading: p.heading, status, statusLabel }
}
const gridRobots: RobotMapRobot[] = [
  fromRos("amr-07", "AMR-07", 10.5, 4, 0, "active", "On mission"),
  fromRos("amr-11", "AMR-11", 28.5, 16, -Math.PI / 2, "warning", "Battery 12 %"),
  fromRos("amr-14", "AMR-14", -9.5, 19, Math.PI / 2, "normal", "Charging"),
]

/** A grid with no plan image: the grid is the floor, its size the site's. Zones, routes and robots sit on it as on any plan. */
function GridSite({ withCostmap = false }: { withCostmap?: boolean }) {
  const [view, setView] = React.useState("map")
  const [selected, setSelected] = React.useState<string | null>(null)
  const shared = { label: "Map of North site", robots: gridRobots, zones, selectedId: selected, onSelect: (id: string | null) => setSelected(id) }
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">North site, as mapped</p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="map">Map</SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "map" ? (
        <RobotMap grid={warehouseGrid()} costmap={withCostmap ? warehouseCostmap() : undefined} paths={withCostmap ? paths : undefined} {...shared} />
      ) : (
        <RobotMapList {...shared} />
      )}
    </div>
  )
}

/** The floor as the robots mapped it (a 1200 × 720 occupancy grid): free floor, walls and racks in ink, the unseen cold store hatched. */
export const RobotMapOccupancyGrid: S = {
  render: () => <GridSite />,
}

/** The global costmap over the grid, in the accent's ramp from clear to lethal, with its legend; the route being driven stays the one blue. */
export const RobotMapCostmap: S = {
  render: () => <GridSite withCostmap />,
}

/** How far a beam from (x, y) along (dx, dy) on the plan travels before it meets a wall or rack (slab test per box). */
function cast(x: number, y: number, dx: number, dy: number) {
  let best = Infinity
  for (const [rx, ry, rw, rh] of solid) {
    const tx1 = (rx - x) / dx
    const tx2 = (rx + rw - x) / dx
    const ty1 = (ry - y) / dy
    const ty2 = (ry + rh - y) / dy
    const near = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2))
    const far = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2))
    if (far >= Math.max(near, 0) && near < best) best = Math.max(near, 0)
  }
  return best
}

/** A 270° lidar with 1080 beams and a 12 m reach, as a ROS driver publishes it: misses past its reach are Infinity. */
function lidar(robot: RobotMapRobot): RobotMapScan {
  const rnd = seeded(robot.id.length * 31 + Math.round(robot.x))
  const angleMin = (-3 * Math.PI) / 4
  const angleIncrement = ((3 * Math.PI) / 2) / 1080
  // AMR-11's localisation has drifted 3°: its scan lands beside the walls it sees, which is what scans on a map are for.
  const drift = robot.id === "amr-11" ? (3 * Math.PI) / 180 : 0
  const yaw = ((90 - (robot.heading ?? 0)) * Math.PI) / 180 + drift
  const ranges = new Float32Array(1080)
  for (let i = 0; i < 1080; i++) {
    const a = yaw + angleMin + i * angleIncrement
    const r = cast(robot.x, robot.y, Math.cos(a), -Math.sin(a))
    // A little range noise, and now and then a beam with no return (NaN), which the map skips.
    ranges[i] = rnd() < 0.01 ? NaN : r > 12 ? Infinity : r + (rnd() - 0.5) * 0.04
  }
  return { robotId: robot.id, angleMin, angleIncrement, ranges, rangeMin: 0.05, rangeMax: 12 }
}

let scans: RobotMapScan[] | undefined
const robotScans = () => (scans ??= gridRobots.map(lidar))

/**
 * Three robots' laser scans over the grid: small dots, one path per scan, thin enough to show the map under them. Over a grid,
 * whose walls are already ink, the dots take the accent (scanColor="chart-1") so a hit reads against the wall it lands on.
 */
export const RobotMapLaserScans: S = {
  render: () => (
    <div className="flex w-full flex-col gap-3">
      <RobotMap label="Map of North site with laser scans" grid={warehouseGrid()} zones={zones} robots={gridRobots} scans={robotScans()} scanColor="chart-1" />
      <RobotMapList label="Robots on North site" robots={gridRobots} zones={zones} />
    </div>
  ),
}
