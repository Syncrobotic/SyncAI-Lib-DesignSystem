// @syncrobotic/device-detail v0.56.0 · update: npx shadcn add @syncrobotic/device-detail --overwrite
"use client"

import * as React from "react"
import { Plus, Server } from "lucide-react"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { formatAbsolute, formatRelative, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card, CardHeader, CardTitle } from "@/registry/syncrobotic/ui/card"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DescriptionList, type DescriptionListLabels } from "@/registry/syncrobotic/ui/description-list"
import { DesiredState, type DesiredStateLabels } from "@/registry/syncrobotic/ui/desired-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { FreshnessStamp, freshnessOf, type FreshnessStampLabels, type FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"
import { HeartbeatStrip, type HeartbeatBucket, type HeartbeatEvent, type HeartbeatStripLabels } from "@/registry/syncrobotic/ui/heartbeat-strip"
import { Input } from "@/registry/syncrobotic/ui/input"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** What the server holds about a device: its own record, never the device's word. */
export type DeviceRecord = {
  id: string
  name: string
  instanceId?: string | null
  /** Air-gapped devices never report: quiet is their correct state. */
  connectivity: "connected" | "air-gapped"
  lifecycle: "active" | "removing" | "removed"
  /** How it got in, in words ("Registered itself with the project slug"). */
  source?: string | null
  registeredAt?: DateInput | null
  approvedAt?: DateInput | null
  /** When its last check-in arrived. */
  lastSeenAt?: DateInput | null
  /** The server's liveness verdict (`liveness === "offline"`). */
  offline?: boolean
}

/** A service the device says it runs. */
export type DeviceService = { name: string; version?: string | null; state: "running" | "degraded" | "stopped"; note?: string | null }

/** What the device said about itself at its last check-in. A field it did not send is null: "Not reported", never 0. */
export type DeviceReport = {
  version?: string | null
  health?: "ok" | "degraded" | null
  /** Why it is degraded, as the device said ("Disk 94 % full"). */
  healthNote?: string | null
  trustedKey?: string | null
  gpus?: string[] | null
  services?: DeviceService[] | null
}

/** A licence on the server's books. */
export type DeviceLicence = { id: string; modules: string; issuedAt: DateInput; expiresAt?: DateInput | null; state: "active" | "expired" | "revoked" }

/** An order travelling to the device on its next check-in (a revocation): ordered is not in effect until it reports so. */
export type DeviceOrder = {
  /** What was ordered, in words ("Revoked: every module off"). */
  desired: string
  /** What the device last reported ("Running 4 modules"). */
  reported: string
  orderedAt: DateInput
  inEffect?: boolean
  /** The server refuses its check-ins, so the order cannot arrive. */
  blocked?: boolean
  blockedReason?: string
}

export type DeviceHeartbeat = {
  buckets: HeartbeatBucket[]
  bucketMs: number
  events?: HeartbeatEvent[]
  windows?: { value: string; label: string }[]
  window?: string
  onWindowChange?: (value: string) => void
  labels?: Partial<HeartbeatStripLabels>
}

export type DeviceDetailLabels = {
  title: string
  actions: string
  connectivity: Record<DeviceRecord["connectivity"], string>
  lifecycle: Record<DeviceRecord["lifecycle"], string>
  lastCheckIn: string
  never: string
  neverCaption: string
  airGapped: string
  airGappedCaption: string
  lagging: string
  stale: string
  licence: string
  licenceState: Record<DeviceLicence["state"] | "none" | "revoking", string>
  expires: (date: string) => string
  version: string
  health: string
  healthState: Record<"ok" | "degraded", string>
  degraded: string
  /** A reported value a device did not send, or an air-gapped device cannot. */
  notReported: string
  airGappedNoReport: string
  reference: string
  instanceId: string
  connectivityLabel: string
  source: string
  registered: string
  approved: string
  claims: string
  trustedKey: string
  gpus: string
  services: string
  service: string
  serviceVersion: string
  serviceState: string
  serviceStates: Record<DeviceService["state"], string>
  servicesNone: string
  servicesNever: string
  servicesNeverBody: string
  servicesAirGapped: string
  checkIns: string
  checkInsBody: string
  checkInsAirGapped: string
  licences: string
  licencesBody: string
  issue: string
  /** Issue licence, disabled while the device is being removed. */
  issueRemoving: string
  modules: string
  issued: string
  expiresColumn: string
  licenceStateColumn: string
  noExpiry: string
  noLicences: string
  noLicencesBody: string
  revoke: string
  revokeTitle: (name: string) => string
  revokeBody: string
  revokeConfirm: string
  /** Stop the features, disabled for an air-gapped device. */
  revokeAirGapped: string
  /** Stop the features, disabled while a revocation is on its way. */
  revokeWaiting: string
  remove: string
  removeTitle: (name: string) => string
  removeBody: string
  removeConfirm: string
  cancelRemoval: string
  cancelTitle: string
  cancelBody: string
  cancelConfirm: string
  force: string
  forceTitle: (name: string) => string
  forceBody: string
  forceReason: string
  forceReasonHint: (min: number) => string
  forceConfirm: string
  keep: string
  denied: string
  failed: string
  errors: Record<string, string>
  freshness?: Partial<FreshnessStampLabels>
  desired?: Partial<DesiredStateLabels>
  list?: Partial<DescriptionListLabels>
  data?: Partial<DataStateLabels>
}

