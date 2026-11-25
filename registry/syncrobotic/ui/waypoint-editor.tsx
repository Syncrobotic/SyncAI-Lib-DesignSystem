// @syncrobotic/waypoint-editor v0.36.0 · update: npx shadcn add @syncrobotic/waypoint-editor --overwrite
"use client"

import * as React from "react"
import { CopyPlus, Plus, Trash2, CircleAlert, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { RobotMap, pointInPolygon, type RobotMapLabels, type RobotMapPoint, type RobotMapProps, type RobotMapWaypointEdit, type RobotMapZone } from "@/registry/syncrobotic/ui/robot-map"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Sortable, SortableHandle, SortableItem, SortablePosition } from "@/registry/syncrobotic/ui/sortable"
import { toast } from "@/registry/syncrobotic/ui/toast"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"

/**
 * Where a waypoint is. `plan`: metres on a robot-map plan, from its top-left corner, x right and y down (robot-map's
 * coordinates). `geo`: latitude and longitude in degrees (WGS 84), for a geographic map; the editor lists, edits and
 * measures them, but draws only `plan` waypoints on its map.
 */
export type WaypointCoordinate = { kind: "plan"; x: number; y: number } | { kind: "geo"; lat: number; lon: number }

/** What the robot does on arriving: nothing, wait a number of seconds, dock, take a photo, or an action of the app's own. */
export type WaypointAction = { type: "none" } | { type: "wait"; seconds: number } | { type: "dock" } | { type: "photo" } | { type: "custom"; name: string }
export type WaypointActionType = WaypointAction["type"]

export type Waypoint = {
  /** Stays with the waypoint through reorders and edits. */
  id: string
  /** Said in the list, on the map's row and in announcements: "Loading bay door". */
  name: string
  at: WaypointCoordinate
  /** Which way to face on arrival, in degrees clockwise from the top of the plan (robot-map's heading). Left out: any. */
  heading?: number
  action: WaypointAction
  /** Seconds to stay after the action, before driving on. */
  dwell?: number
}

/** A reason a route cannot be saved, on one waypoint. */
export type WaypointProblem = {
  id: string
  /** The waypoint's place in the route, from 0. */
  index: number
  kind: "noName" | "noActionName" | "invalid" | "outside" | "keepOut" | "tooClose"
  /** keepOut: the zone's name (or its kind's word when it has none). */
  zone?: string
  /** tooClose: metres from the waypoint before it. */
  distance?: number
}

export type WaypointEditorLabels = {
  /** The list's name: "Route". */
  name: string
  /** The map's name for screen readers. */
  map: string
  /** The List / Map switch on a narrow editor. */
  showAs: string
  listTab: string
  mapTab: string
  add: string
  empty: string
  /** A new waypoint's name, by its place: "Waypoint 4". */
  defaultName: (n: number) => string
  /** A duplicate's name. */
  copyName: (name: string) => string
  /** The drag handle's name. */
  move: (name: string) => string
  /** Read with a row: what its keys do. */
  rowKeys: string
  fieldName: string
  x: string
  y: string
  lat: string
  lon: string
  heading: string
  headingHint: string
  action: string
  actions: Record<WaypointActionType, string>
  waitFor: string
  customName: string
  dwell: string
  dwellHint: string
  duplicate: string
  remove: string
  /** The toast after a delete, with Undo. */
  removed: (name: string) => string
  undo: string
  /** A waypoint's place, in the row. */
  position: (x: number, y: number, locale: string | undefined) => string
  geoPosition: (lat: number, lon: number, locale: string | undefined) => string
  headingShort: (deg: number, locale: string | undefined) => string
  /** The action in the row: "Wait 30 s", "Dock", the custom action's name. */
  actionShort: (action: WaypointAction, locale: string | undefined) => string
  dwellShort: (seconds: number, locale: string | undefined) => string
  problem: (p: WaypointProblem, minSpacing: number, locale: string | undefined) => string
  count: (n: number, locale: string | undefined) => string
  distanceTitle: string
  durationTitle: string
  distance: (metres: number, locale: string | undefined) => string
  duration: (seconds: number, locale: string | undefined) => string
  /** The draft differs from the saved route. */
  unsaved: string
  saved: string
  save: string
  cancel: string
  /** Why Save is disabled, beside it. */
  noChanges: string
  needsWaypoint: string
  blocked: (problems: number, locale: string | undefined) => string
  saveFailed: string
  /** Said once the save went through. */
  savedNotice: string
  /** The toast after Cancel threw changes away, with Undo. */
  discarded: string
  /** Said (throttled) when the number of problems changes. */
  problems: (n: number, locale: string | undefined) => string
  added: (name: string, n: number) => string
  duplicated: (name: string, n: number) => string
  /** A read-only editor says so above the list. */
  readOnly: string
  /** The selected waypoint under the map on a narrow editor: the button that opens it in the list. */
  details: string
}

