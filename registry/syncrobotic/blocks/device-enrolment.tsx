// @syncrobotic/device-enrolment v0.56.0 · update: npx shadcn add @syncrobotic/device-enrolment --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, Check, CircleAlert, Server, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { formatAbsolute, formatDuration, formatRelative, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { EvidencePanel, type EvidencePanelLabels, type EvidenceRow } from "@/registry/syncrobotic/ui/evidence-panel"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

/**
 * One machine in the queue. `pending`: it reached out on its own and waits for a decision. `awaiting-claim`: a place an
 * operator made here, waiting for its machine to claim it; there is nothing to decide yet.
 */
export type EnrolmentRequest = {
  id: string
  state: "pending" | "awaiting-claim"
  /** The name the machine gave itself: shown as its claim, never as its name here. */
  claimedName?: string | null
  /** The id the machine presented; none while a place waits for its machine. */
  instanceId?: string | null
  /** When it first reached out, or when the place was made. */
  firstSeenAt?: DateInput | null
  /** The address Portal saw it come from. Can be spoofed. */
  sourceIp?: string | null
  /** What the machine said about itself, beside what the record expects (EvidencePanel rows). */
  evidence?: EvidenceRow[]
  /** Licensed modules the machine is still running (one that came back for review): a count, or "all". */
  heldModules?: number | "all"
  /** The name an operator gave a place made here. */
  name?: string | null
  /** When the place's join code stops working. */
  claimExpiresAt?: DateInput | null
}

export type EnrolmentFilter = "all" | "pending" | "awaiting-claim"

export type DeviceEnrolmentLabels = {
  title: string
  description: string
  /** The line under the header, from the server's count of pending requests. */
  waiting: (count: number, formatted: string) => string
  filter: string
  filters: Record<EnrolmentFilter, string>
  queue: string
  pending: string
  awaitingClaim: string
  firstSeen: (ago: string) => string
  placeMade: (ago: string) => string
  unnamed: string
  back: string
  routes: string
  routesTitle: string
  routesBody: string
  connected: string
  connectedBody: string
  slug: string
  airGapped: string
  airGappedBody: string
  registerOffline: string
  /** Where the offline button would be, for a viewer who may not create devices. */
  registerOfflineDenied: string
  reviewTitle: string
  reviewWarning: string
  instanceId: string
  claimedName: string
  claimedNameHint: string
  sourceIp: string
  sourceIpHint: string
  /** Under the evidence heading: where and when it came from. */
  evidenceMeta: (source: string | null, firstSeen: string) => string
  holdsModules: (count: number) => string
  holdsAll: string
  name: string
  nameHint: string
  approve: string
  reject: string
  rejectTitle: string
  /** `cooldown` is the server's wait, written as a duration ("7 days"). */
  rejectBody: (cooldown: string) => string
  goBack: string
  approved: (name: string) => string
  rejected: (name: string) => string
  /** Approve and Reject, disabled for a viewer without the write permission. */
  denied: string
  /** Approve, disabled when the project has no seat left. */
  noSeats: string
  claimTitle: string
  claimBody: string
  claimName: string
  claimExpires: string
  nothingSelected: string
  nothingSelectedBody: string
  empty: string
  emptyBody: string
  noMatch: string
  noMatchBody: string
  failed: string
  failedBody: string
  errors: Record<string, string>
  dismiss: string
  pageEmpty: string
  evidence?: Partial<EvidencePanelLabels>
  data?: Partial<DataStateLabels>
}

