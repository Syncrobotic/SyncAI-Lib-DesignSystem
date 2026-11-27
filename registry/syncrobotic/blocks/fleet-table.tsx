// @syncrobotic/fleet-table v0.55.0 · update: npx shadcn add @syncrobotic/fleet-table --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CircleAlert, MapPin, Pencil, Search, SearchX, Trash2 } from "lucide-react"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { useSearchText } from "@/registry/syncrobotic/hooks/use-list-query"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type Robot = {
  id: string
  name: string
  status: "patrolling" | "docked" | "attention" | "stopped" | "offline"
  battery: number
  site: string
  /** As people read it ("3 h ago"), when there is no `lastSeenAt`. */
  lastSeen: string
  /** ISO 8601: written relative to `now` in the reader's language, instead of `lastSeen`. */
  lastSeenAt?: string
}

const tones: Record<Robot["status"], Status> = { patrolling: "active", docked: "normal", attention: "warning", stopped: "danger", offline: "offline" }

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

export type FleetTableFilter = "all" | "active" | "attention" | "offline"

export type FleetTableLabels = {
  /** The table's name for screen readers. */
  table: string
  filter: string
  filters: Record<FleetTableFilter, string>
  search: string
  searchPlaceholder: string
  columns: { name: string; status: string; battery: string; site: string; seen: string }
  status: Record<Robot["status"], string>
  battery: (name: string) => string
  /** A low battery read out on a phone, e.g. "14 %, low". */
  low: (percent: string) => string
  showOnMap: string
  rename: string
  remove: string
  /** Why Rename and Remove are disabled, and who can change it. */
  denied: string
  noMatch: string
  noMatchBody: string
  clearFilters: string
  empty: string
  emptyBody: string
  /** The title of a failed action; its description comes from `errors` by code. */
  failed: string
  failedBody: string
  errors: Record<string, string>
  dismiss: string
  pageEmpty: string
  data?: Partial<DataStateLabels>
}

export const defaultFleetTableLabels: FleetTableLabels = {
  table: "Robots",
  filter: "Filter robots",
  filters: { all: "All", active: "Active", attention: "Attention", offline: "Offline" },
  search: "Search robots",
  searchPlaceholder: "Search name or site",
  columns: { name: "Robot", status: "Status", battery: "Battery", site: "Site", seen: "Last seen" },
  status: { patrolling: "Patrolling", docked: "Docked", attention: "Needs attention", stopped: "Stopped", offline: "Offline" },
  battery: (name) => `Battery, ${name}`,
  low: (percent) => `${percent}, low`,
  showOnMap: "Show on map",
  rename: "Rename",
  remove: "Remove from fleet",
  denied: "You need the devices:write permission. A project admin can grant it.",
  noMatch: "No robots match",
  noMatchBody: "Try another name or clear the filter.",
  clearFilters: "Clear filters",
  empty: "No robots yet",
  emptyBody: "Robots appear here once they are added to the fleet.",
  failed: "That did not work",
  failedBody: "Nothing was changed. Try again.",
  errors: {},
  dismiss: "Dismiss",
  pageEmpty: "0 robots",
}

// The battery in a phone row's line: the number, and below 15 % the warning shape before it and the word read out.
const PhoneBattery = ({ value, low }: { value: number; low: (percent: string) => string }) => (
  <span className="inline-flex items-center gap-2 tabular-nums">
    {value < 15 && <StatusGlyph status="warning" />}
    {/* One string when low: a positioned sr-only ", low" alone is read as "14 % , low". */}
    {value < 15 ? (
      <>
        <span aria-hidden="true">{value} %</span>
        <span className="sr-only">{low(`${value} %`)}</span>
      </>
    ) : (
      `${value} %`
    )}
  </span>
)

const relative = (iso: string, now: number, locale?: string) => {
  const s = (Date.parse(iso) - now) / 1000
  const a = Math.abs(s)
  const rtf = new Intl.RelativeTimeFormat(locale ?? "en", { numeric: "auto" })
  if (a < 60) return rtf.format(0, "second")
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute")
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour")
  return rtf.format(Math.round(s / 86400), "day")
}