const num = (n: number, locale: string | undefined, digits = 1) => n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const defaultWaypointEditorLabels: WaypointEditorLabels = {
  name: "Route",
  map: "Route map",
  showAs: "Show as",
  listTab: "List",
  mapTab: "Map",
  add: "Add waypoint",
  empty: "No waypoints yet. Click the map or Add waypoint to start the route.",
  defaultName: (n) => `Waypoint ${n}`,
  copyName: (name) => `${name} copy`,
  move: (name) => `Move ${name}`,
  rowKeys: "Enter opens its details, Delete removes it.",
  fieldName: "Name",
  x: "X",
  y: "Y",
  lat: "Latitude",
  lon: "Longitude",
  heading: "Heading",
  headingHint: "Leave empty for any heading.",
  action: "On arrival",
  actions: { none: "Nothing", wait: "Wait", dock: "Dock", photo: "Take a photo", custom: "Custom action" },
  waitFor: "Wait for",
  customName: "Action name",
  dwell: "Dwell",
  dwellHint: "Time to stay after the action.",
  duplicate: "Duplicate",
  remove: "Delete",
  removed: (name) => `${name} deleted`,
  undo: "Undo",
  position: (x, y, locale) => `${num(x, locale)}, ${num(y, locale)} m`,
  geoPosition: (lat, lon, locale) => `${num(lat, locale, 6)}, ${num(lon, locale, 6)}`,
  headingShort: (deg, locale) => `facing ${Math.round(deg).toLocaleString(locale)}°`,
  actionShort: (a, locale) =>
    a.type === "wait" ? `Wait ${a.seconds.toLocaleString(locale)} s` : a.type === "dock" ? "Dock" : a.type === "photo" ? "Photo" : a.type === "custom" ? a.name || "Custom action" : "",
  dwellShort: (s, locale) => `stay ${s.toLocaleString(locale)} s`,
  problem: (p, min, locale) =>
    p.kind === "noName"
      ? "Name missing"
      : p.kind === "noActionName"
        ? "Action name missing"
        : p.kind === "invalid"
          ? "Position is not a number"
          : p.kind === "outside"
            ? "Outside the map"
            : p.kind === "keepOut"
              ? `Inside ${p.zone ?? "a no-entry zone"}`
              : `${num(p.distance ?? 0, locale, 2)} m from the one before (at least ${num(min, locale)} m)`,
  count: (n, locale) => (n === 1 ? "1 waypoint" : `${n.toLocaleString(locale)} waypoints`),
  distanceTitle: "Distance",
  durationTitle: "Estimated time",
  distance: (m, locale) => (m >= 1000 ? `${num(m / 1000, locale, 2)} km` : `${num(m, locale)} m`),
  duration: (s, locale) => {
    const t = Math.round(s)
    if (t < 60) return `about ${t.toLocaleString(locale)} s`
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    return h ? `about ${h.toLocaleString(locale)} h ${m.toLocaleString(locale)} min` : `about ${m.toLocaleString(locale)} min ${(t % 60).toLocaleString(locale)} s`
  },
  unsaved: "Unsaved changes",
  saved: "No unsaved changes",
  save: "Save route",
  cancel: "Cancel",
  noChanges: "No changes to save",
  needsWaypoint: "Add a waypoint to save",
  blocked: (n, locale) => (n === 1 ? "Fix 1 problem to save" : `Fix ${n.toLocaleString(locale)} problems to save`),
  saveFailed: "The route could not be saved. Try again.",
  savedNotice: "Route saved",
  discarded: "Changes discarded",
  problems: (n, locale) => (n === 0 ? "No problems left" : n === 1 ? "1 problem" : `${n.toLocaleString(locale)} problems`),
  added: (name, n) => `${name} added as waypoint ${n}`,
  duplicated: (name, n) => `${name} added as waypoint ${n}`,
  readOnly: "View only: you cannot change this route.",
  details: "Details",
}

// ---------------------------------------------------------------------------------------------------------------------
// Measuring and checking a route: pure, exported for the app's own summaries and for a server that checks again.
// ---------------------------------------------------------------------------------------------------------------------

const finite = (c: WaypointCoordinate) => (c.kind === "plan" ? Number.isFinite(c.x) && Number.isFinite(c.y) : Number.isFinite(c.lat) && Number.isFinite(c.lon))

/**
 * Metres between two places: straight on the plan, great-circle (haversine, mean Earth radius) between two geo points.
 * A plan point and a geo point have no common frame, so their leg is NaN.
 */
export function legLength(a: WaypointCoordinate, b: WaypointCoordinate): number {
  if (a.kind === "plan" && b.kind === "plan") return Math.hypot(b.x - a.x, b.y - a.y)
  if (a.kind === "geo" && b.kind === "geo") {
    const rad = Math.PI / 180
    const dLat = (b.lat - a.lat) * rad
    const dLon = (b.lon - a.lon) * rad
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
    return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(h)))
  }
  return NaN
}