export const defaultDeviceEnrolmentLabels: DeviceEnrolmentLabels = {
  title: "Enrolment",
  description: "Machines that reached out to this project on their own. A machine asked; you decide.",
  waiting: (count, n) => (count === 1 ? `${n} machine is waiting for a decision.` : `${n} machines are waiting for a decision.`),
  filter: "Show",
  filters: { all: "All", pending: "To review", "awaiting-claim": "Unclaimed" },
  queue: "Enrolment queue",
  pending: "Awaiting review",
  awaitingClaim: "Awaiting the machine",
  firstSeen: (ago) => `First seen ${ago}`,
  placeMade: (ago) => `Place made ${ago}`,
  unnamed: "No name given",
  back: "Back to the queue",
  routes: "How a device gets in",
  routesTitle: "How a device gets in",
  routesBody: "One question decides it: can the machine reach this project over a network?",
  connected: "It has a network",
  connectedBody: "Put this slug in the device's configuration. It registers itself on boot and appears here, waiting for your decision.",
  slug: "Project slug",
  airGapped: "It has no network (air-gapped)",
  airGappedBody: "An air-gapped machine never registers itself. Create it here from the machine code it prints, sign a licence, and carry the file to it.",
  registerOffline: "Register an offline device",
  registerOfflineDenied: "Ask a project admin to register it: you need the devices:write permission.",
  reviewTitle: "Review this registration",
  reviewWarning: "It registered with this project's slug, which is public, so an entry here proves nothing. Until you approve it, it holds no seat and nothing it reports is kept.",
  instanceId: "Instance ID",
  claimedName: "Name it gave itself",
  claimedNameHint: "Chosen by the machine, not its name here.",
  sourceIp: "Source address",
  sourceIpHint: "As the server saw it. Can be spoofed.",
  evidenceMeta: (source, firstSeen) => [source && `From ${source}`, firstSeen && `first seen ${firstSeen}`].filter(Boolean).join(" · "),
  holdsModules: (count) =>
    `This device is still running ${count === 1 ? "1 licensed module" : `${count} licensed modules`}. Its check-ins are refused while it waits here, so neither approving nor rejecting reaches it.`,
  holdsAll: "This device is still running an all-access licence. Its check-ins are refused while it waits here, so neither approving nor rejecting reaches it.",
  name: "Name it before approving",
  nameHint: "Yours, not the machine's: the fleet list shows this name.",
  approve: "Approve",
  reject: "Reject",
  rejectTitle: "Reject this registration?",
  rejectBody: (cooldown) => `The machine is told nothing: its check-ins keep failing as if it did not exist. It cannot ask again for ${cooldown}.`,
  goBack: "Go back",
  approved: (name) => `${name} approved`,
  rejected: (name) => `${name} rejected`,
  denied: "You need the devices:write permission. A project admin can grant it.",
  noSeats: "Every seat in this project is taken. Remove a device or raise the quota, then approve.",
  claimTitle: "Waiting for its machine",
  claimBody: "Nothing has claimed this place yet. When the machine claims it with its join code, it moves to Awaiting review.",
  claimName: "Name",
  claimExpires: "Join code expires",
  nothingSelected: "Nothing selected",
  nothingSelectedBody: "Choose a machine in the queue to review it.",
  empty: "No machine is waiting",
  emptyBody: "A machine that reaches out to this project shows up here for a decision.",
  noMatch: "Nothing in this state",
  noMatchBody: "Show all to see the rest of the queue.",
  failed: "That did not work",
  failedBody: "Nothing was changed. Try again.",
  errors: {},
  dismiss: "Dismiss",
  pageEmpty: "0 machines",
}

