// @syncrobotic/robot-model v0.52.0 · update: npx shadcn add @syncrobotic/robot-model --overwrite
"use client"

import * as React from "react"
import * as THREE from "three"
import URDFLoader, { type URDFJoint, type URDFMimicJoint, type URDFRobot } from "urdf-loader"
import { Box, CircleAlert, Crosshair, OctagonAlert, Rotate3d, RotateCw, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientValue } from "@/registry/syncrobotic/hooks/use-now"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup } from "@/registry/syncrobotic/ui/button-group"
import { ViewportOverlay, ViewportPanel } from "@/registry/syncrobotic/ui/viewport-overlay"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { formatClockTime } from "@/registry/syncrobotic/lib/clock-time"
import { clamp } from "@/registry/syncrobotic/lib/math"
import { onThemeChange } from "@/registry/syncrobotic/lib/theme-change"

/** A joint's kind, as the URDF names it. */
export type RobotModelJointType = "revolute" | "continuous" | "prismatic" | "fixed" | "floating" | "planar"

/** One joint of the model, as plain data read from the URDF. */
export type RobotModelJointInfo = {
  name: string
  type: RobotModelJointType
  /** Limits in radians (revolute) or metres (prismatic); absent for continuous and fixed joints. */
  lower?: number
  upper?: number
  /** The link this joint moves. */
  child?: string
  /** For a mimic joint: the joint it follows, as value = multiplier × that joint's value + offset. */
  mimic?: { joint: string; multiplier: number; offset: number }
}

/**
 * The model as plain data: its name, the joints that move on their own (URDF order) and every link. `mimics` are joints
 * that follow another (`<mimic>`): not counted, but they can be highlighted by name.
 */
export type RobotModelInfo = { name: string; joints: RobotModelJointInfo[]; links: string[]; mimics?: RobotModelJointInfo[] }

/**
 * A joint's value as ROS sends it: one number (radians, or metres when prismatic), or the components in URDF order:
 * planar [x, y, θ], floating [x, y, z, roll, pitch, yaw]. A single number for a planar or floating joint is its x.
 */
export type RobotModelJointValue = number | readonly number[]

/** What the view shows, as `data-state` on its root. */
export type RobotModelState = "empty" | "loading" | "error" | "ready" | "stale" | "context-lost" | "no-webgl"

/** The orbit camera: angles in radians around the target, the distance in metres, the target in the scene's frame. */
export type RobotModelView = { yaw: number; pitch: number; distance: number; target: [number, number, number] }

/** Where each `package://name` points: `{ arm_description: "/robots/arm_description" }`. */
export type RobotModelPackages = Record<string, string>

export type RobotModelLabels = {
  /** Read after the summary when the view has focus: what the pointer and the keys do. */
  keys: string
  /** The name when neither `label` nor the URDF gives one. */
  robot: string
  /** "6 joints": the joints that move. */
  jointCount: (n: number) => string
  /** The summary the view is read as: the robot, that it is a 3D view, and how many joints move. */
  summary: (robot: string, joints: number) => string
  /** Added to the summary when something is highlighted: each item is one joint or link, described. */
  highlighted: (items: string[]) => string
  /**
   * A joint's value in words: degrees for revolute and continuous joints, millimetres for prismatic ones (ROS sends
   * radians and metres). Planar and floating joints are written with `poseValue` instead.
   */
  jointValue: (value: number, type: RobotModelJointType) => string
  /**
   * A planar ([x, y, θ]) or floating ([x, y, z, roll, pitch, yaw]) joint's value in words, each component with its own
   * unit: "x 120 mm, y −40 mm, θ 30°". Components that are not finite numbers are left out.
   */
  poseValue: (values: readonly number[], type: "planar" | "floating") => string
  /** A highlighted joint described: its value and its limits. `value` and the limits are already in words. */
  jointDetail: (value: string | undefined, lower: string | undefined, upper: string | undefined) => string
  /** A highlighted link (not a joint) described. */
  link: string
  loading: string
  /** While meshes arrive: "Loading meshes, 3 of 7". */
  loadingMeshes: (loaded: number, total: number) => string
  /** The first line of the error. */
  error: string
  /** What failed, under it: the file in words and why. */
  errorDetail: (path: string, reason: string) => string
  /** Why a URDF is not one: it is not XML, or it has no `<robot>`. */
  invalidUrdf: string
  /** A `package://` path whose package has no entry in `packages` and no `meshBaseUrl` to fall back on. */
  missingPackage: (pkg: string) => string
  /** A mesh in a format the default loader does not read. */
  unsupportedMesh: string
  retry: string
  /** With no URDF given. */
  empty: string
  stale: string
  /** After "Stale": when the joints last changed. */
  lastUpdate: (time: string) => string
  /** The time of the last update. 24-hour clock by default; pass the site's own format or time zone. */
  formatTime: (date: Date) => string
  /** The fallback's first line, when this browser cannot draw 3D. */
  noWebgl: string
  /** Under it: what the person can still read. */
  noWebglDetail: string
  /** The fallback's list of joints. */
  jointsHeading: string
  /** A joint with no value in `joints`. */
  noValue: string
  /** While the graphics context comes back after the GPU reset it. */
  contextLost: string
  /** The context did not come back within a few seconds; under it, Load again draws the view anew. */
  contextFailed: string
  resetView: string
  fitView: string
  /** The axes gizmo's words for the robot's own frame (ROS REP 103: x forward, y left, z up). */
  axes: { x: string; y: string; z: string }
}

const degrees = (rad: number) => {
  const d = Math.round((rad * 180) / Math.PI)
  return `${d < 0 ? "−" : ""}${Math.abs(d)}°`
}
const millimetres = (m: number) => {
  const mm = Math.round(m * 1000)
  return `${mm < 0 ? "−" : ""}${Math.abs(mm)} mm`
}

// The components of a planar or floating joint, in URDF order, and whether each is an angle (written in degrees) or a
// distance (written in millimetres).
const POSE_AXES = {
  planar: [
    ["x", false],
    ["y", false],
    ["θ", true],
  ],
  floating: [
    ["x", false],
    ["y", false],
    ["z", false],
    ["roll", true],
    ["pitch", true],
    ["yaw", true],
  ],
} as const satisfies Record<"planar" | "floating", readonly (readonly [string, boolean])[]>

export const defaultRobotModelLabels: RobotModelLabels = {
  keys:
    "Drag to turn the view, right-drag to move it, and the wheel or a pinch to zoom once the view has focus. Arrow keys turn, Shift with the arrows moves, plus and minus zoom, 0 resets the view and F fits the robot. The view only shows the robot; it does not move it.",
  robot: "Robot",
  jointCount: (n) => (n === 1 ? "1 joint" : `${n} joints`),
  summary: (robot, n) => `${robot}, 3D view, ${n === 1 ? "1 joint" : `${n} joints`}`,
  highlighted: (items) => `Highlighted: ${items.join("; ")}`,
  // A planar or floating joint given as one number is its x, a distance.
  jointValue: (value, type) => (type === "prismatic" || type === "planar" || type === "floating" ? millimetres(value) : degrees(value)),
  poseValue: (values, type) =>
    POSE_AXES[type]
      .flatMap(([axis, angle], i) => {
        const v = values[i]
        return v === undefined || !Number.isFinite(v) ? [] : [`${axis} ${angle ? degrees(v) : millimetres(v)}`]
      })
      .join(", "),
  jointDetail: (value, lower, upper) =>
    [value && `at ${value}`, lower !== undefined && upper !== undefined && `limits ${lower} to ${upper}`].filter(Boolean).join(", "),
  link: "link",
  loading: "Loading robot model…",
  loadingMeshes: (loaded, total) => `Loading meshes, ${loaded} of ${total}`,
  error: "The robot model could not be loaded.",
  errorDetail: (path, reason) => `${path}: ${reason}`,
  invalidUrdf: "not a URDF (no <robot> element, or the XML is broken)",
  missingPackage: (pkg) => `no path given for package “${pkg}”`,
  unsupportedMesh: "this mesh format is not supported (STL and COLLADA are)",
  retry: "Load again",
  empty: "No robot model to show.",
  stale: "Stale",
  lastUpdate: (time) => `last update ${time}`,
  formatTime: (d) => formatClockTime(d),
  noWebgl: "3D view unavailable: this browser cannot draw 3D (WebGL is off or not supported).",
  noWebglDetail: "The joint positions are listed below instead.",
  jointsHeading: "Joint positions",
  noValue: "No value",
  contextLost: "Restoring the 3D view…",
  contextFailed: "The 3D view could not be restored.",
  resetView: "Reset the view",
  fitView: "Fit the robot in view",
  axes: { x: "Forward", y: "Left", z: "Up" },
}