export const defaultDeviceDetailLabels: DeviceDetailLabels = {
  title: "Device",
  actions: "Device actions",
  connectivity: { connected: "Connected", "air-gapped": "Air-gapped" },
  lifecycle: { active: "Active", removing: "Removing: waiting for the device", removed: "Removed" },
  lastCheckIn: "Last check-in",
  never: "Never",
  neverCaption: "Nothing has arrived yet",
  airGapped: "Does not report",
  airGappedCaption: "Air-gapped: its correct, permanent state",
  lagging: "Later than expected",
  stale: "Not reporting: what it last said may be out of date",
  licence: "Licence",
  licenceState: { active: "Active", expired: "Expired", revoked: "Revoked", none: "None", revoking: "Revoking" },
  expires: (date) => `Expires ${date}`,
  version: "Version running",
  health: "Health",
  healthState: { ok: "OK", degraded: "Degraded" },
  degraded: "The device reports a problem",
  notReported: "Not reported",
  airGappedNoReport: "Air-gapped devices do not report",
  reference: "Reference",
  instanceId: "Instance ID",
  connectivityLabel: "Connectivity",
  source: "How it got in",
  registered: "Registered",
  approved: "Approved",
  claims: "Reported by the device",
  trustedKey: "Trusted vendor key",
  gpus: "GPUs",
  services: "Running services",
  service: "Service",
  serviceVersion: "Version",
  serviceState: "State",
  serviceStates: { running: "Running", degraded: "Degraded", stopped: "Stopped" },
  servicesNone: "The device reports no services.",
  servicesNever: "Nothing reported yet",
  servicesNeverBody: "Services show here after the device's first check-in.",
  servicesAirGapped: "An air-gapped device does not report what it runs. That is its correct state, not a fault.",
  checkIns: "Check-ins",
  checkInsBody: "When the device reported, and when it said something was wrong. A gap is a stretch nothing arrived.",
  checkInsAirGapped: "An air-gapped device never checks in. That is its correct, permanent state.",
  licences: "Licences",
  licencesBody: "What this project has signed for the device, and whether the device has it yet.",
  issue: "Issue licence",
  issueRemoving: "A device being removed cannot get a new licence. Cancel the removal first.",
  modules: "Modules",
  issued: "Issued",
  expiresColumn: "Expires",
  licenceStateColumn: "State",
  noExpiry: "Does not expire",
  noLicences: "No licence issued",
  noLicencesBody: "Issue one to open the device's features.",
  revoke: "Stop the features…",
  revokeTitle: (name) => `Stop the features on ${name}?`,
  revokeBody: "The revocation travels on the device's next check-in. Until the device reports it back, treat its modules as still running. It stays in the project and keeps its seat.",
  revokeConfirm: "Stop the features",
  revokeAirGapped: "An air-gapped device never checks in, so a revocation cannot reach it. Let its licence expire, or remove it.",
  revokeWaiting: "A revocation is already on its way. It takes effect at the device's next check-in.",
  remove: "Remove from project…",
  removeTitle: (name) => `Remove ${name} from the project?`,
  removeBody: "Its features stop at its next check-in, then it is removed and its seat is released. Until it confirms, it stays enrolled.",
  removeConfirm: "Remove device",
  cancelRemoval: "Cancel removal",
  cancelTitle: "Cancel this removal?",
  cancelBody: "The device stays in the project. Its modules stay revoked: issue a licence to open them again.",
  cancelConfirm: "Cancel removal",
  force: "Force removal…",
  forceTitle: (name) => `Force the removal of ${name}?`,
  forceBody: "This does not switch off the modules on that machine. It closes this project's books on the device: after this, even if it comes back, it cannot receive the revocation. Switching them off then needs someone at the machine.",
  forceReason: "Reason",
  forceReasonHint: (min) => `At least ${min} characters. Recorded in the audit log.`,
  forceConfirm: "Force removal",
  keep: "Keep waiting",
  denied: "You need the devices:write permission. A project admin can grant it.",
  failed: "That did not work. Nothing was changed; try again.",
  errors: {},
}