export type FleetTableContentProps = {
  /** One page of rows and the server's count of all that match. Never counted here. */
  page: ListPage<Robot>
  query: ListQuery
  /** A new search, sort or filter goes back to page 1. */
  onQueryChange: (query: ListQuery) => void
  filter?: FleetTableFilter
  onFilterChange?: (filter: FleetTableFilter) => void
  /** Each segment's count, from the server's summary. A segment without one shows no number. */
  counts?: Partial<Record<FleetTableFilter, number>>
  /** Columns the server sorts by ("name", "battery", "lastSeen"): their headers become sort buttons. */
  sortable?: readonly ("name" | "battery" | "lastSeen")[]
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  /** Your permission check; without it every action shows. */
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  /** What a viewer without the write permission sees: Rename and Remove `disabled` with the reason (default), or `hidden`. */
  denied?: "disabled" | "hidden"
  onOpen?: (robot: Robot) => void
  onShowOnMap?: (robot: Robot) => void
  onRename?: (robot: Robot) => void | Promise<void>
  onRemove?: (robot: Robot) => Promise<void>
  /** Typing pauses this long before the search goes out, in ms. */
  searchDelay?: number
  /** For `lastSeenAt`; default the browser's clock once the page has loaded. */
  now?: Date
  locale?: string
  labels?: Partial<FleetTableLabels>
}

/**
 * The fleet table as your data draws it: one page of rows with the server's `total` and per-segment `counts`, the
 * query in and out through `onQueryChange`, actions as callbacks that return promises, words from `labels`.
 */
