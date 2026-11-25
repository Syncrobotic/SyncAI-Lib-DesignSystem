// @syncrobotic/point-cloud v0.35.0 · update: npx shadcn add @syncrobotic/point-cloud --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Crosshair, Radar, Rotate3d, RotateCw, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup } from "@/registry/syncrobotic/ui/button-group"
import { ViewportOverlay, ViewportPanel } from "@/registry/syncrobotic/ui/viewport-overlay"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"

/** What the points are coloured by: their height (z), the sensor's intensity, or nothing (one grey, as a map's scans). */
export type PointCloudColorBy = "height" | "intensity" | "none"

/** What the viewer shows, as `data-state` on its root. A stale cloud is still `ready`, with `data-stale` beside it. */
export type PointCloudState = "loading" | "error" | "no-webgl" | "empty" | "ready"

/** The finite points' extent, in metres, in the cloud's own frame. */
export type PointCloudBounds = { min: [number, number, number]; max: [number, number, number]; count: number }

/**
 * The orbit camera: it looks at `target` from `distance` metres away, turned `yaw` radians about z (0 looks from +x back
 * along x) and raised `pitch` radians above the ground plane. z is up, as in a ROS frame.
 */
export type PointCloudCamera = { target: [number, number, number]; yaw: number; pitch: number; distance: number }

export type PointCloudLabels = {
  /**
   * What the view is, read after `label` as its name: "Front lidar, 3D point cloud". The name stays the same while scans
   * arrive; the count and the extent are in its description instead.
   */
  viewName: string
  /** Read after the summary when the view has focus: what the pointer and the keys do. */
  keys: string
  /** "123,456 points". */
  count: (n: number) => string
  /** The extent, read by screen readers and shown nowhere else: "x −4.0 to 12.0 m forward, …". */
  bounds: (b: PointCloudBounds) => string
  /** Read with the summary when `robot` is drawn. */
  robotAtOrigin: string
  /** How long the last frame took, from the start of drawing until the GPU finished it, in the footer. */
  frameTime: (ms: number) => string
  loading: string
  /** Said in the view when there is nothing to draw. */
  empty: string
  error: string
  retry: string
  stale: string
  /** After "Stale": when the last cloud arrived. */
  lastScan: (time: string) => string
  /** The time of the last cloud. 24-hour clock by default; pass the site's own format or time zone. */
  formatTime: (date: Date) => string
  /** The browser cannot draw 3D: the first line, then why and what to do. */
  noWebGL: string
  noWebGLHint: string
  /** Said while the browser gives the 3D view back after taking it away (a GPU reset, too many views open). */
  contextLost: string
  resetView: string
  fit: string
  /** The words on the axes gizmo: each axis by its direction, so it never relies on colour. */
  axisX: string
  axisY: string
  axisZ: string
  /** The colour scale's name in the footer, by what it shows. */
  scaleHeight: string
  scaleIntensity: string
  /** The values at the colour scale's ends. */
  metres: (m: number) => string
  intensityValue: (v: number) => string
}

const fixed1 = (n: number) => (Object.is(Math.round(n * 10), -0) ? 0 : n).toFixed(1)

export const defaultPointCloudLabels: PointCloudLabels = {
  viewName: "3D point cloud",
  keys: "Drag to rotate, right-drag or two fingers to pan; the wheel or a pinch zooms once the view has focus. Arrow keys rotate, Shift with the arrows pans, plus and minus zoom, 0 resets the view.",
  count: (n) => (n === 1 ? "1 point" : `${n.toLocaleString("en-US")} points`),
  bounds: (b) =>
    `x ${fixed1(b.min[0])} to ${fixed1(b.max[0])} m forward, y ${fixed1(b.min[1])} to ${fixed1(b.max[1])} m left, z ${fixed1(b.min[2])} to ${fixed1(b.max[2])} m up`,
  robotAtOrigin: "The robot is at the origin, facing x",
  frameTime: (ms) => `Frame ${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`,
  loading: "Loading the point cloud",
  empty: "No points",
  error: "The point cloud could not be loaded.",
  retry: "Load again",
  stale: "Stale",
  lastScan: (time) => `last scan ${time}`,
  formatTime: (d) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"),
  noWebGL: "This browser cannot draw the 3D view.",
  noWebGLHint: "WebGL 2 is turned off or not supported. Turn on hardware acceleration, or open this page in a current browser.",
  contextLost: "Restoring the 3D view…",
  resetView: "Reset view",
  fit: "Fit to points",
  axisX: "x forward",
  axisY: "y left",
  axisZ: "z up",
  scaleHeight: "Height",
  scaleIntensity: "Intensity",
  metres: (m) => `${fixed1(m)} m`,
  intensityValue: (v) => (Math.abs(v) >= 100 ? Math.round(v).toString() : Number(v.toPrecision(3)).toString()),
}

// ---------------------------------------------------------------------------------------------------------------------
// The pure parts: bounds, the camera, colour positions and the drawn lines. They hold no state and touch no DOM, so the
// tests can check them without a GPU, and an app can use them to frame its own overlays.
// ---------------------------------------------------------------------------------------------------------------------

/** The vertical field of view, in radians. */
const FOV = (50 * Math.PI) / 180
const PITCH_LIMIT = 1.45
const MIN_DISTANCE = 0.05
const MAX_DISTANCE = 1e5
/** Room left round a fitted cloud, as a factor of the distance. */
const FIT_MARGIN = 1.08
/** The default angle: from behind the robot and a little to its left, looking forward and down. */
const DEFAULT_YAW = (5 * Math.PI) / 6
const DEFAULT_PITCH = 0.5
/** One arrow key turns the view this much; one + or − zooms by this factor. */
const KEY_YAW = Math.PI / 12
const KEY_PITCH = Math.PI / 18
const KEY_ZOOM = 1.25
/** Radians per pixel dragged. */
const DRAG_TURN = 0.008
/** Steps for the ground grid, in metres. */
const NICE = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
/** Colour stops sent to the shader, sampled from the theme's ramp. */
const RAMP_STOPS = 16
/**
 * Where the ramp starts: 20 % of the accent into the track, not the bare track. A heatmap cell at "none" may vanish into
 * the card; a point never stands for none, so the lowest one must still be seen against the view.
 */
const RAMP_FLOOR = 20

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * How often, at most, the description with the point count and the extent changes while the view stays in one state. A
 * live cloud changes them with every scan, and a screen reader that follows the description would otherwise hear them
 * at the sensor's rate.
 */
const SUMMARY_EVERY_MS = 5000

/** The extent of the finite points (a decoded PointCloud2 often carries NaN for rays that hit nothing), or null for none. */
export function pointCloudBounds(points: Float32Array): PointCloudBounds | null {
  let x0 = Infinity
  let y0 = Infinity
  let z0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  let z1 = -Infinity
  let count = 0
  for (let i = 0; i + 2 < points.length; i += 3) {
    const x = points[i]!
    const y = points[i + 1]!
    const z = points[i + 2]!
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
    if (z < z0) z0 = z
    if (z > z1) z1 = z
    count++
  }
  return count ? { min: [x0, y0, z0], max: [x1, y1, z1], count } : null
}