const mergeLabels = (given?: Partial<RobotModelLabels>): RobotModelLabels => ({
  ...defaultRobotModelLabels,
  ...given,
  axes: { ...defaultRobotModelLabels.axes, ...given?.axes },
})

/** A ROS `sensor_msgs/JointState` (its `name` and `position` arrays) as the `joints` record the view takes. */
export function jointStateToRecord(msg: { name: readonly string[]; position: readonly number[] }): Record<string, number> {
  const out: Record<string, number> = {}
  msg.name.forEach((name, i) => {
    const p = msg.position[i]
    if (p !== undefined && Number.isFinite(p)) out[name] = p
  })
  return out
}

// A `package://` path whose package could not be resolved is handed to the mesh loader with this prefix, so the loader can
// report the path in words instead of the URDF loader only logging it.
const MISSING = "\u0000missing-package:"

export type ParseUrdfOptions = {
  packages?: RobotModelPackages
  /** The folder relative mesh paths resolve against, and that holds the packages not listed in `packages`. */
  meshBaseUrl?: string
  /** Build the visual geometry (primitives now, meshes as they load). Off for the words fallback, which needs only the joints. */
  visuals?: boolean
  /** A mesh started loading. */
  onMeshStart?: (path: string) => void
  /** A mesh finished, with an error in words when it failed. Not called once `signal` has aborted. */
  onMeshEnd?: (path: string, error?: string) => void
  /** Aborted when the robot is not wanted any more: a mesh that arrives after it is freed instead of being added. */
  signal?: AbortSignal
  labels?: Pick<RobotModelLabels, "invalidUrdf" | "missingPackage" | "unsupportedMesh">
}

/** Thrown by `parseUrdf` when the text is not a URDF. */
export class UrdfError extends Error {}

const withSlash = (url: string) => (url === "" || url.endsWith("/") ? url : `${url}/`)

/** The folder a URL is in, with its trailing slash. */
export const urlBase = (url: string) => url.slice(0, url.lastIndexOf("/") + 1)

/**
 * Builds the robot from URDF text with urdf-loader: links, joints and the visual geometry (box, cylinder, sphere and
 * meshes). Collision geometry is skipped: a monitoring view shows what the robot looks like.
 */