export function FleetTableContent({
  page,
  query,
  onQueryChange,
  filter = "all",
  onFilterChange,
  counts,
  sortable = [],
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  onOpen,
  onShowOnMap,
  onRename,
  onRemove,
  searchDelay = 300,
  now,
  locale,
  labels,
}: FleetTableContentProps) {
  const l = { ...defaultFleetTableLabels, ...labels }
  const write = permissions?.write ?? "devices:write"
  const mayWrite = can ? can(write) : true
  const [search, setSearch] = useSearchText(query.search, (s) => onQueryChange({ ...query, search: s, page: 1 }), searchDelay)
  const [failure, setFailure] = React.useState<string | null>(null)
  const [clock] = React.useState(() => now?.getTime() ?? Date.now())
  const at = now?.getTime() ?? clock

  const count = (f: FleetTableFilter) => (counts?.[f] === undefined ? "" : ` ${formatCount(counts[f], { compact: true, locale })}`)
  const sortOf = (id: "name" | "battery" | "lastSeen") =>
    sortable.includes(id)
      ? {
          sort: query.sortBy === id ? (query.order ?? "asc") : (false as const),
          onSort: () => onQueryChange({ ...query, sortBy: id, order: query.sortBy === id && query.order !== "desc" ? "desc" : "asc", page: 1 }),
        }
      : {}

  const run = async (fn: () => void | Promise<void>) => {
    setFailure(null)
    try {
      await fn()
    } catch (e) {
      if (!isStepUpCancelled(e)) setFailure(errorCodeOf(e) ?? "UNKNOWN")
    }
  }

  // One list of columns for the table and the phone rows: the name is the row's title, the status its trailing shape and
  // word, the battery and the site the line under it; last seen stays in the table.
  const columns: ResponsiveTableColumn<Robot>[] = [
    { id: "name", header: l.columns.name, cell: (r) => r.name, ...sortOf("name") },
    { id: "status", header: l.columns.status, cell: (r) => <InlineStatus status={tones[r.status]}>{l.status[r.status]}</InlineStatus>, phone: "trailing", className: "w-44" },
    {
      id: "battery",
      header: l.columns.battery,
      cell: (r) => <Meter value={r.battery} low={15} label={l.battery(r.name)} inline />,
      phoneCell: (r) => <PhoneBattery value={r.battery} low={l.low} />,
      className: "w-48",
      ...sortOf("battery"),
    },
    { id: "site", header: l.columns.site, cell: (r) => r.site, className: "hidden text-muted-foreground lg:table-cell lg:w-40" },
    {
      id: "seen",
      header: l.columns.seen,
      cell: (r) => (r.lastSeenAt ? <time dateTime={r.lastSeenAt}>{relative(r.lastSeenAt, at, locale)}</time> : r.lastSeen),
      phone: "hidden",
      className: "hidden text-muted-foreground lg:table-cell lg:w-32",
      ...sortOf("lastSeen"),
    },
  ]

  const guarded = (node: React.ReactElement) => (
    <PermissionGate allowed={mayWrite} mode={denied} reason={l.denied}>
      {node}
    </PermissionGate>
  )
  const actions = !!(onShowOnMap || onRename || onRemove) && (mayWrite || denied === "disabled" || onShowOnMap)
  const filtered = !!query.search || filter !== "all"
  const clear = () => {
    setSearch("")
    onFilterChange?.("all")
    onQueryChange({ ...query, search: undefined, page: 1 })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", state === "forbidden" && "hidden")}>
        <SegmentedControl
          value={filter}
          onValueChange={(v) => {
            if (!v) return
            onFilterChange?.(v as FleetTableFilter)
            if (query.page !== 1) onQueryChange({ ...query, page: 1 })
          }}
          aria-label={l.filter}
          className="lg:w-auto"
        >
          {(["all", "active", "attention", "offline"] as const).map((f) => (
            <SegmentedControlItem key={f} value={f}>
              {l.filters[f]}
              {count(f)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <InputGroup className="lg:w-72">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={l.searchPlaceholder} aria-label={l.search} />
        </InputGroup>
      </div>

      {failure && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{l.failed}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{l.errors[failure] ?? l.failedBody}</span>
            <Button variant="ghost" size="sm" onClick={() => setFailure(null)}>
              {l.dismiss}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        <ResponsiveTable
          label={l.table}
          rows={page.items}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={onOpen}
          rowActions={
            actions
              ? (r) => (
                  <DropdownMenu modal={false}>
                    <DropdownMenuMoreTrigger name={r.name} size="icon-sm" />
                    <DropdownMenuContent align="end">
                      {onShowOnMap && (
                        <DropdownMenuItem onSelect={() => onShowOnMap(r)}>
                          <MapPin aria-hidden="true" /> {l.showOnMap}
                        </DropdownMenuItem>
                      )}
                      {onRename &&
                        guarded(
                          <DropdownMenuItem onSelect={() => void run(() => onRename(r))}>
                            <Pencil aria-hidden="true" /> {l.rename}
                          </DropdownMenuItem>,
                        )}
                      {onRemove && (mayWrite || denied === "disabled") && (
                        <>
                          {(onShowOnMap || onRename) && <DropdownMenuSeparator />}
                          {guarded(
                            <DropdownMenuItem destructive onSelect={() => void run(() => onRemove(r))}>
                              <Trash2 aria-hidden="true" /> {l.remove}
                            </DropdownMenuItem>,
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              : undefined
          }
          // No match: one inline EmptyState in the table's spanning cell (the list's surface on a phone), with the way back.
          empty={
            filtered ? (
              <EmptyState
                size="inline"
                icon={SearchX}
                title={l.noMatch}
                description={l.noMatchBody}
                action={
                  <Button variant="secondary" size="sm" onClick={clear}>
                    {l.clearFilters}
                  </Button>
                }
              />
            ) : (
              <EmptyState size="inline" title={l.empty} description={l.emptyBody} />
            )
          }
        />
      </DataState>

      {state !== "loading" && state !== "error" && state !== "forbidden" && (
        <Pagination
          page={query.page - 1}
          pageSize={query.limit}
          total={page.total}
          onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })}
          labels={{ empty: l.pageEmpty }}
          locale={locale}
        />
      )}
    </div>
  )
}

const matches: Record<FleetTableFilter, (r: Robot) => boolean> = {
  all: () => true,
  active: (r) => r.status === "patrolling" || r.status === "docked",
  attention: (r) => r.status === "attention" || r.status === "stopped",
  offline: (r) => r.status === "offline",
}

/**
 * A fleet section to search, filter by state, paginate and act on rows as a ResponsiveTable, status as shape and word,
 * with the emergency stop left to the screen around it. A table where there is room, a list on a phone, as in
 * console-overview. This is FleetTableContent on sample data, the sample answering as a server would.
 */
export function FleetTable({ robots = sampleRobots, pageSize = 5, onOpen }: { robots?: Robot[]; pageSize?: number; onOpen?: (r: Robot) => void }) {
  const [query, setQuery] = React.useState<ListQuery>({ page: 1, limit: pageSize })
  const [filter, setFilter] = React.useState<FleetTableFilter>("all")
  const [list, setList] = React.useState(robots)
  // The sample's stand-in for the server: it filters, counts and pages; the content only draws what it is given.
  const rows = list.filter((r) => matches[filter](r) && `${r.name} ${r.site}`.toLowerCase().includes((query.search ?? "").toLowerCase()))
  const last = Math.max(1, Math.ceil(rows.length / query.limit))
  const current = { ...query, page: Math.min(query.page, last) }
  const counts = Object.fromEntries((Object.keys(matches) as FleetTableFilter[]).map((f) => [f, list.filter(matches[f]).length]))
  return (
    <FleetTableContent
      page={{ items: rows.slice((current.page - 1) * query.limit, current.page * query.limit), total: rows.length }}
      query={current}
      onQueryChange={setQuery}
      filter={filter}
      onFilterChange={setFilter}
      counts={counts}
      searchDelay={0}
      onOpen={onOpen ?? (() => {})}
      onShowOnMap={() => {}}
      onRename={() => {}}
      onRemove={async (r) => setList((all) => all.filter((x) => x.id !== r.id))}
    />
  )
}
