import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { RobotMap, RobotMapList, type RobotMapPath, type RobotMapRobot, type RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
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
