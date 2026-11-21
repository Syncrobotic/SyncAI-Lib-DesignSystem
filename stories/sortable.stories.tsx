import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Lock, MapPin, X } from "lucide-react"
import { Sortable, SortableHandle, SortableItem } from "@/registry/syncrobotic/ui/sortable"
import { Switch } from "@/registry/syncrobotic/ui/switch"

const meta: Meta = { title: "Inputs/Sortable" }
export default meta
type S = StoryObj

type Stop = { id: string; name: string; wait: string }
const route: Stop[] = [
  { id: "a", name: "Dock A", wait: "start" },
  { id: "b", name: "North gate", wait: "30 s" },
  { id: "c", name: "Parking lot", wait: "1 min" },
  { id: "d", name: "Loading dock", wait: "45 s" },
  { id: "e", name: "Hall B entrance", wait: "30 s" },
]

const row = "flex min-h-(--h-row) items-center gap-2 rounded-sm bg-card pr-3 pl-1 ring-1 ring-border ring-inset"

export const SortableWaypoints: S = {
  render: function W() {
    const [stops, setStops] = React.useState(route)
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Patrol order</span>
        <Sortable value={stops} onValueChange={setStops} getId={(s) => s.id} getLabel={(s) => s.name}>
          {stops.map((s, i) => (
            <SortableItem key={s.id} id={s.id}>
              <div className={row}>
                <SortableHandle label={`Move ${s.name}`} />
                <span className="flex size-6 shrink-0 items-center justify-center rounded-xs bg-muted text-xs font-medium tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.wait}</span>
              </div>
            </SortableItem>
          ))}
        </Sortable>
      </div>
    )
  },
}

