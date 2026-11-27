// @syncrobotic/webhook-deliveries v0.57.0 · update: npx shadcn add @syncrobotic/webhook-deliveries --overwrite
"use client"

import * as React from "react"
import { RotateCw, Send, Webhook } from "lucide-react"
import { cn } from "@/lib/utils"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { formatAbsolute, formatDuration } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/registry/syncrobotic/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

/** succeeded: a 2xx answer. failed: no more retries. pending: waiting for its next retry. */
export type DeliveryStatus = "succeeded" | "failed" | "pending"

export type WebhookDeliveryRecord = {
  id: string
  event: string
  endpointId: string
  endpointUrl: string
  /** ISO 8601: when the last attempt was made. */
  at: string
  status: DeliveryStatus
  /** The HTTP status the endpoint answered; null when it did not answer in time. */
  httpStatus: number | null
  durationMs?: number | null
  attempt?: number
  /** ISO 8601, for a pending delivery. */
  nextRetryAt?: string | null
}

/** One delivery with what was sent and what came back, loaded when it is opened. */
export type WebhookDeliveryDetail = WebhookDeliveryRecord & {
  request: { headers?: Record<string, string>; body: string }
  response?: { headers?: Record<string, string>; body?: string | null } | null
}

export type WebhookDeliveryFilters = { status?: DeliveryStatus; event?: string; endpointId?: string }