export type DeviceDetailContentProps = {
  device: DeviceRecord
  /** The device's last report; null when nothing has arrived. */
  report?: DeviceReport | null
  /** The server's liveness thresholds, never a number of the interface's own. */
  thresholds: FreshnessThresholds
  heartbeat?: DeviceHeartbeat
  /** Newest first. */
  licences?: DeviceLicence[]
  /** A revocation on its way, with what the device last reported. */
  order?: DeviceOrder | null
  /** Past this long since it was ordered, the wait is overdue. */
  overdueAfterMs?: number
  /** Opens your flow for signing a licence. */
  onIssueLicence?: () => void
  onRevoke?: (device: DeviceRecord) => Promise<void>
  onRemove?: (device: DeviceRecord) => Promise<void>
  onCancelRemoval?: (device: DeviceRecord) => Promise<void>
  /** Closes the books without the device: run it through your step-up. */
  onForceRemove?: (device: DeviceRecord, reason: string) => Promise<void>
  /** The shortest reason the server takes for a forced removal. */
  forceReasonMinLength?: number
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  /** 1 when this is the page's own header; 2 under a shell that holds the h1. */
  headingLevel?: 1 | 2
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<DeviceDetailLabels>
}

type Confirm = "revoke" | "remove" | "cancel" | "force"

const serviceStatus: Record<DeviceService["state"], Status> = { running: "normal", degraded: "warning", stopped: "danger" }
const lifecycleStatus: Record<DeviceRecord["lifecycle"], Status> = { active: "normal", removing: "active", removed: "offline" }

/**
 * One device: what the server knows first (its record, the licences it signed), then what the device claims (version,
 * health, services), each claim with how old it is. Check-ins full width, licences with what is ordered beside what is in
 * effect, and the rare, destructive actions in a menu.
 */