export type DeviceEnrolmentContentProps = {
  /** One page of the queue and the server's count of all that match. Never counted here. */
  requests: ListPage<EnrolmentRequest>
  query?: ListQuery
  onQueryChange?: (query: ListQuery) => void
  filter?: EnrolmentFilter
  onFilterChange?: (filter: EnrolmentFilter) => void
  /** Each segment's count, from the server's summary; `pending` also words the line under the header. */
  counts?: Partial<Record<EnrolmentFilter, number>>
  /** The request under review; uncontrolled from `defaultSelectedId` when omitted. */
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelectedChange?: (id: string | null) => void
  /** The project's public slug, copied for the connected route. */
  slug?: string
  /** Opens your flow for an air-gapped machine (from its machine code). */
  onRegisterOffline?: () => void
  /** How long a rejected machine must wait before it may ask again, from the server, in ms. */
  rejectCooldownMs: number
  /** Seats the project has left; 0 disables Approve with the reason. */
  seatsLeft?: number
  /** The longest name the server takes. */
  nameMaxLength?: number
  onApprove: (request: EnrolmentRequest, decision: { name?: string }) => Promise<void>
  onReject: (request: EnrolmentRequest) => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  /** Your permission check; without it every action is allowed. */
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  /** What a viewer without the write permission sees: the actions `disabled` with the reason (default), or `hidden`. */
  denied?: "disabled" | "hidden"
  /** 1 when this is the page's own header; 2 under a shell that holds the h1. */
  headingLevel?: 1 | 2
  /** ms since the epoch, for ages; the clock once the page has hydrated when omitted. */
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<DeviceEnrolmentLabels>
}

const h = (level: number) => `h${Math.min(level, 4)}` as "h2" | "h3" | "h4"

/**
 * The queue of machines that enrolled themselves and the review of one: what it claims beside what is on record, a name
 * you give it, then approve or reject. A machine reached out; a person only decides.
 */
