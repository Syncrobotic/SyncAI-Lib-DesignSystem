// @syncrobotic/geo-map v0.40.0 · update: npx shadcn add @syncrobotic/geo-map --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Crosshair, LocateOff, RotateCw, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/registry/syncrobotic/lib/format-count"
import { StatusGlyph, statusText, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup } from "@/registry/syncrobotic/ui/button-group"
import { ViewportOverlay, ViewportPanel } from "@/registry/syncrobotic/ui/viewport-overlay"
import { SafetyZone } from "@/registry/syncrobotic/ui/robot-icons"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { clamp } from "@/registry/syncrobotic/lib/math"
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"

/** A place on Earth in WGS 84 degrees: latitude north positive, longitude east positive. Objects, never a pair, so the order is never in doubt. */
export type GeoPoint = { lat: number; lon: number }

/**
 * How good a robot's satellite position is, best first: an RTK fixed solution (centimetres), RTK float (decimetres), a
 * differential or SBAS fix (about a metre), a plain GPS fix (metres), or none. `navSatFixToGeo` in `ros` reads it from a
 * `sensor_msgs/NavSatFix`.
 */
export type GeoFix = "rtk-fixed" | "rtk-float" | "dgps" | "gps" | "none"

export type GeoMapRobot = {
  id: string
  /** Shown beside the marker and in the list: the robot's ID or short name ("Patrol-2"). */
  name: string
  lat: number
  lon: number
  /** Where it faces, in degrees clockwise from true north (0 north, 90 east). Leave it out when unknown. */
  heading?: number
  /** Its state, by shape: only warning and danger are coloured. */
  status: Status
  /** The state in words; without it the default word for `status` (labels.status). */
  statusLabel?: string
  /** The quality of its satellite fix. With `none` the marker is its last known place, drawn with a dashed edge and "No fix". */
  fix?: GeoFix
  /** Horizontal accuracy in metres (the radius it is within): drawn as a circle around it once that is larger than the marker, and written as "±3 m". */
  accuracy?: number
  /** Where it has been, oldest first: a solid grey line up to where it is now. */
  trail?: GeoPoint[]
}

/** `allowed`: the area the robots work in (dashed outline). `keep-out`: an area they must not enter (solid outline, hatched). */
export type GeoMapFenceKind = "allowed" | "keep-out"

/** A geofence: a polygon in degrees, drawn as an outline with its name; a keep-out is hatched, never a red fill. */
export type GeoMapFence = {
  id: string
  kind: GeoMapFenceKind
  /** The corners in order around it. */
  points: GeoPoint[]
  /** Its name, at its corner and in the list ("Pond"). Without it the kind's word (labels.fenceKind). */
  label?: string
}

/** A goal: a place, and the way to face there in degrees clockwise from north (left out: the planner chooses). */
export type GeoMapGoal = { lat: number; lon: number; heading?: number }

/** One slippy-map tile: zoom level, column from the antimeridian (west) and row from the north. */
export type GeoMapTile = { z: number; x: number; y: number }

export type GeoMapMode = "view" | "goal"

// ---------------------------------------------------------------------------------------------------------------------
// Web Mercator (EPSG:3857), the projection of slippy-map tiles: x and y run 0–1 across the world, from the antimeridian
// east and from about 85° north down. At zoom z the world is 256 × 2^z pixels across.
// ---------------------------------------------------------------------------------------------------------------------

/** The latitude where Web Mercator's square world ends; the poles are beyond it. */
export const MAX_LATITUDE = 85.0511287798
/** WGS 84's equatorial radius, which Web Mercator takes as the sphere's. */
const EARTH_RADIUS = 6378137