/**
 * The camera at `yaw` and `pitch` that shows the whole of `bounds` in a view of `aspect` (width over height), with a
 * small margin: each corner of the box is kept inside the view, so a long, flat cloud fills the view instead of the
 * sphere around it. With no bounds it frames ten metres square round the origin.
 */
export function fitPointCloudCamera(bounds: PointCloudBounds | null, aspect: number, yaw = DEFAULT_YAW, pitch = DEFAULT_PITCH): PointCloudCamera {
  const min = bounds?.min ?? [-5, -5, 0]
  const max = bounds?.max ?? [5, 5, 0]
  const target: [number, number, number] = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 1
  const tanY = Math.tan(FOV / 2)
  const tanX = tanY * a
  const c: PointCloudCamera = { target, yaw, pitch: clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT), distance: 1 }
  const { back, right, up } = cameraBasis(c)
  // A corner at depth b (towards the eye) and offsets r, u on screen is in view from distance d when r / (d − b) and
  // u / (d − b) stay within the half-fields' tangents: d ≥ b + r / tanX and d ≥ b + u / tanY.
  let d = 0.5
  for (let i = 0; i < 8; i++) {
    const v = [0, 1, 2].map((k) => ((i >> k) & 1 ? max[k]! : min[k]!) - target[k]!)
    const along = (w: [number, number, number]) => w[0] * v[0]! + w[1] * v[1]! + w[2] * v[2]!
    const b = along(back)
    d = Math.max(d, b + Math.abs(along(right)) / tanX, b + Math.abs(along(up)) / tanY)
  }
  return { ...c, distance: clamp(d * FIT_MARGIN, MIN_DISTANCE, MAX_DISTANCE) }
}

/** The camera turned by a drag of `dx`, `dy` pixels: right turns the cloud with the hand, down raises the eye. */
export function orbitPointCloudCamera(c: PointCloudCamera, dx: number, dy: number): PointCloudCamera {
  return { ...c, yaw: c.yaw - dx * DRAG_TURN, pitch: clamp(c.pitch + dy * DRAG_TURN, -PITCH_LIMIT, PITCH_LIMIT) }
}

/**
 * The zoom factor for one wheel event: its delta in pixels, lines (16 px each) or pages (`pageHeight` pixels each, the
 * view's height), so a mouse that scrolls by lines or pages zooms about as far per notch as one that scrolls by pixels.
 */
export function pointCloudWheelZoom(deltaY: number, deltaMode: number, pageHeight: number) {
  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? Math.max(1, pageHeight) : 1
  return Math.exp(-deltaY * unit * 0.002)
}

/** The camera moved closer by `factor` (above 1 zooms in, below 1 out). */
export function zoomPointCloudCamera(c: PointCloudCamera, factor: number): PointCloudCamera {
  return factor > 0 && Number.isFinite(factor) ? { ...c, distance: clamp(c.distance / factor, MIN_DISTANCE, MAX_DISTANCE) } : c
}

/** The eye's right and up directions in the world, for panning and for the axes gizmo. */
function cameraBasis(c: PointCloudCamera) {
  const cp = Math.cos(c.pitch)
  const sp = Math.sin(c.pitch)
  const cy = Math.cos(c.yaw)
  const sy = Math.sin(c.yaw)
  // From the target to the eye.
  const back: [number, number, number] = [cp * cy, cp * sy, sp]
  const right: [number, number, number] = [-sy, cy, 0]
  // up = right × forward, with forward = −back.
  const up: [number, number, number] = [-sp * cy, -sp * sy, cp]
  return { back, right, up }
}

/**
 * The camera after a pan of `dx`, `dy` pixels in a view `viewHeight` pixels tall: the point under the pointer follows
 * it, at the target's depth.
 */
export function panPointCloudCamera(c: PointCloudCamera, dx: number, dy: number, viewHeight: number): PointCloudCamera {
  const perPx = (2 * c.distance * Math.tan(FOV / 2)) / Math.max(1, viewHeight)
  const { right, up } = cameraBasis(c)
  const t = c.target
  return {
    ...c,
    target: [t[0] - (right[0] * dx - up[0] * dy) * perPx, t[1] - (right[1] * dx - up[1] * dy) * perPx, t[2] - (right[2] * dx - up[2] * dy) * perPx],
  }
}

/**
 * What a key does to the camera, or null when the viewer does not use it: arrows turn, Shift with the arrows pans a tenth
 * of the view, + and − zoom, 0 goes back to `reset`.
 */
export function pointCloudCameraForKey(
  c: PointCloudCamera,
  e: { key: string; shiftKey?: boolean },
  reset: PointCloudCamera,
  viewHeight = 400,
): PointCloudCamera | null {
  const step = viewHeight / 10
  switch (e.key) {
    case "ArrowLeft":
      return e.shiftKey ? panPointCloudCamera(c, -step, 0, viewHeight) : { ...c, yaw: c.yaw + KEY_YAW }
    case "ArrowRight":
      return e.shiftKey ? panPointCloudCamera(c, step, 0, viewHeight) : { ...c, yaw: c.yaw - KEY_YAW }
    case "ArrowUp":
      return e.shiftKey ? panPointCloudCamera(c, 0, -step, viewHeight) : { ...c, pitch: clamp(c.pitch + KEY_PITCH, -PITCH_LIMIT, PITCH_LIMIT) }
    case "ArrowDown":
      return e.shiftKey ? panPointCloudCamera(c, 0, step, viewHeight) : { ...c, pitch: clamp(c.pitch - KEY_PITCH, -PITCH_LIMIT, PITCH_LIMIT) }
    case "+":
    case "=":
      return zoomPointCloudCamera(c, KEY_ZOOM)
    case "-":
    case "_":
      return zoomPointCloudCamera(c, 1 / KEY_ZOOM)
    case "0":
      return reset
    default:
      return null
  }
}

/**
 * The values the colour scale runs over: the heights of the finite points, or the intensities beside them, unless the
 * app fixes `range` (so the colours stay put from one scan to the next). Null when there is nothing to colour by.
 */
