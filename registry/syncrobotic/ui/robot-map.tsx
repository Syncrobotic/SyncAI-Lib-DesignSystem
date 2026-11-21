// @syncrobotic/robot-map v0.24.0 · update: npx shadcn add @syncrobotic/robot-map --overwrite
"use client"

import * as React from "react"
import { Crosshair, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusGlyph, statusText, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup } from "@/registry/syncrobotic/ui/button-group"
import { ChargingDock, SafetyZone } from "@/registry/syncrobotic/ui/robot-icons"

/**
 * A point on the site, in metres from the plan's top-left corner: x to the right, y down (as the plan image is drawn).
 * From a ROS map frame (y up, yaw counter-clockwise from +x in radians) whose plan has its bottom-left at
 * (originX, originY): x = xRos − originX, y = height − (yRos − originY), heading = 90 − yaw × 180 / π.
 */
export type RobotMapPoint = [x: number, y: number]

export type RobotMapZoneKind = "restricted" | "slow" | "charging" | "other"

/** An area of the site, drawn as a hairline outline with its icon and name; never a fill. */
export type RobotMapZone = {
  id: string
  kind: RobotMapZoneKind
  /** The corners, in metres, in order around the zone. */
  points: RobotMapPoint[]
  /** Its name, shown at its corner and in RobotMapList: "Cold store". Without it the kind's word (labels.zoneKind) is used; an unnamed `other` zone is only its outline. */
  label?: string
}

export type RobotMapRobot = {
  id: string
  /** Shown beside the marker and in the list: the robot's ID or short name ("AMR-07"). */
  name: string
  /** Position in metres from the plan's top-left corner. */
  x: number
  y: number
  /** Where it faces, in degrees clockwise from the top of the plan (0 up, 90 right). Leave it out when unknown. */
  heading?: number
  /** Its state, by shape: only warning and danger are coloured. */
  status: Status
  /** The state in words; without it the default word for `status` (labels.status). */
  statusLabel?: string
}

/** A route: `planned` is where a robot is going (dashed, the in-progress blue), `travelled` where it has been (solid, grey). */
export type RobotMapPath = { id: string; kind: "planned" | "travelled"; points: RobotMapPoint[]; robotId?: string }

/**
 * A ROS `nav_msgs/OccupancyGrid`, as its `info` and `data` arrive: cells row by row from the grid's origin, which is its
 * bottom-left corner in the map frame (y up). A cell is −1 when unknown and 0–100 for the chance it is occupied.
 */
export type RobotMapGrid = {
  /** Cells across and up (`info.width`, `info.height`). */
  width: number
  height: number
  /** Metres per cell (`info.resolution`). */
  resolution: number
  /** The outer corner of the first cell in the ROS map frame, in metres (`info.origin.position`). Its yaw must be 0, as map_server and the SLAM packages write it. */
  origin: { x: number; y: number }
  /** Row-major from the origin: cell (column, row) is `data[row × width + column]`, row 0 at the bottom. */
  data: Int8Array | readonly number[]
}

/** The plan in the ROS map frame: its size in metres and where its bottom-left corner is. */
export type RobotMapFrame = { width: number; height: number; origin: { x: number; y: number } }

/** A place and the way it faces, on the plan: metres from the top-left, heading clockwise from the top (0 up, 90 right). */
export type RobotMapPose = { x: number; y: number; heading?: number }

/**
 * The plan a grid makes when it is the whole floor plan: its size in metres, and its origin as the plan's bottom-left
 * corner. Give `width` and `height` to RobotMap (or leave them out with `grid`), and convert poses with `rosToPlan`.
 */
export const gridToPlan = (grid: RobotMapGrid): RobotMapFrame => ({
  width: grid.width * grid.resolution,
  height: grid.height * grid.resolution,
  origin: { x: grid.origin.x, y: grid.origin.y },
})

/**
 * A ROS pose (x, y in metres, yaw in radians counter-clockwise from +x) on the plan: `x = xRos − originX`,
 * `y = height − (yRos − originY)`, `heading = 90 − yaw × 180 / π`, kept between 0 and 360.
 */
export function rosToPlan(frame: RobotMapFrame, pose: { x: number; y: number; yaw?: number }): RobotMapPose {
  const at = { x: pose.x - frame.origin.x, y: frame.height - (pose.y - frame.origin.y) }
  if (pose.yaw === undefined) return at
  return { ...at, heading: (((90 - (pose.yaw * 180) / Math.PI) % 360) + 360) % 360 }
}

/** Where a grid lies on the plan, in metres from the plan's top-left: the ROS conversion applied to its corners. */
const gridRect = (grid: RobotMapGrid, frame: RobotMapFrame) => {
  const w = grid.width * grid.resolution
  const h = grid.height * grid.resolution
  // The grid's top-left is its origin raised by its own height, since the map frame's y grows up and the plan's down.
  const topLeft = rosToPlan(frame, { x: grid.origin.x, y: grid.origin.y + h })
  return { x: topLeft.x, y: topLeft.y, w, h }
}

/**
 * The grid as an RGBA image, top row first (the plan's y grows down, the grid's up), in one pass over the cells. The map
 * paints it in its own tokens through two masks of this one image, so it follows dark, light and high contrast without
 * drawing it again:
 *  - occupied (1–100): white at alpha value / 100; read as luminance it lays the ink colour on at that strength;
 *  - unknown (−1): opaque black, which is no luminance (no ink) but full alpha, where the no-data hatch shows;
 *  - free (0): transparent, the map's own surface.
 * A cell between 1 and 99 keeps a trace of the hatch under its ink, as a cell the robot is not sure about.
 * For a costmap (`kind: "cost"`) only costs above 0 are drawn, at alpha cost / 100; unknown is left clear.
 */
