// @syncrobotic/fleet-table v0.17.2 · update: npx shadcn add @syncrobotic/fleet-table --overwrite
"use client"

import * as React from "react"
import { Ellipsis, MapPin, Pencil, Search, Trash2 } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

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
  { id: "9C44", name: "Patrol dog 9C44", status: "attention", battery: 18, site: "Parking lot", lastSeen: "1 min ago" },
  { id: "4D21", name: "Patrol dog 4D21", status: "stopped", battery: 64, site: "Warehouse", lastSeen: "now" },
  { id: "1A08", name: "Patrol dog 1A08", status: "patrolling", battery: 55, site: "Perimeter", lastSeen: "now" },
  { id: "6E77", name: "Patrol dog 6E77", status: "offline", battery: 0, site: "Dock B", lastSeen: "3 h ago" },
  { id: "8F15", name: "Patrol dog 8F15", status: "docked", battery: 91, site: "Dock A", lastSeen: "now" },
  { id: "3C62", name: "Patrol dog 3C62", status: "patrolling", battery: 38, site: "Loading bay", lastSeen: "now" },
]

type Filter = "all" | "active" | "attention" | "offline"
const matches: Record<Filter, (r: Robot) => boolean> = {
  all: () => true,
  active: (r) => r.status === "patrolling" || r.status === "docked",
  attention: (r) => r.status === "attention" || r.status === "stopped",
  offline: (r) => r.status === "offline",
}

/** The fleet at a glance: search, filter by state, page through, act on a row. On phones, status moves under the name and site and last seen hide. */
export function FleetTable({ robots = sampleRobots, pageSize = 5, onOpen }: { robots?: Robot[]; pageSize?: number; onOpen?: (r: Robot) => void }) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [page, setPage] = React.useState(0)

  const rows = robots.filter((r) => matches[filter](r) && `${r.name} ${r.site}`.toLowerCase().includes(query.toLowerCase()))
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize)
  const count = (f: Filter) => robots.filter(matches[f]).length

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

      {visible.length === 0 ? (
        <div className="rounded-md ring-1 ring-border">
          <EmptyState
            icon={Search}
            title="No robots match"
            description="Try another name or clear the filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("")
                  setFilter("all")
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Robot</TableHead>
              <TableHead className="hidden sm:table-cell sm:w-44">Status</TableHead>
              <TableHead className="sm:w-48">Battery</TableHead>
              <TableHead className="hidden lg:table-cell lg:w-40">Site</TableHead>
              <TableHead className="hidden lg:table-cell lg:w-32">Last seen</TableHead>
              <TableHead className="w-12 max-sm:pr-2 max-sm:pl-0">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-sm:py-2">
                  {/* One target for the name and, on a phone, the status under it: at least 44 px, with the row's padding
                      even above and below. */}
                  <button type="button" onClick={() => onOpen?.(r)} className="group/name press flex min-h-(--h-md) flex-col items-start justify-center gap-1 text-left">
                    <span className="font-medium group-hover/name:underline">{r.name}</span>
                    <span className="sm:hidden">
                      <InlineStatus status={status[r.status].tone}>{status[r.status].label}</InlineStatus>
                    </span>
                  </button>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <InlineStatus status={status[r.status].tone}>{status[r.status].label}</InlineStatus>
                </TableCell>
                <TableCell>
                  <Meter value={r.battery} low={15} label={`Battery, ${r.name}`} inline className="max-sm:flex-col max-sm:items-start max-sm:gap-1" />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{r.site}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{r.lastSeen}</TableCell>
                <TableCell className="max-sm:pr-2 max-sm:pl-0">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                        <Ellipsis aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination page={current} pageSize={pageSize} total={rows.length} onPageChange={setPage} labels={{ empty: "0 robots" }} />
    </div>
  )
}