export function pointCloudColorRange(
  points: Float32Array,
  colorBy: PointCloudColorBy,
  intensity?: Float32Array,
  range?: [number, number],
): [number, number] | null {
  if (colorBy === "none") return null
  if (range && Number.isFinite(range[0]) && Number.isFinite(range[1]) && range[1] !== range[0]) return range
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0, p = 0; p + 2 < points.length; i++, p += 3) {
    if (!Number.isFinite(points[p]!) || !Number.isFinite(points[p + 1]!) || !Number.isFinite(points[p + 2]!)) continue
    const v = colorBy === "intensity" ? intensity?.[i] : points[p + 2]
    if (v === undefined || !Number.isFinite(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return lo <= hi ? [lo, hi] : null
}

/** Where a value falls on the colour scale, from 0 (the light end in light mode) to 1 (the full accent). */
export function pointCloudRampPosition(value: number, range: [number, number] | null): number {
  if (!range || !Number.isFinite(value)) return 0
  const [lo, hi] = range
  return hi === lo ? 1 : clamp((value - lo) / (hi - lo), 0, 1)
}

/**
 * The vertex buffer: x, y, z and the ramp position of each finite point, interleaved, so one buffer and one draw call
 * carry the whole cloud. Points with a NaN or infinite coordinate are left out. When `into` is large enough the points are
 * packed into it instead of a new array, so a live cloud of the same size does not allocate megabytes on every scan; the
 * result is then a view of `into` and is overwritten by the next pack into it.
 */
export function packPointCloud(
  points: Float32Array,
  colorBy: PointCloudColorBy,
  intensity?: Float32Array,
  range?: [number, number] | null,
  into?: Float32Array,
) {
  const n = Math.floor(points.length / 3)
  const out = into && into.length >= n * 4 ? into : new Float32Array(n * 4)
  let count = 0
  for (let i = 0; i < n; i++) {
    const x = points[i * 3]!
    const y = points[i * 3 + 1]!
    const z = points[i * 3 + 2]!
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue
    const v = colorBy === "intensity" ? (intensity?.[i] ?? NaN) : z
    const o = count * 4
    out[o] = x
    out[o + 1] = y
    out[o + 2] = z
    out[o + 3] = colorBy === "none" ? 0 : pointCloudRampPosition(v, range ?? null)
    count++
  }
  return { data: count * 4 === out.length ? out : out.subarray(0, count * 4), count }
}

/** The ground grid on z = 0: a round step that gives at most about 24 lines a side, past the cloud and the origin by one step. */
export function pointCloudGrid(bounds: PointCloudBounds | null) {
  const x0 = Math.min(bounds?.min[0] ?? -5, 0)
  const x1 = Math.max(bounds?.max[0] ?? 5, 0)
  const y0 = Math.min(bounds?.min[1] ?? -5, 0)
  const y1 = Math.max(bounds?.max[1] ?? 5, 0)
  const extent = Math.max(x1 - x0, y1 - y0, 1)
  const step = NICE.find((n) => extent / n <= 24) ?? NICE[NICE.length - 1]!
  const ax = Math.floor(x0 / step) * step - step
  const bx = Math.ceil(x1 / step) * step + step
  const ay = Math.floor(y0 / step) * step - step
  const by = Math.ceil(y1 / step) * step + step
  const lines: number[] = []
  for (let x = ax; x <= bx + step / 2; x += step) lines.push(x, ay, 0, x, by, 0)
  for (let y = ay; y <= by + step / 2; y += step) lines.push(ax, y, 0, bx, y, 0)
  return { step, lines: new Float32Array(lines) }
}

/** The robot's footprint at the origin, as line segments: its outline and a chevron pointing forward (+x). */
function robotLines({ length, width }: { length: number; width: number }) {
  const l = length / 2
  const w = width / 2
  const z = 0.02
  const tip = l - Math.min(l, w) * 0.3
  const back = tip - Math.min(l, w) * 0.7
  const side = w * 0.6
  // prettier-ignore
  return new Float32Array([
    -l, -w, z, l, -w, z,  l, -w, z, l, w, z,  l, w, z, -l, w, z,  -l, w, z, -l, -w, z,
    back, side, z, tip, 0, z,  tip, 0, z, back, -side, z,
  ])
}

// Small column-major matrices, the layout WebGL reads.
function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[10] = (far + near) / (near - far)
  m[11] = -1
  m[14] = (2 * far * near) / (near - far)
  return m
}

function viewMatrix(c: PointCloudCamera) {
  const { back, right, up } = cameraBasis(c)
  const eye = [c.target[0] + back[0] * c.distance, c.target[1] + back[1] * c.distance, c.target[2] + back[2] * c.distance] as const
  const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
  // prettier-ignore
  return new Float32Array([
    right[0], up[0], back[0], 0,
    right[1], up[1], back[1], 0,
    right[2], up[2], back[2], 0,
    -dot(right, eye), -dot(up, eye), -dot(back, eye), 1,
  ])
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r]! * b[c * 4 + k]!
      out[c * 4 + r] = s
    }
  return out
}

/** Each axis on the gizmo: its direction on screen (x right, y down), from the camera's turn alone. */
export function pointCloudGizmo(c: PointCloudCamera) {
  const { right, up } = cameraBasis(c)
  return [0, 1, 2].map((i) => ({ x: right[i]!, y: -up[i]! }))
}

/**
 * The gizmo's arms and where each word goes: centred just past its arm's tip, then moved apart vertically where two
 * words would overlap (two axes can point almost the same way on screen). Sizes are in CSS pixels of 12 px monospace.
 */
export function pointCloudGizmoLayout(c: PointCloudCamera, words: string[], arm: number) {
  const CHAR = 7.2
  const H = 14
  const placed = pointCloudGizmo(c).map((d, i) => {
    const w = (words[i]?.length ?? 1) * CHAR + 4
    const len = Math.hypot(d.x, d.y)
    // An axis pointing at the eye has no direction on screen: its word goes above and to the right of the centre.
    const u = len > 0.15 ? { x: d.x / len, y: d.y / len } : { x: 0.6, y: -0.8 }
    const pad = Math.abs(u.x) * (w / 2) + Math.abs(u.y) * (H / 2) + 3
    const tip = { x: d.x * arm, y: d.y * arm }
    return { tip, label: { x: tip.x + u.x * pad, y: tip.y + u.y * pad }, w }
  })
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!
        const b = placed[j]!
        const overlapX = (a.w + b.w) / 2 - Math.abs(a.label.x - b.label.x)
        const overlapY = H - Math.abs(a.label.y - b.label.y)
        if (overlapX <= 0 || overlapY <= 0) continue
        const away = b.label.y >= a.label.y ? 1 : -1
        b.label.y += away * (overlapY + 2)
      }
  return placed.map(({ tip, label }) => ({ tip, label }))
}

/** A glide's ease: --ease-standard, cubic-bezier(0.2, 0, 0, 1), solved for x by bisection (as robot-map does). */
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

// ---------------------------------------------------------------------------------------------------------------------
// The renderer: raw WebGL2, one interleaved vertex buffer for the points and one small one for the grid and the robot.
// It lives outside React. The component hands it data in effects and events, and it draws only when asked: after new
// data, a resize, a theme change or a move of the camera, never in a loop.
// ---------------------------------------------------------------------------------------------------------------------

type Rgba = [number, number, number, number]
type Palette = { background: Rgba; grid: Rgba; robot: Rgba; ramp: Float32Array }

const POINTS_VS = `#version 300 es
layout(location = 0) in vec4 a_point;
uniform mat4 u_mvp;
uniform float u_size;
uniform vec3 u_ramp[${RAMP_STOPS}];
out vec3 v_color;
void main() {
  gl_Position = u_mvp * vec4(a_point.xyz, 1.0);
  gl_PointSize = u_size;
  float t = clamp(a_point.w, 0.0, 1.0) * float(${RAMP_STOPS - 1});
  int i = int(floor(t));
  int j = min(i + 1, ${RAMP_STOPS - 1});
  v_color = mix(u_ramp[i], u_ramp[j], fract(t));
}`

const POINTS_FS = `#version 300 es
precision mediump float;
uniform float u_round;
in vec3 v_color;
out vec4 o_color;
void main() {
  if (u_round > 0.5 && length(gl_PointCoord - 0.5) > 0.5) discard;
  o_color = vec4(v_color, 1.0);
}`