export function rasteriseGrid(grid: Pick<RobotMapGrid, "width" | "height" | "data">, kind: "occupancy" | "cost" = "occupancy") {
  const { width: w, height: h, data } = grid
  const out = new Uint8ClampedArray(w * h * 4)
  // One 32-bit word per pixel is four times fewer writes than bytes; its byte order is the platform's.
  const px = new Uint32Array(out.buffer)
  const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1
  const word = (r: number, a: number) => (little ? ((a << 24) | (r << 16) | (r << 8) | r) >>> 0 : ((r << 24) | (r << 16) | (r << 8) | a) >>> 0)
  const shades = Array.from({ length: 101 }, (_, v) => word(255, Math.round((v * 255) / 100)))
  const unknown = kind === "occupancy" ? word(0, 255) : 0
  for (let row = 0; row < h; row++) {
    const from = row * w
    const to = (h - 1 - row) * w
    for (let col = 0; col < w; col++) {
      const v = data[from + col] ?? -1
      if (v === 0) continue
      px[to + col] = v < 0 ? unknown : (shades[Math.min(100, Math.round(v))] ?? 0)
    }
  }
  return out
}

/** The grid drawn into a PNG off the render, as a blob URL; null where there is no canvas (a server, the tests). */
async function gridImage(grid: RobotMapGrid, kind: "occupancy" | "cost"): Promise<string | null> {
  const { width: w, height: h } = grid
  if (!(w > 0 && h > 0) || typeof document === "undefined" || typeof ImageData === "undefined") return null
  const image = new ImageData(rasteriseGrid(grid, kind), w, h)
  let blob: Blob | null = null
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.putImageData(image, 0, 0)
    blob = await canvas.convertToBlob()
  } else {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.putImageData(image, 0, 0)
    // toBlob encodes the PNG away from the main thread, so even a 4000 × 4000 grid blocks only for the one pass above.
    blob = await new Promise<Blob | null>((done) => canvas.toBlob(done))
  }
  return blob ? URL.createObjectURL(blob) : null
}

/**
 * A grid's image, made again only when its cells or size change (a new `data` array), not on every pan or every new
 * object around the same cells. The previous image stays until the next one is ready, so a live costmap does not blink.
 */
function useGridImage(grid: RobotMapGrid | undefined, kind: "occupancy" | "cost") {
  const [image, setImage] = React.useState<{ url: string; grid: RobotMapGrid } | null>(null)
  const current = React.useEffectEvent(() => grid)
  const data = grid?.data
  const w = grid?.width
  const h = grid?.height
  React.useEffect(() => {
    const g = current()
    if (!g || !data || !w || !h) return
    let live = true
    gridImage(g, kind).then(
      (url) => {
        if (!url) return
        if (live) setImage({ url, grid: g })
        else URL.revokeObjectURL(url)
      },
      // A canvas that cannot be made (too large for the browser) leaves the layer empty rather than break the map.
      () => {},
    )
    return () => {
      live = false
    }
  }, [data, w, h, kind])
  // Each URL is freed once the image after it has been drawn, or when the map goes.
  React.useEffect(() => {
    if (!image) return
    return () => URL.revokeObjectURL(image.url)
  }, [image])
  if (!grid || !image) return null
  // While the next image is made, the one on screen keeps the place it was made for.
  return image.grid.data === grid.data ? { url: image.url, grid } : image
}

export type RobotMapLabels = {
  /** Read once when focus enters the map. */
  instructions: string
  zoomIn: string
  zoomOut: string
  fit: string
  /** Default words per status, for robots without statusLabel. */
  status: Record<Status, string>
  /** Default names per zone kind, and the kind's word in the list. */
  zoneKind: Record<RobotMapZoneKind, string>
  /** Said over the map and in the list when there are no robots. */
  empty: string
  loading: string
  error: string
  retry: string
  /** How many robots the map shows, read with the instructions. */
  count: (n: number) => string
  /** The selected robot, read with the instructions. */
  selected: (name: string, status: string) => string
  /** Where north is, when `northDeg` is given. */
  north: (deg: number) => string
  /** The letter on the north arrow. */
  northLetter: string
  /** RobotMapList: a robot's position. */
  position: (x: number, y: number) => string
  /** RobotMapList: the zone a robot is in. */
  inZone: (zone: string, kind?: string) => string
  /** RobotMapList: the zone a robot is in, when the zone has no name. */
  inUnnamedZone: (kind: string) => string
  /** RobotMapList: a robot outside every zone. */
  noZone: string
  /** RobotMapList: which way it faces. */
  heading: (deg: number) => string
  /** The scale bar's length. */
  metres: (m: number) => string
  /** The costmap's legend: its name and the two ends of its ramp ("Cost: low → lethal"). */
  costTitle: string
  costLow: string
  costHigh: string
}

const metres = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(1))