/** The route's length in metres, leg by leg; legs that cannot be measured (NaN) are left out. */
export function routeDistance(waypoints: readonly Pick<Waypoint, "at">[]): number {
  let d = 0
  for (let i = 1; i < waypoints.length; i++) {
    const leg = legLength(waypoints[i - 1]!.at, waypoints[i]!.at)
    if (Number.isFinite(leg)) d += leg
  }
  return d
}

/** Seconds the robot spends at a waypoint: the wait action's seconds and the dwell. */
const stay = (w: Pick<Waypoint, "action" | "dwell">) => (w.action.type === "wait" ? Math.max(0, w.action.seconds || 0) : 0) + Math.max(0, w.dwell ?? 0)

/** Seconds to drive the route at `speed` (m/s) and stay at each waypoint. Docking and photos take what the app says in `dwell`. */
export function routeDuration(waypoints: readonly Pick<Waypoint, "at" | "action" | "dwell">[], speed: number): number {
  const drive = speed > 0 ? routeDistance(waypoints) / speed : 0
  return drive + waypoints.reduce((s, w) => s + stay(w), 0)
}

export type WaypointRules = {
  /** The plan's size in metres: a plan waypoint outside it is a problem. */
  width?: number
  height?: number
  /** Zones of kind `restricted` are keep-out: a waypoint inside one is a problem. */
  zones?: readonly RobotMapZone[]
  /** Metres a waypoint must be from the one before it (0.5 by default). */
  minSpacing?: number
  /** The word for an unnamed keep-out zone. */
  unnamedZone?: string
}

/** Every reason the route cannot be saved, in route order: names, numbers, the map's edges, keep-out zones, spacing. */
export function validateWaypoints(waypoints: readonly Waypoint[], rules: WaypointRules = {}): WaypointProblem[] {
  const { width, height, zones = [], minSpacing = 0.5, unnamedZone } = rules
  const keepOut = zones.filter((z) => z.kind === "restricted")
  const out: WaypointProblem[] = []
  waypoints.forEach((w, index) => {
    const base = { id: w.id, index }
    if (!w.name.trim()) out.push({ ...base, kind: "noName" })
    if (w.action.type === "custom" && !w.action.name.trim()) out.push({ ...base, kind: "noActionName" })
    if (!finite(w.at)) {
      out.push({ ...base, kind: "invalid" })
      return
    }
    if (w.at.kind === "plan") {
      const { x, y } = w.at
      if ((width !== undefined && (x < 0 || x > width)) || (height !== undefined && (y < 0 || y > height))) out.push({ ...base, kind: "outside" })
      const zone = keepOut.find((z) => pointInPolygon([x, y], z.points))
      if (zone) out.push({ ...base, kind: "keepOut", ...(zone.label ?? unnamedZone ? { zone: zone.label ?? unnamedZone } : {}) })
    }
    const prev = waypoints[index - 1]
    if (prev && finite(prev.at)) {
      const d = legLength(prev.at, w.at)
      if (Number.isFinite(d) && d < minSpacing) out.push({ ...base, kind: "tooClose", distance: d })
    }
  })
  return out
}

/** Whether two routes are the same, field by field. */
const sameRoute = (a: readonly Waypoint[], b: readonly Waypoint[]) => a === b || (a.length === b.length && a.every((w, i) => JSON.stringify(w) === JSON.stringify(b[i])))

// ---------------------------------------------------------------------------------------------------------------------
// The draft: the route being edited and the selected waypoint, in one reducer, so an edit and the selection that follows
// it from the map (an added waypoint is selected) land on the same list.
// ---------------------------------------------------------------------------------------------------------------------

type State = { draft: Waypoint[]; selected: string | null }
type Action =
  | { type: "replace"; draft: Waypoint[] }
  | { type: "update"; id: string; patch: Partial<Omit<Waypoint, "id">> }
  | { type: "insert"; index: number; waypoint: Waypoint }
  | { type: "remove"; id: string }
  | { type: "movePlan"; index: number; point: RobotMapPoint }
  | { type: "selectPlan"; index: number | null }
  | { type: "select"; id: string | null }

const planOnly = (draft: readonly Waypoint[]) => draft.filter((w) => w.at.kind === "plan")

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case "replace":
      return { draft: action.draft, selected: action.draft.some((w) => w.id === state.selected) ? state.selected : null }
    case "update":
      return { ...state, draft: state.draft.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)) }
    case "insert": {
      const draft = [...state.draft]
      draft.splice(Math.min(Math.max(0, action.index), draft.length), 0, action.waypoint)
      return { draft, selected: action.waypoint.id }
    }
    case "remove":
      return { draft: state.draft.filter((w) => w.id !== action.id), selected: state.selected === action.id ? null : state.selected }
    case "movePlan": {
      const target = planOnly(state.draft)[action.index]
      if (!target) return state
      const [x, y] = action.point
      return { ...state, draft: state.draft.map((w) => (w.id === target.id ? { ...w, at: { kind: "plan", x, y } } : w)) }
    }
    case "selectPlan":
      return { ...state, selected: action.index === null ? null : (planOnly(state.draft)[action.index]?.id ?? state.selected) }
    case "select":
      return { ...state, selected: action.id }
  }
}