const LINES_VS = `#version 300 es
layout(location = 0) in vec3 a_pos;
uniform mat4 u_mvp;
void main() { gl_Position = u_mvp * vec4(a_pos, 1.0); }`

const LINES_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 o_color;
void main() { o_color = vec4(u_color.rgb * u_color.a, u_color.a); }`

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()
  const shaders = [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ].map(([type, src]) => {
    const s = gl.createShader(type as number)!
    gl.shaderSource(s, src as string)
    gl.compileShader(s)
    gl.attachShader(program, s)
    return s
  })
  gl.linkProgram(program)
  shaders.forEach((s) => gl.deleteShader(s))
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

type Resources = {
  gl: WebGL2RenderingContext
  points: {
    program: WebGLProgram
    vao: WebGLVertexArrayObject
    buffer: WebGLBuffer
    /** The bytes the points' buffer holds, so a scan that fits is written into it rather than the buffer being made again. */
    capacity: number
    mvp: WebGLUniformLocation | null
    size: WebGLUniformLocation | null
    ramp: WebGLUniformLocation | null
    round: WebGLUniformLocation | null
  }
  lines: { program: WebGLProgram; vao: WebGLVertexArrayObject; buffer: WebGLBuffer; mvp: WebGLUniformLocation | null; color: WebGLUniformLocation | null }
  maxPointSize: number
}

function createResources(gl: WebGL2RenderingContext): Resources | null {
  const pp = compile(gl, POINTS_VS, POINTS_FS)
  if (!pp) return null
  const lp = compile(gl, LINES_VS, LINES_FS)
  if (!lp) {
    // The first program linked, so it holds GPU memory that nothing else would free once this returns null.
    gl.deleteProgram(pp)
    return null
  }
  const vao = (stride: number, size: number) => {
    const v = gl.createVertexArray()
    const b = gl.createBuffer()
    gl.bindVertexArray(v)
    gl.bindBuffer(gl.ARRAY_BUFFER, b)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, size, gl.FLOAT, false, stride, 0)
    gl.bindVertexArray(null)
    return { vao: v, buffer: b }
  }
  const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null
  return {
    gl,
    points: {
      program: pp,
      ...vao(16, 4),
      capacity: 0,
      mvp: gl.getUniformLocation(pp, "u_mvp"),
      size: gl.getUniformLocation(pp, "u_size"),
      ramp: gl.getUniformLocation(pp, "u_ramp"),
      round: gl.getUniformLocation(pp, "u_round"),
    },
    lines: { program: lp, ...vao(12, 3), mvp: gl.getUniformLocation(lp, "u_mvp"), color: gl.getUniformLocation(lp, "u_color") },
    maxPointSize: range?.[1] ?? 64,
  }
}

function freeResources(r: Resources) {
  const { gl } = r
  if (gl.isContextLost()) return
  gl.deleteBuffer(r.points.buffer)
  gl.deleteBuffer(r.lines.buffer)
  gl.deleteVertexArray(r.points.vao)
  gl.deleteVertexArray(r.lines.vao)
  gl.deleteProgram(r.points.program)
  gl.deleteProgram(r.lines.program)
}

type Scene = {
  packed: { data: Float32Array; count: number }
  grid: Float32Array | null
  robot: Float32Array | null
  bounds: PointCloudBounds | null
}

class Renderer {
  camera: PointCloudCamera = fitPointCloudCamera(null, 16 / 9)
  /** Whether the camera has been fitted to a cloud yet: only the first one is, so a live cloud never yanks the view. */
  fitted = false
  pointSize = 2
  palette: Palette | null = null
  private res: Resources | null = null
  private scene: Scene | null = null
  private gridCount = 0
  private robotCount = 0
  private frame = 0
  private glide = 0
  private timing: { sync: WebGLSync; poll: ReturnType<typeof setTimeout> | undefined } | null = null
  /**
   * Frames are timed once someone has moved the camera: that is when the time matters, and a view at rest then shows
   * the same footer on every load (the screenshots compare it).
   */
  private moved = false

  constructor(
    private canvas: HTMLCanvasElement,
    /** After each frame is sent, with the camera it was drawn from (for the gizmo). */
    private onDrawn: (camera: PointCloudCamera) => void,
    /** Once the GPU has finished a frame, with how long it took from the start of drawing. */
    private onTimed: (ms: number) => void,
  ) {}

  /** Creates the context and everything drawn with it; false when the browser has no WebGL2. */
  start() {
    const gl = this.canvas.getContext("webgl2", { antialias: true, alpha: false, preserveDrawingBuffer: false })
    if (!gl) return false
    this.res = createResources(gl)
    if (!this.res) return false
    if (this.scene) this.upload(this.scene)
    this.requestDraw()
    return true
  }

  /** Lets go of every buffer, program and pending timer. The context itself goes with the canvas. */
  stop() {
    this.halt()
    if (this.res) freeResources(this.res)
    this.res = null
  }

  /** The context was taken away: everything made with it is gone already. */
  lost() {
    this.halt()
    this.res = null
  }

  private halt() {
    cancelAnimationFrame(this.frame)
    cancelAnimationFrame(this.glide)
    this.frame = 0
    this.glide = 0
    this.untime()
  }

  /** Stops waiting for a frame's fence: a newer frame replaces it, or the renderer stops. */
  private untime() {
    const t = this.timing
    if (!t) return
    clearTimeout(t.poll)
    if (this.res && !this.res.gl.isContextLost()) this.res.gl.deleteSync(t.sync)
    this.timing = null
  }

  get aspect() {
    return this.canvas.clientHeight > 0 ? this.canvas.clientWidth / this.canvas.clientHeight : 16 / 9
  }

  get viewHeight() {
    return this.canvas.clientHeight || 400
  }

  /** Uploads a new cloud once; the camera is fitted to the first one that has points. */
  setScene(scene: Scene) {
    this.scene = scene
    if (!this.fitted && scene.bounds) {
      this.camera = fitPointCloudCamera(scene.bounds, this.aspect)
      this.fitted = true
    }
    if (this.res) this.upload(scene)
    this.requestDraw()
  }

  private upload(scene: Scene) {
    const r = this.res!
    const { gl } = r
    gl.bindBuffer(gl.ARRAY_BUFFER, r.points.buffer)
    // A live cloud replaces the points many times a second: the buffer is marked dynamic, and a scan that fits in it is
    // written over the last one instead of the driver allocating a new buffer for each.
    const data = scene.packed.data
    if (data.byteLength > r.points.capacity) {
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
      r.points.capacity = data.byteLength
    } else if (data.byteLength) gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
    const grid = scene.grid ?? new Float32Array(0)
    const robot = scene.robot ?? new Float32Array(0)
    const lines = new Float32Array(grid.length + robot.length)
    lines.set(grid)
    lines.set(robot, grid.length)
    gl.bindBuffer(gl.ARRAY_BUFFER, r.lines.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    this.gridCount = grid.length / 3
    this.robotCount = robot.length / 3
  }

  setCamera(c: PointCloudCamera) {
    this.moved = true
    cancelAnimationFrame(this.glide)
    this.camera = c
    this.requestDraw()
  }

  /** Moves the camera over `ms` on --ease-standard; with no time (reduced motion), it jumps. */
  glideTo(to: PointCloudCamera, ms: number) {
    if (!ms) return this.setCamera(to)
    this.moved = true
    cancelAnimationFrame(this.glide)
    const from = this.camera
    // The shorter way round.
    const turn = Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw))
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const e = easeStandard(t)
      const lerp = (a: number, b: number) => a + (b - a) * e
      this.camera = {
        target: [lerp(from.target[0], to.target[0]), lerp(from.target[1], to.target[1]), lerp(from.target[2], to.target[2])],
        yaw: from.yaw + turn * e,
        pitch: lerp(from.pitch, to.pitch),
        // Distance moves on a log scale, so each step of the glide looks the same size.
        distance: from.distance * (to.distance / from.distance) ** e,
      }
      this.draw()
      this.glide = t < 1 ? requestAnimationFrame(step) : 0
    }
    this.glide = requestAnimationFrame(step)
  }

  /** One frame on the next animation frame; asking again before it is drawn changes nothing. */
  requestDraw() {
    if (this.frame || !this.res) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.draw()
    })
  }

  /** Sizes the drawing buffer to the canvas's box in device pixels (at most 2×, which is plenty for points). */
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      // Setting the size clears the drawing buffer. Drawing now, in the same task, means the cleared buffer is never
      // shown; waiting for the next frame would flash the bare background for a frame on every resize.
      this.canvas.width = w
      this.canvas.height = h
      cancelAnimationFrame(this.frame)
      this.frame = 0
      this.draw()
      return
    }
    this.requestDraw()
  }

  private draw() {
    const r = this.res
    const p = this.palette
    if (!r || !p || r.gl.isContextLost()) return
    const t0 = performance.now()
    const { gl } = r
    const dpr = this.canvas.clientWidth > 0 ? this.canvas.width / this.canvas.clientWidth : 1
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(p.background[0], p.background[1], p.background[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const c = this.camera
    const radius = this.scene?.bounds
      ? Math.hypot(...this.scene.bounds.max.map((v, i) => v - this.scene!.bounds!.min[i]!))
      : 10
    const near = Math.max(0.01, c.distance / 1000)
    const far = c.distance + radius * 4 + 100
    const mvp = multiply(perspective(FOV, this.canvas.width / Math.max(1, this.canvas.height), near, far), viewMatrix(c))

    // The grid first, recessive and translucent, without writing depth so no point is hidden behind a hairline.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(r.lines.program)
    gl.uniformMatrix4fv(r.lines.mvp, false, mvp)
    gl.bindVertexArray(r.lines.vao)
    if (this.gridCount) {
      gl.depthMask(false)
      gl.uniform4fv(r.lines.color, p.grid)
      gl.drawArrays(gl.LINES, 0, this.gridCount)
      gl.depthMask(true)
    }

    const count = this.scene?.packed.count ?? 0
    if (count) {
      gl.disable(gl.BLEND)
      gl.useProgram(r.points.program)
      gl.uniformMatrix4fv(r.points.mvp, false, mvp)
      const size = clamp(this.pointSize * dpr, 1, r.maxPointSize)
      gl.uniform1f(r.points.size, size)
      // Round points from 3 device pixels up; below that a square is a dot anyway, and discarding costs fill rate.
      gl.uniform1f(r.points.round, size >= 3 ? 1 : 0)
      gl.uniform3fv(r.points.ramp, p.ramp)
      gl.bindVertexArray(r.points.vao)
      gl.drawArrays(gl.POINTS, 0, count)
    }

    // The robot on top of everything, so a cloud around it never hides where it stands.
    if (this.robotCount) {
      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.useProgram(r.lines.program)
      gl.bindVertexArray(r.lines.vao)
      gl.uniform4fv(r.lines.color, p.robot)
      gl.drawArrays(gl.LINES, this.gridCount, this.robotCount)
    }
    gl.bindVertexArray(null)
    this.onDrawn(c)
    if (this.moved) this.time(gl, t0)
  }

  /**
   * The frame time: from the start of drawing until the GPU has finished, found with a fence polled every millisecond.
   * The time spent issuing calls alone says nothing about half a million points; the GPU's share is most of it.
   */
  private time(gl: WebGL2RenderingContext, t0: number) {
    this.untime()
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
    if (!sync) return
    gl.flush()
    const timing = { sync, poll: undefined as ReturnType<typeof setTimeout> | undefined }
    this.timing = timing
    const poll = () => {
      if (this.timing !== timing || gl.isContextLost()) return
      const done = gl.getSyncParameter(sync, gl.SYNC_STATUS) === gl.SIGNALED
      const ms = performance.now() - t0
      // A fence that never signals (a driver that drops it) is given up after a second rather than polled forever.
      if (!done && ms < 1000) {
        timing.poll = setTimeout(poll, 1)
        return
      }
      this.untime()
      if (done) this.onTimed(ms)
    }
    poll()
  }
}

/**
 * The CSS colours the view is drawn with: the theme's tokens, or, under forced colours (Windows High Contrast), system
 * colours, because there the theme's tokens may all resolve to one colour and the points would vanish into the
 * background. Forced colours draw the points in CanvasText on Canvas, the grid in GrayText and the robot in Highlight, so
 * the cloud stays visible in any contrast theme, in one colour, as forced colours draw everything else.
 */
export function pointCloudPaletteSources(colorBy: PointCloudColorBy, forced = false) {
  if (forced) return { background: "Canvas", grid: "GrayText", robot: "Highlight", ramp: Array<string>(RAMP_STOPS).fill("CanvasText") }
  const ramp = Array.from({ length: RAMP_STOPS }, (_, i) => {
    if (colorBy === "none") return "var(--map-point)"
    const pct = RAMP_FLOOR + ((100 - RAMP_FLOOR) * i) / (RAMP_STOPS - 1)
    return `color-mix(in oklab, var(--chart-1) ${pct.toFixed(2)}%, var(--track))`
  })
  return { background: "var(--map)", grid: "var(--edge)", robot: "var(--foreground)", ramp }
}

/** Reads the theme's colours as numbers, through a 1 × 1 canvas, so any colour syntax the theme uses (hex, oklch, color-mix) works. */
function readPalette(el: HTMLElement, colorBy: PointCloudColorBy, forced: boolean): Palette | null {
  const probe = document.createElement("span")
  probe.style.display = "none"
  // Under forced colours the browser would otherwise replace the probe's colour with a system colour, whatever it asks for.
  probe.style.setProperty("forced-color-adjust", "none")
  el.appendChild(probe)
  const paint = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  const read = (css: string): Rgba => {
    probe.style.color = ""
    probe.style.color = css
    const value = getComputedStyle(probe).color
    if (!paint) return [0, 0, 0, 1]
    paint.clearRect(0, 0, 1, 1)
    paint.fillStyle = value
    paint.fillRect(0, 0, 1, 1)
    const d = paint.getImageData(0, 0, 1, 1).data
    return [d[0]! / 255, d[1]! / 255, d[2]! / 255, d[3]! / 255]
  }
  const sources = pointCloudPaletteSources(colorBy, forced)
  const ramp = new Float32Array(RAMP_STOPS * 3)
  // A colour repeated at every stop (colorBy none, or forced colours) is read once.
  const seen = new Map<string, Rgba>()
  sources.ramp.forEach((css, i) => {
    const c = seen.get(css) ?? read(css)
    seen.set(css, c)
    ramp.set(c.slice(0, 3), i * 3)
  })
  const palette: Palette = { background: read(sources.background), grid: read(sources.grid), robot: read(sources.robot), ramp }
  probe.remove()
  return paint ? palette : null
}

/** The scale's gradient in CSS, the same mix the points are drawn with. */
const scaleGradient = `linear-gradient(to right in oklab, color-mix(in oklab, var(--chart-1) ${RAMP_FLOOR}%, var(--track)), var(--chart-1))`

type GlStatus = "pending" | "ready" | "unsupported" | "lost"

/** The WebGL context's life, which React does not own: a tiny store the component subscribes to. */
function createStatusStore() {
  let value: GlStatus = "pending"
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: GlStatus) => {
      if (next === value) return
      value = next
      listeners.forEach((l) => l())
    },
    subscribe: (l: () => void) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
  }
}

const serverStatus = (): GlStatus => "pending"

export type PointCloudProps = {
  /** Names the view for screen readers, with the summary: "Front lidar, Patrol dog 7F3A". */
  label: string
  /**
   * The points, x, y, z interleaved, in metres, in a ROS frame (REP 103: x forward, y left, z up), as decoded from a
   * sensor_msgs/PointCloud2. NaN points are skipped. Pass a new array for each scan: it is uploaded once, and an array changed in place is not seen.
   */
  points: Float32Array
  /** One intensity per point, in the same order. */
  intensity?: Float32Array
  /** What the colour shows. Defaults to intensity when `intensity` is given, else height; intensity without the array falls back to height. */
  colorBy?: PointCloudColorBy
  /** Fixes the colour scale's ends (metres for height), so colours mean the same from one scan to the next. Defaults to the cloud's own range. */
  colorRange?: [number, number]
  /** The points' size in CSS pixels. */
  pointSize?: number
  /** The ground grid on z = 0, in hairlines. */
  grid?: boolean
  /** The gizmo that says which way x, y and z point, in words. */
  axes?: boolean
  /** The robot's footprint at the origin, facing +x: `true` for 0.9 × 0.6 m, or its own length and width in metres. */
  robot?: boolean | { length: number; width: number }
  /** Bones in the view while the first cloud loads. */
  loading?: boolean
  /** The cloud could not be loaded: `true` for the default words, or your own message. */
  error?: React.ReactNode
  /** Shows a button under the error that tries again. */
  onRetry?: () => void
  /** With no new cloud for this long, the view says "Stale" with when the last one arrived, and dims. Off by default. */
  staleAfterMs?: number
  /** When the cloud was taken (the message's header stamp, in ms since the epoch). Without it, when `points` arrived. */
  receivedAt?: number
  /** Width over height of the view. 16 / 9 by default. */
  aspectRatio?: number
  labels?: Partial<PointCloudLabels>
  className?: string
}

/**
 * A LiDAR or depth point cloud, drawn with WebGL2 (no 3D library): coloured by height or intensity on the accent's single-hue
 * ramp, over a recessive ground grid, with the robot at the origin and an axes gizmo in words. Drag to orbit, the wheel
 * (once focused, or with Ctrl) or a pinch to zoom, right-drag or two fingers to pan; arrows, + − and 0 on the keyboard. It
 * draws only when something changes, so half a million points stay smooth to turn.
 */
export function PointCloud({
  label,
  points,
  intensity,
  colorBy: colorByProp,
  colorRange,
  pointSize = 2,
  grid = true,
  axes = true,
  robot,
  loading,
  error,
  onRetry,
  staleAfterMs,
  receivedAt,
  aspectRatio = 16 / 9,
  labels: labelsProp,
  className,
}: PointCloudProps) {
  const l = { ...defaultPointCloudLabels, ...labelsProp }
  const keysId = React.useId()
  const summaryId = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameTimeRef = React.useRef<HTMLSpanElement>(null)
  const gizmoRef = React.useRef<SVGSVGElement>(null)
  const renderer = React.useRef<Renderer | null>(null)

  const colorBy: PointCloudColorBy = colorByProp === "intensity" && !intensity ? "height" : (colorByProp ?? (intensity ? "intensity" : "height"))
  const bounds = React.useMemo(() => pointCloudBounds(points), [points])
  // The fixed range is followed by its two numbers, not the array: an inline `colorRange={[0, 3]}` is a new array on every
  // render of the parent, and depending on it would pack and upload the whole cloud again each time.
  const rangeLo = colorRange?.[0]
  const rangeHi = colorRange?.[1]
  const range = React.useMemo(
    () => pointCloudColorRange(points, colorBy, intensity, rangeLo !== undefined && rangeHi !== undefined ? [rangeLo, rangeHi] : undefined),
    [points, colorBy, intensity, rangeLo, rangeHi],
  )
  const footprint = robot === true ? { length: 0.9, width: 0.6 } : robot || null
  const robotLength = footprint?.length
  const robotWidth = footprint?.width

  const [status] = React.useState(createStatusStore)
  const gl = React.useSyncExternalStore(status.subscribe, status.get, serverStatus)

  // The latest words for the frame-time line, which the renderer writes after each frame rather than through a render.
  const frameLabel = React.useRef(l.frameTime)
  React.useLayoutEffect(() => {
    frameLabel.current = l.frameTime
  })

  // The context: made once the canvas is in the page, made again when the browser restores one it took away.
  React.useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return
    const r = new Renderer(canvas, (camera) => {
      const svg = gizmoRef.current
      if (!svg) return
      const words = [...svg.querySelectorAll("text")].map((t) => t.textContent ?? "")
      pointCloudGizmoLayout(camera, words, GIZMO_ARM).forEach((g, i) => {
        const line = svg.querySelector<SVGLineElement>(`[data-axis="${i}"] line`)
        const text = svg.querySelector<SVGTextElement>(`[data-axis="${i}"] text`)
        line?.setAttribute("x2", g.tip.x.toFixed(1))
        line?.setAttribute("y2", g.tip.y.toFixed(1))
        text?.setAttribute("x", g.label.x.toFixed(1))
        text?.setAttribute("y", g.label.y.toFixed(1))
      })
    }, (ms) => {
      if (frameTimeRef.current) frameTimeRef.current.textContent = frameLabel.current(ms)
    })
    renderer.current = r
    const start = () => status.set(r.start() ? "ready" : "unsupported")
    const onLost = (e: Event) => {
      // Asking for the context back: without preventDefault the browser never restores it.
      e.preventDefault()
      r.lost()
      status.set("lost")
    }
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", start)
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => r.resize())
    ro?.observe(canvas)
    r.resize()
    start()
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", start)
      ro?.disconnect()
      r.stop()
      renderer.current = null
    }
  }, [status])

  // The theme's colours, read again when the theme or contrast changes, since WebGL cannot use CSS variables.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || gl !== "ready") return
    const apply = () => {
      const r = renderer.current
      if (!r) return
      const forced = window.matchMedia?.("(forced-colors: active)")?.matches ?? false
      r.palette = readPalette(root, colorBy, forced)
      r.requestDraw()
    }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-contrast"] })
    const queries = ["(prefers-color-scheme: dark)", "(prefers-contrast: more)", "(forced-colors: active)"]
      .map((q) => window.matchMedia?.(q))
      .filter((q) => !!q)
    queries.forEach((q) => q.addEventListener("change", apply))
    return () => {
      mo.disconnect()
      queries.forEach((q) => q.removeEventListener("change", apply))
    }
  }, [gl, colorBy])

  // A new cloud (or a new way to colour it) is packed and uploaded once; nothing is uploaded while the camera moves. The
  // packing reuses one array while the clouds fit in it: the renderer keeps only the latest scene, so overwriting the
  // last one loses nothing.
  const scratch = React.useRef<Float32Array | null>(null)
  React.useEffect(() => {
    const r = renderer.current
    if (!r) return
    const need = Math.floor(points.length / 3) * 4
    if (!scratch.current || scratch.current.length < need) scratch.current = new Float32Array(need)
    r.setScene({
      packed: packPointCloud(points, colorBy, intensity, range, scratch.current),
      grid: grid ? pointCloudGrid(bounds).lines : null,
      robot: robotLength && robotWidth ? robotLines({ length: robotLength, width: robotWidth }) : null,
      bounds,
    })
  }, [points, intensity, colorBy, range, grid, bounds, robotLength, robotWidth])

  React.useEffect(() => {
    const r = renderer.current
    if (!r) return
    r.pointSize = pointSize
    r.requestDraw()
  }, [pointSize])

  // Stale: no new cloud for staleAfterMs. The timer restarts with each cloud; the flag belongs to the cloud it went stale
  // on, so a new one clears it without an effect setting state.
  const scanKey: unknown = receivedAt ?? points
  const [staleOn, setStaleOn] = React.useState<{ key: unknown; at: number } | null>(null)
  React.useEffect(() => {
    if (staleAfterMs === undefined) return
    const at = receivedAt ?? Date.now()
    const id = setTimeout(() => setStaleOn({ key: scanKey, at }), Math.max(0, at + staleAfterMs - Date.now()))
    return () => clearTimeout(id)
  }, [scanKey, receivedAt, staleAfterMs])

  const state: PointCloudState = loading ? "loading" : error ? "error" : gl === "unsupported" ? "no-webgl" : !bounds ? "empty" : "ready"
  const stale = staleAfterMs !== undefined && staleOn !== null && staleOn.key === scanKey && state !== "loading" && state !== "error"
  const interactive = state === "ready" && gl === "ready"

  // Buttons and the 0 key glide to the new view at --motion-base; with reduced motion, or no motion token in the page,
  // they jump. Drags, pinches and the wheel follow the hand directly.
  const glideMs = () => {
    const el = rootRef.current
    const reduce = typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    return el && !reduce ? parseFloat(getComputedStyle(el).getPropertyValue("--motion-base")) || 0 : 0
  }
  const resetView = () => {
    const r = renderer.current
    if (r) r.glideTo(fitPointCloudCamera(bounds, r.aspect), glideMs())
  }
  const fitView = () => {
    const r = renderer.current
    if (r) r.glideTo(fitPointCloudCamera(bounds, r.aspect, r.camera.yaw, r.camera.pitch), glideMs())
  }

  // The wheel zooms once the view has focus (a click or Tab put it there), or with Ctrl / ⌘ (a trackpad pinch sends Ctrl).
  // Otherwise it scrolls the page, so a viewer in a long page does not trap the wheel.
  React.useEffect(() => {
    const el = surfaceRef.current
    if (!el || !interactive) return
    const onWheel = (e: WheelEvent) => {
      const r = renderer.current
      if (!r || !(e.ctrlKey || e.metaKey || el.contains(document.activeElement))) return
      e.preventDefault()
      r.setCamera(zoomPointCloudCamera(r.camera, pointCloudWheelZoom(e.deltaY, e.deltaMode, r.viewHeight)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [interactive])

  // One pointer orbits (with the right button, the middle one or Shift, it pans); two pinch to zoom and pan together.
  // The Map is made on first use, where useRef(new Map()) would make one on every render and throw it away.
  const pointerMap = React.useRef<Map<number, { x: number; y: number }> | null>(null)
  const held = () => (pointerMap.current ??= new Map())
  const panning = React.useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    // The middle button would otherwise start the browser's autoscroll on Windows, which takes the drag away from the pan.
    if (e.pointerType === "mouse" && e.button === 1) e.preventDefault()
    held().set(e.pointerId, { x: e.clientX, y: e.clientY })
    panning.current = e.pointerType === "mouse" && (e.button === 2 || e.button === 1 || e.shiftKey)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const r = renderer.current
    const pointers = held()
    const prev = pointers.get(e.pointerId)
    if (!r || !prev) return
    const p = { x: e.clientX, y: e.clientY }
    if (pointers.size >= 2) {
      const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)?.[1]
      if (other) {
        const before = Math.hypot(prev.x - other.x, prev.y - other.y)
        const after = Math.hypot(p.x - other.x, p.y - other.y)
        // Each finger moves the midpoint by half its own move.
        const zoomed = zoomPointCloudCamera(r.camera, before > 0 ? after / before : 1)
        r.setCamera(panPointCloudCamera(zoomed, (p.x - prev.x) / 2, (p.y - prev.y) / 2, r.viewHeight))
      }
    } else if (panning.current) r.setCamera(panPointCloudCamera(r.camera, p.x - prev.x, p.y - prev.y, r.viewHeight))
    else r.setCamera(orbitPointCloudCamera(r.camera, p.x - prev.x, p.y - prev.y))
    pointers.set(e.pointerId, p)
  }
  // Also on a lost capture (the browser or another element took the pointer): without it the pointer would stay held,
  // and moving over the view afterwards, with no button down, would still turn the camera.
  const onPointerEnd = (e: React.PointerEvent) => {
    const pointers = held()
    pointers.delete(e.pointerId)
    if (pointers.size === 0) panning.current = false
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const r = renderer.current
    if (!r || !interactive || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
    const reset = fitPointCloudCamera(bounds, r.aspect)
    const next = pointCloudCameraForKey(r.camera, e, reset, r.viewHeight)
    if (!next) return
    e.preventDefault()
    // A held arrow repeats: those steps follow the key directly; a single press glides like the buttons.
    if (e.key === "0") r.glideTo(next, glideMs())
    else r.setCamera(next)
  }

  // The gizmo and the frame-time line are filled in by the renderer after a frame; one is drawn when they appear.
  React.useEffect(() => {
    renderer.current?.requestDraw()
  }, [axes, interactive])

  const count = bounds?.count ?? 0
  const lastScan = stale && staleOn ? `${l.stale}, ${l.lastScan(l.formatTime(new Date(staleOn.at)))}` : ""
  // What a screen reader hears for the view: its state, or the cloud in numbers (also when the browser cannot draw it).
  const summary = (
    state === "loading"
      ? [l.loading]
      : state === "error"
        ? [typeof error === "string" ? error : l.error]
        : state === "empty"
          ? [l.empty, lastScan]
          : [state === "no-webgl" ? l.noWebGL : "", l.count(count), bounds ? l.bounds(bounds) : "", footprint ? l.robotAtOrigin : "", lastScan]
  )
    .filter(Boolean)
    // Sentences are joined with full stops, so a label's own closing stop is dropped rather than doubled.
    .map((part) => part.replace(/\.$/, ""))
    .join(". ")
  const statusLine =
    state === "loading" ? l.loading : gl === "lost" ? l.contextLost : lastScan

  // The description: the summary at once when the view's state changes, and otherwise at most every SUMMARY_EVERY_MS, so a
  // live cloud's count and extent do not change it at the sensor's rate. The state is compared during render, as the
  // stale flag is, so a new state never waits for an effect.
  const summaryState = `${state} ${gl} ${stale}`
  const [described, setDescribed] = React.useState({ state: summaryState, text: summary, at: 0 })
  if (described.state !== summaryState) setDescribed({ state: summaryState, text: summary, at: described.at })
  React.useEffect(() => {
    if (described.text === summary) return
    const wait = Math.max(0, described.at + SUMMARY_EVERY_MS - Date.now())
    const id = setTimeout(() => setDescribed((d) => ({ ...d, text: summary, at: Date.now() })), wait)
    return () => clearTimeout(id)
  }, [summary, described])

  return (
    <div
      ref={rootRef}
      data-slot="point-cloud"
      data-state={state}
      data-stale={stale ? "" : undefined}
      className={cn("flex flex-col gap-2", className)}
    >
      <span id={keysId} className="sr-only">
        {l.keys}
      </span>
      {/* Read only as the view's description (a hidden element still describes), so browsing does not read it twice. */}
      <span id={summaryId} hidden>
        {described.text}
      </span>
      {/* Spoken when it changes: loading, a stale cloud, the view coming back after the GPU let it go. */}
      <span role="status" className="sr-only">
        {statusLine}
      </span>

      <div
        data-slot="point-cloud-view"
        style={{ "--point-cloud-ratio": aspectRatio } as React.CSSProperties}
        className="relative isolate aspect-(--point-cloud-ratio) w-full overflow-hidden rounded-md bg-map ring-1 ring-border"
      >
        <div
          ref={surfaceRef}
          role="img"
          // The name stays the same while scans arrive; what changes (the count, the extent) is in the description.
          aria-label={`${label}, ${l.viewName}`}
          aria-describedby={interactive ? `${summaryId} ${keysId}` : summaryId}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
          onContextMenu={(e) => {
            if (interactive) e.preventDefault()
          }}
          className={cn(
            "absolute inset-0",
            interactive && "cursor-grab select-none active:cursor-grabbing",
            // One finger scrolls the page past the view until it has focus; then every finger is the camera's.
            "touch-pan-y focus:touch-none",
            // Inset, so it shows over the canvas and inside a rounded frame.
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={cn("block size-full transition-opacity duration-(--motion-base) ease-(--ease-standard)", state !== "ready" && "invisible", stale && "opacity-50")}
          />
        </div>

        {state === "loading" && (
          <div className="pointer-events-none absolute inset-0 p-4">
            <Bone className="size-full rounded-xs" />
          </div>
        )}

        {state === "error" && (
          <div role="alert" className="absolute inset-0 grid place-items-center p-4">
            <EmptyState
              variant="overlay"
              icon={CircleAlert}
              title={error === true ? l.error : error}
              action={
                onRetry && (
                  <Button variant="secondary" onClick={onRetry}>
                    <RotateCw aria-hidden="true" />
                    {l.retry}
                  </Button>
                )
              }
            />
          </div>
        )}

        {(state === "empty" || state === "no-webgl") && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
            <EmptyState variant="overlay" icon={Radar} title={state === "empty" ? l.empty : l.noWebGL} description={state === "no-webgl" ? l.noWebGLHint : undefined} />
          </div>
        )}

        {state === "ready" && gl === "lost" && (
          <ViewportOverlay position="center">
            <ViewportPanel as="p">{l.contextLost}</ViewportPanel>
          </ViewportOverlay>
        )}

        {stale && staleOn && (
          <ViewportOverlay position="top-left">
            <ViewportPanel as="p" data-slot="point-cloud-stale" className="flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
            <span>
              <span className="font-medium">{l.stale}</span> · <span className="tabular-nums">{l.lastScan(l.formatTime(new Date(staleOn.at)))}</span>
            </span>
            </ViewportPanel>
          </ViewportOverlay>
        )}

        {axes && interactive && (
          <svg
            ref={gizmoRef}
            aria-hidden="true"
            data-slot="point-cloud-axes"
            viewBox={`${-GIZMO_W / 2} ${-GIZMO_H / 2} ${GIZMO_W} ${GIZMO_H}`}
            className="pointer-events-none absolute top-0 right-0 h-36 w-52 text-xs"
          >
            {[l.axisX, l.axisY, l.axisZ].map((word, i) => (
              <g key={i} data-axis={i}>
                <line x1="0" y1="0" x2="0" y2="0" strokeWidth={i === 2 ? 2 : 1.5} strokeDasharray={i === 1 ? "3 2" : undefined} className="stroke-muted-foreground" />
                <text x="0" y="0" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-mono" paintOrder="stroke" strokeWidth="3" stroke="var(--map)">
                  {word}
                </text>
              </g>
            ))}
            <circle r="2" className="fill-muted-foreground" />
          </svg>
        )}

        {interactive && (
          // Bottom left, clear of the emergency stop, which products keep bottom right.
          <ViewportOverlay position="bottom-left">
            <ButtonGroup className="pointer-events-auto rounded-sm shadow-float">
              <Button variant="secondary" size="icon" aria-label={l.resetView} title={l.resetView} onClick={resetView}>
                <Rotate3d aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="icon" aria-label={l.fit} title={l.fit} onClick={fitView}>
                <Crosshair aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </ViewportOverlay>
        )}
      </div>

      {state === "ready" && (
        <div data-slot="point-cloud-footer" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 tabular-nums">
            <span>{l.count(count)}</span>
            {gl === "ready" && count > 0 && (
              // Empty until the camera first moves; the separator hides with it.
              <span ref={frameTimeRef} className="empty:hidden before:mr-2 before:content-['·']" />
            )}
          </p>
          {range && count > 0 && (
            <p data-slot="point-cloud-scale" className="flex items-center gap-2 tabular-nums">
              <span>{colorBy === "intensity" ? l.scaleIntensity : l.scaleHeight}</span>
              <span>{colorBy === "intensity" ? l.intensityValue(range[0]) : l.metres(range[0])}</span>
              <span aria-hidden="true" className="h-2 w-16 rounded-2xs" style={{ background: scaleGradient }} />
              <span>{colorBy === "intensity" ? l.intensityValue(range[1]) : l.metres(range[1])}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The gizmo's box (w-52 × h-36) and the length of each arm, in CSS pixels: room for the longest word past an arm's tip
 * in any direction, and for two words moved apart, without spilling over the view's edge.
 */
const GIZMO_W = 208
const GIZMO_H = 144
const GIZMO_ARM = 26
