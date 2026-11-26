// @syncrobotic/fleet-table v0.40.0 · update: npx shadcn add @syncrobotic/fleet-table --overwrite
"use client"

import * as React from "react"
import { MapPin, Pencil, Search, SearchX, Trash2 } from "lucide-react"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type Robot = {
  id: string
  name: string
  status: "patrolling" | "docked" | "attention" | "stopped" | "offline"
  battery: number
  site: string
  lastSeen: string
}

const status: Record<Robot["status"], { tone: Status; label: string }> = {
  patrolling: { tone: "active", label: "Patrolling" },
  docked: { tone: "normal", label: "Docked" },
  attention: { tone: "warning", label: "Needs attention" },
  stopped: { tone: "danger", label: "Stopped" },
  offline: { tone: "offline", label: "Offline" },
}

export const sampleRobots: Robot[] = [
  { id: "7F3A", name: "Patrol dog 7F3A", status: "patrolling", battery: 72, site: "North gate", lastSeen: "now" },
  { id: "2B10", name: "Patrol dog 2B10", status: "docked", battery: 100, site: "Dock A", lastSeen: "now" },
  { id: "9C44", name: "Patrol dog 9C44", status: "attention", battery: 14, site: "Parking lot", lastSeen: "1 min ago" },
  { id: "4D21", name: "Patrol dog 4D21", status: "stopped", battery: 64, site: "Warehouse", lastSeen: "now" },
  { id: "1A08", name: "Patrol dog 1A08", status: "patrolling", battery: 55, site: "Perimeter", lastSeen: "now" },
  { id: "6E77", name: "Patrol dog 6E77", status: "offline", battery: 0, site: "Dock B", lastSeen: "3 h ago" },
  { id: "8F15", name: "Patrol dog 8F15", status: "docked", battery: 91, site: "Dock A", lastSeen: "now" },
  { id: "3C62", name: "Patrol dog 3C62", status: "patrolling", battery: 38, site: "Loading bay", lastSeen: "now" },
]

// The battery in a phone row's line: the number, and below 15 % the warning shape before it and the word read out.
const PhoneBattery = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-2 tabular-nums">
    {value < 15 && <StatusGlyph status="warning" />}
    {value} %{value < 15 && <span className="sr-only">, low</span>}
  </span>
)

// One list of columns for the table and the phone rows: the name is the row's title, the status its trailing shape and
// word, the battery and the site the line under it; last seen stays in the table.
const columns: ResponsiveTableColumn<Robot>[] = [
  { id: "name", header: "Robot", cell: (r) => r.name },
  { id: "status", header: "Status", cell: (r) => <InlineStatus status={status[r.status].tone}>{status[r.status].label}</InlineStatus>, phone: "trailing", className: "w-44" },
  { id: "battery", header: "Battery", cell: (r) => <Meter value={r.battery} low={15} label={`Battery, ${r.name}`} inline />, phoneCell: (r) => <PhoneBattery value={r.battery} />, className: "w-48" },
  { id: "site", header: "Site", cell: (r) => r.site, className: "hidden text-muted-foreground lg:table-cell lg:w-40" },
  { id: "seen", header: "Last seen", cell: (r) => r.lastSeen, phone: "hidden", className: "hidden text-muted-foreground lg:table-cell lg:w-32" },
]

type Filter = "all" | "active" | "attention" | "offline"
const matches: Record<Filter, (r: Robot) => boolean> = {
  all: () => true,
  active: (r) => r.status === "patrolling" || r.status === "docked",
  attention: (r) => r.status === "attention" || r.status === "stopped",
  offline: (r) => r.status === "offline",
}

/**
 * The fleet at a glance: search, filter by state, page through, act on a row. The rows are a ResponsiveTable: a table
 * where there is room, a list on a phone (the name, its state, and the battery and site under it). A section, not a screen: the screen it sits in carries the emergency stop, one tap away
 * (the app shell's, as in console-overview); the table never stops a robot itself.
 */

export function FleetTable({ robots = sampleRobots, pageSize = 5, onOpen }: { robots?: Robot[]; pageSize?: number; onOpen?: (r: Robot) => void }) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [page, setPage] = React.useState(0)

  const rows = robots.filter((r) => matches[filter](r) && `${r.name} ${r.site}`.toLowerCase().includes(query.toLowerCase()))
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize)
  const count = (f: Filter) => formatCount(robots.filter(matches[f]).length, { compact: true })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          value={filter}
          onValueChange={(v) => {
            if (v) setFilter(v as Filter)
            setPage(0)
          }}
          aria-label="Filter robots"
          className="lg:w-auto"
        >
          <SegmentedControlItem value="all">All {count("all")}</SegmentedControlItem>
          <SegmentedControlItem value="active">Active {count("active")}</SegmentedControlItem>
          <SegmentedControlItem value="attention">Attention {count("attention")}</SegmentedControlItem>
          <SegmentedControlItem value="offline">Offline {count("offline")}</SegmentedControlItem>
        </SegmentedControl>
        <InputGroup className="lg:w-72">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Search name or site"
            aria-label="Search robots"
          />
        </InputGroup>
      </div>

      <ResponsiveTable
        label="Robots"
        rows={visible}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={(r) => onOpen?.(r)}
        rowActions={(r) => (
          <DropdownMenu modal={false}>
            <DropdownMenuMoreTrigger name={r.name} size="icon-sm" />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <MapPin aria-hidden="true" /> Show on map
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil aria-hidden="true" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Trash2 aria-hidden="true" /> Remove from fleet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        // No match: one inline EmptyState in the table's spanning cell (the list's surface on a phone), with the way back.
        empty={
          <EmptyState
            size="inline"
            icon={SearchX}
            title="No robots match"
            description="Try another name or clear the filter."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setFilter("all")
                }}
              >
                Clear filters
              </Button>
            }
          />
        }
      />

      <Pagination page={current} pageSize={pageSize} total={rows.length} onPageChange={setPage} labels={{ empty: "0 robots" }} />
    </div>
  )
}