export function parseUrdf(text: string, options: ParseUrdfOptions = {}): URDFRobot {
  const l = { ...defaultRobotModelLabels, ...options.labels }
  const doc = new DOMParser().parseFromString(text, "text/xml")
  if (doc.getElementsByTagName("parsererror").length > 0 || doc.documentElement?.nodeName !== "robot") throw new UrdfError(l.invalidUrdf)
  const base = withSlash(options.meshBaseUrl ?? "")
  const loader = new URDFLoader()
  loader.parseCollision = false
  loader.parseVisual = options.visuals !== false
  loader.workingPath = base
  loader.packages = (pkg: string) => {
    const dir = options.packages?.[pkg] ?? (options.meshBaseUrl !== undefined ? `${base}${pkg}` : undefined)
    return dir === undefined ? `${MISSING}${pkg}` : dir.replace(/\/$/, "")
  }
  loader.loadMeshCb = (path, manager, material, done) => {
    const shown = path.startsWith(MISSING) ? `package://${path.slice(MISSING.length)}` : path
    options.onMeshStart?.(shown)
    if (path.startsWith(MISSING)) {
      options.onMeshEnd?.(shown, l.missingPackage(path.slice(MISSING.length).split("/")[0] ?? ""))
      return
    }
    // The format is read from the path without its query or fragment, so `base.stl?v=2` (a cache-busting version) loads.
    // urdf-loader's own loader tests the whole path and would skip it without a word.
    const format = /\.(stl|dae)$/i.exec(path.replace(/[?#].*$/, ""))?.[1]?.toLowerCase()
    if (!format) {
      options.onMeshEnd?.(shown, l.unsupportedMesh)
      return
    }
    const signal = options.signal
    const end = (mesh: THREE.Object3D | null, err?: unknown) => {
      // The view that asked for this mesh is gone: its robot has been freed, so the mesh is freed rather than added to it.
      if (signal?.aborted) {
        if (mesh) disposeTree(mesh)
        return
      }
      if (mesh) done(mesh)
      options.onMeshEnd?.(shown, err ? reasonOf(err) : undefined)
    }
    // Each format's loader is fetched the first time a mesh of that format is asked for: a robot of boxes needs neither.
    const fail = (err: unknown) => end(null, err)
    if (format === "stl")
      void import("three/examples/jsm/loaders/STLLoader.js").then(({ STLLoader }) => {
        if (signal?.aborted) return
        new STLLoader(manager).load(path, (geometry) => end(new THREE.Mesh(geometry, material ?? new THREE.MeshPhongMaterial())), undefined, fail)
      }, fail)
    else
      void import("three/examples/jsm/loaders/ColladaLoader.js").then(({ ColladaLoader }) => {
        if (signal?.aborted) return
        new ColladaLoader(manager).load(path, (dae) => (dae ? end(dae.scene) : end(null, l.unsupportedMesh)), undefined, fail)
      }, fail)
  }
  // The text, not the checked document: urdf-loader tells a Document by instanceof, which fails across DOM implementations.
  return loader.parse(text)
}

/** A failure in words: an error's message, or what the browser said about a request. */
function reasonOf(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err && "target" in err) {
    const status = (err as { target?: { status?: number; statusText?: string } }).target?.status
    if (status) return `HTTP ${status}`
  }
  return String(err)
}

// The joint a mimic joint follows, by name, or undefined for a joint that moves on its own.
const mimicOf = (j: URDFJoint): URDFMimicJoint | undefined => ((j as Partial<URDFMimicJoint>).mimicJoint ? (j as URDFMimicJoint) : undefined)

/**
 * The model as plain data: its name, the joints that move on their own (fixed ones are not counted), the mimic joints
 * that follow them, and its links.
 */
export function describeRobot(robot: URDFRobot): RobotModelInfo {
  const plain = (j: URDFJoint): RobotModelJointInfo => {
    const limited = j.jointType === "revolute" || j.jointType === "prismatic"
    const child = j.children.find((c) => (c as { isURDFLink?: boolean }).isURDFLink) as { urdfName?: string } | undefined
    const m = mimicOf(j)
    return {
      name: j.urdfName,
      type: j.jointType,
      lower: limited ? j.limit.lower : undefined,
      upper: limited ? j.limit.upper : undefined,
      child: child?.urdfName,
      ...(m && { mimic: { joint: m.mimicJoint, multiplier: m.multiplier, offset: m.offset } }),
    }
  }
  const moving = Object.values(robot.joints).filter((j) => j.jointType !== "fixed")
  return {
    name: robot.robotName || "",
    joints: moving.filter((j) => !mimicOf(j)).map(plain),
    links: Object.keys(robot.links),
    mimics: moving.filter((j) => mimicOf(j)).map(plain),
  }
}

/** A joint of the model by name, whether it moves on its own or mimics another. */
const findJoint = (info: RobotModelInfo, name: string) => info.joints.find((j) => j.name === name) ?? info.mimics?.find((j) => j.name === name)

// How many components each joint type's value has; urdf-loader reads a missing component as undefined, not as "keep".
const ARITY: Record<RobotModelJointType, number> = { revolute: 1, continuous: 1, prismatic: 1, fixed: 1, planar: 3, floating: 6 }

/**
 * A joint's value as the view shows it. A mimic joint follows the joint it mimics whenever that joint has a value (as
 * the 3D view moves it), and reads its own entry in `joints` only when it does not.
 */
export function jointValueOf(name: string, info: RobotModelInfo, joints: Record<string, RobotModelJointValue> | undefined): RobotModelJointValue | undefined {
  const seen = new Set<string>()
  const read = (n: string): RobotModelJointValue | undefined => {
    const m = findJoint(info, n)?.mimic
    // urdf-loader refuses a loop of mimic joints when it parses; the set keeps a hand-built info from recursing forever.
    if (m && !seen.has(n)) {
      seen.add(n)
      const driver = read(m.joint)
      if (driver !== undefined) return typeof driver === "number" ? driver * m.multiplier + m.offset : driver.map((v) => v * m.multiplier + m.offset)
    }
    return joints?.[n]
  }
  return read(name)
}

/** A joint's value in words with the unit for its type and the right number of components, or undefined when it has none. */
export function jointValueWords(value: RobotModelJointValue | undefined, type: RobotModelJointType, labels: Pick<RobotModelLabels, "jointValue" | "poseValue">): string | undefined {
  if (value === undefined) return undefined
  const list = typeof value === "number" ? [value] : value
  if (!list.some((v) => Number.isFinite(v))) return undefined
  if (type === "planar" || type === "floating") return labels.poseValue(list.slice(0, ARITY[type]), type)
  const first = list[0]
  return first === undefined || !Number.isFinite(first) ? undefined : labels.jointValue(first, type)
}

/**
 * Sets each joint from `joints` and returns the names the model lacks. No limits are applied: the view shows what the
 * robot reports. A component left out or not finite keeps its last value. Mimic joints follow their driver
 * (urdf-loader); the driver's value wins, and a mimic's own is used only when the driver has none.
 */
export function applyJointValues(robot: URDFRobot, joints: Record<string, RobotModelJointValue> | undefined): string[] {
  const unknown: string[] = []
  // urdf-loader clamps any joint whose ignoreLimits is false, mimic joints included, so it is set on every joint.
  for (const joint of Object.values(robot.joints)) joint.ignoreLimits = true
  // How many mimic links lead from a joint back to one that moves on its own (0 for that one).
  const depth = (joint: URDFJoint, hops = 0): number => {
    const m = mimicOf(joint)
    const driver = m ? robot.joints[m.mimicJoint] : undefined
    return driver && hops < 64 ? 1 + depth(driver, hops + 1) : 0
  }
  const known: [URDFJoint, RobotModelJointValue][] = []
  for (const [name, value] of Object.entries(joints ?? {})) {
    const joint: URDFJoint | undefined = robot.joints[name]
    if (joint) known.push([joint, value])
    else unknown.push(name)
  }
  // The deepest mimic joints first and the driving joints last, so a driving joint's value is the one that stays.
  known.sort((a, b) => depth(b[0]) - depth(a[0]))
  for (const [joint, value] of known) {
    const n = ARITY[joint.jointType]
    const given = typeof value === "number" ? [value] : value
    const list = Array.from({ length: n }, (_, i) => {
      const v = given[i]
      return v !== undefined && Number.isFinite(v) ? v : null
    })
    if (list.every((v) => v === null)) continue
    joint.setJointValue(...list)
  }
  return unknown
}

/** The links to draw highlighted: each named link, and the link each named joint moves. */
export function highlightedLinks(info: RobotModelInfo, names: readonly string[] | undefined): Set<string> {
  const out = new Set<string>()
  for (const name of names ?? []) {
    if (info.links.includes(name)) out.add(name)
    const joint = findJoint(info, name)
    if (joint?.child) out.add(joint.child)
  }
  return out
}

/** What follows a highlighted name in words ("at 156°, limits −160° to 160°"), or undefined for a name the model does not have. */
function highlightDetail(name: string, info: RobotModelInfo, joints: Record<string, RobotModelJointValue> | undefined, labels: RobotModelLabels): string | undefined {
  const joint = findJoint(info, name)
  if (joint) {
    const words = (v: RobotModelJointValue | undefined) => jointValueWords(v, joint.type, labels)
    return labels.jointDetail(words(jointValueOf(name, info, joints)), words(joint.lower), words(joint.upper))
  }
  if (info.links.includes(name)) return `(${labels.link})`
  return undefined
}

/** One highlighted joint or link in words, for the callout and the summary. Names the model does not have are left out. */
export function describeHighlight(name: string, info: RobotModelInfo, joints: Record<string, RobotModelJointValue> | undefined, labels: RobotModelLabels): string | undefined {
  const detail = highlightDetail(name, info, joints, labels)
  return detail === undefined ? undefined : detail ? `${name} ${detail}` : name
}

/** What the view is read as: the robot, that it is a 3D view, how many joints move, and anything highlighted. */
export function robotModelSummary(info: RobotModelInfo, joints: Record<string, RobotModelJointValue> | undefined, highlight: readonly string[] | undefined, labels: RobotModelLabels, name?: string): string {
  const robot = name || info.name || labels.robot
  const items = (highlight ?? []).flatMap((h) => describeHighlight(h, info, joints, labels) ?? [])
  const parts = [labels.summary(robot, info.joints.length)]
  if (items.length) parts.push(labels.highlighted(items))
  return parts.join(". ")
}

/**
 * The joint values as a string that is equal exactly when the values are, whatever object holds them and in whatever
 * order its keys come, so an update is told by value.
 */
function jointValuesKey(joints: Record<string, RobotModelJointValue> | undefined) {
  if (!joints) return ""
  return Object.keys(joints)
    .sort()
    // An array joins its components with commas, so [1, 2] and 1.2 never read alike.
    .map((name) => `${name}\u0000${String(joints[name])}`)
    .join("\u0000")
}

/** How long a lost graphics context has to come back before the view says it could not be restored. */
const CONTEXT_RESTORE_MS = 5000

// The camera. Angles are in radians: yaw around the vertical, pitch above the ground plane.
const FOV = 35
const HALF_FOV = (FOV / 2) * (Math.PI / 180)
const DEFAULT_YAW = Math.PI / 4
const DEFAULT_PITCH = 0.4
const MIN_PITCH = -0.25
const MAX_PITCH = 1.5
const MIN_DISTANCE = 0.05
const MAX_DISTANCE = 200
const KEY_TURN = Math.PI / 12
const KEY_ZOOM = 1.25
const DRAG_TURN = 0.008

/** The model's bounding sphere in the scene's frame (y up). */
export type RobotModelBounds = { center: [number, number, number]; radius: number; floor: number }

/** The view that fits a bounding sphere, from the given angles, in a frame of the given width over height. */
export function fitView(bounds: RobotModelBounds, aspect: number, yaw = DEFAULT_YAW, pitch = DEFAULT_PITCH): RobotModelView {
  // The narrower of the two fields of view decides: a portrait frame fits by its width.
  const half = Math.min(HALF_FOV, Math.atan(Math.tan(HALF_FOV) * (aspect > 0 ? aspect : 1)))
  const distance = clamp((Math.max(bounds.radius, 0.01) / Math.sin(half)) * 1.05, MIN_DISTANCE, MAX_DISTANCE)
  return { yaw, pitch, distance, target: [...bounds.center] }
}

/** The view turned by the given angles; the pitch stops short of straight down and just below the floor. */
export const orbitView = (v: RobotModelView, dYaw: number, dPitch: number): RobotModelView => ({ ...v, yaw: v.yaw + dYaw, pitch: clamp(v.pitch + dPitch, MIN_PITCH, MAX_PITCH) })

/** The view zoomed by a factor (2 is twice as close). */
export const zoomView = (v: RobotModelView, factor: number): RobotModelView => ({ ...v, distance: clamp(v.distance / factor, MIN_DISTANCE, MAX_DISTANCE) })

type Vec = [number, number, number]
/** The camera's own axes: `out` from the target towards the camera, `right` and `up` on screen. */
function basis(v: Pick<RobotModelView, "yaw" | "pitch">) {
  const cp = Math.cos(v.pitch)
  const out: Vec = [cp * Math.sin(v.yaw), Math.sin(v.pitch), cp * Math.cos(v.yaw)]
  const right: Vec = [Math.cos(v.yaw), 0, -Math.sin(v.yaw)]
  const up: Vec = [out[1] * right[2] - out[2] * right[1], out[2] * right[0] - out[0] * right[2], out[0] * right[1] - out[1] * right[0]]
  return { out, right, up }
}

/** The view moved by a drag of (dx, dy) pixels in a frame `height` pixels tall: what is under the pointer stays under it. */
export function panView(v: RobotModelView, dx: number, dy: number, height: number): RobotModelView {
  const perPx = (2 * v.distance * Math.tan(HALF_FOV)) / Math.max(1, height)
  const { right, up } = basis(v)
  const t = v.target
  return { ...v, target: [t[0] - (right[0] * dx - up[0] * dy) * perPx, t[1] - (right[1] * dx - up[1] * dy) * perPx, t[2] - (right[2] * dx - up[2] * dy) * perPx] }
}

/** The camera's position for a view, in the scene's frame. */
export function cameraPosition(v: RobotModelView): Vec {
  const { out } = basis(v)
  return [v.target[0] + out[0] * v.distance, v.target[1] + out[1] * v.distance, v.target[2] + out[2] * v.distance]
}

/**
 * What a key does to the view while it has focus: a new view, "reset", "fit", or null when the key is not the view's.
 * Arrows turn (Shift with them moves), plus and minus zoom, 0 resets and F fits.
 */
export function viewForKey(key: string, shift: boolean, v: RobotModelView, frame: { width: number; height: number }): RobotModelView | "reset" | "fit" | null {
  const step = Math.min(frame.width, frame.height) * 0.1
  switch (key) {
    case "ArrowLeft":
      return shift ? panView(v, -step, 0, frame.height) : orbitView(v, KEY_TURN, 0)
    case "ArrowRight":
      return shift ? panView(v, step, 0, frame.height) : orbitView(v, -KEY_TURN, 0)
    case "ArrowUp":
      return shift ? panView(v, 0, -step, frame.height) : orbitView(v, 0, KEY_TURN)
    case "ArrowDown":
      return shift ? panView(v, 0, step, frame.height) : orbitView(v, 0, -KEY_TURN)
    case "+":
    case "=":
      return zoomView(v, KEY_ZOOM)
    case "-":
    case "_":
      return zoomView(v, 1 / KEY_ZOOM)
    case "0":
      return "reset"
    case "f":
    case "F":
      return "fit"
    default:
      return null
  }
}

/**
 * The robot's axes as seen from the camera: direction on screen (x right, y down, length 1 when flat) and whether each
 * points at the viewer. With `up: "z"` the frame is ROS's, turned so z is vertical.
 */
export function axesOnScreen(v: Pick<RobotModelView, "yaw" | "pitch">, up: "z" | "y") {
  const { out, right, up: u } = basis(v)
  const scene: Record<"x" | "y" | "z", Vec> = up === "z" ? { x: [1, 0, 0], y: [0, 0, -1], z: [0, 1, 0] } : { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }
  const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  return (["x", "y", "z"] as const).map((axis) => ({ axis, x: dot(scene[axis], right), y: -dot(scene[axis], u), toward: dot(scene[axis], out) > 0 }))
}

// WebGL support, asked once per page: a throwaway canvas gets a context, which is then released at once.
let webglSupport: boolean | undefined
function canDrawWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas")
      const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null
      webglSupport = !!gl
      gl?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

// Theme colours are read from the page's CSS variables at run time, so the model follows light, dark and high contrast.
// A 1×1 canvas turns any CSS colour (hex, rgb, oklch, a var() already resolved) into sRGB bytes.
let swatch: CanvasRenderingContext2D | null | undefined
function themeColor(el: Element, name: string, into: THREE.Color) {
  const value = getComputedStyle(el).getPropertyValue(name).trim()
  if (!value) return
  if (swatch === undefined) swatch = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!swatch) return
  // A canvas ignores a colour it cannot parse and keeps the last fill, which would paint this part in the previous
  // part's colour. Two different fills before the value tell whether it took: if it did, both read back the same.
  swatch.fillStyle = "black"
  swatch.fillStyle = value
  const afterBlack = swatch.fillStyle
  swatch.fillStyle = "white"
  swatch.fillStyle = value
  if (swatch.fillStyle !== afterBlack) return
  swatch.clearRect(0, 0, 1, 1)
  swatch.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = swatch.getImageData(0, 0, 1, 1).data
  into.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}

/**
 * The elements whose attributes set the theme (dark, high contrast): the view's ancestors only, so a class changing
 * elsewhere on the page costs nothing.
 */
function themedAncestors(el: Element): Element[] {
  const out: Element[] = []
  for (let p = el.parentElement; p; p = p.parentElement) out.push(p)
  return out
}

/** Frees the geometry and the materials of an object and everything under it, except the view's own shared materials. */
function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh && !(o as THREE.LineSegments).isLineSegments) return
    mesh.geometry?.dispose()
    for (const m of ([] as THREE.Material[]).concat(mesh.material ?? [])) if (!m.userData.shared) m.dispose()
  })
}

