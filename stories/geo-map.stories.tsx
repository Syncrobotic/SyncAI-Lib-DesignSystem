import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { GeoMap, GeoMapList, type GeoMapFence, type GeoMapGoal, type GeoMapRobot, type GeoPoint } from "@/registry/syncrobotic/ui/geo-map"
import { geoGoalToGeoPoseStamped, navSatFixToGeo, type RosNavSatFix } from "@/registry/syncrobotic/lib/ros"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Charts/Geo map" }
export default meta
type S = StoryObj

// Every story is drawn from data written here and loads nothing from the network: the coordinate grid, or the made-up
// farm's tiles that scripts/geo-tiles.mjs writes into public/media/tiles. Never point a story at a real tile server.

/** A place `east` and `north` metres from a centre: close enough to flat for a site. */
const near =
  (centre: GeoPoint) =>
  (east: number, north: number): GeoPoint => ({
    lat: centre.lat + north / 111320,
    lon: centre.lon + east / (111320 * Math.cos((centre.lat * Math.PI) / 180)),
  })
const box = (at: (e: number, n: number) => GeoPoint, e0: number, n0: number, e1: number, n1: number) => [at(e0, n0), at(e1, n0), at(e1, n1), at(e0, n1)]

// ---------------------------------------------------------------------------------------------------------------------
// A solar farm patrolled at night: the perimeter is the work area, the substation is out of bounds. No tiles: robots in
// the field often have no internet, and the grid in degrees needs none.
// ---------------------------------------------------------------------------------------------------------------------

const solar = near({ lat: 24.8812, lon: 121.1468 })
const patrolFences: GeoMapFence[] = [
  { id: "perimeter", kind: "allowed", label: "Solar farm", points: [solar(-260, -150), solar(240, -150), solar(260, 140), solar(-240, 160)] },
  { id: "substation", kind: "keep-out", label: "Substation", points: box(solar, 110, -85, 180, -35) },
]
const patrolRoute = [solar(-220, -120), solar(200, -120), solar(220, 0), solar(60, 120), solar(-200, 130)]
const patrolRobots: GeoMapRobot[] = [
  {
    id: "p1",
    name: "Patrol-1",
    ...solar(120, -120),
    heading: 90,
    status: "active",
    statusLabel: "On patrol",
    fix: "rtk-fixed",
    accuracy: 0.02,
    trail: [solar(-220, -120), solar(-100, -121), solar(20, -119)],
  },
  { id: "p2", name: "Patrol-2", ...solar(-150, 60), heading: 200, status: "warning", statusLabel: "Battery 14 %", fix: "gps", accuracy: 3.2 },
  { id: "p3", name: "Patrol-3", ...solar(-230, -60), heading: 0, status: "normal", statusLabel: "Charging", fix: "rtk-float", accuracy: 0.4 },
  { id: "p4", name: "Patrol-4", ...solar(40, 90), status: "normal", statusLabel: "Waiting", fix: "none" },
]

/** A map with its text view, as a chart has its table: a Map / List switch above it. */
function WithList({ title, ...props }: { title: string } & Partial<React.ComponentProps<typeof GeoMap>>) {
  const [view, setView] = React.useState("map")
  const [selected, setSelected] = React.useState<string | null>(null)
  const shared = { label: `Map of ${title}`, robots: patrolRobots, fences: patrolFences, selectedId: selected, onSelect: (id: string | null) => setSelected(id), ...props }
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto shrink-0">
          <SegmentedControlItem value="map">Map</SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {view === "map" ? <GeoMap route={patrolRoute} routeActive {...shared} /> : <GeoMapList {...shared} />}
    </div>
  )
}

/**
 * A night patrol on the coordinate grid, with no tiles and no network. The work area is a dashed outline, the substation
 * hatched; the route being driven is the one blue line; Patrol-1's trail is grey. Only the robots that need someone are
 * coloured, and Patrol-4 says it has no fix.
 */
export const GeoMapPatrol: S = {
  render: () => <WithList title="Solar farm" />,
}