export function DeviceDetailContent({
  device,
  report = null,
  thresholds,
  heartbeat,
  licences = [],
  order,
  overdueAfterMs,
  onIssueLicence,
  onRevoke,
  onRemove,
  onCancelRemoval,
  onForceRemove,
  forceReasonMinLength = 8,
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
}: DeviceDetailContentProps) {
  const l = { ...defaultDeviceDetailLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "devices:write") : true
  const clock = useNow(nowProp === undefined ? 30_000 : null)
  const now = nowProp ?? clock
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)
  const [reason, setReason] = React.useState("")
  const airGapped = device.connectivity === "air-gapped"
  const level = (n: number) => `h${Math.min(headingLevel + n, 4)}` as "h2" | "h3" | "h4"
  const exact = (t: DateInput | null | undefined) => (toTime(t) === null ? null : formatAbsolute(t as DateInput, { locale, timeZone }))
  const freshness = now === null ? null : freshnessOf(device.lastSeenAt, thresholds, { now, airGapped, offline: device.offline })
  const stamp = (props?: { variant?: "text" | "icon"; hideWhenLive?: boolean }) => (
    <FreshnessStamp
      lastAt={device.lastSeenAt}
      thresholds={thresholds}
      airGapped={airGapped}
      offline={device.offline}
      now={now ?? undefined}
      locale={locale}
      timeZone={timeZone}
      labels={l.freshness}
      {...props}
    />
  )
  const reported = !airGapped && !!report
  const latest = licences[0]
  const revoking = !!order && !order.inEffect

  const open = (c: Confirm) => {
    setFailure(null)
    setReason("")
    setConfirm(c)
  }
  const run = async (fn: () => Promise<void>) => {
    setFailure(null)
    setBusy(true)
    try {
      await fn()
      setConfirm(null)
    } catch (e) {
      // A cancelled step-up never ran the action: the dialog stays as it was, with nothing to say.
      if (!isStepUpCancelled(e)) setFailure(l.errors[errorCodeOf(e) ?? ""] ?? l.failed)
    } finally {
      setBusy(false)
    }
  }

  const item = (key: Confirm, label: string, opts: { destructive?: boolean; reason?: string }) => {
    const node = (
      <DropdownMenuItem destructive={opts.destructive} onSelect={() => open(key)}>
        {label}
      </DropdownMenuItem>
    )
    const why = !mayWrite ? l.denied : opts.reason
    return why ? (
      // A menu item styles only Radix's own disabled; this one stays focusable to say why, so it takes the ink here.
      <PermissionGate key={key} allowed={false} mode="disabled" reason={why} className="text-disabled">
        {node}
      </PermissionGate>
    ) : (
      <React.Fragment key={key}>{node}</React.Fragment>
    )
  }
  const menuItems = [
    onRevoke && device.lifecycle === "active" && item("revoke", l.revoke, { reason: airGapped ? l.revokeAirGapped : revoking ? l.revokeWaiting : undefined }),
    onCancelRemoval && device.lifecycle === "removing" && item("cancel", l.cancelRemoval, {}),
    onRemove && device.lifecycle === "active" && item("remove", l.remove, { destructive: true }),
    onForceRemove && device.lifecycle === "removing" && item("force", l.force, { destructive: true }),
  ].filter(Boolean)
  const menu = menuItems.length > 0 && (mayWrite || denied === "disabled") && (
    <DropdownMenu modal={false}>
      <DropdownMenuMoreTrigger aria-label={l.actions} />
      <DropdownMenuContent align="end">
        {menuItems.map((m, i) => (
          <React.Fragment key={i}>
            {/* The destructive end sits after a separator, as in every row menu. */}
            {i > 0 && i === menuItems.length - 1 && <DropdownMenuSeparator />}
            {m}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const header = (
    <PageHeader
      as={headingLevel === 1 ? "h1" : "h2"}
      className="pb-0"
      title={device.name || l.title}
      status={<InlineStatus status={lifecycleStatus[device.lifecycle]}>{l.lifecycle[device.lifecycle]}</InlineStatus>}
      badges={<Badge tone="outline">{l.connectivity[device.connectivity]}</Badge>}
      actions={state === "ready" || state === "stale" ? menu || undefined : undefined}
    />
  )

  if (state !== "ready" && state !== "stale")
    return (
      <div data-slot="device-detail" className="flex w-full flex-col gap-6">
        {header}
        <DataState state={state} error={error} onRetry={onRetry} labels={l.data} />
      </div>
    )

  // Portal's own record first: when it last heard, and the licence it signed.
  const checkIn = airGapped
    ? { value: l.airGapped, caption: l.airGappedCaption }
    : toTime(device.lastSeenAt) === null
      ? { value: l.never, caption: l.neverCaption }
      : {
          value: now === null ? "" : formatRelative(device.lastSeenAt as DateInput, { now, locale, minUnit: "minute", future: "clamp" }),
          caption: freshness === "stale" ? l.stale : freshness === "lagging" ? l.lagging : exact(device.lastSeenAt),
          tone: freshness === "stale" ? ("danger" as const) : freshness === "lagging" ? ("warning" as const) : undefined,
        }
  const licenceValue = revoking ? l.licenceState.revoking : latest ? l.licenceState[latest.state] : l.licenceState.none
  const reportedLabel = (text: string) => (
    <span className="flex items-center gap-2">
      {text}
      {stamp({ variant: "icon", hideWhenLive: true })}
    </span>
  )
  const notReported = airGapped ? l.airGappedNoReport : l.notReported

  return (
    <div data-slot="device-detail" className="flex w-full flex-col gap-6">
      {header}

      <DataState state={state} error={error} onRetry={onRetry} labels={l.data}>
        <div className="flex flex-col gap-6">
          <MetricGrid>
            <MetricCard label={l.lastCheckIn} value={checkIn.value} caption={checkIn.caption} tone={"tone" in checkIn ? checkIn.tone : undefined} />
            <MetricCard
              label={l.licence}
              value={licenceValue}
              caption={latest?.state === "active" && !revoking ? (latest.expiresAt ? l.expires(exact(latest.expiresAt) ?? "") : l.noExpiry) : undefined}
            />
            <MetricCard
              label={reportedLabel(l.version)}
              value={reported && report?.version ? <span className="font-mono">{report.version}</span> : undefined}
              unavailable={reported && report?.version ? undefined : notReported}
              caption={l.claims}
            />
            <MetricCard
              label={reportedLabel(l.health)}
              value={reported && report?.health ? l.healthState[report.health] : undefined}
              unavailable={reported && report?.health ? undefined : notReported}
              tone={reported && report?.health === "degraded" ? "warning" : undefined}
              caption={reported && report?.health === "degraded" ? (report.healthNote ?? l.degraded) : l.claims}
            />
          </MetricGrid>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle as={level(1)}>{l.reference}</CardTitle>
              </CardHeader>
              <DescriptionList
                variant="bare"
                columns={1}
                labels={l.list}
                items={[
                  { label: l.instanceId, value: device.instanceId, mono: true, copy: true },
                  { label: l.connectivityLabel, value: l.connectivity[device.connectivity] },
                  { label: l.source, value: device.source },
                  { label: l.registered, value: exact(device.registeredAt) },
                  { label: l.approved, value: exact(device.approvedAt) },
                ]}
              />
              {!airGapped && (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {React.createElement(level(2), { className: "text-sm font-medium" }, l.claims)}
                    {stamp()}
                  </div>
                  <DescriptionList
                    variant="bare"
                    columns={1}
                    labels={{ ...l.list, notSet: l.notReported }}
                    items={[
                      { label: l.version, value: report?.version, mono: true },
                      { label: l.trustedKey, value: report?.trustedKey, mono: true, copy: true },
                      {
                        label: l.gpus,
                        value: report?.gpus?.length ? (
                          <span className="flex flex-col gap-1">
                            {report.gpus.map((g) => (
                              <span key={g}>{g}</span>
                            ))}
                          </span>
                        ) : report?.gpus ? (
                          formatCount(0, { locale })
                        ) : null,
                        mono: true,
                      },
                    ]}
                  />
                </div>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle as={level(1)}>{l.services}</CardTitle>
                {reported && stamp()}
              </CardHeader>
              {airGapped ? (
                <EmptyState size="inline" title={l.airGapped} description={l.servicesAirGapped} />
              ) : !report ? (
                <EmptyState size="inline" title={l.servicesNever} description={l.servicesNeverBody} />
              ) : !report.services?.length ? (
                <p className="text-sm text-muted-foreground">{report.services ? l.servicesNone : l.notReported}</p>
              ) : (
                <Table bare aria-label={l.services}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{l.service}</TableHead>
                      <TableHead className="hidden sm:table-cell">{l.serviceVersion}</TableHead>
                      <TableHead>{l.serviceState}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.services.map((s) => (
                      <TableRow key={s.name}>
                        <TableCell className="whitespace-normal">
                          <span className="font-medium">{s.name}</span>
                          {s.version && <span className="block font-mono text-xs text-muted-foreground sm:hidden">{s.version}</span>}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs sm:table-cell">{s.version ?? <span className="font-sans text-muted-foreground">{l.notReported}</span>}</TableCell>
                        <TableCell className="whitespace-normal">
                          <InlineStatus status={serviceStatus[s.state]}>{l.serviceStates[s.state]}</InlineStatus>
                          {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          <section aria-labelledby="device-detail-check-ins" className="flex flex-col gap-3">
            <SectionHeader id="device-detail-check-ins" as={level(1)} title={l.checkIns} description={airGapped ? undefined : l.checkInsBody} />
            <Card>
              {airGapped ? (
                <EmptyState size="inline" title={l.airGapped} description={l.checkInsAirGapped} />
              ) : heartbeat ? (
                <HeartbeatStrip {...heartbeat} locale={locale} timeZone={timeZone} />
              ) : (
                <EmptyState size="inline" title={l.servicesNever} />
              )}
            </Card>
          </section>

          <section aria-labelledby="device-detail-licences" className="flex flex-col gap-3">
            <SectionHeader
              id="device-detail-licences"
              as={level(1)}
              title={l.licences}
              count={licences.length || undefined}
              locale={locale}
              description={l.licencesBody}
              actions={
                onIssueLicence &&
                (mayWrite || denied === "disabled") && (
                  <PermissionGate allowed={mayWrite && device.lifecycle === "active"} mode="disabled" reason={mayWrite ? l.issueRemoving : l.denied}>
                    <Button variant="secondary" size="sm" onClick={onIssueLicence}>
                      <Plus aria-hidden="true" />
                      {l.issue}
                    </Button>
                  </PermissionGate>
                )
              }
            />
            {order && (
              <DesiredState
                desired={order.desired}
                reported={order.reported}
                orderedAt={order.orderedAt}
                inEffect={order.inEffect}
                blocked={order.blocked}
                blockedReason={order.blockedReason}
                overdueAfterMs={overdueAfterMs}
                lastCheckInAt={device.lastSeenAt}
                thresholds={thresholds}
                offline={device.offline}
                airGapped={airGapped}
                now={now ?? undefined}
                locale={locale}
                timeZone={timeZone}
                labels={l.desired}
                headingAs={level(2)}
              />
            )}
            <Card>
              {licences.length === 0 ? (
                <EmptyState size="inline" title={l.noLicences} description={l.noLicencesBody} />
              ) : (
                <Table bare aria-label={l.licences}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{l.modules}</TableHead>
                      <TableHead className="hidden md:table-cell">{l.issued}</TableHead>
                      <TableHead className="hidden sm:table-cell">{l.expiresColumn}</TableHead>
                      <TableHead>{l.licenceStateColumn}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licences.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell className="whitespace-normal">{x.modules}</TableCell>
                        <TableCell className="hidden tabular-nums md:table-cell">{exact(x.issuedAt)}</TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">{x.expiresAt ? exact(x.expiresAt) : l.noExpiry}</TableCell>
                        <TableCell>
                          {/* The server's books, grey in every state: whether the device has it is the order's to say. */}
                          <InlineStatus status={x.state === "active" ? "normal" : "offline"}>{l.licenceState[x.state]}</InlineStatus>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </section>
        </div>
      </DataState>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "revoke"
                ? l.revokeTitle(device.name)
                : confirm === "remove"
                  ? l.removeTitle(device.name)
                  : confirm === "force"
                    ? l.forceTitle(device.name)
                    : l.cancelTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "revoke" ? l.revokeBody : confirm === "remove" ? l.removeBody : confirm === "force" ? l.forceBody : l.cancelBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm === "force" && (
            <Field label={l.forceReason} hint={l.forceReasonHint(forceReasonMinLength)}>
              <Input value={reason} autoComplete="off" maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
          {failure && (
            <p role="alert" className="text-sm text-danger">
              {failure}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{l.keep}</AlertDialogCancel>
            <Button
              variant={confirm === "cancel" ? "primary" : "destructive"}
              loading={busy}
              disabled={confirm === "force" && reason.trim().length < forceReasonMinLength}
              onClick={() => {
                const c = confirm
                if (c === "revoke" && onRevoke) void run(() => onRevoke(device))
                else if (c === "remove" && onRemove) void run(() => onRemove(device))
                else if (c === "cancel" && onCancelRemoval) void run(() => onCancelRemoval(device))
                else if (c === "force" && onForceRemove) void run(() => onForceRemove(device, reason.trim()))
              }}
            >
              {confirm === "revoke" ? l.revokeConfirm : confirm === "remove" ? l.removeConfirm : confirm === "force" ? l.forceConfirm : l.cancelConfirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Sample ----------

const sampleNowAt = Date.parse("2026-11-21T14:00:00Z")
const HOUR = 3_600_000

export const sampleDevice: DeviceRecord = {
  id: "d1",
  name: "Taipei DC-01",
  instanceId: "inst_7f3a9c21e4b0",
  connectivity: "connected",
  lifecycle: "active",
  source: "Registered itself with the project slug",
  registeredAt: new Date(sampleNowAt - 41 * 24 * HOUR).toISOString(),
  approvedAt: new Date(sampleNowAt - 41 * 24 * HOUR + 2 * HOUR).toISOString(),
  lastSeenAt: new Date(sampleNowAt - 40_000).toISOString(),
}

export const sampleDeviceReport: DeviceReport = {
  version: "2.4.1",
  health: "degraded",
  healthNote: "Disk 94 % full",
  trustedKey: "kid_vendor_2026a",
  gpus: ["GPU-5b1e8f3a-21c4", "GPU-9d02a7c6-4e18"],
  services: [
    { name: "Inference", version: "2.4.1", state: "running" },
    { name: "Vision pipeline", version: "1.9.0", state: "running" },
    { name: "Model store", version: "1.2.3", state: "degraded", note: "Disk 94 % full" },
    { name: "Local dashboard", version: "2.4.1", state: "running" },
  ],
}

// A day in hours: steady, an hour with some missed, a two-hour gap around a restart, and the disk filling at the end.
const sampleBuckets: HeartbeatBucket[] = Array.from({ length: 24 }, (_, i) => {
  const at = new Date(sampleNowAt - (24 - i) * HOUR).toISOString()
  if (i === 9 || i === 10) return { at, beats: 0, expected: 60 }
  if (i === 11) return { at, beats: 41, expected: 60 }
  if (i >= 21) return { at, beats: 60, expected: 60, level: "warning" as const, note: "Disk 94 % full" }
  return { at, beats: 60, expected: 60 }
})

export const sampleDeviceLicences: DeviceLicence[] = [
  { id: "l2", modules: "Vision, Speech, Search, Agents", issuedAt: new Date(sampleNowAt - 12 * 24 * HOUR).toISOString(), expiresAt: "2027-11-20T00:00:00Z", state: "active" },
  { id: "l1", modules: "Vision, Search", issuedAt: new Date(sampleNowAt - 41 * 24 * HOUR).toISOString(), expiresAt: "2026-12-31T00:00:00Z", state: "revoked" },
]

const sampleOrder: DeviceOrder = {
  desired: "Revoked: every module off",
  reported: `Running ${formatCount(4)} modules`,
  orderedAt: new Date(sampleNowAt - 4 * 60_000).toISOString(),
}

const nav: AppNavGroup[] = [{ items: [{ label: "Devices", href: "#devices", icon: Server, items: [{ label: "Enrolment", href: "#enrolment" }] }] }]

/**
 * One device: what the server knows first, then what the device claims with how old it is, check-ins full width,
 * licences with ordered beside in effect, and lifecycle actions in a menu. This is DeviceDetailContent on sample data.
 */
export function DeviceDetail() {
  const [device, setDevice] = React.useState(sampleDevice)
  const [order, setOrder] = React.useState<DeviceOrder | null>(sampleOrder)
  const [range, setRange] = React.useState("24h")
  return (
    <AppShell product="Device console" nav={nav} current="#devices" title="Devices" user={sampleUser}>
      <DeviceDetailContent
        headingLevel={2}
        device={device}
        report={sampleDeviceReport}
        thresholds={{ laggingAfterMs: 2 * 60_000, staleAfterMs: 10 * 60_000 }}
        heartbeat={{
          buckets: sampleBuckets,
          bucketMs: HOUR,
          events: [{ at: new Date(sampleNowAt - 13.5 * HOUR).toISOString(), label: "Restarted, 2.4.0 → 2.4.1" }],
          windows: [
            { value: "24h", label: "24 h" },
            { value: "7d", label: "7 d" },
            { value: "30d", label: "30 d" },
          ],
          window: range,
          onWindowChange: setRange,
        }}
        licences={sampleDeviceLicences}
        order={order}
        overdueAfterMs={15 * 60_000}
        now={sampleNowAt}
        timeZone="Asia/Taipei"
        onIssueLicence={() => {}}
        onRevoke={async () => setOrder({ ...sampleOrder, orderedAt: new Date(sampleNowAt).toISOString() })}
        onRemove={async (d) => setDevice({ ...d, lifecycle: "removing" })}
        onCancelRemoval={async (d) => setDevice({ ...d, lifecycle: "active" })}
        onForceRemove={async (d) => setDevice({ ...d, lifecycle: "removed" })}
      />
    </AppShell>
  )
}