/** The link a mesh belongs to: its nearest URDF link above it, and how deep that link is in the chain. */
function ownerLink(o: THREE.Object3D): { name: string; depth: number } | undefined {
  let p: THREE.Object3D | null = o
  while (p && !(p as { isURDFLink?: boolean }).isURDFLink) p = p.parent
  if (!p) return undefined
  let depth = 0
  for (let q = p.parent; q; q = q.parent) if ((q as { isURDFLink?: boolean }).isURDFLink) depth++
  return { name: (p as unknown as { urdfName: string }).urdfName, depth }
}

function measure(root: THREE.Object3D): RobotModelBounds {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  if (box.isEmpty()) return { center: [0, 0, 0], radius: 0.5, floor: 0 }
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  return { center: [sphere.center.x, sphere.center.y, sphere.center.z], radius: sphere.radius, floor: Math.min(0, box.min.y) }
}

/** A round grid step for a model of this size: 1, 2 or 5 times a power of ten, about a fifth of its radius. */
function gridStep(radius: number) {
  const raw = Math.max(radius / 5, 0.001)
  const p = 10 ** Math.floor(Math.log10(raw))
  const m = raw / p
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : 5) * p
}

type Materials = { even: THREE.MeshStandardMaterial; odd: THREE.MeshStandardMaterial; highlight: THREE.MeshStandardMaterial }
type Stage = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  materials: Materials
  grid: THREE.GridHelper | null
  /** Draws one frame on the next animation frame; several calls before it draw once. */
  render: () => void
  /** The CSS variable the highlight takes its colour from. */
  highlight: "--warning" | "--danger"
  /** Reads the theme's colours again into the materials and the grid. */
  paint: () => void
}

