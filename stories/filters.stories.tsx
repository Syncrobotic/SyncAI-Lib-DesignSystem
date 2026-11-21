import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Battery, BatteryCharging, Bot, Forklift, MapPin, Package, Route, Wrench } from "lucide-react"
import { Filters, filterRows, fromSearchParams, toQueryString, type FilterField, type FilterRule } from "@/registry/syncrobotic/ui/filters"

const meta: Meta = { title: "Inputs/Filters" }
export default meta
type S = StoryObj

type Robot = { name: string; kind: string; status: string; site: string; battery: number; km: number; serviced: string; charging: boolean }

const statuses = ["patrolling", "docked", "attention", "stopped", "offline"]
const sites = ["North gate", "Hall B", "Warehouse 3", "Parking lot", "Perimeter"]
const kinds = ["dog", "courier", "forklift"]
// Deterministic sample rows, so stories and screenshots never change between runs.
const robots: Robot[] = Array.from({ length: 40 }, (_, i) => {
  const id = ((i * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 4).toUpperCase()
  return {
    name: `${["Patrol dog", "Courier", "Forklift"][i % 3]} ${id}`,
    kind: kinds[i % 3],
    status: statuses[(i * 7) % statuses.length],
    site: sites[i % sites.length],
    battery: 12 + ((i * 37) % 88),
    km: 120 + ((i * 53) % 900),
    serviced: `2026-${String(1 + (i % 11)).padStart(2, "0")}-${String(1 + ((i * 5) % 28)).padStart(2, "0")}`,
    charging: i % 4 === 0,
  }
})
const count = (key: keyof Robot, value: string) => robots.filter((r) => r[key] === value).length

const status: FilterField = {
  key: "status",
  label: "Status",
  type: "option",
  multiple: true,
  options: [
    { value: "patrolling", label: "Patrolling" },
    { value: "docked", label: "Docked" },
    { value: "attention", label: "Needs attention" },
    { value: "stopped", label: "Stopped" },
    { value: "offline", label: "Offline" },
  ].map((o) => ({ ...o, count: count("status", o.value) })),
}
const site: FilterField = {
  key: "site",
  label: "Site",
  type: "option",
  icon: <MapPin aria-hidden="true" />,
  options: sites.map((s) => ({ value: s, label: s, count: count("site", s) })),
}
const kind: FilterField = {
  key: "kind",
  label: "Kind",
  type: "option",
  icon: <Bot aria-hidden="true" />,
  options: [
    { value: "dog", label: "Patrol dog", icon: <Bot aria-hidden="true" /> },
    { value: "courier", label: "Courier", icon: <Package aria-hidden="true" /> },
    { value: "forklift", label: "Forklift", icon: <Forklift aria-hidden="true" /> },
  ],
}
const name: FilterField = { key: "name", label: "Robot", type: "text", placeholder: "Name or id" }
const battery: FilterField = { key: "battery", label: "Battery", type: "number", unit: "%", min: 0, max: 100, step: 5, icon: <Battery aria-hidden="true" /> }
const km: FilterField = { key: "km", label: "Odometer", type: "number", unit: "km", min: 0, step: 10, icon: <Route aria-hidden="true" /> }
const serviced: FilterField = { key: "serviced", label: "Last service", type: "date", icon: <Wrench aria-hidden="true" /> }
const charging: FilterField = { key: "charging", label: "Charging", type: "boolean", icon: <BatteryCharging aria-hidden="true" /> }

const basicFields = [status, site, battery]
const allFields = [name, status, kind, site, battery, km, serviced, charging]

/** How many robots the rules leave, read out when it changes. */
function Count({ rules, fields }: { rules: FilterRule[]; fields: FilterField[] }) {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
      {filterRows(robots, rules, fields).length} of {robots.length} robots
    </p>
  )
}

export const FiltersBasic: S = {
  render: function B() {
    const [rules, setRules] = React.useState<FilterRule[]>([{ id: "a", field: "status", operator: "any_of", value: ["attention", "stopped"] }])
    return (
      <div className="flex flex-col gap-3">
        <Filters fields={basicFields} value={rules} onValueChange={setRules} />
        <Count rules={rules} fields={basicFields} />
      </div>
    )
  },
}

export const FiltersAllFieldTypes: S = {
  render: function A() {
    const [rules, setRules] = React.useState<FilterRule[]>([
      { id: "t", field: "name", operator: "contains", value: "dog" },
      { id: "o", field: "kind", operator: "is_not", value: "forklift" },
      { id: "m", field: "status", operator: "none_of", value: ["offline"] },
      { id: "n", field: "battery", operator: "between", value: [20, 80] },
      { id: "d", field: "serviced", operator: "after", value: "2026-03-01" },
      { id: "b", field: "charging", operator: "is_false", value: null },
    ])
    return (
      <div className="flex flex-col gap-3">
        <Filters fields={allFields} value={rules} onValueChange={setRules} />
        <Count rules={rules} fields={allFields} />
      </div>
    )
  },
}

export const FiltersURLSynced: S = {
  render: function U() {
    // The query string is the only state: the rules are read from it on every render and written back on every change,
    // so what you see is exactly what a shared link restores.
    const [query, setQuery] = React.useState("status=any_of:attention,stopped&battery=lt:30")
    const rules = fromSearchParams(query, allFields)
    return (
      <div className="flex flex-col gap-3">
        <Filters fields={allFields} value={rules} onValueChange={(r) => setQuery(toQueryString(r))} />
        <Count rules={rules} fields={allFields} />
        <code aria-live="polite" className="rounded-xs bg-muted px-2 py-1 font-mono text-xs break-all">
          /robots{query ? `?${query}` : ""}
        </code>
      </div>
    )
  },
}

export const FiltersEmpty: S = {
  render: function E() {
    const [rules, setRules] = React.useState<FilterRule[]>([])
    return (
      <div className="flex flex-col gap-3">
        <Filters fields={allFields} value={rules} onValueChange={setRules} />
        <Count rules={rules} fields={allFields} />
      </div>
    )
  },
}

export const FiltersManyRulesWrapping: S = {
  render: function M() {
    const [rules, setRules] = React.useState<FilterRule[]>([
      { id: "1", field: "status", operator: "any_of", value: ["patrolling", "docked", "attention"] },
      { id: "2", field: "site", operator: "is_not", value: "Parking lot" },
      { id: "3", field: "battery", operator: "gt", value: 25 },
      { id: "4", field: "km", operator: "lt", value: 800 },
      { id: "5", field: "serviced", operator: "between", value: ["2026-02-01", "2026-10-31"] },
      { id: "6", field: "name", operator: "not_contains", value: "Forklift" },
      { id: "7", field: "charging", operator: "is_false", value: null },
    ])
    return (
      <div className="flex flex-col gap-3">
        <Filters fields={allFields} value={rules} onValueChange={setRules} />
        <Count rules={rules} fields={allFields} />
      </div>
    )
  },
}
