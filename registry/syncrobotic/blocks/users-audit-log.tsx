// @syncrobotic/users-audit-log v0.53.0 · update: npx shadcn add @syncrobotic/users-audit-log --overwrite
"use client"

import * as React from "react"
import { Download, Search, SearchX } from "lucide-react"
import { useSearchText } from "@/registry/syncrobotic/hooks/use-list-query"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

export type AuditEntry = {
  id: string
  /** ISO 8601. */
  at: string
  actor: string
  /** A kind from `kinds`, for the filter. */
  kind: string
  action: string
  target: string
  from?: string
  to?: string
  ip?: string
}

export type AuditFilters = { actor?: string; kind?: string }
export type AuditOption = { value: string; label: string }

export type UsersAuditLogLabels = {
  search: string
  actor: string
  everyone: string
  kind: string
  allKinds: string
  /** The count beside the filters, from the server's total. */
  count: (total: number, formatted: string) => string
  export: string
  table: string
  columns: { time: string; actor: string; action: string; target: string; change: string; ip: string }
  /** Read between a value before and after. */
  to: string
  none: string
  noMatch: string
  noMatchBody: string
  empty: string
  emptyBody: string
  /** Why Export is disabled. */
  exportDenied: string
  exportFailed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultUsersAuditLogLabels: UsersAuditLogLabels = {
  search: "Search actions and targets",
  actor: "Person",
  everyone: "Everyone",
  kind: "Kind of action",
  allKinds: "All actions",
  count: (total, n) => `${n} ${total === 1 ? "entry" : "entries"}`,
  export: "Export CSV",
  table: "Audit log",
  columns: { time: "Time", actor: "Person", action: "Action", target: "Target", change: "Change", ip: "IP address" },
  to: "to",
  none: "—",
  noMatch: "No entries match",
  noMatchBody: "Clear the search or choose Everyone.",
  empty: "Nothing recorded yet",
  emptyBody: "Changes to people, roles, keys and settings are recorded here as they happen.",
  exportDenied: "Your permissions do not include exporting the audit log. A project admin can grant it.",
  exportFailed: "The export did not start. Try again.",
  errors: {},
}

function Change({ from, to, word }: { from: string; to?: string; word: string }) {
  return (
    <span className="whitespace-nowrap">
      {from} <span aria-hidden="true">→</span>
      <span className="sr-only">{word}</span> <span className="text-foreground">{to}</span>
    </span>
  )
}

export type UsersAuditLogContentProps = {
  entries: ListPage<AuditEntry>
  query: ListQuery
  onQueryChange: (query: ListQuery) => void
  filters?: AuditFilters
  /** A change of filter; send the query back to page 1 with it. */
  onFiltersChange?: (filters: AuditFilters) => void
  /** The people and kinds to filter by, from the server. Without them, that filter is not shown. */
  actors?: readonly AuditOption[]
  kinds?: readonly AuditOption[]
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  /** `read` (audit-logs:read) decides the forbidden state; `export` (default the same) the Export button. */
  permissions?: { read?: string; export?: string }
  /** Exports what the filters select (the server's job, not this page's rows). */
  onExport?: () => Promise<void>
  searchDelay?: number
  locale?: string
  timeZone?: string
  labels?: Partial<UsersAuditLogLabels>
}

/** The audit log from your data: one page with the server's total, search and filters out, times through Intl. */
export function UsersAuditLogContent({
  entries,
  query,
  onQueryChange,
  filters = {},
  onFiltersChange,
  actors,
  kinds,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  onExport,
  searchDelay = 300,
  locale,
  timeZone,
  labels,
}: UsersAuditLogContentProps) {
  const l = { ...defaultUsersAuditLogLabels, ...labels }
  // Forbidden wins over every other state: a region the viewer may not read does not first load, then fail.
  const mayRead = can ? can(permissions?.read ?? "audit-logs:read") : true
  const mayExport = can ? can(permissions?.export ?? permissions?.read ?? "audit-logs:read") : true
  const shown = mayRead ? state : "forbidden"
  const [search, setSearch] = useSearchText(query.search, (s) => onQueryChange({ ...query, search: s, page: 1 }), searchDelay)
  const [exporting, setExporting] = React.useState(false)
  const [exportError, setExportError] = React.useState<string | null>(null)
  const time = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  const filter = (patch: AuditFilters) => {
    onFiltersChange?.({ ...filters, ...patch })
    if (query.page !== 1) onQueryChange({ ...query, page: 1 })
  }

  const runExport = async () => {
    if (!onExport) return
    setExporting(true)
    setExportError(null)
    try {
      await onExport()
    } catch (e) {
      if (!isStepUpCancelled(e)) setExportError(l.errors[errorCodeOf(e) ?? ""] ?? l.exportFailed)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {shown !== "forbidden" && (
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <Input type="search" aria-label={l.search} placeholder={l.search} value={search} onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
          {actors && (
            <Select value={filters.actor ?? "all"} onValueChange={(v) => filter({ actor: v === "all" ? undefined : v })}>
              <SelectTrigger aria-label={l.actor} className="flex-1 sm:w-40 sm:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{l.everyone}</SelectItem>
                {actors.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {kinds && (
            <Select value={filters.kind ?? "all"} onValueChange={(v) => filter({ kind: v === "all" ? undefined : v })}>
              <SelectTrigger aria-label={l.kind} className="flex-1 sm:w-40 sm:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{l.allKinds}</SelectItem>
                {kinds.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span role="status" className="text-sm text-muted-foreground tabular-nums max-sm:w-full sm:ml-auto">
            {shown === "ready" || shown === "stale" ? l.count(entries.total, formatCount(entries.total, { locale })) : ""}
          </span>
          {onExport && (
            <PermissionGate allowed={mayExport} mode="disabled" reason={l.exportDenied}>
              <Button size="sm" variant="secondary" loading={exporting} onClick={() => void runExport()}>
                <Download aria-hidden="true" />
                {l.export}
              </Button>
            </PermissionGate>
          )}
        </div>
      )}
      {exportError && (
        <p role="alert" className="text-sm text-danger">
          {exportError}
        </p>
      )}
      <DataState state={shown === "empty" ? "ready" : shown} error={error} onRetry={onRetry} labels={l.data}>
        {/* One list of columns: the action is the row's title, the time its trailing value, who, the target and the change
            the line under it on a phone; the address stays in the table. Nothing is coloured: an entry is a fact, not an alarm. */}
        <ResponsiveTable
          label={l.table}
          rows={entries.items}
          rowKey={(r) => r.id}
          columns={[
            {
              id: "time",
              header: l.columns.time,
              phone: "trailing",
              cell: (r) => <time dateTime={r.at}>{time.format(new Date(r.at))}</time>,
              className: "whitespace-nowrap text-muted-foreground tabular-nums",
            },
            { id: "who", header: l.columns.actor, cell: (r) => r.actor },
            { id: "action", header: l.columns.action, phone: "title", cell: (r) => <span className="font-medium">{r.action}</span>, phoneCell: (r) => r.action },
            { id: "target", header: l.columns.target, cell: (r) => r.target },
            {
              id: "change",
              header: l.columns.change,
              cell: (r) => (r.from ? <Change from={r.from} to={r.to} word={l.to} /> : l.none),
              phoneCell: (r) => (r.from ? <Change from={r.from} to={r.to} word={l.to} /> : undefined),
              className: "hidden text-muted-foreground lg:table-cell",
            },
            { id: "ip", header: l.columns.ip, phone: "hidden", cell: (r) => r.ip ?? l.none, className: "hidden font-mono text-xs text-muted-foreground lg:table-cell" },
          ]}
          empty={
            query.search || filters.actor || filters.kind ? (
              <EmptyState size="inline" icon={SearchX} title={l.noMatch} description={l.noMatchBody} />
            ) : (
              <EmptyState size="inline" title={l.empty} description={l.emptyBody} />
            )
          }
        />
      </DataState>
      {(shown === "ready" || shown === "stale") && entries.total > query.limit && (
        <Pagination page={query.page - 1} pageSize={query.limit} total={entries.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
      )}
    </div>
  )
}

// Sample data, newest first, in Taipei time.
const sampleEntries: AuditEntry[] = [
  { id: "a1", at: "2026-11-17T14:02:00+08:00", actor: "Mei Lin", kind: "access", action: "Changed role", target: "Kai Chen", from: "Viewer", to: "Operator", ip: "10.2.4.18" },
  { id: "a2", at: "2026-11-17T13:40:00+08:00", actor: "Kai Chen", kind: "robots", action: "Released after stop", target: "Patrol dog 9E37", ip: "10.2.4.33" },
  { id: "a3", at: "2026-11-17T13:38:00+08:00", actor: "Kai Chen", kind: "robots", action: "Emergency stop", target: "Patrol dog 9E37", ip: "10.2.4.33" },
  { id: "a4", at: "2026-11-17T11:30:00+08:00", actor: "System", kind: "robots", action: "Updated firmware", target: "Patrol dog 7F3A", from: "2.4.0", to: "2.4.1" },
  { id: "a5", at: "2026-11-17T09:15:00+08:00", actor: "Ana Ruiz", kind: "settings", action: "Edited route", target: "Perimeter", from: "11 checkpoints", to: "12 checkpoints", ip: "10.2.7.2" },
  { id: "a6", at: "2026-11-16T18:47:00+08:00", actor: "Mei Lin", kind: "access", action: "Revoked API key", target: "Old test script", ip: "10.2.4.18" },
  { id: "a7", at: "2026-11-16T08:02:00+08:00", actor: "Mei Lin", kind: "access", action: "Signed in", target: "Fleet console", ip: "10.2.4.18" },
]

/**
 * Who did what, when and from where, narrowed by person and kind, with values before and after; exports what is shown.
 * A table with search, a list on a phone. Nothing is coloured: an emergency stop is a fact here, not an alarm. This is
 * UsersAuditLogContent on sample data, in a sample shell, the sample answering as a server would.
 */
export function UsersAuditLog() {
  const [query, setQuery] = React.useState<ListQuery>({ page: 1, limit: 20 })
  const [filters, setFilters] = React.useState<AuditFilters>({})
  const q = (query.search ?? "").toLowerCase()
  const rows = sampleEntries.filter(
    (r) => (!filters.actor || r.actor === filters.actor) && (!filters.kind || r.kind === filters.kind) && (!q || `${r.action} ${r.target}`.toLowerCase().includes(q)),
  )
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#audit-log" title="Audit log" user={sampleUser}>
      <UsersAuditLogContent
        entries={{ items: rows.slice((query.page - 1) * query.limit, query.page * query.limit), total: rows.length }}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        actors={[...new Set(sampleEntries.map((r) => r.actor))].map((p) => ({ value: p, label: p }))}
        kinds={[
          { value: "access", label: "Access" },
          { value: "robots", label: "Robots" },
          { value: "settings", label: "Settings" },
        ]}
        searchDelay={0}
        timeZone="Asia/Taipei"
        onExport={async () => {}}
      />
    </AppShell>
  )
}