type Loaded = { info: RobotModelInfo; bounds: RobotModelBounds; version: number }
type Load =
  | { phase: "loading"; meshes?: { loaded: number; total: number } }
  | { phase: "error"; path: string; reason: string }
  | ({ phase: "ready" } & Loaded)

export type RobotModelProps = {
  /** The URDF as text. Use `urdf` or `urdfUrl`. */
  urdf?: string
  /** The app is still getting the URDF (from a parameter server, say): shows loading until `urdf` or `urdfUrl` arrives. */
  loading?: boolean
  /** Where to fetch the URDF. Relative mesh paths resolve against its folder unless `meshBaseUrl` says otherwise. */
  urdfUrl?: string
  /** Where each `package://` package lives: `{ arm_description: "/robots/arm_description" }`. */
  packages?: RobotModelPackages
  /** The folder relative mesh paths resolve against, and that holds any package not in `packages` (`<meshBaseUrl>/<package>/…`). */
  meshBaseUrl?: string
  /** The joints' positions, as ROS sends them (`sensor_msgs/JointState`): radians, or metres for prismatic joints. `jointStateToRecord` converts a message. A planar joint takes [x, y, θ] and a floating one [x, y, z, roll, pitch, yaw]. */
  joints?: Record<string, RobotModelJointValue>
  /** Joint or link names to emphasise: a joint near its limit, a link in fault. Each is drawn in the status colour and named in words. */
  highlight?: string[]
  /** The status colour of the highlight. `warning` (needs attention) by default; `danger` for a fault. */
  highlightStatus?: "warning" | "danger"
  /** Which axis of the URDF is up. ROS uses z. */
  up?: "z" | "y"
  /** The robot's name in the header and the summary. Defaults to the URDF's `<robot name>`. */
  label?: string
  /** When the joint values were measured (the message's stamp). Without it, the time they last changed here. */
  updatedAt?: number | Date
  /**
   * With no update of `joints` for this long, the view says "Stale" with the last update's time over the last pose.
   * 1000 ms by default, as JointState's: the same joint states, at 50 Hz or more. A model without `joints` (a URDF on
   * show, not a robot) never goes stale. `null` never goes stale.
   */
  staleAfterMs?: number | null
  /** Whether to draw in 3D. Defaults to whether the browser can (WebGL); false shows the words fallback, for a device that should not draw 3D. */
  webgl?: boolean
  /** Called by "Load again" after an error, instead of reloading the same files. */
  onRetry?: () => void
  /** Width over height of the view, so it holds its size while loading. 4 / 3 by default. */
  aspectRatio?: number
  labels?: Partial<RobotModelLabels>
  className?: string
}

/**
 * A robot's pose in 3D from its URDF and live joint values (`sensor_msgs/JointState`), for monitoring: it never moves the
 * robot. Turn, move and zoom by pointer or keys; highlighted joints are named in a callout. Three.js draws only when the
 * joints, camera, size or theme change.
 */
