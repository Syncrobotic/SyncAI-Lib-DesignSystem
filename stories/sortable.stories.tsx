import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { MapPin } from "lucide-react"
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
      { id: "stop", label: "Emergency stop", on: true, locked: true },
      { id: "people", label: "Give way to people", on: true },
      { id: "battery", label: "Return when battery is low", on: true },
      { id: "doors", label: "Wait at closed doors", on: false },
    ])
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">When rules conflict, the higher one wins</span>
        <Sortable value={rules} onValueChange={setRules} getId={(r) => r.id} getLabel={(r) => r.label}>
          {rules.map((r) => (
            <SortableItem key={r.id} id={r.id}>
              <label className={row}>
                <SortableHandle label={`Move ${r.label}`} />
                <span className="flex-1 text-sm">{r.label}</span>
                <Switch checked={r.on} disabled={r.locked} onCheckedChange={(on) => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, on } : x)))} />
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