export function DeviceEnrolmentContent({
  requests,
  query,
  onQueryChange,
  filter = "all",
  onFilterChange,
  counts,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelectedChange,
  slug,
  onRegisterOffline,
  rejectCooldownMs,
  seatsLeft,
  nameMaxLength = 80,
  onApprove,
  onReject,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  headingLevel = 1,
  now: nowProp,
  locale,
  timeZone,
  labels,
}: DeviceEnrolmentContentProps) {
  const l = { ...defaultDeviceEnrolmentLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "devices:write") : true
  const clock = useNow(nowProp === undefined ? 30_000 : null)
  const now = nowProp ?? clock
  const [innerSelected, setInnerSelected] = React.useState(defaultSelectedId)
  const selectedId = selectedProp === undefined ? innerSelected : selectedProp
  const select = (id: string | null) => {
    setInnerSelected(id)
    onSelectedChange?.(id)
  }
  const [announced, setAnnounced] = React.useState("")
  const selected = requests.items.find((r) => r.id === selectedId) ?? null
  const ago = (t: DateInput | null | undefined) => (now === null || toTime(t) === null ? "" : formatRelative(t as DateInput, { now, locale, minUnit: "minute", future: "clamp" }))
  const exact = (t: DateInput | null | undefined) => (toTime(t) === null ? "" : formatAbsolute(t as DateInput, { locale, timeZone }))
  const nameOf = (r: EnrolmentRequest) => r.name || r.claimedName || r.instanceId || l.unnamed
  const count = (f: EnrolmentFilter) => (counts?.[f] === undefined ? "" : ` ${formatCount(counts[f], { locale })}`)
  const pendingCount = counts?.pending
  const ready = state === "ready" || state === "stale"

  const routes = (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">{l.routes}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{l.routesTitle}</DialogTitle>
          <DialogDescription>{l.routesBody}</DialogDescription>
        </DialogHeader>
        <Routes l={l} slug={slug} onRegisterOffline={onRegisterOffline} mayWrite={mayWrite} denied={denied} stacked />
      </DialogContent>
    </Dialog>
  )

  return (
    <div data-slot="device-enrolment" className="flex w-full flex-col gap-6">
      <PageHeader
        as={headingLevel === 1 ? "h1" : "h2"}
        className="pb-0"
        title={l.title}
        description={
          <>
            {l.description}
            {ready && pendingCount !== undefined && <span className="block pt-1 text-sm">{l.waiting(pendingCount, formatCount(pendingCount, { locale }))}</span>}
          </>
        }
        actions={state !== "forbidden" ? routes : undefined}
      />

      {state !== "forbidden" && (
        <SegmentedControl
          value={filter}
          onValueChange={(v) => {
            onFilterChange?.(v as EnrolmentFilter)
            if (query && onQueryChange && query.page !== 1) onQueryChange({ ...query, page: 1 })
          }}
          aria-label={l.filter}
          className="w-full sm:w-auto sm:self-start"
        >
          {(["all", "pending", "awaiting-claim"] as const).map((f) => (
            <SegmentedControlItem key={f} value={f}>
              {l.filters[f]}
              {count(f)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}

      <p role="status" className="sr-only">
        {announced}
      </p>

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        {requests.total === 0 && filter === "all" ? (
          <div className="flex flex-col gap-4">
            <EmptyState icon={Server} title={l.empty} description={l.emptyBody} />
            <Routes l={l} slug={slug} onRegisterOffline={onRegisterOffline} mayWrite={mayWrite} denied={denied} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className={cn("flex min-w-0 flex-col gap-4 lg:col-span-2", selected && "max-lg:hidden")}>
              {requests.items.length === 0 ? (
                <EmptyState
                  size="inline"
                  title={l.noMatch}
                  description={l.noMatchBody}
                  action={
                    <Button variant="secondary" size="sm" onClick={() => onFilterChange?.("all")}>
                      {l.filters.all}
                    </Button>
                  }
                />
              ) : (
                <ul aria-label={l.queue} className="flex flex-col gap-2">
                  {requests.items.map((r) => {
                    const current = r.id === selected?.id
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          data-slot="device-enrolment-request"
                          aria-current={current || undefined}
                          onClick={() => select(r.id)}
                          className={cn(
                            "press flex min-h-(--h-lg) w-full flex-col items-start gap-1 rounded-md bg-card p-3 text-left ring-1 ring-border transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            current && "ring-2 ring-foreground",
                          )}
                        >
                          <span className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <span className="min-w-0 truncate font-medium">{nameOf(r)}</span>
                            {/* A state, not a category: words, no badge. Waiting is not a fault, so no colour. */}
                            <span className={cn("text-xs", r.state === "pending" ? "font-medium" : "text-muted-foreground")}>
                              {r.state === "pending" ? l.pending : l.awaitingClaim}
                            </span>
                          </span>
                          {r.instanceId && <span className="max-w-full truncate font-mono text-xs text-muted-foreground">{r.instanceId}</span>}
                          {r.firstSeenAt && now !== null && (
                            <time dateTime={new Date(toTime(r.firstSeenAt) ?? 0).toISOString()} className="text-xs text-muted-foreground">
                              {(r.state === "pending" ? l.firstSeen : l.placeMade)(ago(r.firstSeenAt))}
                            </time>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              {query && onQueryChange && (
                <Pagination
                  page={query.page - 1}
                  pageSize={query.limit}
                  total={requests.total}
                  onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })}
                  labels={{ empty: l.pageEmpty }}
                  locale={locale}
                />
              )}
            </div>

            <div className={cn("flex min-w-0 flex-col gap-3 lg:col-span-3", !selected && "max-lg:hidden")}>
              {selected && (
                <Button variant="ghost" size="sm" className="self-start lg:hidden" onClick={() => select(null)}>
                  <ArrowLeft aria-hidden="true" />
                  {l.back}
                </Button>
              )}
              {!selected ? (
                <EmptyState size="panel" title={l.nothingSelected} description={l.nothingSelectedBody} className="rounded-md ring-1 ring-border" />
              ) : selected.state === "awaiting-claim" ? (
                <section aria-labelledby="device-enrolment-claim" className="flex flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
                  <header className="flex flex-col gap-1">
                    {React.createElement(h(headingLevel + 1), { id: "device-enrolment-claim", className: "text-base font-bold" }, l.claimTitle)}
                    <p className="text-sm text-muted-foreground">{l.claimBody}</p>
                  </header>
                  <DescriptionList
                    variant="bare"
                    columns={2}
                    items={[
                      { label: l.claimName, value: selected.name },
                      { label: l.claimExpires, value: exact(selected.claimExpiresAt) },
                    ]}
                  />
                  {selected.evidence && selected.evidence.length > 0 && <EvidencePanel rows={selected.evidence} labels={l.evidence} headingAs={h(headingLevel + 2)} />}
                </section>
              ) : (
                <Review
                  key={selected.id}
                  request={selected}
                  l={l}
                  level={headingLevel}
                  mayWrite={mayWrite}
                  denied={denied}
                  seatsLeft={seatsLeft}
                  nameMaxLength={nameMaxLength}
                  cooldown={formatDuration(rejectCooldownMs, { locale })}
                  firstSeen={[ago(selected.firstSeenAt), exact(selected.firstSeenAt) && `(${exact(selected.firstSeenAt)})`].filter(Boolean).join(" ")}
                  onApprove={onApprove}
                  onReject={onReject}
                  onDecided={(said) => {
                    setAnnounced(said)
                    select(null)
                  }}
                />
              )}
            </div>
          </div>
        )}
      </DataState>
    </div>
  )
}

function Routes({
  l,
  slug,
  onRegisterOffline,
  mayWrite,
  denied,
  stacked = false,
}: {
  l: DeviceEnrolmentLabels
  slug?: string
  onRegisterOffline?: () => void
  mayWrite: boolean
  denied: "disabled" | "hidden"
  /** One above the other, in a dialog too narrow for two. */
  stacked?: boolean
}) {
  // Two answers to one question, as equals: alternatives, not steps, so nothing is numbered.
  return (
    <div className={cn("grid gap-3", !stacked && "sm:grid-cols-2")}>
      <section aria-label={l.connected} className="flex flex-col gap-2 rounded-md p-4 ring-1 ring-border">
        <p className="text-sm font-medium">{l.connected}</p>
        <p className="text-sm text-muted-foreground">{l.connectedBody}</p>
        {slug && (
          <p className="flex items-center gap-2">
            <span className="sr-only">{l.slug}: </span>
            <code className="min-w-0 font-mono text-sm break-all">{slug}</code>
            <CopyButton value={slug} label={`${l.slug}`} className="-my-2 shrink-0" />
          </p>
        )}
      </section>
      <section aria-label={l.airGapped} className="flex flex-col gap-2 rounded-md p-4 ring-1 ring-border">
        <p className="text-sm font-medium">{l.airGapped}</p>
        <p className="text-sm text-muted-foreground">{l.airGappedBody}</p>
        {onRegisterOffline &&
          (mayWrite ? (
            <Button variant="secondary" size="sm" className="self-start" onClick={onRegisterOffline}>
              {l.registerOffline}
            </Button>
          ) : (
            denied === "disabled" && <p className="text-xs text-muted-foreground">{l.registerOfflineDenied}</p>
          ))}
      </section>
    </div>
  )
}

function Review({
  request,
  l,
  level,
  mayWrite,
  denied,
  seatsLeft,
  nameMaxLength,
  cooldown,
  firstSeen,
  onApprove,
  onReject,
  onDecided,
}: {
  request: EnrolmentRequest
  l: DeviceEnrolmentLabels
  level: number
  mayWrite: boolean
  denied: "disabled" | "hidden"
  seatsLeft?: number
  nameMaxLength: number
  cooldown: string
  firstSeen: string
  onApprove: DeviceEnrolmentContentProps["onApprove"]
  onReject: DeviceEnrolmentContentProps["onReject"]
  /** After a decision lands: what to announce. */
  onDecided: (said: string) => void
}) {
  const [name, setName] = React.useState("")
  const [confirming, setConfirming] = React.useState(false)
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null)
  const [failure, setFailure] = React.useState<string | null>(null)
  const headingId = React.useId()
  const noSeats = seatsLeft !== undefined && seatsLeft <= 0
  const shown = name.trim() || request.claimedName || request.instanceId || l.unnamed

  const decide = async (kind: "approve" | "reject") => {
    setFailure(null)
    setBusy(kind)
    try {
      if (kind === "approve") await onApprove(request, { name: name.trim() || undefined })
      else await onReject(request)
      onDecided(kind === "approve" ? l.approved(shown) : l.rejected(shown))
    } catch (e) {
      // A cancelled step-up never ran the action: nothing to say, everything stays as it was.
      if (!isStepUpCancelled(e)) setFailure(l.errors[errorCodeOf(e) ?? ""] ?? l.failedBody)
    } finally {
      setBusy(null)
    }
  }

  const held = request.heldModules === "all" ? l.holdsAll : request.heldModules ? l.holdsModules(request.heldModules) : null
  const heldAlert = held && (
    <Alert tone="warning">
      <TriangleAlert aria-hidden="true" />
      <AlertDescription>{held}</AlertDescription>
    </Alert>
  )
  const gate = (node: React.ReactElement, extra?: string) =>
    !mayWrite ? (
      <PermissionGate allowed={false} mode={denied} reason={l.denied}>
        {node}
      </PermissionGate>
    ) : extra ? (
      <PermissionGate allowed={false} mode="disabled" reason={extra}>
        {node}
      </PermissionGate>
    ) : (
      node
    )

  return (
    <section data-slot="device-enrolment-review" aria-labelledby={headingId} className="flex flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
      <header className="flex flex-col gap-1">
        {React.createElement(h(level + 1), { id: headingId, className: "text-base font-bold" }, confirming ? l.rejectTitle : l.reviewTitle)}
        <p className="text-sm text-muted-foreground">{confirming ? l.rejectBody(cooldown) : l.reviewWarning}</p>
      </header>

      {confirming ? (
        <>
          {/* The evidence is gone from this face, so the machine is named again; held modules are repeated here, where the
              belief that rejecting switches them off is strongest. */}
          <p className="text-sm font-medium">{shown}</p>
          {heldAlert}
        </>
      ) : (
        <>
          {heldAlert}
          <DescriptionList
            variant="bare"
            columns={2}
            items={[
              { label: l.instanceId, value: request.instanceId, mono: true, copy: true },
              { label: l.claimedName, value: request.claimedName, hint: l.claimedNameHint },
              { label: l.sourceIp, value: request.sourceIp, mono: true, hint: l.sourceIpHint },
            ]}
          />
          {request.evidence && request.evidence.length > 0 && (
            <EvidencePanel rows={request.evidence} meta={l.evidenceMeta(request.sourceIp ?? null, firstSeen)} labels={l.evidence} headingAs={h(level + 2)} />
          )}
          <Field label={l.name} hint={l.nameHint}>
            <Input
              value={name}
              maxLength={nameMaxLength}
              placeholder={request.claimedName ?? undefined}
              autoComplete="off"
              disabled={!mayWrite}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </>
      )}

      {failure && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{l.failed}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{failure}</span>
            <Button variant="ghost" size="sm" onClick={() => setFailure(null)}>
              {l.dismiss}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(mayWrite || denied === "disabled") && (
        <div className="flex flex-wrap justify-end gap-2">
          {confirming ? (
            <>
              <Button variant="secondary" disabled={!!busy} onClick={() => setConfirming(false)}>
                {l.goBack}
              </Button>
              <Button variant="destructive" loading={busy === "reject"} onClick={() => void decide("reject")}>
                <X aria-hidden="true" />
                {l.reject}
              </Button>
            </>
          ) : (
            <>
              {gate(
                <Button variant="destructive" disabled={!!busy} onClick={() => setConfirming(true)}>
                  <X aria-hidden="true" />
                  {l.reject}
                </Button>,
              )}
              {gate(
                <Button loading={busy === "approve"} onClick={() => void decide("approve")}>
                  <Check aria-hidden="true" />
                  {l.approve}
                </Button>,
                noSeats ? l.noSeats : undefined,
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

// ---------- Sample ----------

const sampleNowAt = Date.parse("2026-11-21T14:00:00Z")
const minutes = (n: number) => new Date(sampleNowAt - n * 60_000).toISOString()

export const sampleEnrolmentRequests: EnrolmentRequest[] = [
  {
    id: "r1",
    state: "pending",
    claimedName: "lm-edge-taipei-02",
    instanceId: "inst_7f3a9c21e4b0",
    firstSeenAt: minutes(12),
    sourceIp: "203.0.113.24",
    evidence: [
      { id: "fingerprint", label: "Identity key hash", reported: "SHA256:9c21e4b07f3a…d81e", mono: true, copy: true, hint: "Check it against what the device prints on its own console." },
      { id: "product", label: "Product UUID", reported: "4c4c4544-0052-3610-8048-b4c04f4a3732", expected: "4c4c4544-0052-3610-8048-b4c04f4a3732", mono: true },
      {
        id: "gpus",
        label: "GPU UUIDs",
        reported: ["GPU-5b1e8f3a-21c4", "GPU-9d02a7c6-4e18"],
        expected: ["GPU-5b1e8f3a-21c4", "GPU-0f7e3b91-7a2d"],
        mono: true,
      },
      { id: "version", label: "Device version", reported: "2.4.1", mono: true },
    ],
  },
  {
    id: "r2",
    state: "pending",
    claimedName: "localmind-node",
    instanceId: "inst_2b81d0e6f9c4",
    firstSeenAt: minutes(95),
    sourceIp: "198.51.100.7",
    heldModules: 4,
    evidence: [
      { id: "fingerprint", label: "Identity key hash", reported: "SHA256:2b81d0e6f9c4…07aa", mono: true, copy: true },
      { id: "version", label: "Device version", reported: "2.3.0", mono: true },
    ],
  },
  { id: "r3", state: "pending", claimedName: null, instanceId: "inst_e04c5a7b3d19", firstSeenAt: minutes(60 * 26), sourceIp: null },
  { id: "r4", state: "awaiting-claim", name: "Kaohsiung DC-03", firstSeenAt: minutes(60 * 30), claimExpiresAt: new Date(sampleNowAt + 5 * 86_400_000).toISOString() },
]

/** A device console's navigation, for the sample shell. */
export const deviceNav: AppNavGroup[] = [
  {
    items: [
      { label: "Devices", href: "#devices", icon: Server, items: [{ label: "Enrolment", href: "#enrolment" }] },
    ],
  },
]

/**
 * The queue of machines that enrolled themselves and the review of one: its claims beside the record, a name you give it,
 * then approve or reject. This is DeviceEnrolmentContent on sample data, in a sample shell.
 */
export function DeviceEnrolment() {
  const [items, setItems] = React.useState(sampleEnrolmentRequests)
  const [filter, setFilter] = React.useState<EnrolmentFilter>("all")
  const [query, setQuery] = React.useState<ListQuery>({ page: 1, limit: 4 })
  const shown = items.filter((r) => filter === "all" || r.state === filter)
  const decide = async (r: EnrolmentRequest) => setItems((all) => all.filter((x) => x.id !== r.id))
  return (
    <AppShell product="Device console" nav={deviceNav} current="#enrolment" title="Devices" user={sampleUser}>
      <DeviceEnrolmentContent
        headingLevel={2}
        requests={{ items: shown, total: shown.length }}
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        counts={{ all: items.length, pending: items.filter((r) => r.state === "pending").length, "awaiting-claim": items.filter((r) => r.state === "awaiting-claim").length }}
        defaultSelectedId="r1"
        slug="acme-factory-tpe"
        onRegisterOffline={() => {}}
        rejectCooldownMs={7 * 86_400_000}
        seatsLeft={3}
        now={sampleNowAt}
        timeZone="Asia/Taipei"
        onApprove={decide}
        onReject={decide}
      />
    </AppShell>
  )
}