export function RobotModel({
  urdf,
  loading = false,
  urdfUrl,
  packages,
  meshBaseUrl,
  joints,
  highlight,
  highlightStatus = "warning",
  up = "z",
  label,
  updatedAt,
  staleAfterMs = 1000,
  webgl,
  onRetry,
  aspectRatio = 4 / 3,
  labels: given,
  className,
}: RobotModelProps) {
  const l = mergeLabels(given)
  const keysId = React.useId()
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const stageRef = React.useRef<Stage | null>(null)
  const robotRef = React.useRef<URDFRobot | null>(null)
  const rootRef = React.useRef<THREE.Group | null>(null)

  const supported = useClientValue(canDrawWebGL, true)
  const [rendererFailed, setRendererFailed] = React.useState(false)
  // The graphics context's life: lost while the browser gives it back, failed when it has not within CONTEXT_RESTORE_MS.
  const [context, setContext] = React.useState<"ok" | "lost" | "failed">("ok")
  // Load again after a failed context makes a new canvas: a context the browser never gave back stays lost on its canvas.
  const [canvasKey, setCanvasKey] = React.useState(0)
  const hasSource = !!urdf || !!urdfUrl
  const draw = hasSource && webgl !== false && supported && !rendererFailed

  // A new source starts over: loading until the URDF and its meshes are in. The state is reset during the render that
  // brings the new source, so nothing is drawn from the old one; the effect below does the loading.
  const packagesKey = packages ? JSON.stringify(packages) : ""
  const [attempt, setAttempt] = React.useState(0)
  const source = [urdf, urdfUrl, packagesKey, meshBaseUrl, up, draw, attempt].join("\u0000")
  const [load, setLoad] = React.useState<Load & { source: string }>({ phase: "loading", source })
  if (load.source !== source) setLoad({ phase: "loading", source })

  const [view, setView] = React.useState<RobotModelView>({ yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: 2, target: [0, 0, 0] })

  // The load callbacks apply the latest joints when the model arrives; they read them from a ref updated after each commit.
  const jointsRef = React.useRef(joints)
  const labelsRef = React.useRef(l)
  React.useLayoutEffect(() => {
    jointsRef.current = joints
    labelsRef.current = l
  })

  // Stale: no new joint values (or stamp) for staleAfterMs. An update is a change of value, not a new object: an inline
  // `joints={{ ... }}` is a new object on every render of the parent, and counting those would keep the view from ever
  // going stale, or, with an old stamp, flip it between stale and fresh on each render and announce it each time. A new
  // update clears it during the render that brings it.
  const stamp = updatedAt instanceof Date ? updatedAt.getTime() : updatedAt
  const jointsKey = jointValuesKey(joints)
  // Only a model fed joint states is live; one shown without them has nothing to go stale.
  const live = joints !== undefined
  const [staleSince, setStaleSince] = React.useState<number | null>(null)
  const [seen, setSeen] = React.useState({ jointsKey, stamp })
  if (seen.jointsKey !== jointsKey || seen.stamp !== stamp) {
    setSeen({ jointsKey, stamp })
    setStaleSince(null)
  }
  React.useEffect(() => {
    if (staleAfterMs === null || !Number.isFinite(staleAfterMs) || !hasSource || !live) return
    const last = stamp ?? Date.now()
    // At most staleAfterMs from now: a stamp from a robot whose clock runs ahead of this one still goes stale.
    const id = setTimeout(() => setStaleSince(last), clamp(last + staleAfterMs - Date.now(), 0, staleAfterMs))
    return () => clearTimeout(id)
  }, [jointsKey, stamp, staleAfterMs, hasSource, live])

  // The renderer, scene, camera, lights and the shared materials: made once per canvas, freed on unmount.
  React.useEffect(() => {
    const canvas = canvasRef.current
    const box = viewportRef.current
    if (!draw || !canvas || !box) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" })
    } catch {
      // The browser said it could draw but no context came: the words fallback, after this effect rather than inside it.
      queueMicrotask(() => setRendererFailed(true))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 1000)
    // Light from the sky and from beside the viewer, so the side you look at is always lit and the shapes read.
    const sky = new THREE.HemisphereLight(0xffffff, 0x808080, 2.2)
    const head = new THREE.DirectionalLight(0xffffff, 1.4)
    head.position.set(1, 2, 2)
    camera.add(head)
    scene.add(sky, camera)
    const material = () => {
      const m = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0 })
      m.userData.shared = true
      return m
    }
    const materials: Materials = { even: material(), odd: material(), highlight: material() }

    let frame = 0
    const render = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        renderer.render(scene, camera)
      })
    }
    const stage: Stage = {
      renderer,
      scene,
      camera,
      materials,
      grid: null,
      highlight: "--warning",
      render,
      paint: () => {
        painted = themeKey()
        // Two greys, alternating along the chain so neighbouring links read apart; the grid in the border's grey.
        themeColor(box, "--muted-foreground", materials.even.color)
        themeColor(box, "--map-point", materials.odd.color)
        themeColor(box, stage.highlight, materials.highlight.color)
        materials.highlight.emissive.copy(materials.highlight.color).multiplyScalar(0.25)
        if (stage.grid) themeColor(box, "--border", (stage.grid.material as THREE.LineBasicMaterial).color)
        render()
      },
    }
    // The values the paint reads, so a watched attribute that changed something else (a layout class on an ancestor, an
    // inline style being animated) costs one style read and no repaint.
    let painted = ""
    const themeKey = () => {
      const css = getComputedStyle(box)
      return ["--muted-foreground", "--map-point", stage.highlight, "--border"].map((n) => css.getPropertyValue(n)).join("\u0000")
    }
    const repaintIfChanged = () => {
      if (themeKey() !== painted) stage.paint()
    }
    stageRef.current = stage
    stage.paint()

    const resize = () => {
      const w = box.clientWidth
      const h = box.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      render()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    // The theme switches by a class or attribute on <html> or another element above the view (dark, high contrast), or
    // by the system's preference.
    const stopTheme = onThemeChange(repaintIfChanged, themedAncestors(box))
    // A lost context (the GPU reset, too many views open) comes back by itself; until then the view says so.
    // If it has not come back within a few seconds it is not coming: the view says so and offers Load again, rather than
    // a spinner that never ends.
    let restoreTimer: ReturnType<typeof setTimeout> | undefined
    const lost = (e: Event) => {
      e.preventDefault()
      setContext("lost")
      clearTimeout(restoreTimer)
      restoreTimer = setTimeout(() => setContext("failed"), CONTEXT_RESTORE_MS)
    }
    const restored = () => {
      clearTimeout(restoreTimer)
      setContext("ok")
      render()
    }
    canvas.addEventListener("webglcontextlost", lost)
    canvas.addEventListener("webglcontextrestored", restored)

    return () => {
      ro.disconnect()
      stopTheme()
      canvas.removeEventListener("webglcontextlost", lost)
      canvas.removeEventListener("webglcontextrestored", restored)
      clearTimeout(restoreTimer)
      // The next renderer has a new context, so a loss reported by this one does not apply to it.
      setContext("ok")
      cancelAnimationFrame(frame)
      if (stage.grid) disposeTree(stage.grid)
      for (const m of Object.values(materials)) m.dispose()
      renderer.dispose()
      stageRef.current = null
      // dispose() frees what three made, not the context: browsers keep only about 16, and one waiting for garbage
      // collection still counts. Released once the canvas has really left the page (Strict Mode re-runs this effect on the
      // same canvas, which must keep its context). timer-ok: meant to run after unmount.
      setTimeout(() => {
        if (!canvas.isConnected) renderer.forceContextLoss?.()
      }, 0)
    }
  }, [draw, canvasKey])

  // Loading: fetch the URDF when given a URL, build the robot, wait for its meshes, then measure it and fit the view.
  React.useEffect(() => {
    if (!urdf && !urdfUrl) return
    const ctrl = new AbortController()
    let live = true
    let root: THREE.Group | null = null
    let robot: URDFRobot | null = null
    const pkgs = packagesKey ? (JSON.parse(packagesKey) as RobotModelPackages) : undefined
    const fail = (path: string, reason: string) => {
      if (live) setLoad({ phase: "error", path, reason, source })
    }
    const run = async () => {
      let text = urdf
      if (!text && urdfUrl) {
        try {
          const res = await fetch(urdfUrl, { signal: ctrl.signal })
          if (!res.ok) return fail(urdfUrl, `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`)
          text = await res.text()
        } catch (e) {
          if (!ctrl.signal.aborted) fail(urdfUrl, reasonOf(e))
          return
        }
      }
      if (!live) return
      // An empty answer (a 200 with no body, a file that was truncated to nothing) is an error, not an endless load.
      if (!text?.trim()) return fail(urdfUrl ?? "URDF", labelsRef.current.invalidUrdf)
      let total = 0
      let loaded = 0
      let parsed = false
      let failed = false
      const finish = () => {
        if (!live || failed || !parsed || loaded < total || !robot) return
        root = new THREE.Group()
        // ROS is z-up; the scene is y-up. Turning the robot a quarter turn about x keeps its x forward and puts z up.
        if (up === "z") root.rotation.x = -Math.PI / 2
        root.add(robot)
        robotRef.current = robot
        rootRef.current = root
        applyJointValues(robot, jointsRef.current)
        const bounds = measure(root)
        const box = viewportRef.current
        const aspect = box && box.clientHeight ? box.clientWidth / box.clientHeight : 1
        const info = describeRobot(robot)
        setLoad((prev) => ({ phase: "ready", info, bounds, version: (prev.phase === "ready" ? prev.version : 0) + 1, source }))
        setView(fitView(bounds, aspect))
      }
      try {
        robot = parseUrdf(text, {
          packages: pkgs,
          meshBaseUrl: meshBaseUrl ?? (urdfUrl ? urlBase(urdfUrl) : undefined),
          visuals: draw,
          labels: labelsRef.current,
          signal: ctrl.signal,
          onMeshStart: () => {
            total++
          },
          onMeshEnd: (path, error) => {
            loaded++
            if (!live || failed) return
            if (error) {
              failed = true
              return fail(path, error)
            }
            if (parsed && total > 1) setLoad((prev) => (prev.phase === "loading" ? { ...prev, meshes: { loaded, total } } : prev))
            finish()
          },
        })
      } catch (e) {
        return fail(urdfUrl ?? "URDF", reasonOf(e))
      }
      parsed = true
      if (total > 1 && loaded < total) setLoad((prev) => (prev.phase === "loading" ? { ...prev, meshes: { loaded, total } } : prev))
      finish()
    }
    void run()
    return () => {
      live = false
      ctrl.abort()
      if (root) root.removeFromParent()
      if (robot) disposeTree(robot)
      if (robotRef.current === robot) {
        robotRef.current = null
        rootRef.current = null
      }
    }
  }, [source, urdf, urdfUrl, packagesKey, meshBaseUrl, up, draw])

  const ready = load.phase === "ready" ? load : null
  const version = ready?.version ?? 0
  const bounds = ready?.bounds
  const info = ready?.info

  // The robot joins the scene once loaded, with a ground grid sized to it.
  React.useEffect(() => {
    const stage = stageRef.current
    const root = rootRef.current
    if (!stage || !root || !bounds) return
    const { radius, floor, center } = bounds
    const step = gridStep(radius)
    const cells = Math.max(4, Math.ceil((radius * 4) / step / 2) * 2)
    const grid = new THREE.GridHelper(cells * step, cells, 0xffffff, 0xffffff)
    grid.position.set(center[0], floor, center[2])
    stage.grid = grid
    stage.scene.add(root, grid)
    stage.paint()
    return () => {
      stage.scene.remove(root, grid)
      disposeTree(grid)
      stage.grid = null
      stage.render()
    }
  }, [bounds, draw, canvasKey])

  // Each link in its grey, highlighted links in the status colour.
  const highlightKey = (highlight ?? []).join("\u0000")
  React.useEffect(() => {
    const stage = stageRef.current
    const root = rootRef.current
    if (!stage || !root || !info) return
    stage.highlight = highlightStatus === "danger" ? "--danger" : "--warning"
    const lit = highlightedLinks(info, highlightKey ? highlightKey.split("\u0000") : [])
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const owner = ownerLink(mesh)
      const next = owner && lit.has(owner.name) ? stage.materials.highlight : owner && owner.depth % 2 ? stage.materials.odd : stage.materials.even
      if (mesh.material === next) return
      for (const m of ([] as THREE.Material[]).concat(mesh.material ?? [])) if (!m.userData.shared) m.dispose()
      mesh.material = next
    })
    stage.paint()
  }, [info, draw, highlightKey, highlightStatus, canvasKey])

  // New joint values move the robot and draw one frame. They are followed by value (read from the ref the layout effect
  // has just updated), so a parent that rebuilds the same values on each render draws nothing new.
  React.useEffect(() => {
    const robot = robotRef.current
    if (!robot || !version) return
    applyJointValues(robot, jointsRef.current)
    stageRef.current?.render()
  }, [jointsKey, version])

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const [x, y, z] = cameraPosition(view)
    stage.camera.position.set(x, y, z)
    stage.camera.near = Math.max(0.001, view.distance / 100)
    stage.camera.far = view.distance * 100
    stage.camera.updateProjectionMatrix()
    stage.camera.lookAt(...view.target)
    stage.render()
  }, [view, version, draw, canvasKey])

  const frameSize = () => {
    const el = viewportRef.current
    return { width: el?.clientWidth || 1, height: el?.clientHeight || 1 }
  }
  const aspectNow = () => {
    const { width, height } = frameSize()
    return width / height
  }
  const resetView = () => {
    if (bounds) setView(fitView(bounds, aspectNow()))
  }
  // Fit measures the robot in its pose now, so an arm reaching out stays in the frame.
  const fitNow = () => {
    const root = rootRef.current
    if (root) setView((v) => fitView(measure(root), aspectNow(), v.yaw, v.pitch))
  }

  // The wheel zooms once the view has focus (a click or Tab put it there), or with Ctrl / ⌘ (a trackpad pinch sends
  // Ctrl). Otherwise it scrolls the page, so a view in a long page does not trap the wheel.
  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || el.contains(document.activeElement))) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : 1
      setView((v) => zoomView(v, Math.exp(-e.deltaY * unit * 0.002)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [draw, version])

  // One pointer turns the view (the right button, or Shift, moves it); two pinch to zoom and move together.
  const pointers = React.useRef(new Map<number, { x: number; y: number; pan: boolean }>())
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) return
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey })
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {}
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    const { height } = frameSize()
    if (pointers.current.size >= 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1]
      if (other) {
        const before = Math.hypot(prev.x - other.x, prev.y - other.y)
        const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
        setView((v) => panView(zoomView(v, before > 0 ? after / before : 1), dx / 2, dy / 2, height))
      }
    } else if (prev.pan) setView((v) => panView(v, dx, dy, height))
    else setView((v) => orbitView(v, -dx * DRAG_TURN, dy * DRAG_TURN))
    pointers.current.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY })
  }
  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ready || e.altKey || e.ctrlKey || e.metaKey) return
    const next = viewForKey(e.key, e.shiftKey, view, frameSize())
    if (next === null) return
    e.preventDefault()
    if (next === "reset") resetView()
    else if (next === "fit") fitNow()
    else setView(next)
  }

  const isStale = staleSince !== null && (ready !== null || !draw)
  const fallback = hasSource && !draw
  const contextFailed = draw && context === "failed"
  const state: RobotModelState = !hasSource
    ? loading
      ? "loading"
      : "empty"
    : load.phase === "error" || contextFailed
      ? "error"
      : load.phase === "loading"
        ? "loading"
        : fallback
          ? "no-webgl"
          : draw && context === "lost"
            ? "context-lost"
            : isStale
              ? "stale"
              : "ready"
  const name = label || info?.name || l.robot
  const summary = info ? robotModelSummary(info, joints, highlight, l, label) : name
  const lastUpdate = staleSince !== null ? l.formatTime(new Date(staleSince)) : ""
  const callouts = info ? (highlight ?? []).flatMap((h) => (describeHighlight(h, info, joints, l) ? [h] : [])) : []
  const HighlightIcon = highlightStatus === "danger" ? OctagonAlert : TriangleAlert
  const highlightText = highlightStatus === "danger" ? "text-danger" : "text-warning"
  const announce =
    state === "loading"
      ? l.loading
      : state === "error"
        ? contextFailed && load.phase !== "error"
          ? l.contextFailed
          : l.error
        : state === "context-lost"
          ? l.contextLost
          : isStale
            ? `${l.stale}, ${l.lastUpdate(lastUpdate)}`
            : ""
  const retry = () => {
    // A failed context is this view's own trouble, not the files': a new canvas draws it again, without reloading them.
    if (contextFailed && load.phase !== "error") setCanvasKey((n) => n + 1)
    else if (onRetry) onRetry()
    else setAttempt((n) => n + 1)
  }

  const header = (
    <div data-slot="robot-model-header" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
      <p className="min-w-0">
        <span className="font-medium">{name}</span>
        {info && <span className="text-muted-foreground"> · {l.jointCount(info.joints.length)}</span>}
      </p>
      {(state === "loading" || isStale) && (
        <p data-slot="robot-model-state" className={cn("flex items-center gap-2", isStale ? "text-warning" : "text-muted-foreground")}>
          {isStale ? (
            <>
              <TriangleAlert aria-hidden="true" className="size-4" />
              <span>
                <span className="font-medium">{l.stale}</span> · <span className="tabular-nums">{l.lastUpdate(lastUpdate)}</span>
              </span>
            </>
          ) : (
            <>
              <span aria-hidden="true" className="flex">
                <Spinner className="size-4 text-muted-foreground" delay={0} label={l.loading} />
              </span>
              <span>{load.phase === "loading" && load.meshes ? l.loadingMeshes(load.meshes.loaded, load.meshes.total) : l.loading}</span>
            </>
          )}
        </p>
      )}
    </div>
  )

  const message = (icon: React.ElementType, title: string, detail?: React.ReactNode, action?: React.ReactNode) => (
    <div className="absolute inset-0 grid place-items-center p-4">
      <EmptyState variant="overlay" icon={icon} title={title} description={detail} action={action} />
    </div>
  )
  const retryButton = (
    <Button variant="outline" onClick={retry}>
      <RotateCw aria-hidden="true" />
      {l.retry}
    </Button>
  )

  // No WebGL: the same facts in words, a list of the joints and where they are, in a box that grows with it.
  if (fallback && state !== "loading" && state !== "error") {
    const highlighted = new Set(highlight)
    return (
      <div data-slot="robot-model" data-state={state} className={cn("flex flex-col gap-2", className)}>
        <span role="status" className="sr-only">
          {announce}
        </span>
        {header}
        <div className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <p className="flex items-start gap-2 text-sm">
            <Box aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium">{l.noWebgl}</span> <span className="text-muted-foreground">{l.noWebglDetail}</span>
            </span>
          </p>
          {info && info.joints.length > 0 && (
            <section aria-label={l.jointsHeading} className="flex flex-col gap-1">
              <h3 className="text-xs font-medium text-muted-foreground">{l.jointsHeading}</h3>
              <dl className="flex flex-col divide-y divide-border text-sm">
                {info.joints.map((j) => {
                  const v = jointValueWords(joints?.[j.name], j.type, l)
                  // The list has a row per joint that moves on its own; a highlighted mimic joint marks the row of the
                  // joint it follows, since that is what moves it. The summary names the mimic joint itself.
                  const lit =
                    highlighted.has(j.name) ||
                    (!!j.child && highlighted.has(j.child)) ||
                    !!info.mimics?.some((m) => m.mimic?.joint === j.name && (highlighted.has(m.name) || (!!m.child && highlighted.has(m.child))))
                  return (
                    <div key={j.name} data-highlighted={lit ? "" : undefined} className="flex items-center justify-between gap-4 py-2">
                      <dt className="flex min-w-0 items-center gap-2 font-mono text-xs">
                        {lit && <HighlightIcon aria-hidden="true" className={cn("size-4 shrink-0", highlightText)} />}
                        <span className="truncate">{j.name}</span>
                      </dt>
                      <dd className="text-end tabular-nums">
                        {v === undefined ? <span className="text-muted-foreground">{l.noValue}</span> : v}
                        {/* The value is already in the row; under it, only the limits it is near. */}
                        {lit && j.lower !== undefined && j.upper !== undefined && (
                          <span className={cn("block text-xs", highlightText)}>{l.jointDetail(undefined, l.jointValue(j.lower, j.type), l.jointValue(j.upper, j.type))}</span>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )}
        </div>
      </div>
    )
  }

  const axes = ready ? axesOnScreen(view, up) : []
  const axisWord = (axis: "x" | "y" | "z") => (up === "z" ? l.axes[axis] : axis === "y" ? l.axes.z : axis)

  return (
    <div data-slot="robot-model" data-state={state} className={cn("flex flex-col gap-2", className)}>
      <span id={keysId} className="sr-only">
        {l.keys}
      </span>
      <span role="status" className="sr-only">
        {announce}
      </span>
      {header}
      <div
        data-slot="robot-model-frame"
        style={{ "--robot-model-ratio": aspectRatio } as React.CSSProperties}
        className="relative aspect-(--robot-model-ratio) w-full overflow-hidden rounded-md bg-map ring-1 ring-border"
      >
        {draw && (
          <div
            ref={viewportRef}
            // An image only once there is a robot to describe; until then the states below say what is happening.
            role={ready ? "img" : undefined}
            aria-label={ready ? summary : undefined}
            aria-describedby={ready ? keysId : undefined}
            tabIndex={ready ? 0 : undefined}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "absolute inset-0 select-none",
              ready && "cursor-grab touch-pan-y active:cursor-grabbing",
              // Inset, so the ring shows inside the frame's rounded clip.
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <canvas key={canvasKey} ref={canvasRef} aria-hidden="true" className={cn("block size-full", !ready && "invisible")} />
          </div>
        )}

        {ready && isStale && (
          // Over the last pose, which stays visible underneath: never a silent freeze. The words are said once, in the
          // header's state line above the view, not again over it.
          <div className="pointer-events-none absolute inset-0 bg-(--scrim)" />
        )}

        {ready && axes.length > 0 && (
          <div aria-hidden="true" data-slot="robot-model-axes" className="pointer-events-none absolute top-4 right-4 size-24 text-muted-foreground">
            <svg viewBox="-48 -48 96 96" className="absolute inset-0 size-full">
              {axes.map((a) => (
                <line key={a.axis} x1="0" y1="0" x2={a.x * 22} y2={a.y * 22} stroke="currentColor" strokeWidth={a.axis === (up === "z" ? "z" : "y") ? 2 : 1.5} strokeLinecap="round" strokeDasharray={a.toward ? undefined : "3 3"} />
              ))}
            </svg>
            {axes.map((a) => (
              <span
                key={a.axis}
                data-axis={a.axis}
                // Just past the line's end, on the side it points to, so the word never covers its own line.
                style={{ left: `calc(50% + ${a.x * 24}px)`, top: `calc(50% + ${a.y * 24}px)`, translate: `${(a.x - 1) * 50}% ${(a.y - 1) * 50}%` }}
                className="absolute rounded-2xs bg-map px-1 text-xs whitespace-nowrap"
              >
                {axisWord(a.axis)}
              </span>
            ))}
          </div>
        )}

        {ready && callouts.length > 0 && info && (
          // The summary already reads these; the callout is the same words for the eye, never colour alone.
          <ViewportOverlay position="top" aria-hidden="true" data-slot="robot-model-callout" className="right-28">
            {callouts.map((h) => (
              <ViewportPanel key={h} className="flex w-fit items-start gap-2">
                <HighlightIcon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", highlightText)} />
                <span className="flex flex-col">
                  <span className="font-mono font-medium">{h}</span>
                  <span className="text-xs text-muted-foreground">{highlightDetail(h, info, joints, l)}</span>
                </span>
              </ViewportPanel>
            ))}
          </ViewportOverlay>
        )}

        {ready && (
          // Bottom left, clear of the emergency stop, which products keep bottom right. Out of the Tab order: the view is
          // one stop, and 0 and F do the same from the keyboard.
          <ViewportOverlay position="bottom-left">
            <ButtonGroup className="pointer-events-auto rounded-sm shadow-float">
              <Button variant="secondary" size="icon" tabIndex={-1} aria-label={l.resetView} title={l.resetView} onClick={resetView}>
                <Rotate3d aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="icon" tabIndex={-1} aria-label={l.fitView} title={l.fitView} onClick={fitNow}>
                <Crosshair aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </ViewportOverlay>
        )}

        {state === "loading" && (
          <div className="absolute inset-0">
            <Bone className="size-full rounded-none" />
            <ViewportOverlay position="center">
              <ViewportPanel as="p" className="text-center">
                {load.phase === "loading" && load.meshes ? l.loadingMeshes(load.meshes.loaded, load.meshes.total) : l.loading}
              </ViewportPanel>
            </ViewportOverlay>
          </div>
        )}

        {load.phase === "error" &&
          message(CircleAlert, l.error, <span className="font-mono text-xs">{l.errorDetail(load.path, load.reason)}</span>, retryButton)}

        {contextFailed && load.phase !== "error" && message(CircleAlert, l.contextFailed, undefined, retryButton)}

        {state === "empty" && message(Box, l.empty)}

        {state === "context-lost" && (
          <ViewportOverlay position="center" className="bg-scrim">
            <ViewportPanel as="p" className="flex items-center gap-2">
              <Spinner className="size-4 text-muted-foreground" delay={0} label={l.contextLost} />
              {l.contextLost}
            </ViewportPanel>
          </ViewportOverlay>
        )}
      </div>
    </div>
  )
}