/** A robot selected in the list: a ring and bold name on the map, a bar and bold name in the list. */
function SideBySide() {
  const [selected, setSelected] = React.useState<string | null>("p2")
  return (
    <div className="grid w-full gap-4 lg:grid-cols-[2fr_1fr]">
      <GeoMap label="Map of Solar farm" robots={patrolRobots} fences={patrolFences} route={patrolRoute} routeActive selectedId={selected} onSelect={setSelected} />
      <GeoMapList label="Robots on Solar farm" robots={patrolRobots} fences={patrolFences} selectedId={selected} onSelect={setSelected} />
    </div>
  )
}

export const GeoMapSelected: S = {
  render: () => <SideBySide />,
}

// ---------------------------------------------------------------------------------------------------------------------
// An orchard on tiles: the made-up farm's test tiles, from this repository. A product passes its own tile server's
// template; the attribution says whose tiles they are.
// ---------------------------------------------------------------------------------------------------------------------

const farm = near({ lat: 24.9, lon: 121.2 })
const farmFences: GeoMapFence[] = [
  { id: "farm", kind: "allowed", label: "Hillside farm", points: [farm(-280, -190), farm(280, -190), farm(280, 250), farm(-280, 250)] },
  { id: "pond", kind: "keep-out", label: "Pond", points: box(farm, 100, 95, 200, 190) },
]
const sprayRoute = [farm(40, -160), farm(240, -160), farm(240, -100), farm(40, -100), farm(40, -40)]
const farmRobots: GeoMapRobot[] = [
  {
    id: "mower-1",
    name: "Mower-1",
    ...farm(-148, 60),
    heading: 0,
    status: "active",
    statusLabel: "Mowing row 14",
    fix: "rtk-fixed",
    accuracy: 0.02,
    trail: [farm(-156, -160), farm(-156, 140), farm(-152, 145), farm(-148, 140), farm(-148, -165 + 10)],
  },
  { id: "sprayer-2", name: "Sprayer-2", ...farm(140, -160), heading: 90, status: "active", statusLabel: "Spraying", fix: "rtk-float", accuracy: 0.3 },
  { id: "scout-3", name: "Scout-3", ...farm(-40, 200), heading: 180, status: "normal", statusLabel: "Parked", fix: "dgps", accuracy: 0.9 },
]

