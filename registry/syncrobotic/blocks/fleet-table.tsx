"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Ellipsis, MapPin, Pencil, Search, Trash2 } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Progress } from "@/registry/syncrobotic/ui/progress"
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

const status: Record<Robot["status"], { tone: Tone; label: string }> = {
  patrolling: { tone: "info", label: "Patrolling" },
  docked: { tone: "success", label: "Docked" },
  attention: { tone: "warning", label: "Needs attention" },
  stopped: { tone: "danger", label: "Stopped" },
  offline: { tone: "neutral", label: "Offline" },
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
        <div className="relative lg:w-72">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Search name or site"
            aria-label="Search robots"
            className="pl-8"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-md ring-1 ring-border">
          <EmptyState icon={Search} title="No robots match" description="Try another name or clear the filter." action={<Button variant="secondary" onClick={() => { setQuery(""); setFilter("all") }}>Clear filters</Button>} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Robot</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="sm:w-40">Battery</TableHead>
              <TableHead className="hidden md:table-cell">Site</TableHead>
              <TableHead className="hidden md:table-cell">Last seen</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => onOpen?.(r)} className="text-left font-medium hover:underline">
                      {r.name}
                    </button>
                    <span className="sm:hidden">
                      <InlineStatus tone={status[r.status].tone}>{status[r.status].label}</InlineStatus>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <InlineStatus tone={status[r.status].tone}>{status[r.status].label}</InlineStatus>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={r.battery} tone={r.battery < 30 ? "warning" : "neutral"} aria-label={`Battery ${r.battery}%`} className="hidden w-20 sm:block" />
                    <span className={r.battery < 30 ? "text-warning" : "text-muted-foreground"}>{r.battery}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{r.site}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{r.lastSeen}</TableCell>
                <TableCell>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length === 0 ? "0 robots" : `${current * pageSize + 1}–${current * pageSize + visible.length} of ${rows.length}`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
