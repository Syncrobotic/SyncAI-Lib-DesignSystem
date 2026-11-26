// @syncrobotic/sheet-filters v0.40.0 · update: npx shadcn add @syncrobotic/sheet-filters --overwrite
"use client"

import * as React from "react"
import { SearchX } from "lucide-react"
import { formatCount } from "@/registry/syncrobotic/lib/format-count"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { FacetsDrawer, type Facet, type FacetValue } from "@/registry/syncrobotic/ui/facets"

// Sample data: the robots the filters narrow down.
type Robot = { id: string; state: "patrolling" | "docked" | "attention" | "offline"; site: "taipei" | "taoyuan" | "hsinchu" }
const robots: Robot[] = [
  { id: "7F3A", state: "patrolling", site: "taipei" },
  { id: "1715", state: "patrolling", site: "taipei" },
  { id: "DAA6", state: "docked", site: "taipei" },
  { id: "9E37", state: "attention", site: "taoyuan" },
  { id: "C2B0", state: "offline", site: "taoyuan" },
  { id: "4A11", state: "docked", site: "taoyuan" },
  { id: "B812", state: "patrolling", site: "hsinchu" },
]
const states: Record<Robot["state"], { label: string; status: Status }> = {
  patrolling: { label: "Patrolling", status: "active" },
  docked: { label: "Docked", status: "normal" },
  attention: { label: "Needs attention", status: "warning" },
  offline: { label: "Offline", status: "offline" },
}
const sites: Record<Robot["site"], string> = { taipei: "Taipei HQ", taoyuan: "Taoyuan plant", hsinchu: "Hsinchu lab" }

const matches = (r: Robot, v: FacetValue) => (!v.state?.length || v.state.includes(r.state)) && (!v.site?.length || v.site.includes(r.site))

/**
 * The facets, each option with how many robots it would leave once the other facet's picks apply: what the reader sees
 * before they tap it.
 */
function facetsOf(value: FacetValue): Facet[] {
  const count = (key: "state" | "site", option: string) => robots.filter((r) => r[key] === option && matches(r, { ...value, [key]: [] })).length
  return [
    { key: "state", label: "State", options: (Object.keys(states) as Robot["state"][]).map((s) => ({ value: s, label: states[s].label, count: count("state", s) })) },
    { key: "site", label: "Site", options: (Object.keys(sites) as Robot["site"][]).map((s) => ({ value: s, label: sites[s], count: count("site", s) })) },
  ]
}

/**
 * Filters on a phone: the Filters button in the list's toolbar says how many are on and opens the facets in a bottom sheet
 * (FacetsDrawer), each option with how many robots it leaves. Picks apply at once, as in the facet column on a wide screen,
 * so the list and its count behind the sheet are always the result; Done closes it, Clear all empties it. On a wide screen
 * put `Facets` beside the list with the same value.
 */
export function SheetFilters({
  defaultOpen,
  defaultValue = { state: ["attention", "offline"] },
  onValueChange,
}: {
  /** Opens the sheet at first. */
  defaultOpen?: boolean
  /** The picks it starts with. */
  defaultValue?: FacetValue
  /** Called with every facet's picks after each change. */
  onValueChange?: (value: FacetValue) => void
}) {
  const [value, setValue] = React.useState<FacetValue>(defaultValue)
  const change = (v: FacetValue) => {
    setValue(v)
    onValueChange?.(v)
  }
  const shown = robots.filter((r) => matches(r, value))

  return (
    <div className="flex min-h-[var(--app-shell-height,100dvh)] flex-col gap-4 bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FacetsDrawer facets={facetsOf(value)} value={value} onValueChange={change} defaultOpen={defaultOpen} />
        {/* What the picks leave, said once after each change. */}
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {formatCount(shown.length)} of {formatCount(robots.length)} robots
        </p>
      </div>
      {shown.length === 0 ? (
        <ListGroup className="py-4">
          <EmptyState
            size="inline"
            icon={SearchX}
            title="No robots match"
            description="Pick another state or site."
            action={
              <Button variant="secondary" size="sm" onClick={() => change({})}>
                Clear filters
              </Button>
            }
          />
        </ListGroup>
      ) : (
        <ListGroup role="list" aria-label="Robots">
          {shown.map((r) => (
            // The item draws the hairline between rows, as ResponsiveTable's phone rows do.
            <div key={r.id} role="listitem" className="border-b border-border last:border-b-0">
              <ListRow title={`Patrol dog ${r.id}`} meta={sites[r.site]} trailing={<InlineStatus status={states[r.state].status}>{states[r.state].label}</InlineStatus>} />
            </div>
          ))}
        </ListGroup>
      )}
    </div>
  )
}