const defaultLabels: RobotMapLabels = {
  instructions: "Arrow keys move the map, plus and minus zoom, 0 shows the whole site. The robot list beside the map has the same robots as text.",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Show the whole site",
  status: { active: "Working", normal: "Idle", warning: "Needs attention", danger: "Stopped", offline: "Offline" },
  zoneKind: { restricted: "No entry", slow: "Slow zone", charging: "Charging", other: "Marked" },
  empty: "No robots on this site right now.",
  loading: "Loading the map",
  error: "The map could not be loaded.",
  retry: "Reload the map",
  count: (n) => (n === 1 ? "1 robot" : `${n} robots`),
  selected: (name, status) => `Selected: ${name}, ${status}`,
  north: (deg) => `North is ${Math.round(((deg % 360) + 360) % 360)}° clockwise from the top`,
  northLetter: "N",
  position: (x, y) => `${metres(x)} m across, ${metres(y)} m down`,
  inZone: (zone, kind) => (kind ? `In ${zone} (${kind.toLowerCase()})` : `In ${zone}`),
  inUnnamedZone: (kind) => `In a ${kind.toLowerCase()} zone`,
  noZone: "Outside the marked zones",
  heading: (deg) => `Facing ${Math.round(((deg % 360) + 360) % 360)}°`,
  metres: (m) => `${m} m`,
  costTitle: "Cost",
  costLow: "low",
  costHigh: "lethal",
}

const merge = (given?: Partial<RobotMapLabels>): RobotMapLabels => ({
  ...defaultLabels,
  ...given,
  status: { ...defaultLabels.status, ...given?.status },
  zoneKind: { ...defaultLabels.zoneKind, ...given?.zoneKind },
})

const statusWord = (r: RobotMapRobot, labels: RobotMapLabels) => r.statusLabel ?? labels.status[r.status]
const abnormal = (s: Status) => s === "warning" || s === "danger"