/** A point in Web Mercator's unit square: x 0–1 from 180° W, y 0–1 from 85° N. */
export function projectGeo({ lat, lon }: GeoPoint): [x: number, y: number] {
  const phi = (clamp(lat, -MAX_LATITUDE, MAX_LATITUDE) * Math.PI) / 180
  return [(lon + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2]
}

/** The inverse of `projectGeo`. */
export function unprojectGeo(x: number, y: number): GeoPoint {
  return { lat: (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI, lon: x * 360 - 180 }
}

/** Ground metres per screen pixel at a latitude and zoom: 156 543 m at zoom 0 on the equator, halving each zoom level. */
export const metresPerPixel = (lat: number, zoom: number) => (2 * Math.PI * EARTH_RADIUS * Math.cos((clamp(lat, -MAX_LATITUDE, MAX_LATITUDE) * Math.PI) / 180)) / (256 * 2 ** zoom)

/** A tile's URL from a template with {z}, {x} and {y}, or from a function the product gives. */
export const tileUrlFor = (template: string | ((tile: GeoMapTile) => string), tile: GeoMapTile) =>
  typeof template === "function" ? template(tile) : template.replaceAll("{z}", String(tile.z)).replaceAll("{x}", String(tile.x)).replaceAll("{y}", String(tile.y))

/** Whether a point is inside a polygon of degrees (even-odd rule, longitude as x): right for a site, not for one that crosses the antimeridian. */
export function geoPointInPolygon({ lat, lon }: GeoPoint, poly: GeoPoint[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!
    const b = poly[j]!
    if (a.lat > lat !== b.lat > lat && lon < ((b.lon - a.lon) * (lat - a.lat)) / (b.lat - a.lat) + a.lon) inside = !inside
  }
  return inside
}

/** The first fence a point is in, keep-outs before allowed areas (being in a keep-out is what matters). */
export const fenceOf = (p: GeoPoint, fences: GeoMapFence[]) =>
  fences.find((f) => f.kind === "keep-out" && geoPointInPolygon(p, f.points)) ?? fences.find((f) => f.kind === "allowed" && geoPointInPolygon(p, f.points))

// ---------------------------------------------------------------------------------------------------------------------
// Numbers and words
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A number in `locale` (English without one, so server and browser agree) with between `min` and `max` decimals, without
 * grouping, so a coordinate reads as one number.
 */
export function formatGeoNumber(value: number, max: number, locale?: string, min = max): string {
  return formatNumber(value, { locale, minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: false })
}

const compassPoints = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
const deg360 = (d: number) => Math.round(((d % 360) + 360) % 360) % 360

export type GeoMapLabels = {
  /** Read once when focus enters the map. */
  instructions: string
  zoomIn: string
  zoomOut: string
  fit: string
  /** Default words per status, for robots without statusLabel. */
  status: Record<Status, string>
  /** The fix in words: "RTK fixed", "GPS fix", "No fix". */
  fix: Record<GeoFix, string>
  /** A fix and its accuracy together: "GPS fix · ±3 m". */
  fixWithAccuracy: (fix: string, accuracy: string) => string
  /** Horizontal accuracy: "±2 cm", "±0.4 m", "±3 m". */
  accuracy: (metres: number, locale?: string) => string
  /** The fence kinds' words, for unnamed fences and in the list. */
  fenceKind: Record<GeoMapFenceKind, string>
  /** Said over the map and in the list when there are no robots. */
  empty: string
  loading: string
  error: string
  retry: string
  /** Over the map when tiles were asked for and none could be loaded: it falls back to the coordinate grid. */
  tilesFailed: string
  /** How many robots the map shows, read with the instructions. */
  count: (n: number) => string
  /** The selected robot, read with the instructions. */
  selected: (name: string, status: string) => string
  /** A latitude with `digits` decimals: "24.900120° N". */
  latitude: (deg: number, digits: number, locale?: string) => string
  longitude: (deg: number, digits: number, locale?: string) => string
  /** A place in words, as the list, the crosshair, the goal card and the announcements write it. */
  position: (lat: string, lon: string) => string
  /** Which way a robot or a goal faces: "Heading 90° E". */
  heading: (deg: number) => string
  /** GeoMapList: the fence a robot is in. */
  inFence: (name: string, kind: string) => string
  /** GeoMapList: the fence a robot is in, when the fence has no name. */
  inUnnamedFence: (kind: string) => string
  /** GeoMapList: a robot outside every allowed area, when there are allowed areas. */
  outsideAllowed: string
  /** The scale bar's length: "50 m", "2 km". */
  distance: (metres: number, locale?: string) => string
  /** The keys of goal mode, read with the instructions. */
  editKeys: string
  /** The banner in goal mode, before a goal is placed. */
  goalHint: string
  /** The confirm card's title, and its line on how to turn, send or cancel from the keyboard. */
  goalConfirm: string
  goalConfirmKeys: string
  send: string
  cancel: string
  /** The confirm card's warnings: the goal is in a keep-out, or outside every allowed area. */
  goalInKeepOut: (fence: string) => string
  /** `area` is the work area's name when there is one allowed fence with a name. */
  goalOutsideAllowed: (area?: string) => string
  /** Said in the live region as goal mode is used. */
  goalPlaced: (position: string) => string
  /** Said when a goal is placed where it cannot be sent, with the card's reason. */
  goalBlocked: (position: string, reason: string) => string
  /** Said when Send (or Enter) is tried on a goal that cannot be sent. */
  goalNotSent: (reason: string) => string
  goalSet: (position: string, heading?: number) => string
  goalCancelled: string
  /** Said when robots' fixes change, gathered and at most once per `announceEveryMs`: "Patrol-2: No fix". */
  fixChanged: (name: string, fix: string) => string
}

const defaultLabels: GeoMapLabels = {
  instructions: "Arrow keys move the map, plus and minus zoom, 0 shows all robots. The robot list beside the map has the same robots as text.",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Show all robots",
  status: { active: "Working", normal: "Idle", warning: "Needs attention", danger: "Stopped", offline: "Offline" },
  fix: { "rtk-fixed": "RTK fixed", "rtk-float": "RTK float", dgps: "DGPS fix", gps: "GPS fix", none: "No fix" },
  fixWithAccuracy: (fix, accuracy) => `${fix} · ${accuracy}`,
  accuracy: (m, locale) =>
    m < 1 ? `±${formatGeoNumber(Math.max(1, Math.round(m * 100)), 0, locale)} cm` : `±${formatGeoNumber(m, m < 10 ? 1 : 0, locale, 0)} m`,
  fenceKind: { allowed: "Work area", "keep-out": "Keep out" },
  empty: "No robots on this map right now.",
  loading: "Loading the map",
  error: "The map could not be loaded.",
  retry: "Load again",
  tilesFailed: "Map tiles could not be loaded. Showing the coordinate grid.",
  count: (n) => (n === 1 ? "1 robot" : `${n} robots`),
  selected: (name, status) => `Selected: ${name}, ${status}`,
  latitude: (deg, digits, locale) => `${formatGeoNumber(Math.abs(deg), digits, locale)}° ${deg < 0 ? "S" : "N"}`,
  longitude: (deg, digits, locale) => `${formatGeoNumber(Math.abs(deg), digits, locale)}° ${deg < 0 ? "W" : "E"}`,
  position: (lat, lon) => `${lat}, ${lon}`,
  heading: (deg) => `Heading ${deg360(deg)}° ${compassPoints[Math.round(deg360(deg) / 45) % 8]}`,
  inFence: (name, kind) => `In ${name} (${kind.toLowerCase()})`,
  inUnnamedFence: (kind) => `In a ${kind.toLowerCase()} area`,
  outsideAllowed: "Outside the work area",
  distance: (m, locale) => (m >= 1000 ? `${formatGeoNumber(m / 1000, 1, locale, 0)} km` : `${formatGeoNumber(m, m < 1 ? 1 : 0, locale, 0)} m`),
  editKeys: "Arrow keys move the crosshair, Shift for bigger steps; Enter or Space places the goal, Esc cancels. Right-drag or two fingers move the map.",
  goalHint: "Click to place the goal, drag to point it. Esc cancels.",
  goalConfirm: "Send this goal?",
  goalConfirmKeys: "Left and right arrows turn it, Enter sends, Esc cancels.",
  send: "Send goal",
  cancel: "Cancel",
  goalInKeepOut: (fence) => `Inside ${fence}, a keep-out area`,
  goalOutsideAllowed: (area) => (area ? `Outside ${area}, the work area` : "Outside the work area"),
  goalPlaced: (position) => `Goal at ${position}. Enter sends it, Esc cancels.`,
  goalBlocked: (position, reason) => `Goal at ${position}. ${reason}: it cannot be sent. Place it again, or press Esc.`,
  goalNotSent: (reason) => `${reason}: this goal cannot be sent.`,
  goalSet: (position, heading) => `Goal sent: ${position}${heading === undefined ? "" : `, heading ${deg360(heading)}°`}`,
  goalCancelled: "Goal cancelled",
  fixChanged: (name, fix) => `${name}: ${fix}`,
}

const merge = (given?: Partial<GeoMapLabels>): GeoMapLabels => ({
  ...defaultLabels,
  ...given,
  status: { ...defaultLabels.status, ...given?.status },
  fix: { ...defaultLabels.fix, ...given?.fix },
  fenceKind: { ...defaultLabels.fenceKind, ...given?.fenceKind },
})

const statusWord = (r: GeoMapRobot, labels: GeoMapLabels) => r.statusLabel ?? labels.status[r.status]
const abnormal = (s: Status) => s === "warning" || s === "danger"
/** Six decimals: about 0.1 m, finer than an RTK fix. */
const COORD_DIGITS = 6
const where = (p: GeoPoint, labels: GeoMapLabels, locale?: string) =>
  labels.position(labels.latitude(p.lat, COORD_DIGITS, locale), labels.longitude(p.lon, COORD_DIGITS, locale))
/** A robot's fix in words, with its accuracy when it has one: "GPS fix · ±3 m". */
export function geoFixText(robot: Pick<GeoMapRobot, "fix" | "accuracy">, labels?: Partial<GeoMapLabels>, locale?: string): string | undefined {
  if (!robot.fix) return undefined
  const l = merge(labels)
  const word = l.fix[robot.fix]
  return robot.fix !== "none" && robot.accuracy !== undefined && Number.isFinite(robot.accuracy) ? l.fixWithAccuracy(word, l.accuracy(robot.accuracy, locale)) : word
}

// ---------------------------------------------------------------------------------------------------------------------
// The view: zoom `z` (any fraction) and the point of the world (Mercator x, y) at the frame's anchor. Everything is
// drawn in screen pixels from it, so lines, markers and text keep their size at any zoom.
// ---------------------------------------------------------------------------------------------------------------------

type View = { z: number; x: number; y: number }
type Size = { w: number; h: number }

const INSET = 16
/** Below, room for the zoom buttons and the scale bar (44 px and 8 px apart), as robot-map. */
const BOTTOM = INSET + 44 + 8
const anchor = ({ w, h }: Size) => ({ x: w / 2, y: (INSET + h - BOTTOM) / 2 })
/** A fit never zooms past this, so one robot alone shows its surroundings. */
const FIT_MAX_ZOOM = 18
/** Scale bar lengths, in metres. */
const NICE_M = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000]
/** Graticule steps, in degrees. */
const NICE_DEG = [0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 45]

/** The ease of --ease-standard, cubic-bezier(0.2, 0, 0, 1), solved for x by bisection. */
function easeStandard(t: number) {
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (bez(0.2, 0, mid) < t) lo = mid
    else hi = mid
  }
  return bez(0, 1, (lo + hi) / 2)
}

type Box = { x: number; y: number; w: number; h: number }
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const DISC = 13
const LINE = 20
const charWidth = 7.5