/**
 * Words for a live region, at most one every `gap` ms: the latest waits for the gap and replaces any still waiting, so a
 * burst of edits is said once, as where it ended. `delay` holds a message back (a count that changes as someone types).
 */
function useAnnouncer(gap = 1000) {
  const [said, setSaid] = React.useState("")
  const last = React.useRef(0)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const say = (text: string, delay = 0) => {
    clearTimeout(timer.current)
    const wait = Math.max(delay, last.current + gap - Date.now())
    timer.current = setTimeout(() => {
      last.current = Date.now()
      // The same words twice would not be read again; a no-break space makes them new.
      setSaid((prev) => (prev === text ? `${text} ` : text))
    }, wait)
  }
  return [said, say] as const
}

/** The map the editor draws on: robot-map's props, without the editing ones the editor sets itself. */
export type WaypointEditorMap = Omit<
  RobotMapProps,
  | "label"
  | "mode"
  | "goal"
  | "onGoal"
  | "waypoints"
  | "onWaypointsChange"
  | "onWaypointEdit"
  | "selectedWaypoint"
  | "onWaypointSelect"
  | "waypointMarks"
  | "waypointsPlanned"
  | "onZoneDraw"
  | "editableZones"
  | "onZonesChange"
  | "labels"
> & { label?: string; labels?: Partial<RobotMapLabels> }

export type WaypointEditorProps = {
  /** The saved route. The editor edits a draft of it; a new `value` replaces the draft unless it has unsaved changes. */
  value: Waypoint[]
  /** A draft to start from instead of `value`, such as one kept across a reload: it counts as unsaved changes. */
  defaultDraft?: Waypoint[]
  /** The waypoint selected at first (its id), with its details open. */
  defaultSelected?: string
  /** Save: called with the draft. Return a promise to keep Save busy until it settles; a rejection keeps the draft and says so. */
  onSave?: (waypoints: Waypoint[]) => void | Promise<unknown>
  /** Cancel: the draft goes back to `value` (with Undo in a toast), then this is called, e.g. to close the editor. */
  onCancel?: () => void
  /** Called when the draft gains or loses unsaved changes: warn before leaving the page with it. */
  onDirtyChange?: (dirty: boolean) => void
  /** The plan to draw the route on (robot-map's props). Without it the editor is the list alone. */
  map?: WaypointEditorMap
  /** Cruise speed in m/s, for the estimated time. Without it only the distance is shown. */
  speed?: number
  /** Metres a waypoint must be from the one before it. 0.5 by default. */
  minSpacing?: number
  /** For viewers: the route, the map and the details, without anything that changes them. */
  readOnly?: boolean
  /** A new waypoint's id. By default one unique to this editor. */
  createId?: () => string
  labels?: Partial<WaypointEditorLabels>
  /** Formats numbers (BCP 47, "zh-TW"). */
  locale?: string
  className?: string
}

/**
 * A robot's route as an ordered list of waypoints, edited in a list and on robot-map together: each waypoint a name, a
 * place, an optional heading, an action on arrival and a dwell time. Reorder by the handle (drag or keys), add by clicking
 * the map or Add waypoint, delete with Undo, duplicate. A row and its point select each other. Problems (outside the map,
 * in a keep-out zone, too close, no name) show on the row and the point, and Save says why it is disabled. The summary
 * gives the distance and, with `speed`, the time. Narrow, the list comes first and the map is a tab.
 */