/** Whether a point is inside a polygon (even-odd rule). */
export function pointInPolygon([x, y]: RobotMapPoint, poly: RobotMapPoint[]) {
  let inside = false
  // Each edge runs from the previous corner j to corner i. Both are below poly.length, and the loop never runs on an
  // empty polygon, so both corners exist.
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** The first zone a robot stands in, in the order given. */
export const zoneOf = (r: RobotMapRobot, zones: RobotMapZone[]) => zones.find((z) => pointInPolygon([r.x, r.y], z.points))

// ---------------------------------------------------------------------------------------------------------------------
// The view: `k` is the zoom (1 = the whole site fits), `cx`/`cy` the point of the site, in metres, at the frame's centre.
// Everything is drawn in screen pixels from it, so lines, markers and text keep their size at any zoom.
// ---------------------------------------------------------------------------------------------------------------------

type View = { k: number; cx: number; cy: number }
type Size = { w: number; h: number }

const MAX_ZOOM = 20
const STEP = 1.5
/** The space kept around the site when it fits: 16 px, the frame's padding. */
const INSET = 16
/** Below the site, room for the zoom buttons and scale bar (44 px and 8 px apart), so they do not cover it when it fits. */
const BOTTOM = INSET + 44 + 8
/** The frame point the view's centre is drawn at: the middle of the room left by the insets. */
const anchor = ({ w, h }: Size) => ({ x: w / 2, y: (INSET + h - BOTTOM) / 2 })
/** Steps for the grid and the scale bar, in metres. */
const NICE = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

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

/** A label's box on screen, to keep names from covering each other. */
type Box = { x: number; y: number; w: number; h: number }
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** The marker's disc radius and the name's line height, in px. */
const DISC = 13
const LINE = 20
/** About the width of one character of 12 px monospace, plus the label's padding. */
const charWidth = 7.5

export type RobotMapProps = {
  /** Names the map for screen readers: "Map of North site". */
  label: string
  /** The site's size in metres: the plan's width and height. With `grid` and no plan of its own, leave them out: the grid's size is the plan's. */
  width?: number
  height?: number
  /** The floor plan under everything: an image URL (stretched over width × height), or SVG drawn in metres. */
  floorplan?: string | React.ReactNode
  /**
   * A ROS occupancy grid drawn as the floor (under `floorplan`, when both are given): free cells are the map's surface,
   * occupied ones the ink colour at their probability, unknown ones the no-data hatch. Drawn into an image once per new
   * `data` array, so pass a new array for new cells and the same one otherwise.
   */
  grid?: RobotMapGrid
  /** A ROS costmap (the same message) over the floor, in the accent's ramp from clear to strong, with a legend. */
  costmap?: RobotMapGrid
  /** Where the plan's bottom-left corner is in the ROS map frame, in metres: places `grid` and `costmap` on it. Without it, the grid's origin (the grid is the plan). */
  origin?: { x: number; y: number }
  zones?: RobotMapZone[]
  robots?: RobotMapRobot[]
  paths?: RobotMapPath[]
  /** The selected robot, controlled; null for none. Without it the map keeps its own selection. */
  selectedId?: string | null
  /** Called with the robot clicked, or null when the background is clicked or Esc pressed. */
  onSelect?: (id: string | null, robot?: RobotMapRobot) => void
  /** Where north is, in degrees clockwise from the top of the plan. Without it no north arrow is drawn. */
  northDeg?: number
  /** Bones in the frame while the map loads. */
  loading?: boolean
  /** The map could not be loaded: says so in the frame (`true` for the default words, or your own message). */
  error?: React.ReactNode
  /** Shows a button under the error that tries again. */
  onRetry?: () => void
  /** Fill the parent's height (a full-screen map) instead of keeping the site's proportions. */
  fill?: boolean
  labels?: Partial<RobotMapLabels>
  className?: string
}

const frame = "relative isolate w-full overflow-hidden rounded-md bg-map ring-1 ring-border"

/** The frame's size from the site's proportions: at most 75 % of the screen's height, so a tall site fits, and at least 288 px, so a wide one still has room on a phone. */
const proportions = (width: number, height: number, fill?: boolean): React.CSSProperties | undefined =>
  fill ? undefined : { aspectRatio: `${width} / ${height}`, maxHeight: "75svh", minHeight: "min(18rem, 75svh)" }

/**
 * A site's floor plan with its zones, routes and robots, in metres. Robots are their status shape (colour only when one
 * needs attention), a heading tick and their name; names move aside rather than cover each other. Drag, the wheel (once
 * the map has focus, or with Ctrl) and two fingers pan and zoom; so do the buttons and the keys. The map is one Tab stop;
 * offer RobotMapList beside it, the same robots as text, as a chart offers its table.
 */
export function RobotMap({
  label: name,
  width: widthProp,
  height: heightProp,
  floorplan,
  grid,
  costmap,
  origin,
  zones = [],
  robots = [],
  paths = [],
  selectedId: selectedProp,
  onSelect,
  northDeg,
  loading,
  error,
  onRetry,
  fill,
  labels: given,
  className,
}: RobotMapProps) {
  const labels = merge(given)
  // A grid with no size given is the whole plan; otherwise the size given wins and the grid sits on it by `origin`.
  // Neither (a map still loading its grid) draws a 1 m square, so nothing divides by zero.
  const width = (widthProp ?? (grid ? grid.width * grid.resolution : 0)) || 1
  const height = (heightProp ?? (grid ? grid.height * grid.resolution : 0)) || 1
  const frameRos: RobotMapFrame = { width, height, origin: origin ?? grid?.origin ?? { x: 0, y: 0 } }
  const gridShown = useGridImage(grid, "occupancy")
  const costShown = useGridImage(costmap, "cost")
  // SVG references ids through url(#…), which reads React's id characters badly; letters, digits and dashes only.
  const uid = React.useId().replace(/[^\w-]/g, "")
  const root = React.useRef<HTMLDivElement>(null)
  const [selectedState, setSelectedState] = React.useState<string | null>(null)
  const selected = selectedProp !== undefined ? selectedProp : selectedState
  const select = (id: string | null) => {
    if (selectedProp === undefined) setSelectedState(id)
    onSelect?.(id, id ? robots.find((r) => r.id === id) : undefined)
  }

  // The frame's size. Until it is measured (server render, tests) the site is drawn at 640 px across.
  const [measured, setMeasured] = React.useState<Size | null>(null)
  const size: Size = measured ?? { w: 640, h: Math.round((640 * height) / width) }
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

  const fitView: View = { k: 1, cx: width / 2, cy: height / 2 }
  const [view, setViewState] = React.useState<View>(fitView)
  const viewRef = React.useRef(view)
  const sizeRef = React.useRef(size)
  const base = Math.max(1e-6, Math.min((size.w - 2 * INSET) / width, (size.h - INSET - BOTTOM) / height))
  const baseRef = React.useRef(base)
  // The wheel and pointer handlers read the frame's size and scale from refs; they are updated after each commit, never
  // during render, so the React Compiler can keep this component.
  React.useLayoutEffect(() => {
    sizeRef.current = size
    baseRef.current = base
  })

  const limit = (v: View): View => {
    const k = clamp(v.k, 1, MAX_ZOOM)
    return { k, cx: clamp(v.cx, 0, width), cy: clamp(v.cy, 0, height) }
  }
  const frameId = React.useRef<number | undefined>(undefined)
  const setView = (v: View) => {
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    frameId.current = undefined
    viewRef.current = limit(v)
    setViewState(viewRef.current)
  }
  // Buttons and keys glide to the new view at --motion-base on --ease-standard; with reduced motion, or no motion token
  // in the page, they jump. Drags and the wheel follow the hand directly.
  const glideTo = (v: View) => {
    const to = limit(v)
    const el = root.current
    const reduce = typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const ms = el && !reduce ? parseFloat(getComputedStyle(el).getPropertyValue("--motion-base")) || 0 : 0
    if (!ms) return setView(to)
    const from = viewRef.current
    const start = performance.now()
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const e = easeStandard(t)
      // Zoom moves on a log scale, so each step of a glide looks the same size.
      const k = from.k * (to.k / from.k) ** e
      viewRef.current = { k, cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e }
      setViewState(viewRef.current)
      frameId.current = t < 1 ? requestAnimationFrame(step) : undefined
    }
    frameId.current = requestAnimationFrame(step)
  }
  React.useEffect(() => () => {
    if (frameId.current !== undefined) cancelAnimationFrame(frameId.current)
  }, [])

  /** The view after zooming by `factor` around a point of the frame (px), which stays where it is. */
  const zoomed = (v: View, factor: number, px: number, py: number): View => {
    const a = anchor(sizeRef.current)
    const s = baseRef.current * v.k
    const k = clamp(v.k * factor, 1, MAX_ZOOM)
    const s2 = baseRef.current * k
    const wx = v.cx + (px - a.x) / s
    const wy = v.cy + (py - a.y) / s
    return { k, cx: wx - (px - a.x) / s2, cy: wy - (py - a.y) / s2 }
  }
  const zoomBy = (factor: number) => {
    const a = anchor(sizeRef.current)
    glideTo(zoomed(viewRef.current, factor, a.x, a.y))
  }
  const panBy = (dx: number, dy: number) => {
    const v = viewRef.current
    const s = baseRef.current * v.k
    glideTo({ ...v, cx: v.cx + dx / s, cy: v.cy + dy / s })
  }

  // The wheel zooms once the map has focus (a click or Tab put it there), or with Ctrl / ⌘ (a trackpad pinch sends
  // Ctrl). Otherwise it scrolls the page, so a map in a long page does not trap the wheel.
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || el.contains(document.activeElement))) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const unit = e.deltaMode === 1 ? 16 : 1
      setView(zoomed(viewRef.current, Math.exp(-e.deltaY * unit * 0.002), e.clientX - r.left, e.clientY - r.top))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  // Drag with one pointer pans; two pinch and pan. A press that does not move selects the robot under it, or clears.
  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const gesture = React.useRef<{ moved: boolean; x: number; y: number; robot: string | null } | null>(null)
  const local = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    if ((e.target as HTMLElement).closest("button")) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      const robot = (e.target as Element).closest?.("[data-robot-id]")?.getAttribute("data-robot-id") ?? null
      gesture.current = { moved: false, x: p.x, y: p.y, robot }
    } else if (gesture.current) gesture.current.moved = true
    try {
      root.current?.setPointerCapture?.(e.pointerId)
    } catch {}
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const p = local(e)
    const g = gesture.current
    if (g && !g.moved && Math.hypot(p.x - g.x, p.y - g.y) > 4) g.moved = true
    if (!g?.moved) return
    const v = viewRef.current
    const s = baseRef.current * v.k
    // A second pointer down makes it a pinch around the first other pointer; this pointer alone pans.
    const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1]
    if (other) {
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(p.x - other.x, p.y - other.y)
      const mid0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 }
      const mid1 = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 }
      const z = zoomed(v, before > 0 ? after / before : 1, mid0.x, mid0.y)
      const s2 = baseRef.current * z.k
      setView({ ...z, cx: z.cx - (mid1.x - mid0.x) / s2, cy: z.cy - (mid1.y - mid0.y) / s2 })
    } else setView({ ...v, cx: v.cx - (p.x - prev.x) / s, cy: v.cy - (p.y - prev.y) / s })
    pointers.current.set(e.pointerId, p)
  }
  const onPointerEnd = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return
    const g = gesture.current
    if (pointers.current.size === 0) {
      gesture.current = null
      if (e.type === "pointerup" && g && !g.moved) {
        if (g.robot) select(g.robot)
        else if (selected) select(null)
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Only on the map itself: on its buttons the keys do what buttons do.
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
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
        zoomBy(STEP)
        break
      case "-":
      case "_":
        zoomBy(1 / STEP)
        break
      case "0":
        glideTo(fitView)
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

  // A robot selected from the list (or elsewhere) that is out of view: the map glides to it, keeping the zoom.
  const s = base * view.k
  const at = anchor(size)
  const toScreen = (x: number, y: number): [number, number] => [at.x + (x - view.cx) * s, at.y + (y - view.cy) * s]
  const selectedRobot = robots.find((r) => r.id === selected)
  // An effect event: it reads the current view and size, but only a change of selection runs it, since a pan away from
  // the selected robot afterwards is the person's choice.
  const glideToSelected = React.useEffectEvent(() => {
    if (!selectedRobot) return
    const [x, y] = toScreen(selectedRobot.x, selectedRobot.y)
    const m = 2 * DISC
    if (x < m || y < m || x > size.w - m || y > size.h - m) glideTo({ ...viewRef.current, cx: selectedRobot.x, cy: selectedRobot.y })
  })
  React.useEffect(() => {
    glideToSelected()
  }, [selected])

  const hint = `${uid}-hint`
  if (loading) {
    return (
      <div data-slot="robot-map" data-loading="" role="group" aria-label={name} aria-busy="true" style={proportions(width, height, fill)} className={cn(frame, className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        <Bone className="absolute inset-4 size-auto rounded-xs" />
      </div>
    )
  }
  if (error) {
    return (
      <div
        data-slot="robot-map"
        data-error=""
        role="group"
        aria-label={name}
        style={proportions(width, height, fill)}
        className={cn(frame, "flex flex-col items-center justify-center gap-3 p-4 text-center", className)}
      >
        <p role="alert" className="text-sm text-muted-foreground">
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

  // The grid: lines at a round number of metres, at least 40 px apart, drawn past the plan to the frame's edges.
  // Zoomed out past the ladder, the coarsest step is used.
  const gridStep = NICE.find((n) => n * s >= 40) ?? Math.max(...NICE)
  const x0 = view.cx - at.x / s
  const y0 = view.cy - at.y / s
  let lines = ""
  for (let i = Math.ceil(x0 / gridStep); i * gridStep <= x0 + size.w / s; i++) {
    const px = Math.round(toScreen(i * gridStep, 0)[0]) + 0.5
    lines += `M${px} 0V${size.h}`
  }
  for (let i = Math.ceil(y0 / gridStep); i * gridStep <= y0 + size.h / s; i++) {
    const py = Math.round(toScreen(0, i * gridStep)[1]) + 0.5
    lines += `M0 ${py}H${size.w}`
  }
  // The scale bar: the longest round length up to 120 px, or the finest step when even that is longer.
  const scaleM = [...NICE].reverse().find((n) => n * s <= 120) ?? Math.min(...NICE)
  const [ox, oy] = toScreen(0, 0)
  const pts = (p: RobotMapPoint[]) => p.map(([x, y]) => toScreen(x, y).map((n) => n.toFixed(1)).join(",")).join(" ")

  // Names: below the marker, else right, above, left; the first place that covers no other name or marker. The selected
  // robot is placed first, so its name never moves aside.
  const order = [...robots].sort((a, b) => Number(b.id === selected) - Number(a.id === selected))
  const discs = robots.map((r) => {
    const [x, y] = toScreen(r.x, r.y)
    return { id: r.id, box: { x: x - DISC, y: y - DISC, w: 2 * DISC, h: 2 * DISC } }
  })
  // A zone's name sits in its first inside corner that no robot covers: top left, top right, bottom left, bottom right.
  // Robots move and a zone does not, so the name moves aside rather than hide under a robot.
  const zoneSpots = new Map<string, Box>()
  for (const z of zones) {
    const text = z.label ?? (z.kind === "other" ? undefined : labels.zoneKind[z.kind])
    if (!text) continue
    const xs = z.points.map((p) => p[0])
    const ys = z.points.map((p) => p[1])
    const [x0, y0] = toScreen(Math.min(...xs), Math.min(...ys))
    const [x1, y1] = toScreen(Math.max(...xs), Math.max(...ys))
    const w = text.length * charWidth + 32
    // A tuple of four, so the fallback to the first corner is always there.
    const corners: [Box, Box, Box, Box] = [
      { x: x0 + 4, y: y0 + 4, w, h: LINE },
      { x: x1 - 4 - w, y: y0 + 4, w, h: LINE },
      { x: x0 + 4, y: y1 - 4 - LINE, w, h: LINE },
      { x: x1 - 4 - w, y: y1 - 4 - LINE, w, h: LINE },
    ]
    zoneSpots.set(z.id, corners.find((c) => !discs.some((d) => overlap(d.box, c))) ?? corners[0])
  }
  // What a name must not cover either: the zone names, and the buttons and scale bar in the bottom-left corner.
  const vertical = size.h >= 400
  const blocked: Box[] = [
    vertical ? { x: 0, y: size.h - INSET - 3 * 44, w: INSET + 44 + 8 + 120, h: 3 * 44 + INSET } : { x: 0, y: size.h - BOTTOM, w: INSET + 3 * 44 + 8 + 120, h: BOTTOM },
    ...zoneSpots.values(),
  ]
  const inFrame = (b: Box) => b.x >= 0 && b.y >= 0 && b.x + b.w <= size.w && b.y + b.h <= size.h
  const names: Box[] = []
  const placed = new Map<string, { x: number; y: number }>()
  for (const r of order) {
    const [x, y] = toScreen(r.x, r.y)
    const text = r.name + (abnormal(r.status) || r.id === selected ? ` · ${statusWord(r, labels)}` : "")
    const w = text.length * charWidth + 8
    const gap = DISC + 2
    // A tuple of four, so the fallback to the first place is always there.
    const candidates: [Box, Box, Box, Box] = [
      { x: x - w / 2, y: y + gap, w, h: LINE },
      { x: x + gap, y: y - LINE / 2, w, h: LINE },
      { x: x - w / 2, y: y - gap - LINE, w, h: LINE },
      { x: x - gap - w, y: y - LINE / 2, w, h: LINE },
    ]
    const others = [...names, ...blocked, ...discs.filter((d) => d.id !== r.id).map((d) => d.box)]
    const pick = candidates.find((c) => inFrame(c) && !others.some((b) => overlap(b, c))) ?? candidates[0]
    names.push(pick)
    placed.set(r.id, { x: pick.x, y: pick.y })
  }

  /** A grid's rectangle on screen, from its rectangle on the plan. */
  const onScreen = (g: RobotMapGrid) => {
    const r = gridRect(g, frameRos)
    const [x, y] = toScreen(r.x, r.y)
    return { x, y, width: r.w * s, height: r.h * s }
  }
  // Nearest-neighbour once a cell is two pixels or more, so cells read as cells; smoothed below that, so a thin wall in a
  // large grid does not vanish between the pixels it falls on.
  const cells = (g: RobotMapGrid): React.CSSProperties => ({ imageRendering: g.resolution * s >= 2 ? "pixelated" : "auto" })
  const costLayer = costShown && (
    <g data-layer="costmap">
      <defs>
        <mask id={`${uid}-cost`} maskUnits="userSpaceOnUse" {...onScreen(costShown.grid)} style={{ maskType: "luminance" }}>
          <image href={costShown.url} preserveAspectRatio="none" {...onScreen(costShown.grid)} style={cells(costShown.grid)} />
        </mask>
      </defs>
      {/* The accent's sequential ramp, as heatmaps use it: clear at no cost, at most 60 % at lethal, so the floor and its
          walls still read through. */}
      <rect {...onScreen(costShown.grid)} className="fill-chart-1 opacity-60" mask={`url(#${uid}-cost)`} />
    </g>
  )
  const kindIcon = { restricted: SafetyZone, slow: SafetyZone, charging: ChargingDock, other: null }
  const summary = [
    robots.length ? labels.count(robots.length) : labels.empty,
    selectedRobot ? labels.selected(selectedRobot.name, statusWord(selectedRobot, labels)) : "",
    northDeg !== undefined ? labels.north(northDeg) : "",
  ]
    .filter(Boolean)
    .join(". ")

  return (
    <div
      ref={root}
      data-slot="robot-map"
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
      style={proportions(width, height, fill)}
      className={cn(
        frame,
        "cursor-grab select-none active:cursor-grabbing",
        // Inset, so a full-screen map shows it too; drawn over the map's layers (the frame is its own stacking context).
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        // A full-screen map takes every gesture; a map in a page lets one finger scroll the page up and down.
        fill ? "touch-none" : "touch-pan-y",
        className,
      )}
    >
      <p id={hint} className="sr-only">
        {labels.instructions} {summary}.
      </p>
      <div aria-hidden="true" className={cn("absolute inset-0", !measured && "invisible")}>
        <svg width={size.w} height={size.h} className="absolute inset-0">
          <path d={lines} className="fill-none stroke-edge" strokeWidth="1" />
          {grid && (
            <g data-layer="grid">
              {/* The surface first, so free cells are the map's own colour and the background lines stop at the grid. */}
              <rect {...onScreen(grid)} className="fill-map" />
              {gridShown && (
                <>
                  <defs>
                    <pattern id={`${uid}-hatch`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                      {/* The theme's no-data hatch (a 1 px line every 5 px in the field-edge colour), in screen pixels at any zoom. */}
                      <line x1="0.5" y1="0" x2="0.5" y2="5" className="stroke-input" strokeWidth="1" />
                    </pattern>
                    <mask id={`${uid}-unknown`} maskUnits="userSpaceOnUse" {...onScreen(gridShown.grid)} style={{ maskType: "alpha" }}>
                      <image href={gridShown.url} preserveAspectRatio="none" {...onScreen(gridShown.grid)} style={cells(gridShown.grid)} />
                    </mask>
                    <mask id={`${uid}-occupied`} maskUnits="userSpaceOnUse" {...onScreen(gridShown.grid)} style={{ maskType: "luminance" }}>
                      <image href={gridShown.url} preserveAspectRatio="none" {...onScreen(gridShown.grid)} style={cells(gridShown.grid)} />
                    </mask>
                  </defs>
                  <rect {...onScreen(gridShown.grid)} fill={`url(#${uid}-hatch)`} mask={`url(#${uid}-unknown)`} />
                  {/* The costmap between the hatch and the ink, so walls and racks stay ink over their lethal cost. */}
                  {costLayer}
                  <rect {...onScreen(gridShown.grid)} className="fill-foreground" mask={`url(#${uid}-occupied)`} />
                </>
              )}
            </g>
          )}
          {typeof floorplan === "string" ? (
            <image href={floorplan} x={ox} y={oy} width={width * s} height={height * s} preserveAspectRatio="none" />
          ) : floorplan ? (
            <g transform={`translate(${ox} ${oy}) scale(${s})`}>{floorplan}</g>
          ) : null}
          <rect x={ox} y={oy} width={width * s} height={height * s} className="fill-none stroke-map-point" strokeWidth="1" />
          {!gridShown && costLayer}
          {zones.map((z) => (
            <polygon
              key={z.id}
              data-zone={z.kind}
              points={pts(z.points)}
              // Told apart by line, never by fill: no entry 2 px solid, slow dashed, charging and other 1 px solid.
              strokeWidth={z.kind === "restricted" ? 2 : 1.5}
              strokeDasharray={z.kind === "slow" ? "6 4" : undefined}
              className="fill-none stroke-map-point"
            />
          ))}
          {paths.map((p) => (
            <polyline
              key={p.id}
              data-path={p.kind}
              points={pts(p.points)}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={p.kind === "planned" ? "6 4" : undefined}
              className={cn("fill-none", p.kind === "planned" ? "stroke-info" : "stroke-muted-foreground")}
            />
          ))}
        </svg>

        {zones.map((z) => {
          const Icon = kindIcon[z.kind]
          // An unnamed zone of no particular kind is only its outline.
          const text = z.label ?? (z.kind === "other" ? undefined : labels.zoneKind[z.kind])
          const spot = zoneSpots.get(z.id)
          if (!text || !spot) return null
          return (
            <span
              key={z.id}
              style={{ left: spot.x, top: spot.y }}
              className="pointer-events-none absolute flex items-center gap-2 rounded-2xs bg-map px-1 text-xs whitespace-nowrap text-muted-foreground"
            >
              {Icon && <Icon aria-hidden="true" className="size-4" />}
              {text}
            </span>
          )
        })}

        {robots.map((r) => {
          const [x, y] = toScreen(r.x, r.y)
          const isSelected = r.id === selected
          const spot = placed.get(r.id)!
          return (
            <React.Fragment key={r.id}>
              <div
                data-robot-id={r.id}
                data-state={isSelected ? "selected" : undefined}
                style={{ left: x, top: y }}
                className="absolute flex size-(--h-md) -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
              >
                <svg viewBox="-22 -22 44 44" className={cn("absolute inset-0 size-full", abnormal(r.status) ? statusText[r.status] : r.status === "offline" ? "text-muted-foreground" : "text-foreground")}>
                  {/* Selected: a 2 px ring in the focus ring's ink, outside the disc, so it reads without colour. */}
                  {isSelected && <circle r={DISC + 5} className="fill-none stroke-ring" strokeWidth="2" />}
                  {r.heading !== undefined && <path d={`M0 ${-DISC - 6}L5 ${-DISC + 1}H-5Z`} transform={`rotate(${r.heading})`} fill="currentColor" />}
                  <circle r={DISC} className="fill-card stroke-edge" strokeWidth="1" />
                </svg>
                <StatusGlyph status={r.status} className="relative size-4" />
              </div>
              <span
                data-robot-label={r.id}
                style={{ left: spot.x, top: spot.y }}
                className={cn(
                  "pointer-events-none absolute flex h-5 items-center rounded-2xs bg-map px-1 font-mono text-xs whitespace-nowrap",
                  isSelected ? "font-bold" : "font-medium",
                )}
              >
                {r.name}
                {(abnormal(r.status) || isSelected) && (
                  <span className={cn("font-sans", abnormal(r.status) ? statusText[r.status] : "text-muted-foreground")}>&nbsp;· {statusWord(r, labels)}</span>
                )}
              </span>
            </React.Fragment>
          )
        })}
      </div>

      {/* Top left, clear of the north arrow: what the map says about itself, one card under another. */}
      {(robots.length === 0 || costmap) && (
        <div className={cn("pointer-events-none absolute top-4 left-4 flex flex-col items-start gap-2", northDeg !== undefined ? "right-16" : "right-4")}>
          {costmap && (
            <p data-slot="robot-map-legend" className="flex items-center gap-2 rounded-xs bg-card px-2 py-1 text-xs text-muted-foreground ring-1 ring-border">
              <span className="font-medium text-foreground">{labels.costTitle}</span>
              {labels.costLow}
              <span aria-hidden="true" className="h-2 w-12 rounded-2xs bg-map bg-linear-to-r from-transparent to-chart-1/60 ring-1 ring-border" />
              {labels.costHigh}
            </p>
          )}
          {robots.length === 0 && <p className="w-fit rounded-xs bg-card px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">{labels.empty}</p>}
        </div>
      )}

      {northDeg !== undefined && (
        <div aria-hidden="true" className="absolute top-4 right-4 flex size-(--h-md) flex-col items-center justify-center rounded-md bg-card ring-1 ring-border">
          <svg viewBox="-12 -12 24 24" className="size-6" style={{ transform: `rotate(${northDeg}deg)` }}>
            <path d="M0 -10L5 4L0 1L-5 4Z" className="fill-foreground" />
          </svg>
          <span className="text-xs leading-none font-bold">{labels.northLetter}</span>
        </div>
      )}

      {/* Bottom left, clear of the emergency stop, which products keep bottom right. */}
      <div className="absolute bottom-4 left-4 flex items-end gap-2">
        {/* Stacked on a tall map; in a row on a short one (a phone), where a column would cover a third of it. */}
        <ButtonGroup orientation={vertical ? "vertical" : "horizontal"} className="shadow-float">
          <Button variant="secondary" size="icon" aria-label={labels.zoomIn} title={labels.zoomIn} disabled={view.k >= MAX_ZOOM} onClick={() => zoomBy(STEP)}>
            <ZoomIn aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label={labels.zoomOut} title={labels.zoomOut} disabled={view.k <= 1} onClick={() => zoomBy(1 / STEP)}>
            <ZoomOut aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label={labels.fit} title={labels.fit} onClick={() => glideTo(fitView)}>
            <Crosshair aria-hidden="true" />
          </Button>
        </ButtonGroup>
        <div aria-hidden="true" data-slot="robot-map-scale" className="flex flex-col items-start gap-1 rounded-2xs bg-map px-1 pb-1 text-xs">
          <span>{labels.metres(scaleM)}</span>
          <span style={{ width: scaleM * s }} className="h-2 border-x-2 border-b-2 border-foreground" />
        </div>
      </div>
    </div>
  )
}

export type RobotMapListProps = Pick<RobotMapProps, "label" | "robots" | "zones" | "selectedId" | "onSelect" | "loading" | "error" | "onRetry" | "labels" | "className">

/**
 * The map's robots as text: name, state, position, zone and heading, one row each, in the order given. Offer it beside
 * every RobotMap (a Map / List switch, or a Robots sheet over a full-screen map), as charts offer a table: for screen
 * readers, for exact positions, and on a phone. A row selects its robot on the map.
 */
export function RobotMapList({ label: name, robots = [], zones = [], selectedId, onSelect, loading, error, onRetry, labels: given, className }: RobotMapListProps) {
  const labels = merge(given)
  const list = "flex flex-col divide-y divide-border overflow-hidden rounded-md bg-card ring-1 ring-border"

  if (loading) {
    return (
      <div data-slot="robot-map-list" data-loading="" aria-busy="true" className={cn(list, className)}>
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
      <div data-slot="robot-map-list" data-error="" className={cn("flex flex-col items-start gap-3 rounded-md bg-card p-4 ring-1 ring-border", className)}>
        <p role="alert" className="text-sm text-muted-foreground">
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
      <p data-slot="robot-map-list" data-empty="" className={cn("rounded-md bg-card p-4 text-sm text-muted-foreground ring-1 ring-border", className)}>
        {labels.empty}
      </p>
    )
  }

  return (
    <ul data-slot="robot-map-list" aria-label={name} className={cn(list, className)}>
      {robots.map((r) => {
        const isSelected = r.id === selectedId
        const zone = zoneOf(r, zones)
        const kind = zone && labels.zoneKind[zone.kind]
        const where = !zone
          ? labels.noZone
          : zone.label
            ? labels.inZone(zone.label, zone.kind === "other" ? undefined : kind)
            : labels.inUnnamedZone(kind!)
        const word = statusWord(r, labels)
        return (
          <li key={r.id} className="min-w-0">
            <button
              type="button"
              aria-pressed={isSelected}
              data-robot-id={r.id}
              onClick={() => onSelect?.(r.id, r)}
              className={cn(
                "press flex min-h-(--h-row) w-full border-l-2 min-w-0 flex-col items-start justify-center gap-1 px-4 py-3 text-left",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                // Selected: weight and a 2 px ink edge on the start side, not a colour.
                isSelected ? "border-foreground bg-muted" : "border-transparent hover:bg-accent",
              )}
            >
              <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span className={cn("font-mono text-sm", isSelected ? "font-bold" : "font-medium")}>{r.name}</span>
                <span className={cn("flex items-center gap-2 text-xs", abnormal(r.status) ? statusText[r.status] : "text-muted-foreground")}>
                  <StatusGlyph status={r.status} />
                  {word}
                </span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {/* Each fact keeps its words together; the line breaks between facts, never leaving "270°" alone. */}
                {[labels.position(r.x, r.y), where, r.heading !== undefined ? labels.heading(r.heading) : ""]
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