/** The view that shows every point given, with room for markers and names; null when there are none. */
function fitPoints(points: GeoPoint[], size: Size, minZoom: number): View | null {
  if (!points.length) return null
  const xy = points.map(projectGeo)
  const xs = xy.map((p) => p[0])
  const ys = xy.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  // 48 px each side keeps a marker and its name inside the frame.
  const w = Math.max(1, size.w - 2 * INSET - 96)
  const h = Math.max(1, size.h - INSET - BOTTOM - 96)
  const dx = x1 - x0
  const dy = y1 - y0
  const z = dx === 0 && dy === 0 ? FIT_MAX_ZOOM : Math.log2(Math.min(dx ? w / (dx * 256) : Infinity, dy ? h / (dy * 256) : Infinity))
  return { z: clamp(z, minZoom, FIT_MAX_ZOOM), x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
}

export type GeoMapProps = {
  /** Names the map for screen readers: "Map of the orchard". */
  label: string
  robots?: GeoMapRobot[]
  fences?: GeoMapFence[]
  /** A route, numbered from its first waypoint: dashed grey, or the in-progress blue with `routeActive`. */
  route?: GeoPoint[]
  /** The route is the one a robot is driving now: its line turns the in-progress blue. */
  routeActive?: boolean
  /**
   * Raster tiles: a URL template with {z}, {x} and {y} (`https://tiles.example.com/{z}/{x}/{y}.png`), or a function from a
   * tile to its URL (signed URLs, a local cache). Bring your own tile server: OpenStreetMap's public servers forbid heavy
   * use and apps that do not identify themselves. Without it the map draws a coordinate grid, which needs no network.
   */
  tileUrl?: string | ((tile: GeoMapTile) => string)
  /** Who the tiles are from, shown on the map as their licence asks: "© OpenStreetMap contributors". */
  attribution?: React.ReactNode
  /** Tile width in pixels: 256 (the default) or 512. */
  tileSize?: number
  /** The deepest zoom level the tile server has; past it, its tiles are drawn larger. Default 19. */
  tileMaxZoom?: number
  /** The first view, before anyone pans or zooms. Without it the map fits the robots, the fences and the route. */
  center?: GeoPoint
  zoom?: number
  /** Zoom limits of the view. Defaults 2 and 22. */
  minZoom?: number
  maxZoom?: number
  /** The selected robot, controlled; null for none. Without it the map keeps its own selection. */
  selectedId?: string | null
  /** Called with the robot clicked, or null when the background is clicked or Esc pressed. */
  onSelect?: (id: string | null, robot?: GeoMapRobot) => void
  /** Bones in the frame while the map loads. */
  loading?: boolean
  /** The map could not be loaded: says so in the frame (`true` for the default words, or your own message). */
  error?: React.ReactNode
  onRetry?: () => void
  /** Fill the parent's height (a full-screen map) instead of a 16:10 frame. */
  fill?: boolean
  /** `goal`: a click (or Enter at the keyboard crosshair) places a goal, a drag points it, and the goal is sent on confirm. */
  mode?: GeoMapMode
  /** The goal to show, controlled. */
  goal?: GeoMapGoal | null
  /** Goal mode: the goal, once confirmed (Send, or Enter). `heading` is left out when nobody pointed it. */
  onGoal?: (goal: GeoMapGoal) => void
  /** Ask before sending a goal placed with the pointer (default true). With false a release sends it, as robot-map does. */
  confirmGoal?: boolean
  /** Robots' fix changes are said at most this often, gathered into one sentence. Default 3000 ms. */
  announceEveryMs?: number
  /** Formats coordinates, accuracy and distances. Pass the app's locale beside its labels. */
  locale?: string
  labels?: Partial<GeoMapLabels>
  className?: string
}

const frame = "relative isolate w-full overflow-hidden rounded-md bg-map ring-1 ring-border"
/** 16:10, at most 75 % of the screen's height and at least 288 px, so a phone still has room for it. */
const proportions = (fill?: boolean): React.CSSProperties | undefined => (fill ? undefined : { aspectRatio: "16 / 10", maxHeight: "75svh", minHeight: "min(18rem, 75svh)" })

/**
 * A goal placed and not yet sent; `placed` once the press that placed it is over (a drag still points it), `byKeys` when
 * the keys placed it (it then always asks before sending, as Enter is the confirm).
 */
type Draft = { at: [number, number]; heading?: number; placed?: boolean; byKeys?: boolean }

/**
 * An outdoor map in latitude and longitude for robots that work outside (patrol, agriculture, delivery), drawn in SVG
 * with no map library: Web Mercator raster tiles from the product's own tile server, or a coordinate grid that needs no
 * network. Robots are their status shape with a heading tick, an accuracy circle and their fix in words; geofences are
 * outlines (keep-outs hatched), a route has numbered waypoints, and each robot can leave a trail. Drag, the wheel, two
 * fingers, the buttons and the keys pan and zoom; `mode="goal"` places a goal and sends it on confirm. The map is one Tab
 * stop: offer GeoMapList beside it, the same robots as text.
 */
export function GeoMap({
  label: name,
  robots = [],
  fences = [],
  route = [],
  routeActive,
  tileUrl,
  attribution,
  tileSize = 256,
  tileMaxZoom = 19,
  center,
  zoom,
  minZoom = 2,
  maxZoom = 22,
  selectedId: selectedProp,
  onSelect,
  loading,
  error,
  onRetry,
  fill,
  mode = "view",
  goal,
  onGoal,
  confirmGoal = true,
  announceEveryMs = 3000,
  locale,
  labels: given,
  className,
}: GeoMapProps) {
  const labels = merge(given)
  const uid = React.useId().replace(/[^\w-]/g, "")
  const root = React.useRef<HTMLDivElement>(null)
  const [selectedState, setSelectedState] = React.useState<string | null>(null)
  const selected = selectedProp !== undefined ? selectedProp : selectedState
  const select = (id: string | null) => {
    if (selectedProp === undefined) setSelectedState(id)
    onSelect?.(id, id ? robots.find((r) => r.id === id) : undefined)
  }

  // The frame's size; until it is measured (server render, tests) 640 × 400.
  const [measured, setMeasured] = React.useState<Size | null>(null)
  const size: Size = measured ?? { w: 640, h: 400 }
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === "undefined") return
    const update = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setMeasured({ w: r.width, h: r.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading, error])

  const limit = (v: View): View => ({ z: clamp(v.z, minZoom, maxZoom), x: clamp(v.x, 0, 1), y: clamp(v.y, 0, 1) })
  // The first view shows the whole working area: the robots, the fences and the route. The fit (0, the button) shows the
  // robots, or the area when there are none; with nothing at all, the first view given or the world.
  const area = [...robots, ...fences.flatMap((f) => f.points), ...route]
  const startView = (s: Size): View => {
    if (center) {
      const [x, y] = projectGeo(center)
      return limit({ z: zoom ?? 16, x, y })
    }
    return limit(fitPoints(area, s, minZoom) ?? { z: zoom ?? minZoom, x: 0.5, y: 0.5 })
  }
  const fitView = (s: Size): View => {
    const v = fitPoints(robots.length ? robots : area, s, minZoom)
    return v ? limit(v) : startView(s)
  }
  // null: nobody has moved the view yet, so it is the first view for the frame's size now. Once there is something to show
  // and the frame is measured, that view is kept, so robots driving about do not pull the map along with them.
  const [viewState, setViewState] = React.useState<View | null>(null)
  if (viewState === null && measured && (center || area.length)) setViewState(startView(measured))
  const view = viewState ?? startView(size)
  const viewRef = React.useRef(view)
  const sizeRef = React.useRef(size)
  React.useLayoutEffect(() => {
    viewRef.current = view
    sizeRef.current = size
  })

  const frameId = React.useRef<number | undefined>(undefined)
  const setView = (v: View) => {
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    frameId.current = undefined
    viewRef.current = limit(v)
    setViewState(viewRef.current)
  }
  // Buttons and keys glide at --motion-base on --ease-standard; with reduced motion, or no motion token, they jump.
  const glideTo = (v: View) => {
    const to = limit(v)
    const el = root.current
    const reduce = prefersReducedMotion()
    const ms = el && !reduce ? parseFloat(getComputedStyle(el).getPropertyValue("--motion-base")) || 0 : 0
    if (!ms) return setView(to)
    const from = viewRef.current
    let start: number | undefined
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    const step = (now: number) => {
      start ??= now
      const t = Math.min(1, (now - start) / ms)
      const e = easeStandard(t)
      viewRef.current = { z: from.z + (to.z - from.z) * e, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e }
      setViewState(viewRef.current)
      frameId.current = t < 1 ? requestAnimationFrame(step) : undefined
    }
    frameId.current = requestAnimationFrame(step)
  }
  React.useEffect(() => () => {
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
  }, [])

  /** The view after zooming by `dz` levels around a point of the frame (px), which stays where it is. */
  const zoomed = (v: View, dz: number, px: number, py: number): View => {
    const a = anchor(sizeRef.current)
    const z = clamp(v.z + dz, minZoom, maxZoom)
    const s1 = 256 * 2 ** v.z
    const s2 = 256 * 2 ** z
    const wx = v.x + (px - a.x) / s1
    const wy = v.y + (py - a.y) / s1
    return { z, x: wx - (px - a.x) / s2, y: wy - (py - a.y) / s2 }
  }
  const zoomBy = (dz: number) => {
    const a = anchor(sizeRef.current)
    glideTo(zoomed(viewRef.current, dz, a.x, a.y))
  }
  const panBy = (dx: number, dy: number) => {
    const v = viewRef.current
    const s = 256 * 2 ** v.z
    glideTo({ ...v, x: v.x + dx / s, y: v.y + dy / s })
  }

  // The wheel zooms once the map has focus, or with Ctrl / ⌘ (a trackpad pinch); otherwise it scrolls the page.
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || el.contains(document.activeElement))) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const unit = e.deltaMode === 1 ? 16 : 1
      setView(zoomed(viewRef.current, (-e.deltaY * unit * 0.002) / Math.LN2, e.clientX - r.left, e.clientY - r.top))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  // Announcements: an edit is said at once; the crosshair once the keys rest; robots' fix changes gathered and throttled.
  const [said, setSaid] = React.useState("")
  const sayTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const say = (text: string) => {
    clearTimeout(sayTimer.current)
    setSaid(text)
  }
  const sayWhenStill = (text: string) => {
    clearTimeout(sayTimer.current)
    sayTimer.current = setTimeout(() => setSaid(text), 400)
  }
  const fixes = React.useRef<{ seen: Map<string, string> | null; pending: Map<string, string>; last: number; timer?: ReturnType<typeof setTimeout> }>({ seen: null, pending: new Map(), last: -Infinity })
  const fixWords = robots.map((r) => [r.id, r.name, r.fix ? labels.fix[r.fix] : ""] as const)
  const fixKey = fixWords.map((f) => f.join("\u0001")).join("\u0002")
  const onFixes = React.useEffectEvent(() => {
    const f = fixes.current
    const now = new Map(fixWords.map(([id, , word]) => [id, word]))
    // The first fixes the map sees are its starting point, not news.
    if (f.seen) {
      for (const [id, robotName, word] of fixWords) if (word && f.seen.has(id) && f.seen.get(id) !== word) f.pending.set(robotName, word)
    }
    f.seen = now
    if (!f.pending.size || f.timer !== undefined) return
    const flush = () => {
      f.timer = undefined
      f.last = Date.now()
      const text = [...f.pending].map(([n, w]) => labels.fixChanged(n, w)).join(". ")
      f.pending.clear()
      clearTimeout(sayTimer.current)
      setSaid(text)
    }
    f.timer = setTimeout(flush, Math.max(0, f.last + announceEveryMs - Date.now()))
  })
  React.useEffect(() => {
    onFixes()
  }, [fixKey])
  React.useEffect(
    () => () => {
      clearTimeout(sayTimer.current)
      clearTimeout(fixes.current.timer)
    },
    [],
  )

  // Goal mode keeps only what is half done: a goal placed and not yet sent, and the keyboard crosshair.
  const editing = mode === "goal"
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [cursorState, setCursor] = React.useState<[number, number] | null>(null)
  const [focused, setFocused] = React.useState(false)
  const [byPointer, setByPointer] = React.useState(false)
  const [lastMode, setLastMode] = React.useState(mode)
  if (lastMode !== mode) {
    setLastMode(mode)
    setDraft(null)
    setCursor(null)
  }

  /** A point of the frame (px) in Mercator, from the view of the last commit; for handlers. */
  const worldAt = (px: number, py: number): [number, number] => {
    const v = viewRef.current
    const a = anchor(sizeRef.current)
    const s = 256 * 2 ** v.z
    return [clamp(v.x + (px - a.x) / s, 0, 1), clamp(v.y + (py - a.y) / s, 0, 1)]
  }
  const geoOf = ([x, y]: [number, number]) => unprojectGeo(x, y)
  /** On screen, north is up and Mercator keeps angles, so a drag's direction is its bearing. */
  const headingTo = (dx: number, dy: number) => Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360)
  const draftGoal = (d: Draft): GeoMapGoal => ({ ...geoOf(d.at), ...(d.heading === undefined ? {} : { heading: d.heading }) })
  const allowedFences = fences.filter((f) => f.kind === "allowed")
  /**
   * Why a goal here cannot be sent, or null: it is in a keep-out, or outside every allowed area. The robot must not be
   * sent there from this map, so Send and Enter stay off until the goal is placed again somewhere allowed.
   */
  const blockedAt = (at: GeoPoint): string | null => {
    const keepOut = fences.find((f) => f.kind === "keep-out" && geoPointInPolygon(at, f.points))
    if (keepOut) return labels.goalInKeepOut(keepOut.label ?? labels.fenceKind["keep-out"])
    if (allowedFences.length && !allowedFences.some((f) => geoPointInPolygon(at, f.points)))
      return labels.goalOutsideAllowed(allowedFences.length === 1 ? allowedFences[0]!.label : undefined)
    return null
  }
  const commitGoal = (d: Draft) => {
    const g = draftGoal(d)
    const reason = blockedAt(g)
    if (reason) {
      say(labels.goalNotSent(reason))
      return
    }
    setDraft(null)
    onGoal?.(g)
    say(labels.goalSet(where(g, labels, locale), g.heading))
  }
  const placeDraft = (d: Draft) => {
    setDraft({ ...d, placed: true })
    // The card covers the top of the map: a goal placed under it glides down into view, so its arrow can be checked.
    const v = viewRef.current
    const s = 256 * 2 ** v.z
    const a = anchor(sizeRef.current)
    const { w, h } = sizeRef.current
    const below = INSET + (w >= 480 ? 176 : 140)
    const y = a.y + (d.at[1] - v.y) * s
    if ((confirmGoal || d.byKeys) && y < below + 24 && h - BOTTOM > below + 24) glideTo({ ...v, y: v.y - (below + (h - BOTTOM - below) / 2 - y) / s })
    const reason = blockedAt(geoOf(d.at))
    const position = where(geoOf(d.at), labels, locale)
    say(reason ? labels.goalBlocked(position, reason) : labels.goalPlaced(position))
  }
  const cancelDraft = () => {
    setDraft(null)
    say(labels.goalCancelled)
  }

  // One pointer pans, two pinch; a press that does not move selects the robot under it. In goal mode the primary pointer
  // places the goal and everything else pans (right or middle button, a second finger).
  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const gesture = React.useRef<{ moved: boolean; x: number; y: number; robot: string | null } | null>(null)
  const edit = React.useRef<{ x: number; y: number; at: [number, number] } | null>(null)
  const local = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onPointerDown = (e: React.PointerEvent) => {
    const primary = !(e.pointerType === "mouse" && e.button !== 0)
    if (!primary && !editing) return
    // The map's own controls and cards keep their clicks.
    if ((e.target as HTMLElement).closest("button, [data-map-ui]")) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (!byPointer) setByPointer(true)
    const target = e.target as Element
    if (editing && primary && pointers.current.size === 1) {
      const at = worldAt(p.x, p.y)
      edit.current = { x: p.x, y: p.y, at }
      setDraft({ at })
      setCursor(at)
    } else if (pointers.current.size === 1) {
      const robot = editing ? null : (target.closest?.("[data-robot-id]")?.getAttribute("data-robot-id") ?? null)
      gesture.current = { moved: !primary, x: p.x, y: p.y, robot }
    } else {
      // A second finger: a pinch, and the end of a goal the first finger was placing.
      if (edit.current) setDraft(null)
      edit.current = null
      gesture.current = { moved: true, x: p.x, y: p.y, robot: null }
    }
    try {
      root.current?.setPointerCapture?.(e.pointerId)
    } catch {}
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const p = local(e)
    const ed = edit.current
    if (ed) {
      if (Math.hypot(p.x - ed.x, p.y - ed.y) > 8) setDraft({ at: ed.at, heading: headingTo(p.x - ed.x, p.y - ed.y) })
      pointers.current.set(e.pointerId, p)
      return
    }
    const g = gesture.current
    if (g && !g.moved && Math.hypot(p.x - g.x, p.y - g.y) > 4) g.moved = true
    if (!g?.moved) return
    const v = viewRef.current
    const s = 256 * 2 ** v.z
    const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1]
    if (other) {
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(p.x - other.x, p.y - other.y)
      const mid0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 }
      const mid1 = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 }
      const z = zoomed(v, before > 0 && after > 0 ? Math.log2(after / before) : 0, mid0.x, mid0.y)
      const s2 = 256 * 2 ** z.z
      setView({ ...z, x: z.x - (mid1.x - mid0.x) / s2, y: z.y - (mid1.y - mid0.y) / s2 })
    } else setView({ ...v, x: v.x - (p.x - prev.x) / s, y: v.y - (p.y - prev.y) / s })
    pointers.current.set(e.pointerId, p)
  }
  const onPointerEnd = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return
    const ed = edit.current
    if (ed && pointers.current.size === 0) {
      edit.current = null
      if (e.type !== "pointerup") {
        setDraft(null)
        return
      }
      const p = local(e)
      const d: Draft = { at: ed.at, ...(Math.hypot(p.x - ed.x, p.y - ed.y) > 8 ? { heading: headingTo(p.x - ed.x, p.y - ed.y) } : {}) }
      // Without the card a release sends at once, unless the goal cannot be sent: then it stays, with the reason.
      if (confirmGoal || blockedAt(geoOf(d.at))) placeDraft(d)
      else commitGoal(d)
      return
    }
    const g = gesture.current
    if (pointers.current.size === 0) {
      gesture.current = null
      if (e.type === "pointerup" && g && !g.moved && !editing) {
        if (g.robot) select(g.robot)
        else if (selected) select(null)
      }
    }
  }

  /** Goal mode's keys; true when the key was used, so the map's own keys get the rest. */
  const editKey = (e: React.KeyboardEvent): boolean => {
    const v = viewRef.current
    const cur = cursorState ?? [v.x, v.y]
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const dir = dirs[e.key]
    if (dir) {
      // A placed goal turns with left and right: 15° a press, 45° with Shift. Up and down leave it as it is.
      if (draft) {
        if (dir[0]) {
          const heading = (((draft.heading ?? 0) + dir[0] * (e.shiftKey ? 45 : 15)) % 360 + 360) % 360
          setDraft({ ...draft, heading })
          sayWhenStill(labels.heading(heading))
        }
        return true
      }
      const s = 256 * 2 ** v.z
      const step = (e.shiftKey ? 40 : 8) / s
      const next: [number, number] = [clamp(cur[0] + dir[0] * step, 0, 1), clamp(cur[1] + dir[1] * step, 0, 1)]
      setCursor(next)
      // The view follows the crosshair near the frame's edge, so the keys alone reach anywhere.
      const a = anchor(sizeRef.current)
      const sx = a.x + (next[0] - v.x) * s
      const sy = a.y + (next[1] - v.y) * s
      const { w, h } = sizeRef.current
      if (sx < 48 || sy < 48 || sx > w - 48 || sy > h - BOTTOM) setView({ ...v, x: next[0], y: next[1] })
      sayWhenStill(where(geoOf(next), labels, locale))
      return true
    }
    if (e.key === "Enter" || e.key === " ") {
      if (draft?.placed) commitGoal(draft)
      else placeDraft({ at: cur, byKeys: true })
      return true
    }
    if (e.key === "Escape" && (draft || edit.current)) {
      edit.current = null
      cancelDraft()
      return true
    }
    return false
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
    if (editing) {
      if (byPointer) setByPointer(false)
      if (editKey(e)) {
        e.preventDefault()
        return
      }
    }
    const { w, h } = sizeRef.current
    const step = Math.min(w, h) * 0.2
    switch (e.key) {
      case "ArrowLeft":
        panBy(-step, 0)
        break
      case "ArrowRight":
        panBy(step, 0)
        break
      case "ArrowUp":
        panBy(0, -step)
        break
      case "ArrowDown":
        panBy(0, step)
        break
      case "+":
      case "=":
        zoomBy(1)
        break
      case "-":
      case "_":
        zoomBy(-1)
        break
      case "0":
        glideTo(fitView(sizeRef.current))
        break
      case "Escape":
        // Only with a selection to clear, so Esc still closes a sheet the map sits in.
        if (!selected) return
        select(null)
        break
      default:
        return
    }
    e.preventDefault()
  }

  // Projection for drawing.
  const s = 256 * 2 ** view.z
  const at = anchor(size)
  const toScreen = (x: number, y: number): [number, number] => [at.x + (x - view.x) * s, at.y + (y - view.y) * s]
  const geoToScreen = (p: GeoPoint) => {
    const [x, y] = projectGeo(p)
    return toScreen(x, y)
  }
  const selectedRobot = robots.find((r) => r.id === selected)
  // A robot selected elsewhere (the list) that is out of view: the map glides to it, keeping the zoom.
  const glideToSelected = React.useEffectEvent(() => {
    if (!selectedRobot) return
    const [x, y] = geoToScreen(selectedRobot)
    const m = 2 * DISC
    if (x < m || y < m || x > size.w - m || y > size.h - m) {
      const [wx, wy] = projectGeo(selectedRobot)
      glideTo({ ...viewRef.current, x: wx, y: wy })
    }
  })
  React.useEffect(() => {
    glideToSelected()
  }, [selected])

  // Tiles: the level nearest the zoom (for 512 px tiles one less), each drawn at the zoom's scale. Which have loaded or
  // failed is kept by URL, so a story or a test can wait for them (data-tiles) and the grid shows when none can load.
  const [tileLoad, setTileLoad] = React.useState<ReadonlyMap<string, "ok" | "error">>(() => new Map())
  const settle = (href: string, state: "ok" | "error") =>
    setTileLoad((m) => {
      if (m.get(href) === state) return m
      // A long session pans over thousands of tiles; past 4000 the record starts again rather than grow.
      const next = new Map(m.size > 4000 ? [] : m)
      next.set(href, state)
      return next
    })

  const hint = `${uid}-hint`
  if (loading) {
    return (
      <div data-slot="geo-map" data-loading="" role="group" aria-label={name} aria-busy="true" style={proportions(fill)} className={cn(frame, className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        <Bone className="absolute inset-4 size-auto rounded-xs" />
      </div>
    )
  }
  if (error) {
    return (
      <div data-slot="geo-map" data-error="" role="group" aria-label={name} style={proportions(fill)} className={cn(frame, "flex flex-col items-center justify-center gap-3 p-4 text-center", className)}>
        <CircleAlert aria-hidden="true" className="size-6 text-muted-foreground" />
        <p role="alert" className="text-sm text-pretty">
          {error === true ? labels.error : error}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw aria-hidden="true" /> {labels.retry}
          </Button>
        )}
      </div>
    )
  }

  const tiles: { key: string; href: string; x: number; y: number; size: number }[] = []
  if (tileUrl) {
    const tz = clamp(Math.round(view.z - Math.log2(tileSize / 256)), 0, tileMaxZoom)
    const n = 2 ** tz
    const t = s / n
    const left = view.x * s - at.x
    const top = view.y * s - at.y
    for (let j = Math.max(0, Math.floor(top / t)); j <= Math.min(n - 1, Math.floor((top + size.h) / t)); j++) {
      for (let i = Math.max(0, Math.floor(left / t)); i <= Math.min(n - 1, Math.floor((left + size.w) / t)); i++) {
        // Whole pixels, and a half pixel over each neighbour, so no seam shows between tiles.
        const x = Math.floor(i * t - left)
        const y = Math.floor(j * t - top)
        tiles.push({ key: `${tz}/${i}/${j}`, href: tileUrlFor(tileUrl, { z: tz, x: i, y: j }), x, y, size: Math.ceil(t) + 1 })
      }
    }
  }
  const tilesSettled = tiles.every((t) => tileLoad.has(t.href))
  const tilesFailed = tiles.length > 0 && tilesSettled && !tiles.some((t) => tileLoad.get(t.href) === "ok")
  // The coordinate grid: always under the tiles (it shows while they load), labelled when it is the map.
  const gridShown = !tileUrl || tilesFailed
  const tl = unprojectGeo(clamp(view.x - at.x / s, 0, 1), clamp(view.y - at.y / s, 0, 1))
  const br = unprojectGeo(clamp(view.x + (size.w - at.x) / s, 0, 1), clamp(view.y + (size.h - at.y) / s, 0, 1))
  // A step whose lines of longitude are at least 112 px apart, room for a label.
  const degStep = NICE_DEG.find((d) => (d / 360) * s >= 112) ?? 45
  const degDigits = Math.max(0, Math.ceil(-Math.log10(degStep) - 1e-9))
  let lines = ""
  const lonTicks: { v: number; x: number }[] = []
  const latTicks: { v: number; y: number }[] = []
  for (let k = Math.ceil(tl.lon / degStep); k * degStep <= br.lon && lonTicks.length < 200; k++) {
    const v = Number((k * degStep).toFixed(degDigits))
    const x = Math.round(geoToScreen({ lat: 0, lon: v })[0]) + 0.5
    lines += `M${x} 0V${size.h}`
    lonTicks.push({ v, x })
  }
  for (let k = Math.ceil(br.lat / degStep); k * degStep <= tl.lat && latTicks.length < 200; k++) {
    const v = Number((k * degStep).toFixed(degDigits))
    const y = Math.round(geoToScreen({ lat: v, lon: 0 })[1]) + 0.5
    lines += `M0 ${y}H${size.w}`
    latTicks.push({ v, y })
  }
  // The scale bar at the view's centre latitude: the longest round length up to 120 px.
  const mpp = metresPerPixel(unprojectGeo(view.x, view.y).lat, view.z)
  const scaleM = [...NICE_M].reverse().find((m) => m / mpp <= 120) ?? NICE_M[0]!
  const pts = (list: GeoPoint[]) => list.map((p) => geoToScreen(p).map((n) => n.toFixed(1)).join(",")).join(" ")

  // Names: below the marker, else right, above, left; the first place that covers no other name, marker or card.
  const order = [...robots].sort((a, b) => Number(b.id === selected) - Number(a.id === selected))
  const discs = robots.map((r) => {
    const [x, y] = geoToScreen(r)
    return { id: r.id, box: { x: x - DISC, y: y - DISC, w: 2 * DISC, h: 2 * DISC } }
  })
  const showConfirm = editing && draft?.placed === true && (confirmGoal || draft.byKeys === true)
  const banner = editing && !draft ? labels.goalHint : null
  const cardRows = (banner ? 2 : 0) + (showConfirm ? 4 : 0) + (draft?.placed && !showConfirm ? 1 : 0) + (tilesFailed ? 1 : 0) + (robots.length ? 0 : 1)
  const cards: Box[] = cardRows ? [{ x: 0, y: 0, w: Math.min(size.w, INSET + 360), h: INSET + 36 * cardRows }] : []
  // The route's numbered waypoints and the goal stay readable: no name or fence label is put over one.
  const box = ([wx, wy]: [number, number], r: number): Box => {
    const [x, y] = toScreen(wx, wy)
    return { x: x - r, y: y - r, w: 2 * r, h: 2 * r }
  }
  // A goal's box takes in its arrow, whichever way it points.
  const stops: Box[] = [...route.map((p) => box(projectGeo(p), 11)), ...[goal ? projectGeo(goal) : null, draft?.at ?? null].flatMap((g) => (g ? [box(g, 32)] : []))]
  const inFrame = (b: Box) => b.x >= 0 && b.y >= 0 && b.x + b.w <= size.w && b.y + b.h <= size.h
  /** A label that fits nowhere free still stays inside the frame, not cut at its edge (unless what it names is out of view). */
  const intoFrame = (b: Box): Box => ({ ...b, x: clamp(b.x, 4, Math.max(4, size.w - 4 - b.w)), y: clamp(b.y, 4, Math.max(4, size.h - 4 - b.h)) })
  const fenceSpots = new Map<string, Box>()
  for (const f of fences) {
    if (!f.points.length) continue
    const text = f.label ?? labels.fenceKind[f.kind]
    const xy = f.points.map(geoToScreen)
    const [x0, y0, x1, y1] = [Math.min(...xy.map((p) => p[0])), Math.min(...xy.map((p) => p[1])), Math.max(...xy.map((p) => p[0])), Math.max(...xy.map((p) => p[1]))]
    const w = text.length * charWidth + (f.kind === "keep-out" ? 32 : 8)
    const spots: [Box, Box, Box, Box] = [
      { x: x0 + 4, y: y0 + 4, w, h: LINE },
      { x: x1 - 4 - w, y: y0 + 4, w, h: LINE },
      { x: x0 + 4, y: y1 - 4 - LINE, w, h: LINE },
      { x: x1 - 4 - w, y: y1 - 4 - LINE, w, h: LINE },
    ]
    fenceSpots.set(f.id, spots.find((c) => inFrame(c) && ![...discs.map((d) => d.box), ...stops, ...cards].some((b) => overlap(b, c))) ?? intoFrame(spots[0]))
  }
  const vertical = size.h >= 400
  const blocked: Box[] = [
    vertical ? { x: 0, y: size.h - INSET - 3 * 44, w: INSET + 44 + 8 + 160, h: 3 * 44 + INSET } : { x: 0, y: size.h - BOTTOM, w: INSET + 3 * 44 + 8 + 160, h: BOTTOM },
    ...fenceSpots.values(),
    ...cards,
    ...stops,
  ]
  const names: Box[] = []
  const placed = new Map<string, { x: number; y: number }>()
  const labelText = (r: GeoMapRobot) =>
    r.name + (abnormal(r.status) || r.id === selected ? ` · ${statusWord(r, labels)}` : "") + (r.fix === "none" ? ` · ${labels.fix.none}` : "")
  for (const r of order) {
    const [x, y] = geoToScreen(r)
    const w = labelText(r).length * charWidth + 8
    // Clear of the heading tick, whichever way the robot faces.
    const gap = DISC + 7
    const candidates: [Box, Box, Box, Box] = [
      { x: x - w / 2, y: y + gap, w, h: LINE },
      { x: x + gap, y: y - LINE / 2, w, h: LINE },
      { x: x - w / 2, y: y - gap - LINE, w, h: LINE },
      { x: x - gap - w, y: y - LINE / 2, w, h: LINE },
    ]
    const others = [...names, ...blocked, ...discs.filter((d) => d.id !== r.id).map((d) => d.box)]
    const pick = candidates.find((c) => inFrame(c) && !others.some((b) => overlap(b, c))) ?? (x >= 0 && x <= size.w && y >= 0 && y <= size.h ? intoFrame(candidates[0]) : candidates[0])
    names.push(pick)
    placed.set(r.id, { x: pick.x, y: pick.y })
  }

  // The goal card's warnings: a keep-out it falls in, or outside every allowed area.
  const draftAt = draft ? geoOf(draft.at) : null
  const warning = draftAt ? blockedAt(draftAt) : null
  // Without the card (confirmGoal={false}), a goal that could not be sent stays on the map with its reason beside it.
  const blockedNotice = editing && draft?.placed === true && !showConfirm && warning

  const cursor = cursorState ?? [view.x, view.y]
  const showCursor = editing && focused && !byPointer && !draft
  const summary = [
    robots.length ? labels.count(robots.length) : labels.empty,
    selectedRobot ? labels.selected(selectedRobot.name, statusWord(selectedRobot, labels)) : "",
    banner ?? "",
    editing ? labels.editKeys : "",
  ]
    .filter(Boolean)
    .join(". ")
  // Lines over tiles: each drawn first in the map's colour, 2 px wider, so it reads on a photo and on the grid alike.
  const halo = "fill-none stroke-map"

  return (
    <div
      ref={root}
      data-slot="geo-map"
      role="application"
      aria-roledescription="map"
      aria-label={name}
      aria-describedby={hint}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={editing ? (e) => e.preventDefault() : undefined}
      onFocus={(e) => setFocused(e.target === e.currentTarget)}
      onBlur={(e) => e.target === e.currentTarget && setFocused(false)}
      data-mode={mode}
      data-tiles={tiles.length ? (tilesSettled ? "ready" : "loading") : undefined}
      style={proportions(fill)}
      className={cn(
        frame,
        editing ? "cursor-crosshair select-none" : "cursor-grab select-none active:cursor-grabbing",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        fill || editing ? "touch-none" : "touch-pan-y",
        className,
      )}
    >
      <p id={hint} className="sr-only">
        {labels.instructions} {summary}.
      </p>
      <p data-slot="geo-map-announce" aria-live="polite" className="sr-only">
        {said}
      </p>
      <div aria-hidden="true" className={cn("absolute inset-0", !measured && "invisible")}>
        <svg width={size.w} height={size.h} className="absolute inset-0">
          <defs>
            <pattern id={`${uid}-keep-out`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              {/* Keep-out is hatched in the ink's grey, a pattern and not a colour: it reads on tiles and in grey scale. */}
              <line x1="1" y1="0" x2="1" y2="8" className="stroke-muted-foreground" strokeWidth="1.5" />
            </pattern>
          </defs>
          <path d={lines} className="fill-none stroke-edge" strokeWidth="1" />
          {tiles.length > 0 && (
            <g data-layer="tiles">
              {tiles.map((t) => (
                <image
                  key={t.key}
                  href={t.href}
                  x={t.x}
                  y={t.y}
                  width={t.size}
                  height={t.size}
                  preserveAspectRatio="none"
                  onLoad={() => settle(t.href, "ok")}
                  onError={() => settle(t.href, "error")}
                />
              ))}
            </g>
          )}
          {fences.map((f) => {
            const p = pts(f.points)
            const keep = f.kind === "keep-out"
            return (
              <g key={f.id} data-fence={f.kind}>
                {keep && <polygon points={p} fill={`url(#${uid}-keep-out)`} />}
                <polygon points={p} className={halo} strokeWidth="4" strokeLinejoin="round" />
                {/* Told apart by line: the work area dashed grey, a keep-out solid ink over its hatch. */}
                <polygon
                  points={p}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeDasharray={keep ? undefined : "8 4"}
                  className={cn("fill-none", keep ? "stroke-foreground" : "stroke-muted-foreground")}
                />
              </g>
            )
          })}
          {robots.map((r) =>
            r.trail && r.trail.length > 0 ? (
              <g key={r.id} data-trail={r.id}>
                <polyline points={pts([...r.trail, r])} className={halo} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={pts([...r.trail, r])} className="fill-none stroke-muted-foreground" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : null,
          )}
          {route.length > 1 && (
            <g data-route={routeActive ? "active" : "planned"}>
              <polyline points={pts(route)} className={halo} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
              {/* Blue only when it is the route being driven; a route not yet sent is grey. */}
              <polyline
                points={pts(route)}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="6 4"
                className={cn("fill-none", routeActive ? "stroke-info" : "stroke-muted-foreground")}
              />
            </g>
          )}
          {route.map((p, i) => {
            const [x, y] = geoToScreen(p)
            return (
              <g key={i} data-waypoint={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle r="10" className="fill-card stroke-foreground" strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" className="fill-foreground font-mono text-xs font-medium">
                  {i + 1}
                </text>
              </g>
            )
          })}
          {robots.map((r) => {
            if (!r.accuracy || r.fix === "none") return null
            const radius = r.accuracy / metresPerPixel(r.lat, view.z)
            // Only once it shows past the marker; a circle hidden under it says nothing.
            if (!(radius > DISC + 2) || radius > 20_000) return null
            const [x, y] = geoToScreen(r)
            return <circle key={r.id} data-accuracy={r.id} cx={x} cy={y} r={radius} className="fill-muted-foreground/15 stroke-muted-foreground" strokeWidth="1" />
          })}
          {[goal ? { g: projectGeo(goal), heading: goal.heading, draft: false } : null, draft ? { g: draft.at, heading: draft.heading, draft: true } : null].map((item) => {
            if (!item) return null
            const [x, y] = toScreen(item.g[0], item.g[1])
            return (
              <g key={item.draft ? "draft" : "goal"} data-goal={item.draft ? "draft" : "set"} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                {item.heading !== undefined && (
                  <g transform={`rotate(${item.heading})`}>
                    <path d="M0 -7V-30M-6 -23L0 -31L6 -23" className={halo} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0 -7V-30M-6 -23L0 -31L6 -23" className="fill-none stroke-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
                <circle r="7" className="fill-card stroke-foreground" strokeWidth="2" strokeDasharray={item.draft ? "3 2" : undefined} />
                <circle r="2.5" className="fill-foreground" />
              </g>
            )
          })}
          {showCursor && (
            <g data-cursor="" transform={`translate(${toScreen(cursor[0], cursor[1]).map((n) => n.toFixed(1)).join(" ")})`}>
              <path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14" className="fill-none stroke-map" strokeWidth="4" strokeLinecap="round" />
              <path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14" className="fill-none stroke-foreground" strokeWidth="1.5" strokeLinecap="round" />
              <circle r="2" className="fill-foreground" />
            </g>
          )}
        </svg>

        {gridShown && (
          <>
            {lonTicks.map((t) => (
              <span key={`lon-${t.v}`} data-graticule="lon" style={{ left: t.x + 4, top: 4 }} className="pointer-events-none absolute rounded-2xs bg-map px-1 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {labels.longitude(t.v, degDigits, locale)}
              </span>
            ))}
            {latTicks.map((t) => (
              <span key={`lat-${t.v}`} data-graticule="lat" style={{ right: 4, top: t.y + 2 }} className="pointer-events-none absolute rounded-2xs bg-map px-1 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {labels.latitude(t.v, degDigits, locale)}
              </span>
            ))}
          </>
        )}

        {fences.map((f) => {
          const spot = fenceSpots.get(f.id)
          if (!spot) return null
          return (
            <span
              key={f.id}
              style={{ left: spot.x, top: spot.y }}
              className="pointer-events-none absolute flex items-center gap-2 rounded-2xs bg-map px-1 text-xs whitespace-nowrap text-muted-foreground"
            >
              {f.kind === "keep-out" && <SafetyZone aria-hidden="true" className="size-4" />}
              {f.label ?? labels.fenceKind[f.kind]}
            </span>
          )
        })}

        {robots.map((r) => {
          const [x, y] = geoToScreen(r)
          const isSelected = r.id === selected
          const lost = r.fix === "none"
          return (
            <div
              key={r.id}
              data-robot-id={r.id}
              data-state={isSelected ? "selected" : undefined}
              data-fix={r.fix}
              style={{ left: x, top: y }}
              className={cn("absolute flex size-(--h-md) -translate-x-1/2 -translate-y-1/2 items-center justify-center", editing ? "pointer-events-none" : "cursor-pointer")}
            >
              <svg viewBox="-22 -22 44 44" className={cn("absolute inset-0 size-full", abnormal(r.status) ? statusText[r.status] : r.status === "offline" ? "text-muted-foreground" : "text-foreground")}>
                {isSelected && <circle r={DISC + 5} className="fill-none stroke-ring" strokeWidth="2" />}
                {r.heading !== undefined && <path d={`M0 ${-DISC - 6}L5 ${-DISC + 1}H-5Z`} transform={`rotate(${r.heading})`} fill="currentColor" />}
                {/* No fix: the last place it was known, with a dashed edge, as a goal not yet sent is dashed. */}
                <circle r={DISC} className={cn("fill-card", lost ? "stroke-foreground" : "stroke-edge")} strokeWidth={lost ? 1.5 : 1} strokeDasharray={lost ? "3 2" : undefined} />
              </svg>
              <StatusGlyph status={r.status} className="relative size-4" />
            </div>
          )
        })}
        {/* Names over every marker, so a crowded corner still reads; each was placed clear of the others where it could be. */}
        {robots.map((r) => {
          const isSelected = r.id === selected
          const lost = r.fix === "none"
          const spot = placed.get(r.id)!
          return (
            <span
              key={r.id}
              data-robot-label={r.id}
              style={{ left: spot.x, top: spot.y }}
              className={cn("pointer-events-none absolute flex h-5 items-center rounded-2xs bg-map px-1 font-mono text-xs whitespace-nowrap", isSelected ? "font-bold" : "font-medium")}
            >
              {r.name}
              {(abnormal(r.status) || isSelected) && (
                <span className={cn("font-sans", abnormal(r.status) ? statusText[r.status] : "text-muted-foreground")}>&nbsp;· {statusWord(r, labels)}</span>
              )}
              {lost && <span className="font-sans text-warning">&nbsp;· {labels.fix.none}</span>}
            </span>
          )
        })}
        {showCursor && (
          <span
            data-slot="geo-map-cursor"
            // Right of the crosshair, or left of it where the readout would run past the frame's edge.
            style={toScreen(cursor[0], cursor[1])[0] + 12 + 26 * charWidth > size.w ? { right: size.w - toScreen(cursor[0], cursor[1])[0] + 12, top: toScreen(cursor[0], cursor[1])[1] + 12 } : { left: toScreen(cursor[0], cursor[1])[0] + 12, top: toScreen(cursor[0], cursor[1])[1] + 12 }}
            className="pointer-events-none absolute rounded-2xs bg-map px-1 font-mono text-xs whitespace-nowrap tabular-nums"
          >
            {where(geoOf(cursor), labels, locale)}
          </span>
        )}
      </div>

      {(banner || showConfirm || blockedNotice || tilesFailed || robots.length === 0) && (
        <ViewportOverlay position="top">
          {banner && (
            <ViewportPanel as="p" data-slot="geo-map-mode" className={cn("flex max-w-full flex-col gap-1", size.w < 480 && "px-2 py-1 text-xs")}>
              <span>{banner}</span>
            </ViewportPanel>
          )}
          {showConfirm && draftAt && (
            <ViewportPanel
              data-slot="geo-map-confirm"
              data-map-ui=""
              role="group"
              aria-label={labels.goalConfirm}
              className="pointer-events-auto flex max-w-full flex-col gap-2 p-3"
            >
              <p className="font-medium">{labels.goalConfirm}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {where(draftAt, labels, locale)}
                {draft?.heading !== undefined && ` · ${labels.heading(draft.heading)}`}
              </p>
              {!warning && size.w >= 480 && <p className="text-xs text-muted-foreground">{labels.goalConfirmKeys}</p>}
              {/* Disabled with its reason beside it, and as its description: a goal here must not be sent. */}
              {warning && (
                <p id={`${uid}-blocked`} data-slot="geo-map-confirm-warning" className="flex items-center gap-2 text-xs text-warning">
                  <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                  {warning}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={cancelDraft}>
                  {labels.cancel}
                </Button>
                <Button size="sm" disabled={!!warning} aria-describedby={warning ? `${uid}-blocked` : undefined} onClick={() => draft && commitGoal(draft)}>
                  {labels.send}
                </Button>
              </div>
            </ViewportPanel>
          )}
          {blockedNotice && (
            <ViewportPanel as="p" data-slot="geo-map-blocked" className="flex w-fit items-center gap-2 text-warning">
              <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
              {warning}
            </ViewportPanel>
          )}
          {tilesFailed && (
            <ViewportPanel as="p" className="w-fit text-muted-foreground">
              {labels.tilesFailed}
            </ViewportPanel>
          )}
          {robots.length === 0 && (
            <ViewportPanel>
              <EmptyState variant="overlay" title={labels.empty} />
            </ViewportPanel>
          )}
        </ViewportOverlay>
      )}

      {/* Bottom left, clear of the emergency stop, which products keep bottom right: zoom, the scale bar, the attribution. */}
      <ViewportOverlay position="bottom">
        <ButtonGroup orientation={vertical ? "vertical" : "horizontal"} className="pointer-events-auto rounded-sm shadow-float">
          <Button variant="secondary" size="icon" aria-label={labels.zoomIn} title={labels.zoomIn} disabled={view.z >= maxZoom} onClick={() => zoomBy(1)}>
            <ZoomIn aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label={labels.zoomOut} title={labels.zoomOut} disabled={view.z <= minZoom} onClick={() => zoomBy(-1)}>
            <ZoomOut aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label={labels.fit} title={labels.fit} onClick={() => glideTo(fitView(sizeRef.current))}>
            <Crosshair aria-hidden="true" />
          </Button>
        </ButtonGroup>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <div aria-hidden="true" data-slot="geo-map-scale" className="flex flex-col items-start gap-1 rounded-2xs bg-map px-1 pb-1 text-xs">
            <span>{labels.distance(scaleM, locale)}</span>
            <span style={{ width: scaleM / mpp }} className="h-2 border-x-2 border-b-2 border-foreground" />
          </div>
          {attribution && tiles.length > 0 && (
            <p data-slot="geo-map-attribution" data-map-ui="" className="pointer-events-auto rounded-2xs bg-map px-1 text-xs text-pretty text-muted-foreground">
              {attribution}
            </p>
          )}
        </div>
      </ViewportOverlay>
    </div>
  )
}

export type GeoMapListProps = Pick<GeoMapProps, "label" | "robots" | "fences" | "selectedId" | "onSelect" | "loading" | "error" | "onRetry" | "locale" | "labels" | "className">

/**
 * The map's robots as text: name, state, fix and accuracy, coordinates, fence and heading, one row each, in the order
 * given. Offer it beside every GeoMap (a Map / List switch, or side by side), as charts offer a table: for screen
 * readers, for exact coordinates, and on a phone. A row selects its robot on the map.
 */
export function GeoMapList({ label: name, robots = [], fences = [], selectedId, onSelect, loading, error, onRetry, locale, labels: given, className }: GeoMapListProps) {
  const labels = merge(given)
  const list = "flex flex-col divide-y divide-border overflow-hidden rounded-md bg-card ring-1 ring-border"
  if (loading) {
    return (
      <div data-slot="geo-map-list" data-loading="" aria-busy="true" className={cn(list, className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex flex-col gap-2 px-4 py-3">
            <Bone className="h-4 w-1/3" />
            <Bone className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <div data-slot="geo-map-list" data-error="" className={cn("flex flex-col items-start gap-3 rounded-md bg-card p-4 ring-1 ring-border", className)}>
        <p role="alert" className="flex items-center gap-2 text-sm">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          {error === true ? labels.error : error}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw aria-hidden="true" /> {labels.retry}
          </Button>
        )}
      </div>
    )
  }
  if (!robots.length) {
    return (
      <div data-slot="geo-map-list" data-empty="" className={cn("rounded-md bg-card ring-1 ring-border", className)}>
        <EmptyState size="inline" title={labels.empty} />
      </div>
    )
  }
  const hasAllowed = fences.some((f) => f.kind === "allowed")
  return (
    <ul data-slot="geo-map-list" aria-label={name} className={cn(list, className)}>
      {robots.map((r) => {
        const isSelected = r.id === selectedId
        const fence = fenceOf(r, fences)
        const inside = fence ? (fence.label ? labels.inFence(fence.label, labels.fenceKind[fence.kind]) : labels.inUnnamedFence(labels.fenceKind[fence.kind])) : hasAllowed ? labels.outsideAllowed : ""
        const fix = geoFixText(r, labels, locale)
        const lost = r.fix === "none"
        return (
          <li key={r.id} className="min-w-0">
            <button data-slot="geo-map-list-item"
              type="button"
              aria-pressed={isSelected}
              data-robot-id={r.id}
              onClick={() => onSelect?.(r.id, r)}
              className={cn(
                "press flex min-h-(--h-row) w-full min-w-0 flex-col items-start justify-center gap-1 border-l-2 px-4 py-3 text-left",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                isSelected ? "border-foreground bg-muted" : "border-transparent hover:bg-accent",
              )}
            >
              <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span className={cn("font-mono text-sm", isSelected ? "font-bold" : "font-medium")}>{r.name}</span>
                <span className={cn("flex items-center gap-2 text-xs", abnormal(r.status) ? statusText[r.status] : "text-muted-foreground")}>
                  <StatusGlyph status={r.status} />
                  {statusWord(r, labels)}
                </span>
                {fix && (
                  <span data-slot="geo-map-fix" className={cn("flex items-center gap-2 text-xs tabular-nums", lost ? "text-warning" : "text-muted-foreground")}>
                    {lost && <LocateOff aria-hidden="true" className="size-4 shrink-0" />}
                    {fix}
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {[where(r, labels, locale), inside, r.heading !== undefined ? labels.heading(r.heading) : ""]
                  .filter(Boolean)
                  .map((part, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && " · "}
                      <span className="whitespace-nowrap">{part}</span>
                    </React.Fragment>
                  ))}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