export function WaypointEditor({
  value,
  defaultDraft,
  defaultSelected,
  onSave,
  onCancel,
  onDirtyChange,
  map,
  speed,
  minSpacing = 0.5,
  readOnly,
  createId,
  labels: given,
  locale,
  className,
}: WaypointEditorProps) {
  const labels = { ...defaultWaypointEditorLabels, ...given, actions: { ...defaultWaypointEditorLabels.actions, ...given?.actions } }
  const [state, dispatch] = React.useReducer(reduce, { draft: defaultDraft ?? value, selected: defaultSelected ?? null })
  const { draft, selected } = state
  // The route the draft is measured against: `value`, or the draft as it was last saved, until a new `value` arrives.
  const [base, setBase] = React.useState(value)
  const [lastValue, setLastValue] = React.useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    // A clean draft follows the new route; one with unsaved changes keeps them, now against the new route.
    if (sameRoute(draft, base)) dispatch({ type: "replace", draft: value })
    setBase(value)
  }
  const dirty = !sameRoute(draft, base)
  const [saving, setSaving] = React.useState(false)
  const [saveFailed, setSaveFailed] = React.useState(false)
  const [tab, setTab] = React.useState<"list" | "map">("list")
  const [said, say] = useAnnouncer()
  const uid = React.useId().replace(/[^\w-]/g, "")
  const seq = React.useRef(0)
  const newId = () => (createId ? createId() : `${uid}-wp-${++seq.current}`)
  const root = React.useRef<HTMLDivElement>(null)
  // Where focus goes once the next render is on screen: a row (after a delete or duplicate), a name field (after an add).
  const focusNext = React.useRef<{ id: string; part: "row" | "name" } | "add" | null>(null)

  const width = map?.width ?? (map?.grid ? map.grid.width * map.grid.resolution : undefined)
  const height = map?.height ?? (map?.grid ? map.grid.height * map.grid.resolution : undefined)
  const problems = validateWaypoints(draft, { width, height, zones: map?.zones, minSpacing, unnamedZone: map?.labels?.zoneKind?.restricted ?? "a no-entry zone" })
  const problemsOf = (id: string) => problems.filter((p) => p.id === id)
  const distance = routeDistance(draft)
  const duration = speed ? routeDuration(draft, speed) : undefined
  const reason = readOnly ? null : !dirty ? labels.noChanges : draft.length === 0 ? labels.needsWaypoint : problems.length ? labels.blocked(problems.length, locale) : null

  const onDirty = React.useEffectEvent((d: boolean) => onDirtyChange?.(d))
  React.useEffect(() => {
    onDirty(dirty)
  }, [dirty])
  // The count of problems, said when it changes and has rested a moment, so typing a name is not read letter by letter.
  const count = problems.length
  const sayCount = React.useEffectEvent((n: number) => say(labels.problems(n, locale), 1500))
  const firstCount = React.useRef(true)
  React.useEffect(() => {
    if (firstCount.current) {
      firstCount.current = false
      return
    }
    sayCount(count)
  }, [count])
  React.useEffect(() => {
    const f = focusNext.current
    if (!f || !root.current) return
    focusNext.current = null
    if (f === "add") {
      root.current.querySelector<HTMLElement>('[data-slot="waypoint-editor-add"]')?.focus()
      return
    }
    const row = [...root.current.querySelectorAll<HTMLElement>("[data-waypoint-id]")].find((el) => el.dataset.waypointId === f.id)
    row?.querySelector<HTMLElement>(f.part === "name" ? 'input[name="name"]' : '[data-slot="waypoint-row"]')?.focus()
  })
  // A waypoint selected on the map comes into view in the list.
  React.useEffect(() => {
    if (!selected || !root.current) return
    const row = [...root.current.querySelectorAll<HTMLElement>("[data-waypoint-id]")].find((el) => el.dataset.waypointId === selected)
    row?.scrollIntoView?.({ block: "nearest" })
  }, [selected])

  const plan = planOnly(draft)
  const selectedPlan = plan.findIndex((w) => w.id === selected)
  const index = draft.findIndex((w) => w.id === selected)

  /** A place for a new waypoint: between the selected one and the next, past the last one, or the plan's middle. */
  const placeFor = (at: number): WaypointCoordinate => {
    const prev = draft[at - 1]?.at
    const next = draft[at]?.at
    if (prev?.kind === "plan" && next?.kind === "plan") return { kind: "plan", x: (prev.x + next.x) / 2, y: (prev.y + next.y) / 2 }
    if (prev?.kind === "geo") return { kind: "geo", lat: prev.lat, lon: prev.lon + 0.0001 }
    if (prev?.kind === "plan") {
      const step = Math.max(1, 2 * minSpacing)
      const x = width !== undefined && prev.x + step > width ? prev.x - step : prev.x + step
      return { kind: "plan", x: Math.max(0, x), y: prev.y }
    }
    return { kind: "plan", x: (width ?? 0) / 2, y: (height ?? 0) / 2 }
  }
  const addAfterSelected = () => {
    const at = index >= 0 ? index + 1 : draft.length
    const w: Waypoint = { id: newId(), name: labels.defaultName(at + 1), at: placeFor(at), action: { type: "none" } }
    dispatch({ type: "insert", index: at, waypoint: w })
    focusNext.current = { id: w.id, part: "name" }
    say(labels.added(w.name, at + 1))
  }
  const removeOne = (w: Waypoint) => {
    const at = draft.findIndex((d) => d.id === w.id)
    if (at < 0) return
    dispatch({ type: "remove", id: w.id })
    const after = draft[at + 1] ?? draft[at - 1]
    focusNext.current = after ? { id: after.id, part: "row" } : "add"
    toast({ title: labels.removed(w.name || labels.defaultName(at + 1)), action: { label: labels.undo, onClick: () => dispatch({ type: "insert", index: at, waypoint: w }) } })
  }
  const duplicate = (w: Waypoint) => {
    const at = draft.findIndex((d) => d.id === w.id)
    // Beside the original, not on it, which would be too close to save.
    const step = Math.max(1, 2 * minSpacing)
    const place: WaypointCoordinate =
      w.at.kind === "plan" ? { kind: "plan", x: width !== undefined && w.at.x + step > width ? Math.max(0, w.at.x - step) : w.at.x + step, y: w.at.y } : { ...w.at, lon: w.at.lon + 0.0001 }
    const copy: Waypoint = { ...w, id: newId(), name: labels.copyName(w.name), at: place }
    dispatch({ type: "insert", index: at + 1, waypoint: copy })
    focusNext.current = { id: copy.id, part: "row" }
    say(labels.duplicated(copy.name, at + 2))
  }
  const onMapEdit = (edit: RobotMapWaypointEdit) => {
    if (edit.type === "move") dispatch({ type: "movePlan", index: edit.index, point: edit.point })
    else if (edit.type === "add") {
      const [x, y] = edit.point
      // The map adds at the end of its points, which is the end of the route.
      dispatch({ type: "insert", index: draft.length, waypoint: { id: newId(), name: labels.defaultName(draft.length + 1), at: { kind: "plan", x, y }, action: { type: "none" } } })
    } else {
      const w = plan[edit.index]
      if (w) removeOne(w)
    }
  }
  const save = () => {
    if (reason || saving) return
    const snapshot = draft
    setSaveFailed(false)
    const done = () => {
      setSaving(false)
      setBase(snapshot)
      say(labels.savedNotice)
    }
    const result = onSave?.(snapshot)
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setSaving(true)
      ;(result as Promise<unknown>).then(done, () => {
        setSaving(false)
        setSaveFailed(true)
      })
    } else done()
  }
  const cancel = () => {
    if (dirty) {
      const before = draft
      dispatch({ type: "replace", draft: base })
      toast({ title: labels.discarded, action: { label: labels.undo, onClick: () => dispatch({ type: "replace", draft: before }) } })
    }
    setSaveFailed(false)
    onCancel?.()
  }
  const update = (id: string, patch: Partial<Omit<Waypoint, "id">>) => dispatch({ type: "update", id, patch })

  const summary = (w: Waypoint) =>
    [
      w.at.kind === "plan" ? labels.position(w.at.x, w.at.y, locale) : labels.geoPosition(w.at.lat, w.at.lon, locale),
      w.heading !== undefined ? labels.headingShort(w.heading, locale) : "",
      labels.actionShort(w.action, locale),
      w.dwell ? labels.dwellShort(w.dwell, locale) : "",
    ].filter(Boolean)

  const reasonId = `${uid}-reason`
  const keysId = `${uid}-keys`
  const mapView = map && (
    <RobotMap
      {...map}
      label={map.label ?? labels.map}
      mode={readOnly ? "view" : "waypoints"}
      waypoints={plan.map((w) => (w.at.kind === "plan" ? [w.at.x, w.at.y] : [0, 0]))}
      waypointMarks={plan.map((w) => ({ heading: w.heading, problem: problemsOf(w.id).length > 0 }))}
      selectedWaypoint={selectedPlan >= 0 ? selectedPlan : null}
      onWaypointSelect={(i) => dispatch({ type: "selectPlan", index: i })}
      onWaypointEdit={readOnly ? undefined : onMapEdit}
    />
  )
  const selectedWaypoint = index >= 0 ? draft[index] : undefined

  return (
    <div ref={root} data-slot="waypoint-editor" data-dirty={dirty || undefined} className={cn("@container flex w-full min-w-0 flex-col gap-4", className)}>
      <p data-slot="waypoint-editor-announce" aria-live="polite" className="sr-only">
        {said}
      </p>
      <p id={keysId} className="sr-only">
        {labels.rowKeys}
      </p>
      {map && (
        // One pane at a time on a narrow editor: the list first, the map a tab. Side by side from 768 px.
        <SegmentedControl value={tab} onValueChange={(v) => setTab(v as "list" | "map")} aria-label={labels.showAs} className="@3xl:hidden">
          <SegmentedControlItem value="list">{labels.listTab}</SegmentedControlItem>
          <SegmentedControlItem value="map">{labels.mapTab}</SegmentedControlItem>
        </SegmentedControl>
      )}
      <div className={cn("grid min-w-0 gap-4", map && "@3xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @5xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]")}>
        <section aria-label={labels.name} className={cn("flex min-w-0 flex-col gap-3", map && tab !== "list" && "hidden @3xl:flex")}>
          <div className="flex min-h-(--h-sm) flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground tabular-nums">{labels.count(draft.length, locale)}</p>
            {!readOnly && (
              <Button data-slot="waypoint-editor-add" variant="secondary" size="sm" onClick={addAfterSelected}>
                <Plus aria-hidden="true" />
                {labels.add}
              </Button>
            )}
          </div>
          {readOnly && <p className="text-sm text-muted-foreground">{labels.readOnly}</p>}
          {draft.length === 0 ? (
            <div data-slot="waypoint-editor-empty" className="rounded-md bg-card ring-1 ring-border">
              <EmptyState size="inline" icon={Waypoints} title={labels.empty} />
            </div>
          ) : (
            <Sortable value={draft} onValueChange={(next) => dispatch({ type: "replace", draft: next })} getId={(w) => w.id} getLabel={(w) => w.name || labels.defaultName(draft.indexOf(w) + 1)}>
              {draft.map((w, i) => {
                const isSelected = w.id === selected
                const own = problemsOf(w.id)
                const detailsId = `${uid}-details-${i}`
                const name = w.name || labels.defaultName(i + 1)
                return (
                  <SortableItem key={w.id} id={w.id}>
                    <div
                      data-waypoint-id={w.id}
                      data-state={isSelected ? "selected" : undefined}
                      // Selected: a 2 px ink ring all round, as a graph node. Never a one-sided border: the corners bend it into a crescent.
                      className={cn("flex flex-col rounded-sm bg-card ring-inset", isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border")}
                    >
                      <div className="flex min-h-(--h-row) items-center gap-1 pr-1 pl-1">
                        {!readOnly && <SortableHandle label={labels.move(name)} />}
                        <button
                          type="button"
                          data-slot="waypoint-row"
                          aria-expanded={isSelected}
                          aria-controls={isSelected ? detailsId : undefined}
                          aria-describedby={readOnly ? undefined : keysId}
                          className={cn(
                            "press flex min-h-(--h-md) min-w-0 flex-1 items-start gap-3 rounded-xs px-2 py-2 text-left hover:bg-accent",
                            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                            readOnly && "pl-3",
                          )}
                          onClick={() => dispatch({ type: "select", id: isSelected ? null : w.id })}
                          onKeyDown={(e) => {
                            if (readOnly || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
                            if (e.key === "Delete" || e.key === "Backspace") {
                              e.preventDefault()
                              removeOne(w)
                            }
                          }}
                        >
                          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-xs bg-muted font-mono text-xs font-medium tabular-nums">
                            <SortablePosition />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className={cn("truncate text-sm", isSelected ? "font-bold" : "font-medium", !w.name && "text-muted-foreground")}>{name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {summary(w).map((part, k) => (
                                <React.Fragment key={k}>
                                  {k > 0 && " · "}
                                  <span className="whitespace-nowrap">{part}</span>
                                </React.Fragment>
                              ))}
                            </span>
                            {own.length > 0 && (
                              <span data-slot="waypoint-problems" className="flex items-start gap-2 text-xs text-warning">
                                <svg aria-hidden="true" viewBox="0 0 12 12" className="mt-px size-3 shrink-0">
                                  <path d="M6 1 11 10.5H1Z" fill="currentColor" />
                                </svg>
                                <span>{own.map((p) => labels.problem(p, minSpacing, locale)).join(" · ")}</span>
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                      {isSelected && (
                        <div id={detailsId} role="group" aria-label={name} className="animate-appear flex flex-col gap-4 border-t border-border px-3 pt-3 pb-4">
                          {readOnly ? (
                            <ReadOnlyDetails w={w} labels={labels} locale={locale} />
                          ) : (
                            <Details w={w} own={own} labels={labels} update={update} width={width} height={height} locale={locale} />
                          )}
                          {!readOnly && (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => duplicate(w)}>
                                <CopyPlus aria-hidden="true" />
                                {labels.duplicate}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => removeOne(w)}>
                                <Trash2 aria-hidden="true" />
                                {labels.remove}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </SortableItem>
                )
              })}
            </Sortable>
          )}
        </section>
        {map && (
          // Side by side, the map stays in view while a long list scrolls past it.
          <div className={cn("flex min-w-0 flex-col gap-3 @3xl:sticky @3xl:top-2 @3xl:self-start", tab !== "map" && "hidden @3xl:flex")}>
            {mapView}
            {/* Narrow, the list is a tab away: the selected waypoint in one line, and a way to its details. */}
            {selectedWaypoint && (
              <div className="flex items-center justify-between gap-3 @3xl:hidden">
                <p className="min-w-0 truncate text-sm">
                  <span className="font-medium">
                    {index + 1}. {selectedWaypoint.name || labels.defaultName(index + 1)}
                  </span>
                  <span className="text-muted-foreground"> · {summary(selectedWaypoint)[0]}</span>
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTab("list")
                    focusNext.current = { id: selectedWaypoint.id, part: "row" }
                  }}
                >
                  {labels.details}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        data-slot="waypoint-editor-summary"
        className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md px-4 py-3", readOnly ? "bg-card ring-1 ring-border" : "sticky bottom-2 z-10 bg-float shadow-float ring-1 ring-edge backdrop-blur-xl")}
      >
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{labels.distanceTitle}</dt>
            <dd className="font-medium tabular-nums">{labels.distance(distance, locale)}</dd>
          </div>
          {duration !== undefined && (
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{labels.durationTitle}</dt>
              <dd className="font-medium tabular-nums">{labels.duration(duration, locale)}</dd>
            </div>
          )}
        </dl>
        {!readOnly && (
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <p id={reasonId} data-slot="waypoint-editor-status" className={cn("flex items-center gap-2 text-sm", saveFailed ? "text-danger" : dirty ? "font-medium" : "text-muted-foreground")}>
              {saveFailed && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
              {saveFailed ? labels.saveFailed : dirty ? (reason && reason !== labels.noChanges ? `${labels.unsaved} · ${reason}` : labels.unsaved) : labels.saved}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={(!dirty && !onCancel) || saving} onClick={cancel}>
                {labels.cancel}
              </Button>
              <Button size="sm" disabled={!!reason} loading={saving} aria-describedby={reasonId} onClick={save}>
                {labels.save}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** The selected waypoint's fields. */
function Details({
  w,
  own,
  labels,
  update,
  width,
  height,
  locale,
}: {
  w: Waypoint
  own: WaypointProblem[]
  labels: WaypointEditorLabels
  update: (id: string, patch: Partial<Omit<Waypoint, "id">>) => void
  width: number | undefined
  height: number | undefined
  locale: string | undefined
}) {
  const nameProblem = own.find((p) => p.kind === "noName")
  const actionProblem = own.find((p) => p.kind === "noActionName")
  const a = w.action
  const setAction = (type: WaypointActionType) =>
    update(w.id, {
      action: type === "wait" ? { type, seconds: a.type === "wait" ? a.seconds : 30 } : type === "custom" ? { type, name: a.type === "custom" ? a.name : "" } : { type },
    })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      <Field label={labels.fieldName} error={nameProblem && labels.problem(nameProblem, 0, locale)} className="col-span-2">
        <Input name="name" value={w.name} autoComplete="off" onChange={(e) => update(w.id, { name: e.target.value })} />
      </Field>
      {w.at.kind === "plan" ? (
        <>
          <Field label={labels.x}>
            <NumberField
              value={w.at.x}
              min={0}
              max={width}
              step={0.1}
              unit="m"
              onValueChange={(v) => v !== null && w.at.kind === "plan" && update(w.id, { at: { ...w.at, x: v } })}
              className="w-full"
            />
          </Field>
          <Field label={labels.y}>
            <NumberField
              value={w.at.y}
              min={0}
              max={height}
              step={0.1}
              unit="m"
              onValueChange={(v) => v !== null && w.at.kind === "plan" && update(w.id, { at: { ...w.at, y: v } })}
              className="w-full"
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={labels.lat}>
            <NumberField value={w.at.lat} min={-90} max={90} step={0.000001} unit="°" onValueChange={(v) => v !== null && w.at.kind === "geo" && update(w.id, { at: { ...w.at, lat: v } })} className="w-full" />
          </Field>
          <Field label={labels.lon}>
            <NumberField value={w.at.lon} min={-180} max={180} step={0.000001} unit="°" onValueChange={(v) => v !== null && w.at.kind === "geo" && update(w.id, { at: { ...w.at, lon: v } })} className="w-full" />
          </Field>
        </>
      )}
      <Field label={labels.heading} hint={labels.headingHint} className="col-span-2">
        <NumberField
          value={w.heading ?? null}
          min={0}
          max={359}
          step={1}
          largeStep={45}
          unit="°"
          onValueChange={(v) => update(w.id, { heading: v === null ? undefined : v })}
          className="w-full"
        />
      </Field>
      <Field label={labels.action} className={a.type === "wait" || a.type === "custom" ? undefined : "col-span-2"}>
        <Select value={a.type} onValueChange={(v) => setAction(v as WaypointActionType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["none", "wait", "dock", "photo", "custom"] as const).map((t) => (
              <SelectItem key={t} value={t}>
                {labels.actions[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {a.type === "wait" && (
        <Field label={labels.waitFor}>
          <NumberField value={a.seconds} min={0} step={1} largeStep={30} unit="s" onValueChange={(v) => update(w.id, { action: { type: "wait", seconds: v ?? 0 } })} className="w-full" />
        </Field>
      )}
      {a.type === "custom" && (
        <Field label={labels.customName} error={actionProblem && labels.problem(actionProblem, 0, locale)}>
          <Input value={a.name} autoComplete="off" onChange={(e) => update(w.id, { action: { type: "custom", name: e.target.value } })} />
        </Field>
      )}
      <Field label={labels.dwell} hint={labels.dwellHint} className="col-span-2">
        <NumberField value={w.dwell ?? 0} min={0} step={1} largeStep={30} unit="s" onValueChange={(v) => update(w.id, { dwell: v ?? 0 })} className="w-full" />
      </Field>
    </div>
  )
}

/** The same facts for a viewer, as text. */
function ReadOnlyDetails({ w, labels, locale }: { w: Waypoint; labels: WaypointEditorLabels; locale: string | undefined }) {
  const rows: [string, string][] = [
    [w.at.kind === "plan" ? `${labels.x}, ${labels.y}` : `${labels.lat}, ${labels.lon}`, w.at.kind === "plan" ? labels.position(w.at.x, w.at.y, locale) : labels.geoPosition(w.at.lat, w.at.lon, locale)],
    [labels.heading, w.heading === undefined ? "—" : `${Math.round(w.heading).toLocaleString(locale)}°`],
    [labels.action, w.action.type === "none" ? labels.actions.none : labels.actionShort(w.action, locale)],
    [labels.dwell, `${(w.dwell ?? 0).toLocaleString(locale)} s`],
  ]
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="tabular-nums">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}