export type WebhookDeliveriesLabels = {
  count: (total: number, formatted: string) => string
  status: string
  statuses: Record<"all" | DeliveryStatus, string>
  event: string
  allEvents: string
  endpoint: string
  allEndpoints: string
  clear: string
  table: string
  when: string
  duration: string
  noAnswer: string
  attempt: (n: number) => string
  nextRetry: (when: string) => string
  detail: string
  http: string
  request: string
  response: string
  noResponse: string
  copyRequest: string
  copyResponse: string
  redeliver: string
  redeliverHint: string
  redelivered: string
  redeliveredBody: string
  close: string
  denied: string
  empty: string
  emptyBody: string
  noMatch: string
  noMatchBody: string
  failed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultWebhookDeliveriesLabels: WebhookDeliveriesLabels = {
  count: (total, n) => `${n} ${total === 1 ? "delivery" : "deliveries"}`,
  status: "Status",
  statuses: { all: "All", failed: "Failed", pending: "Retrying", succeeded: "Delivered" },
  event: "Event",
  allEvents: "All events",
  endpoint: "Endpoint",
  allEndpoints: "All endpoints",
  clear: "Clear filters",
  table: "Deliveries",
  when: "When",
  duration: "Took",
  noAnswer: "No answer",
  attempt: (n) => `Attempt ${n}`,
  nextRetry: (when) => `Next try ${when}`,
  detail: "Delivery",
  http: "HTTP status",
  request: "Request",
  response: "Response",
  noResponse: "The endpoint did not answer in time.",
  copyRequest: "Copy the request",
  copyResponse: "Copy the response",
  redeliver: "Send again",
  redeliverHint: "Sends the same payload as a new delivery; this one stays as it was.",
  redelivered: "Sent again",
  redeliveredBody: "It is listed as a new delivery once your endpoint answers.",
  close: "Close",
  denied: "You need the webhooks:write permission. A project admin can grant it.",
  empty: "No deliveries yet",
  emptyBody: "Each event sent to one of your endpoints is listed here, with what it answered.",
  noMatch: "No delivery matches these filters",
  noMatchBody: "Change a filter or clear them.",
  failed: "That did not work. Nothing was sent; try again.",
  errors: {},
}

const statuses = ["all", "failed", "pending", "succeeded"] as const

const statusGlyph: Record<DeliveryStatus, Status> = { succeeded: "normal", failed: "danger", pending: "active" }

const host = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const headersText = (h?: Record<string, string>) => (h ? Object.entries(h).map(([k, v]) => `${k}: ${v}`).join("\n") : "")

export type WebhookDeliveriesContentProps = {
  /** One page of deliveries, filtered by the server, and its count of all that match. */
  deliveries: ListPage<WebhookDeliveryRecord>
  /** Matches per status under the other filters, from the server; a segment without one shows no count. */
  counts?: Partial<Record<"all" | DeliveryStatus, number>>
  query: ListQuery
  onQueryChange: (query: ListQuery) => void
  filters: WebhookDeliveryFilters
  /** A changed filter; the block also sends the query back to page 1. */
  onFiltersChange: (filters: WebhookDeliveryFilters) => void
  /** The event types to filter by. */
  events: readonly { value: string; label?: string }[]
  endpoints: readonly { id: string; url: string }[]
  /** The delivery open in the detail sheet. */
  selectedId?: string | null
  onSelectedChange?: (id: string | null) => void
  /** The open delivery's request and response, from your API. */
  detail?: WebhookDeliveryDetail | null
  detailState?: DataStateKind
  detailError?: DataStateError | null
  onDetailRetry?: () => void
  /** Sends the payload again as a new delivery; run it through your step-up if your API asks. */
  onRedeliver?: (delivery: WebhookDeliveryRecord) => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  locale?: string
  timeZone?: string
  labels?: Partial<WebhookDeliveriesLabels>
}

/**
 * Every delivery from your server, a page at a time: filtered by status, event and endpoint, each opened to its request
 * and response, and sent again. Only a failure is coloured; a delivery waiting to retry is the blue of something in progress.
 */
export function WebhookDeliveriesContent({
  deliveries,
  counts,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  events,
  endpoints,
  selectedId,
  onSelectedChange,
  detail,
  detailState = "ready",
  detailError,
  onDetailRetry,
  onRedeliver,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  locale,
  timeZone,
  labels,
}: WebhookDeliveriesContentProps) {
  const l = { ...defaultWebhookDeliveriesLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "webhooks:write") : true
  const [busy, setBusy] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)
  const when = (iso: string) => formatAbsolute(iso, { locale, timeZone })
  const filtered = !!(filters.status || filters.event || filters.endpointId)
  const setFilters = (next: WebhookDeliveryFilters) => {
    onFiltersChange(next)
    if (query.page !== 1) onQueryChange({ ...query, page: 1 })
  }
  const open = deliveries.items.find((d) => d.id === selectedId) ?? (detail && detail.id === selectedId ? detail : undefined)

  const redeliver = async (d: WebhookDeliveryRecord) => {
    if (!onRedeliver) return
    setBusy(true)
    setFailure(null)
    try {
      await onRedeliver(d)
      toast({ tone: "success", title: l.redelivered, description: l.redeliveredBody })
    } catch (e) {
      // A cancelled step-up sent nothing: say nothing.
      if (!isStepUpCancelled(e)) setFailure(l.errors[errorCodeOf(e) ?? ""] ?? l.failed)
    } finally {
      setBusy(false)
    }
  }

  const statusCell = (d: WebhookDeliveryRecord) => (
    <InlineStatus status={statusGlyph[d.status]}>
      {l.statuses[d.status]}
      <span className="tabular-nums">{d.httpStatus ?? l.noAnswer}</span>
    </InlineStatus>
  )

  return (
    <div data-slot="webhook-deliveries" className="flex flex-col gap-4">
      <div className={cn("flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center", state === "forbidden" && "hidden")}>
        {/* Four statuses with counts do not fit a phone's row: there the same choice is a Select. */}
        <Select value={filters.status ?? "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : (v as DeliveryStatus) })}>
          <SelectTrigger aria-label={l.status} className="sm:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {l.statuses[s]}
                {counts?.[s] !== undefined && ` (${formatCount(counts[s]!, { locale })})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SegmentedControl
          value={filters.status ?? "all"}
          onValueChange={(v) => v && setFilters({ ...filters, status: v === "all" ? undefined : (v as DeliveryStatus) })}
          aria-label={l.status}
          className="max-sm:hidden lg:w-auto"
        >
          {statuses.map((s) => (
            <SegmentedControlItem key={s} value={s}>
              {l.statuses[s]}
              {counts?.[s] !== undefined && <span className="text-muted-foreground tabular-nums">{formatCount(counts[s]!, { locale, compact: true })}</span>}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center">
          <Select value={filters.event ?? "all"} onValueChange={(v) => setFilters({ ...filters, event: v === "all" ? undefined : v })}>
            <SelectTrigger aria-label={l.event} className="lg:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{l.allEvents}</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label ?? e.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.endpointId ?? "all"} onValueChange={(v) => setFilters({ ...filters, endpointId: v === "all" ? undefined : v })}>
            <SelectTrigger aria-label={l.endpoint} className="lg:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{l.allEndpoints}</SelectItem>
              {endpoints.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {host(e.url)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setFilters({})}>
              {l.clear}
            </Button>
          )}
        </div>
      </div>

      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure}
        </p>
      )}

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">{l.count(deliveries.total, formatCount(deliveries.total, { locale }))}</p>
          <Table aria-label={l.table}>
            <TableHeader>
              <TableRow>
                <TableHead>{l.event}</TableHead>
                <TableHead className="hidden sm:table-cell">{l.status}</TableHead>
                <TableHead className="hidden md:table-cell">{l.endpoint}</TableHead>
                <TableHead className="hidden sm:table-cell">{l.when}</TableHead>
                <TableHead className="hidden lg:table-cell">{l.duration}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-auto py-4 whitespace-normal">
                    <EmptyState
                      size="inline"
                      icon={Send}
                      title={filtered ? l.noMatch : l.empty}
                      description={filtered ? l.noMatchBody : l.emptyBody}
                      action={
                        filtered ? (
                          <Button variant="secondary" size="sm" onClick={() => setFilters({})}>
                            {l.clear}
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
              {deliveries.items.map((d) => (
                <TableRow key={d.id} data-state={d.id === selectedId ? "selected" : undefined}>
                  <TableCell className="w-full max-w-0 py-2 whitespace-normal sm:w-auto">
                    <button
                      type="button"
                      data-slot="webhook-deliveries-open"
                      onClick={() => onSelectedChange?.(d.id)}
                      className="press flex max-w-full flex-col items-start rounded-xs text-left hover:underline"
                    >
                      <span className="max-w-full font-mono text-sm wrap-anywhere">{d.event}</span>
                      {/* The time names the row for screen readers at every width; from 640 px it is also its own column. */}
                      <span className="text-xs text-muted-foreground tabular-nums sm:sr-only">{when(d.at)}</span>
                    </button>
                    {/* On a phone the status sits under the event, so the event keeps the row's width. */}
                    <span className="mt-1 block sm:hidden">{statusCell(d)}</span>
                  </TableCell>
                  <TableCell className="hidden py-2 whitespace-normal sm:table-cell">
                    {statusCell(d)}
                    {d.status === "pending" && d.nextRetryAt && <span className="block text-xs text-muted-foreground">{l.nextRetry(when(d.nextRetryAt))}</span>}
                  </TableCell>
                  <TableCell className="hidden max-w-0 truncate font-mono text-xs md:table-cell">{host(d.endpointUrl)}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{when(d.at)}</TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">{d.durationMs != null ? formatDuration(d.durationMs, { locale }) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataState>
      {deliveries.total > query.limit && (
        <Pagination page={query.page - 1} pageSize={query.limit} total={deliveries.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
      )}

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && onSelectedChange?.(null)}>
        <SheetContent side="end" className="sm:max-w-lg" data-slot="webhook-deliveries-detail">
          <SheetHeader>
            <SheetTitle className="font-mono">{open?.event ?? l.detail}</SheetTitle>
            <SheetDescription>{open ? when(open.at) : l.detail}</SheetDescription>
          </SheetHeader>
          {open && (
            <DescriptionList
              variant="bare"
              columns={2}
              items={[
                { label: l.status, value: statusCell(open) },
                { label: l.when, value: when(open.at), hint: open.attempt ? l.attempt(open.attempt) : undefined },
                { label: l.endpoint, value: open.endpointUrl, mono: true, copy: true },
                { label: l.duration, value: open.durationMs != null ? formatDuration(open.durationMs, { locale }) : null },
              ]}
            />
          )}
          <DataState state={detailState} error={detailError} onRetry={onDetailRetry} labels={l.data} size="inline">
            {detail && detail.id === selectedId && (
              <div className="flex flex-col gap-4">
                <CodeBlock
                  title={l.request}
                  code={[headersText(detail.request.headers), detail.request.body].filter(Boolean).join("\n\n")}
                  wrap="words"
                  copyLabel={l.copyRequest}
                />
                {detail.response && (detail.response.body || detail.response.headers) ? (
                  <CodeBlock
                    title={l.response}
                    code={[headersText(detail.response.headers), detail.response.body ?? ""].filter(Boolean).join("\n\n")}
                    wrap="words"
                    copyLabel={l.copyResponse}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{l.noResponse}</p>
                )}
              </div>
            )}
          </DataState>
          {failure && (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          )}
          <SheetFooter>
            {open && onRedeliver && (mayWrite || denied === "disabled") && (
              <div className="flex flex-col gap-2">
                <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
                  <Button variant="secondary" loading={busy} onClick={() => void redeliver(open)}>
                    <RotateCw aria-hidden="true" />
                    {l.redeliver}
                  </Button>
                </PermissionGate>
                <p className="text-xs text-muted-foreground">{l.redeliverHint}</p>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const nav: AppNavGroup[] = [{ label: "Project", items: [{ label: "Webhooks", href: "#webhooks", icon: Webhook, items: [{ label: "Deliveries", href: "#deliveries" }] }] }]

const T = Date.parse("2026-11-27T06:00:00Z")
const iso = (minAgo: number) => new Date(T - minAgo * 60_000).toISOString()
const sampleEndpoints = [
  { id: "e1", url: "https://ops.example.com/hooks/devices" },
  { id: "e2", url: "https://alerts.example.net/syncrobotic" },
]
const sampleEvents = [{ value: "device.enrolled" }, { value: "device.offline" }, { value: "licence.issued" }, { value: "member.added" }]

export const sampleDeliveries: WebhookDeliveryRecord[] = [
  { id: "w1", event: "device.offline", endpointId: "e2", endpointUrl: sampleEndpoints[1]!.url, at: iso(3), status: "pending", httpStatus: 503, durationMs: 1204, attempt: 2, nextRetryAt: iso(-5) },
  { id: "w2", event: "device.enrolled", endpointId: "e1", endpointUrl: sampleEndpoints[0]!.url, at: iso(12), status: "succeeded", httpStatus: 200, durationMs: 142, attempt: 1 },
  { id: "w3", event: "licence.issued", endpointId: "e1", endpointUrl: sampleEndpoints[0]!.url, at: iso(48), status: "succeeded", httpStatus: 204, durationMs: 88, attempt: 1 },
  { id: "w4", event: "device.offline", endpointId: "e2", endpointUrl: sampleEndpoints[1]!.url, at: iso(95), status: "failed", httpStatus: null, durationMs: 10_000, attempt: 5 },
  { id: "w5", event: "member.added", endpointId: "e1", endpointUrl: sampleEndpoints[0]!.url, at: iso(180), status: "succeeded", httpStatus: 200, durationMs: 131, attempt: 1 },
]

const detailOf = (d: WebhookDeliveryRecord): WebhookDeliveryDetail => ({
  ...d,
  request: {
    headers: { "Content-Type": "application/json", "X-Signature": "t=1764223200,v1=5b1e8f3a…" },
    body: JSON.stringify({ id: d.id, type: d.event, created: d.at, data: { deviceId: "dev_7f3a9c21" } }, null, 2),
  },
  response: d.httpStatus === null ? null : { headers: { "Content-Type": "text/plain" }, body: d.status === "succeeded" ? "ok" : "Service Unavailable" },
})

/**
 * Every delivery of a project's webhooks, a page at a time: filtered by status, event and endpoint, each opened to its
 * request and response, and sent again. This is WebhookDeliveriesContent on sample data, in a sample shell.
 */
export function WebhookDeliveries() {
  const [query, setQuery] = React.useState<ListQuery>({ page: 1, limit: 20 })
  const [filters, setFilters] = React.useState<WebhookDeliveryFilters>({})
  const [selected, setSelected] = React.useState<string | null>(null)
  const others = (d: WebhookDeliveryRecord) => (!filters.event || d.event === filters.event) && (!filters.endpointId || d.endpointId === filters.endpointId)
  // The sample's stand-in for the server: it filters and counts what a real API would.
  const rows = sampleDeliveries.filter((d) => others(d) && (!filters.status || d.status === filters.status))
  const count = (s?: DeliveryStatus) => sampleDeliveries.filter((d) => others(d) && (!s || d.status === s)).length
  const found = sampleDeliveries.find((d) => d.id === selected)
  return (
    <AppShell product="Device console" nav={nav} current="#deliveries" title="Webhook deliveries" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <WebhookDeliveriesContent
          deliveries={{ items: rows, total: rows.length }}
          counts={{ all: count(), failed: count("failed"), pending: count("pending"), succeeded: count("succeeded") }}
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          events={sampleEvents}
          endpoints={sampleEndpoints}
          selectedId={selected}
          onSelectedChange={setSelected}
          detail={found ? detailOf(found) : null}
          onRedeliver={async () => {}}
          timeZone="Asia/Taipei"
        />
      </div>
      <Toaster />
    </AppShell>
  )
}