export const SortableWithOverlay: S = {
  render: function W() {
    const [stops, setStops] = React.useState(route.slice(0, 4))
    return (
      <Sortable
        value={stops}
        onValueChange={setStops}
        getId={(s) => s.id}
        getLabel={(s) => s.name}
        renderOverlay={(s) => (
          <div className={row}>
            <span className="flex size-(--h-sm) items-center justify-center">
              <MapPin aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm font-medium">{s.name}</span>
          </div>
        )}
      >
        {stops.map((s) => (
          <SortableItem key={s.id} id={s.id}>
            <div className={row}>
              <SortableHandle label={`Move ${s.name}`} />
              <span className="flex-1 text-sm font-medium">{s.name}</span>
            </div>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

export const SortablePriorities: S = {
  render: function P() {
    const [rules, setRules] = React.useState([
      { id: "people", label: "Give way to people", on: true },
      { id: "battery", label: "Return when battery is low", on: true },
      { id: "doors", label: "Wait at closed doors", on: false },
    ])
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">When rules conflict, the higher one wins</span>
        {/* The stop is not a rule you can move or switch off: it sits above the list, with no handle, and says why. */}
        <div className={row}>
          <span className="flex size-(--h-sm) shrink-0 items-center justify-center text-muted-foreground">
            <Lock aria-hidden="true" className="size-4" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-sm">Emergency stop</span>
            <span className="text-xs text-muted-foreground">Always first, always on</span>
          </span>
          <Switch checked disabled aria-label="Emergency stop, always on" />
        </div>
        <Sortable value={rules} onValueChange={setRules} getId={(r) => r.id} getLabel={(r) => r.label}>
          {rules.map((r) => (
            <SortableItem key={r.id} id={r.id}>
              <label className={row}>
                <SortableHandle label={`Move ${r.label}`} />
                <span className="flex-1 text-sm">{r.label}</span>
                <Switch checked={r.on} onCheckedChange={(on) => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, on } : x)))} />
              </label>
            </SortableItem>
          ))}
        </Sortable>
      </div>
    )
  },
}

export const SortableGrid: S = {
  render: function G() {
    const [cams, setCams] = React.useState(["Front", "Rear", "Left", "Right", "Thermal", "Arm"].map((n, i) => ({ id: String(i), name: n })))
    return (
      <Sortable value={cams} onValueChange={setCams} getId={(c) => c.id} getLabel={(c) => `${c.name} camera`} layout="grid">
        {cams.map((c) => (
          <SortableItem key={c.id} id={c.id}>
            <figure className="flex flex-col gap-2 rounded-sm bg-card p-2 ring-1 ring-border">
              <div className="relative aspect-video rounded-xs bg-muted">
                <SortableHandle label={`Move ${c.name} camera`} className="absolute top-1 left-1 bg-card" />
              </div>
              <figcaption className="text-xs text-muted-foreground">{c.name}</figcaption>
            </figure>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

export const SortableCompact: S = {
  render: function C() {
    const [cols, setCols] = React.useState(["Robot", "Status", "Battery", "Site", "Last seen"].map((n) => ({ id: n, name: n })))
    return (
      <div className="flex w-56 flex-col gap-1">
        <span className="pb-1 text-xs font-medium text-muted-foreground">Column order</span>
        <Sortable value={cols} onValueChange={setCols} getId={(c) => c.id} getLabel={(c) => c.name} className="gap-1">
          {cols.map((c) => (
            <SortableItem key={c.id} id={c.id}>
              <div className="flex h-(--h-md) items-center gap-1 rounded-sm pr-3 text-sm hover:bg-accent">
                <SortableHandle label={`Move ${c.name}`} />
                {c.name}
              </div>
            </SortableItem>
          ))}
        </Sortable>
      </div>
    )
  },
}

export const SortableFiles: S = {
  render: function F() {
    const [files, setFiles] = React.useState(["intro.mp4", "hall-b-walkthrough.mp4", "safety-briefing.pdf"].map((n) => ({ id: n, name: n })))
    return (
      <Sortable value={files} onValueChange={setFiles} getId={(f) => f.id} getLabel={(f) => f.name}>
        {files.map((f, i) => (
          <SortableItem key={f.id} id={f.id}>
            <div className={row}>
              <SortableHandle label={`Move ${f.name}`} />
              <span className="flex-1 truncate font-mono text-sm">{f.name}</span>
              <span className="text-xs text-muted-foreground">Step {i + 1}</span>
            </div>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

/** Steps with a remove button at the end; numbers follow the order. */
export const SortableRemovable: S = {
  render: function R() {
    const [stops, setStops] = React.useState(route)
    return (
      <Sortable value={stops} onValueChange={setStops} getId={(s) => s.id} getLabel={(s) => s.name}>
        {stops.map((s, i) => (
          <SortableItem key={s.id} id={s.id}>
            <div className={row}>
              <SortableHandle label={`Move ${s.name}`} />
              <span className="w-6 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
              <span className="flex-1 truncate text-sm">{s.name}</span>
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() => setStops((p) => p.filter((x) => x.id !== s.id))}
                className="press flex size-(--h-sm) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

/** Dashboard widgets in a grid: the order is the layout. */
export const SortableDashboard: S = {
  render: function D() {
    const [w, setW] = React.useState(["Fleet status", "Open alarms", "Battery", "Patrols today"].map((n) => ({ id: n, name: n })))
    return (
      // Four widgets, two by two: no widget is left alone on a row, and each title has room for one line.
      <Sortable value={w} onValueChange={setW} getId={(x) => x.id} getLabel={(x) => x.name} layout="grid" className="w-lg max-w-full sm:grid-cols-2">
        {w.map((x) => (
          <SortableItem key={x.id} id={x.id}>
            <div className="flex h-24 flex-col gap-2 rounded-md bg-card p-3 ring-1 ring-border">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{x.name}</span>
                <SortableHandle label={`Move ${x.name}`} />
              </div>
              <div className="h-2 w-2/3 rounded-xs bg-muted" />
            </div>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

/** Column order with a show / hide toggle per column. */
export const SortableColumnsWithVisibility: S = {
  render: function C() {
    const [cols, setCols] = React.useState(["Robot", "Status", "Battery", "Site", "Firmware"].map((n, i) => ({ id: n, name: n, on: i < 4 })))
    return (
      <Sortable value={cols} onValueChange={setCols} getId={(c) => c.id} getLabel={(c) => c.name} className="w-64 gap-1">
        {cols.map((c) => (
          <SortableItem key={c.id} id={c.id}>
            <label className="flex h-(--h-md) items-center gap-2 rounded-sm pr-1 text-sm hover:bg-accent">
              <SortableHandle label={`Move ${c.name}`} />
              <span className={c.on ? "flex-1" : "flex-1 text-muted-foreground"}>{c.name}</span>
              <Switch checked={c.on} aria-label={`Show ${c.name}`} onCheckedChange={(on) => setCols((p) => p.map((x) => (x.id === c.id ? { ...x, on } : x)))} />
            </label>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}

/** A longer list in a fixed-height box: dragging near an edge scrolls it. */
export const SortableLongList: S = {
  render: function L() {
    const [items, setItems] = React.useState(Array.from({ length: 14 }, (_, i) => ({ id: String(i), name: `Waypoint ${i + 1}` })))
    return (
      <div className="h-72 overflow-y-auto rounded-md p-2 ring-1 ring-border" tabIndex={0} aria-label="Waypoints">
        <Sortable value={items} onValueChange={setItems} getId={(x) => x.id} getLabel={(x) => x.name} className="gap-1">
          {items.map((x) => (
            <SortableItem key={x.id} id={x.id}>
              <div className="flex h-(--h-md) items-center gap-1 rounded-sm pr-3 text-sm hover:bg-accent">
                <SortableHandle label={`Move ${x.name}`} />
                {x.name}
              </div>
            </SortableItem>
          ))}
        </Sortable>
      </div>
    )
  },
}

/** Mission queue with durations and the total that follows the order. */
export const SortableQueue: S = {
  render: function Q() {
    const [q, setQ] = React.useState([
      { id: "m1", name: "Inventory scan · aisle 1–12", min: 24 },
      { id: "m2", name: "Deliver to floor 3", min: 8 },
      { id: "m3", name: "Night patrol · north", min: 45 },
    ])
    let t = 0
    return (
      <div className="flex flex-col gap-2">
        <Sortable value={q} onValueChange={setQ} getId={(m) => m.id} getLabel={(m) => m.name}>
          {q.map((m) => {
            t += m.min
            return (
              <SortableItem key={m.id} id={m.id}>
                <div className={row}>
                  <SortableHandle label={`Move ${m.name}`} />
                  <span className="flex-1 truncate text-sm">{m.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">done by +{t} min</span>
                </div>
              </SortableItem>
            )
          })}
        </Sortable>
        <span className="text-xs text-muted-foreground tabular-nums">Total {t} min</span>
      </div>
    )
  },
}

/** Tags in priority order, as a wrapping grid of chips. */
export const SortableChips: S = {
  render: function T() {
    const [tags, setTags] = React.useState(["People", "Forklifts", "Doors", "Spills", "Boxes"].map((n) => ({ id: n, name: n })))
    return (
      <Sortable value={tags} onValueChange={setTags} getId={(x) => x.id} getLabel={(x) => x.name} layout="grid" className="grid-cols-3">
        {tags.map((x, i) => (
          <SortableItem key={x.id} id={x.id}>
            <div className="flex h-(--h-md) items-center gap-1 rounded-sm pr-3 text-sm ring-1 ring-border ring-inset">
              <SortableHandle label={`Move ${x.name}`} />
              <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              {x.name}
            </div>
          </SortableItem>
        ))}
      </Sortable>
    )
  },
}