/** Watches the page's theme, so the tiles' own style (light or dark) follows it, as a product's tile server would. */
function useDark() {
  const [dark, setDark] = React.useState(false)
  React.useEffect(() => {
    const html = document.documentElement
    const read = () => setDark(html.classList.contains("dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])
  return dark
}

function Orchard() {
  const dark = useDark()
  const [selected, setSelected] = React.useState<string | null>(null)
  return (
    <div className="flex w-full flex-col gap-3">
      <GeoMap
        label="Map of Hillside farm"
        tileUrl={`/media/tiles/${dark ? "dark" : "light"}/{z}-{x}-{y}.svg`}
        tileMaxZoom={18}
        attribution="Test tiles: a made-up farm"
        robots={farmRobots}
        fences={farmFences}
        route={sprayRoute}
        routeActive
        selectedId={selected}
        onSelect={setSelected}
      />
      <GeoMapList label="Robots on Hillside farm" robots={farmRobots} fences={farmFences} selectedId={selected} onSelect={setSelected} />
    </div>
  )
}

/**
 * An orchard on raster tiles: a mower down a tree row with its trail, a sprayer on the field's route, the pond a hatched
 * keep-out. The tiles are this repository's test set; a product brings its own tile server (OpenStreetMap's forbids heavy
 * use).
 */
export const GeoMapTiles: S = {
  render: () => <Orchard />,
}

// ---------------------------------------------------------------------------------------------------------------------
// Fix quality, straight from sensor_msgs/NavSatFix through `navSatFixToGeo`: the words, and the accuracy as a circle.
// ---------------------------------------------------------------------------------------------------------------------

const yard = near({ lat: 24.95, lon: 121.24 })
const fixMessage = (at: GeoPoint, status: number, sigma: number | null): RosNavSatFix => ({
  status: { status, service: 1 },
  latitude: at.lat,
  longitude: at.lon,
  altitude: 112,
  position_covariance: sigma === null ? [0, 0, 0, 0, 0, 0, 0, 0, 0] : [sigma ** 2, 0, 0, 0, sigma ** 2, 0, 0, 0, (2 * sigma) ** 2],
  position_covariance_type: sigma === null ? 0 : 2,
})
const fixRobots: GeoMapRobot[] = [
  { id: "d1", name: "Courier-1", status: "active", statusLabel: "Delivering", heading: 45, ...navSatFixToGeo(fixMessage(yard(-12, 6), 2, 0.012)) },
  { id: "d2", name: "Courier-2", status: "active", statusLabel: "Delivering", heading: 120, ...navSatFixToGeo(fixMessage(yard(-2, -6), 2, 0.3)) },
  { id: "d3", name: "Courier-3", status: "normal", statusLabel: "Waiting", heading: 270, ...navSatFixToGeo(fixMessage(yard(9, 8), 1, 0.7)) },
  { id: "d4", name: "Courier-4", status: "normal", statusLabel: "Waiting", heading: 180, ...navSatFixToGeo(fixMessage(yard(12, -5), 0, 2.4)) },
  { id: "d5", name: "Courier-5", status: "warning", statusLabel: "Waiting for a fix", ...navSatFixToGeo(fixMessage(yard(-10, -9), -1, null)) },
]

/**
 * Five couriers between buildings, each with the fix its receiver reported: RTK fixed, RTK float, DGPS, plain GPS with its
 * circle of ±3 m, and No fix (its last place, dashed). Converted from NavSatFix messages with `navSatFixToGeo`.
 */
export const GeoMapFixQuality: S = {
  render: () => (
    <div className="flex w-full flex-col gap-3">
      <GeoMap label="Map of the courier yard" robots={fixRobots} center={yard(0, 0)} zoom={20} />
      <GeoMapList label="Couriers in the yard" robots={fixRobots} />
    </div>
  ),
}

// ---------------------------------------------------------------------------------------------------------------------
// Goal mode: click to place a goal, drag to point it, then send it from the card. The story stands in for the app, which
// keeps the goal and would publish `geoGoalToGeoPoseStamped(goal)`.
// ---------------------------------------------------------------------------------------------------------------------

function GoalMode() {
  const [goal, setGoal] = React.useState<GeoMapGoal | null>(null)
  const sent = goal ? geoGoalToGeoPoseStamped(goal) : null
  return (
    <div className="flex w-full flex-col gap-3">
      <GeoMap label="Map of Solar farm: send Patrol-3 somewhere" robots={patrolRobots} fences={patrolFences} mode="goal" goal={goal} onGoal={setGoal} />
      <p className="text-sm text-muted-foreground tabular-nums">
        {sent
          ? `Sent to Patrol-3: ${sent.pose.position.latitude.toFixed(6)}, ${sent.pose.position.longitude.toFixed(6)}${goal?.heading === undefined ? ", any heading" : `, heading ${goal.heading}°`}`
          : "No goal sent."}
      </p>
    </div>
  )
}

/** Goal mode: the goal is placed, then sent on confirm. Inside the substation or outside the farm, the card says so first. */
export const GeoMapGoalMode: S = {
  render: () => <GoalMode />,
}

/** No robots: the fences still show, and the map says there are none rather than look empty. */
export const GeoMapEmpty: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <GeoMap label="Map of Solar farm" robots={[]} fences={patrolFences} />
      <GeoMapList label="Robots on Solar farm" robots={[]} />
    </div>
  ),
}

export const GeoMapLoading: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <GeoMap label="Map of Solar farm" loading />
      <GeoMapList label="Robots on Solar farm" loading />
    </div>
  ),
}

export const GeoMapError: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <GeoMap label="Map of Solar farm" error="Robot positions could not be loaded. The fleet server did not answer." onRetry={() => {}} />
      <GeoMapList label="Robots on Solar farm" error="Robot positions could not be loaded." onRetry={() => {}} />
    </div>
  ),
}
