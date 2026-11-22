import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { robotMapLabels, waypointEditorLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import type { RobotMapRobot, RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
import { Toaster } from "@/registry/syncrobotic/ui/toast"
import { WaypointEditor, type Waypoint, type WaypointEditorMap } from "@/registry/syncrobotic/ui/waypoint-editor"

const meta: Meta = { title: "Inputs/Waypoint editor" }
export default meta
type S = StoryObj

// North site, as in the robot map's stories: a 60 × 36 m warehouse with racks down the middle, a cold store (no entry)
// top right, the loading bay along the bottom and the docks on the left wall. Every value is fixed, so each load (and
// each screenshot) is the same.
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

const robots: RobotMapRobot[] = [{ id: "amr-07", name: "AMR-07", x: 4, y: 9, heading: 90, status: "normal", statusLabel: "Charging" }]

const northSite: WaypointEditorMap = { label: "North site: AMR-07's night patrol", width: 60, height: 36, floorplan: <NorthSiteFloor />, zones, robots, snap: 0.5 }

/** AMR-07's night patrol: out of the dock, along the racks, a photo at the bay door, back to charge. */
const patrol: Waypoint[] = [
  { id: "leave-dock", name: "Leave dock", at: { kind: "plan", x: 8, y: 9 }, heading: 90, action: { type: "none" } },
  { id: "aisle-west", name: "Aisle 1 north", at: { kind: "plan", x: 11, y: 4 }, action: { type: "wait", seconds: 10 } },
  { id: "aisle-east", name: "Aisle 5 north", at: { kind: "plan", x: 41, y: 4 }, heading: 90, action: { type: "photo" }, dwell: 5 },
  { id: "bay-door", name: "Bay door 2", at: { kind: "plan", x: 41, y: 25 }, heading: 180, action: { type: "custom", name: "Check door sensor" }, dwell: 20 },
  { id: "aisle-return", name: "Aisle 1 south", at: { kind: "plan", x: 11, y: 25 }, action: { type: "none" } },
  { id: "dock", name: "Dock 2", at: { kind: "plan", x: 3, y: 9 }, heading: 270, action: { type: "dock" } },
]

/** The app's side: it keeps the saved route, and the editor keeps the draft until Save. */
function Patrol({ value: initial = patrol, ...props }: Partial<React.ComponentProps<typeof WaypointEditor>>) {
  const [value, setValue] = React.useState(initial)
  return (
    <>
      <WaypointEditor value={value} onSave={setValue} map={northSite} speed={1.2} {...props} />
      <Toaster />
    </>
  )
}

/** The patrol on the North site, no changes yet: list beside the map from 768 px, the list first with the map a tab below that. */
export const WaypointEditorRoute: S = {
  render: () => <Patrol />,
}

/** A waypoint selected from its row: its point is ringed on the map, its fields open under the row. */
export const WaypointEditorSelected: S = {
  render: () => <Patrol defaultSelected="aisle-east" />,
}

/**
 * A draft with problems: a waypoint inside the cold store (no entry), one 0.3 m from the one before, one with no name
 * and a custom action with no name. Each says why on its row, the points carry the warning shape, and Save says what to fix.
 */
export const WaypointEditorProblems: S = {
  render: () => (
    <Patrol
      defaultDraft={[
        patrol[0]!,
        patrol[1]!,
        { ...patrol[2]!, name: "", at: { kind: "plan", x: 48, y: 8 } },
        { ...patrol[3]!, action: { type: "custom", name: "" } },
        { id: "too-close", name: "Bay door 2, again", at: { kind: "plan", x: 41.3, y: 25 }, action: { type: "none" } },
        patrol[5]!,
      ]}
      defaultSelected="aisle-east"
    />
  ),
}

/** Unsaved changes that can be saved: the draft added a stop, and Save is ready. */
export const WaypointEditorUnsaved: S = {
  render: () => (
    <Patrol defaultDraft={[...patrol.slice(0, 4), { id: "bay-west", name: "Bay door 1", at: { kind: "plan", x: 24, y: 25 }, action: { type: "photo" } }, ...patrol.slice(4)]} />
  ),
}

/** For viewers: the route, the map and each waypoint's details, with nothing that changes them. */
export const WaypointEditorReadOnly: S = {
  render: () => <Patrol readOnly defaultSelected="bay-door" />,
}

/** A new route: the map is there to click on, and the list says how to start. */
export const WaypointEditorEmpty: S = {
  render: () => <Patrol value={[]} />,
}

/**
 * Without a map: the list alone, here with latitude and longitude (a site survey outdoors). The editor measures the
 * route on the globe; its map draws plan waypoints only, so a geographic route takes your own map beside it.
 */
export const WaypointEditorGeo: S = {
  render: () => (
    <Patrol
      map={undefined}
      speed={1.5}
      value={[
        { id: "gate", name: "North gate", at: { kind: "geo", lat: 25.03312, lon: 121.56542 }, heading: 180, action: { type: "none" } },
        { id: "lot", name: "Parking lot B", at: { kind: "geo", lat: 25.03241, lon: 121.56601 }, action: { type: "photo" }, dwell: 10 },
        { id: "fence", name: "East fence", at: { kind: "geo", lat: 25.03198, lon: 121.56713 }, action: { type: "wait", seconds: 30 } },
      ]}
    />
  ),
}

/** The Traditional Chinese (Taiwan) pack, with numbers formatted for zh-TW. */
export const WaypointEditorZhTw: S = {
  render: () => <Patrol labels={waypointEditorLabels} locale={zhTW} map={{ ...northSite, label: "北區：AMR-07 夜間巡邏", labels: robotMapLabels }} defaultSelected="bay-door" />,
}
