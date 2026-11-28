// @syncrobotic/platform-health v0.58.0 · update: npx shadcn add @syncrobotic/platform-health --overwrite
"use client"

import * as React from "react"
import { Activity, Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount, formatNumber } from "@/registry/syncrobotic/lib/format-number"
import { formatDuration, formatRelative, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusGlyph, glyphText, type GlyphStatus } from "@/registry/syncrobotic/shell/status-glyph"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { FreshnessStamp, freshnessOf, type FreshnessStampLabels, type FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** A background worker process. `alive` is the server's verdict; the heartbeat's age is shown beside it. */
export type PlatformWorker = {
  id: string
  name: string
  alive: boolean
  lastHeartbeatAt?: DateInput | null
  startedAt?: DateInput | null
  /** Where it runs, in words ("pid 4321 on api-2"). */
  detail?: string | null
}

/** A job queue's counts, from the server. */
export type PlatformQueue = {
  name: string
  /** Jobs not yet running: waiting and delayed. */
  depth: number
  /** Jobs that used up their retries. */
  failed: number
  /** When the oldest job still waiting was added; null when none waits. */
  oldestJobAt?: DateInput | null
  /** Reachable but not taking jobs, because someone paused it. */
  paused?: boolean
}

/** A scheduled (cron) job. `overdue` is the server's verdict: past its own interval without a run. */
export type PlatformScheduledJob = {
  name: string
  /** When it runs, as the server writes it: "Every 5 minutes", or a cron expression. */
  schedule: string
  lastRunAt?: DateInput | null
  nextRunAt?: DateInput | null
  lastResult?: "succeeded" | "failed" | "running" | null
  overdue?: boolean
  /** Why the last run failed, as the server says it. */
  lastError?: string | null
}

/** Email sent in the server's window (`emailWindow`). */
export type PlatformEmailDelivery = { sent: number; bounced: number; failed: number }

export type PlatformDatabase = {
  /** Bytes on disk, and the volume's size when the server knows it. */
  storage?: { usedBytes: number; capacityBytes?: number | null } | null
  /** Each replica's lag behind the primary in ms; null when it does not answer. */
  replicas?: readonly { name: string; lagMs: number | null }[] | null
  /** Tables split by time range. `partitioned: false` is waiting for its migration, which is expected, not a fault. */
  partitions?: readonly { table: string; count: number; sizeBytes?: number | null; newest?: string | null; partitioned?: boolean }[] | null
}

/** The server's limits, never numbers of the interface's own. Without one, that value is shown without a verdict. */
export type PlatformHealthThresholds = {
  heartbeat: FreshnessThresholds
  /** Past this age, the oldest waiting job means the queue is stuck. */
  queueStuckAfterMs?: number
  replicationLagAfterMs?: number
  /** The share of capacity, 0 to 1, past which storage needs someone. */
  storageAfter?: number
}

export type PlatformHealthSection = "workers" | "queues" | "jobs" | "email" | "database"
export type PlatformHealthSectionState = { state: DataStateKind; error?: DataStateError | null }

export type PlatformHealthLabels = {
  summary: string
  workers: string
  workersBody: string
  workersAlive: (alive: string, total: string) => string
  workersDown: (n: number, formatted: string) => string
  allAlive: string
  noneReporting: string
  worker: string
  status: string
  heartbeat: string
  upSince: string
  alive: string
  down: string
  late: string
  noWorkers: string
  queues: string
  queuesBody: string
  queue: string
  waiting: string
  oldest: string
  failedJobs: string
  queued: string
  failedCount: (n: number, formatted: string) => string
  noneFailed: string
  healthy: string
  paused: string
  stuck: (age: string) => string
  noQueues: string
  actions: string
  queueActions: (queue: string) => string
  retryFailed: string
  retryNone: string
  retried: (queue: string) => string
  pause: string
  resume: string
  resumed: (queue: string) => string
  pauseTitle: (queue: string) => string
  pauseBody: string
  pauseConfirm: string
  pausedNow: (queue: string) => string
  keep: string
  jobs: string
  jobsBody: string
  job: string
  lastRun: string
  nextRun: string
  neverRun: string
  results: Record<"succeeded" | "failed" | "running", string>
  overdue: string
  overdueCount: (n: number, formatted: string) => string
  allOnTime: string
  noJobs: string
  email: string
  emailBody: (window: string) => string
  emailWindow: string
  sent: string
  emailSent: string
  bounced: string
  emailFailed: string
  emailFailedCount: (n: number, formatted: string) => string
  database: string
  databaseBody: string
  storage: string
  storageOf: (used: string, capacity: string) => string
  storageHigh: string
  replicas: string
  replicaLag: (name: string, lag: string) => string
  replicaDown: (name: string) => string
  noReplicas: string
  partitions: string
  table: string
  partitionCount: string
  size: string
  newest: string
  notPartitioned: string
  notReported: string
  denied: string
  failed: string
  errors: Record<string, string>
  freshness?: Partial<FreshnessStampLabels>
  data?: Partial<DataStateLabels>
}

export const defaultPlatformHealthLabels: PlatformHealthLabels = {
  summary: "Summary",
  workers: "Workers",
  workersBody: "The processes that run background jobs. A worker without a heartbeat takes none.",
  workersAlive: (a, t) => `${a} of ${t}`,
  workersDown: (n, f) => `${f} ${n === 1 ? "worker" : "workers"} down`,
  allAlive: "All alive",
  noneReporting: "None reporting",
  worker: "Worker",
  status: "Status",
  heartbeat: "Last heartbeat",
  upSince: "Up since",
  alive: "Alive",
  down: "Down",
  late: "Heartbeat late",
  noWorkers: "No worker has reported. Background jobs wait until one starts.",
  queues: "Job queues",
  queuesBody: "Jobs waiting in each queue, the oldest one's age, and those that used up their retries.",
  queue: "Queue",
  waiting: "Waiting",
  oldest: "Oldest waiting",
  failedJobs: "Failed",
  queued: "Jobs waiting",
  failedCount: (_n, f) => `${f} failed`,
  noneFailed: "None failed",
  healthy: "Healthy",
  paused: "Paused",
  stuck: (age) => `Stuck: oldest waiting ${age}`,
  noQueues: "No queues.",
  actions: "Actions",
  queueActions: (q) => `Actions for ${q}`,
  retryFailed: "Retry failed jobs",
  retryNone: "No failed jobs to retry.",
  retried: (q) => `Failed jobs in ${q} are queued again.`,
  pause: "Pause queue…",
  resume: "Resume queue",
  resumed: (q) => `${q} takes jobs again.`,
  pauseTitle: (q) => `Pause ${q}?`,
  pauseBody: "New jobs keep arriving and wait. Nothing in this queue runs until someone resumes it.",
  pauseConfirm: "Pause queue",
  pausedNow: (q) => `${q} is paused.`,
  keep: "Keep running",
  jobs: "Scheduled jobs",
  jobsBody: "Jobs that run on a schedule, with their last result and next run.",
  job: "Job",
  lastRun: "Last run",
  nextRun: "Next run",
  neverRun: "Not run yet",
  results: { succeeded: "Succeeded", failed: "Failed", running: "Running" },
  overdue: "Overdue",
  overdueCount: (n, f) => `${f} need${n === 1 ? "s" : ""} attention`,
  allOnTime: "All on time",
  noJobs: "No scheduled jobs.",
  email: "Email delivery",
  emailBody: (w) => `Email the platform sent in the ${w.toLowerCase()}.`,
  emailWindow: "Last 24 hours",
  sent: "Sent",
  emailSent: "Email sent",
  bounced: "Bounced",
  emailFailed: "Failed",
  emailFailedCount: (_n, f) => `${f} failed`,
  database: "Database",
  databaseBody: "Storage, replication and the tables split by time range.",
  storage: "Storage",
  storageOf: (u, c) => `${u} of ${c}`,
  storageHigh: "Nearly full",
  replicas: "Replication",
  replicaLag: (name, lag) => `${name}: ${lag} behind`,
  replicaDown: (name) => `${name}: not answering`,
  noReplicas: "No replicas",
  partitions: "Partitions",
  table: "Table",
  partitionCount: "Partitions",
  size: "Size",
  newest: "Newest",
  notPartitioned: "Not partitioned yet",
  notReported: "Not reported",
  denied: "You need the system:write permission.",
  failed: "That did not work. Nothing was changed; try again.",
  errors: {},
  freshness: {
    live: (ago) => `Heartbeat ${ago}`,
    lagging: (ago) => `Last heartbeat ${ago}`,
    stale: (ago) => `No heartbeat since ${ago}`,
    never: "No heartbeat yet",
    at: (absolute) => `Last heartbeat at ${absolute}`,
  },
}

/** A worker's state: down (the server's verdict, or a stale heartbeat), late (lagging), or alive. */
export function workerStatus(w: PlatformWorker, thresholds: FreshnessThresholds, now: number): "alive" | "late" | "down" {
  if (!w.alive) return "down"
  const f = freshnessOf(w.lastHeartbeatAt, thresholds, { now })
  return f === "stale" || f === "never" ? "down" : f === "lagging" ? "late" : "alive"
}

/** A queue's state: failed jobs and a stuck oldest job need someone; paused is someone's choice (its jobs wait), so it is grey. */
export function queueStatus(q: PlatformQueue, stuckAfterMs: number | undefined, now: number): "failed" | "stuck" | "paused" | "healthy" {
  if (q.failed > 0) return "failed"
  if (q.paused) return "paused"
  const oldest = toTime(q.oldestJobAt)
  if (stuckAfterMs !== undefined && oldest !== null && q.depth > 0 && now - oldest >= stuckAfterMs) return "stuck"
  return "healthy"
}

/** A scheduled job's state: its last run failed, it is overdue, running, never run, or fine. */
export function jobStatus(j: PlatformScheduledJob): "failed" | "overdue" | "running" | "never" | "ok" {
  if (j.lastResult === "failed") return "failed"
  if (j.overdue) return "overdue"
  if (j.lastResult === "running") return "running"
  return toTime(j.lastRunAt) === null ? "never" : "ok"
}

// Calm states are grey; colour, with its shape, is for what needs someone.
function Mark({ status, calm = false, children }: { status: GlyphStatus; calm?: boolean; children: React.ReactNode }) {
  return (
    <span data-slot="platform-health-status" className={cn("inline-flex items-center gap-2 text-sm", calm ? "text-muted-foreground" : glyphText[status])}>
      <StatusGlyph status={status} className={calm ? "text-muted-foreground" : undefined} />
      {children}
    </span>
  )
}

// Replication lag is usually under a second, which formatDuration would round to 0.
const lag = (ms: number, locale?: string) => (ms < 1000 ? formatNumber(ms, { locale, style: "unit", unit: "millisecond", unitDisplay: "short" }) : formatDuration(ms, { locale }))

const bytes = (n: number, locale?: string) => {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"]
  let i = 0
  let v = n
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i += 1
  }
  return formatNumber(v, { locale, style: "unit", unit: units[i], unitDisplay: "short", maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 })
}

export type PlatformHealthContentProps = {
  workers?: readonly PlatformWorker[]
  queues?: readonly PlatformQueue[]
  jobs?: readonly PlatformScheduledJob[]
  email?: PlatformEmailDelivery | null
  /** The window the email counts cover, in words; the server's ("Last 24 hours"). */
  emailWindow?: string
  database?: PlatformDatabase | null
  thresholds: PlatformHealthThresholds
  /** Each section loads on its own: its state and error, `ready` when not given. */
  states?: Partial<Record<PlatformHealthSection, PlatformHealthSectionState>>
  onRetry?: (section: PlatformHealthSection) => void
  /** Queues the queue's failed jobs again; run it through your step-up if your API asks. */
  onRetryFailed?: (queue: PlatformQueue) => Promise<void>
  /** Pauses (true) or resumes (false) a queue. */
  onPauseQueue?: (queue: PlatformQueue, paused: boolean) => Promise<void>
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  /** The level of the section headings: 2 under the page's h1 (the default), 3 under a section of its own. */
  headingLevel?: 2 | 3
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<PlatformHealthLabels>
}

/**
 * The platform's own health from your server: workers and their heartbeats, job queues (depth, oldest job, failed),
 * scheduled jobs, email delivery and the database, each section with its own data state, and the actions an operator
 * takes (retry failed jobs, pause a queue). Healthy is grey; colour, with a shape and words, marks what needs someone.
 */
export function PlatformHealthContent({
  workers = [],
  queues = [],
  jobs = [],
  email,
  emailWindow,
  database,
  thresholds,
  states,
  onRetry,
  onRetryFailed,
  onPauseQueue,
  can,
  permissions,
  denied = "disabled",
  headingLevel = 2,
  now: nowProp,
  locale,
  timeZone,
  labels,
}: PlatformHealthContentProps) {
  const l = { ...defaultPlatformHealthLabels, ...labels }
  const freshness = { ...defaultPlatformHealthLabels.freshness, ...labels?.freshness }
  const mayWrite = can ? can(permissions?.write ?? "system:write") : true
  const clock = useNow(nowProp === undefined ? 30_000 : null)
  const now = nowProp ?? clock
  const [busy, setBusy] = React.useState<string | null>(null)
  const [pausing, setPausing] = React.useState<PlatformQueue | null>(null)
  const [notice, setNotice] = React.useState<{ text: string; error: boolean } | null>(null)
  const n = (x: number) => formatCount(x, { locale })
  const heading = `h${headingLevel}` as "h2" | "h3"
  const stateOf = (s: PlatformHealthSection) => states?.[s] ?? { state: "ready" as const }
  const ready = (s: PlatformHealthSection) => ["ready", "stale"].includes(stateOf(s).state)
  const windowText = emailWindow ?? l.emailWindow

  const run = async (key: string, fn: () => Promise<void>, done: string) => {
    setBusy(key)
    setNotice(null)
    try {
      await fn()
      setNotice({ text: done, error: false })
      return true
    } catch (e) {
      // A cancelled step-up ran nothing: say nothing.
      if (!isStepUpCancelled(e)) setNotice({ text: l.errors[errorCodeOf(e) ?? ""] ?? l.failed, error: true })
      return false
    } finally {
      setBusy(null)
    }
  }

  // The summary reads the lists the server sent; until the clock is read, worker ages are left out.
  const at = now ?? 0
  const workerStates = workers.map((w) => (now === null ? (w.alive ? "alive" : "down") : workerStatus(w, thresholds.heartbeat, at)))
  const down = workerStates.filter((s) => s === "down").length
  const depth = queues.reduce((sum, q) => sum + q.depth, 0)
  const failedJobs = queues.reduce((sum, q) => sum + q.failed, 0)
  const attention = jobs.filter((j) => ["failed", "overdue"].includes(jobStatus(j))).length
  const metric = (s: PlatformHealthSection) => ({ loading: stateOf(s).state === "loading", unavailable: ready(s) || stateOf(s).state === "loading" ? undefined : l.notReported })

  const section = (id: PlatformHealthSection, title: string, body: string, children: React.ReactNode) => (
    <section aria-labelledby={`platform-health-${id}`} data-slot={`platform-health-${id}`} className="flex flex-col gap-3">
      <SectionHeader id={`platform-health-${id}`} as={heading} title={title} description={body} />
      <Card className="gap-0">
        <DataState state={stateOf(id).state} error={stateOf(id).error} onRetry={onRetry ? () => onRetry(id) : undefined} labels={l.data} size="inline">
          {children}
        </DataState>
      </Card>
    </section>
  )

  const queueMenu = (q: PlatformQueue) => {
    if (!(onRetryFailed || onPauseQueue) || !(mayWrite || denied === "disabled")) return null
    const gate = (reason: string | undefined, item: React.ReactNode) =>
      reason ? (
        // A menu item styles only Radix's own disabled; this one stays focusable to say why, so it takes the ink here.
        <PermissionGate allowed={false} mode="disabled" reason={reason} className="text-disabled">
          {item}
        </PermissionGate>
      ) : (
        item
      )
    const retry =
      onRetryFailed &&
      gate(
        !mayWrite ? l.denied : q.failed === 0 ? l.retryNone : undefined,
        <DropdownMenuItem onSelect={() => void run(`${q.name}:retry`, () => onRetryFailed(q), l.retried(q.name))}>{l.retryFailed}</DropdownMenuItem>,
      )
    return (
      <DropdownMenu>
        <DropdownMenuMoreTrigger aria-label={l.queueActions(q.name)} size="icon-sm" disabled={busy !== null && busy.startsWith(`${q.name}:`)} />
        <DropdownMenuContent align="end">
          {/* With nothing to retry, Pause comes first: the menu opens on an action that works. */}
          {q.failed > 0 && retry}
          {onPauseQueue &&
            gate(
              !mayWrite ? l.denied : undefined,
              <DropdownMenuItem
                onSelect={() => (q.paused ? void run(`${q.name}:pause`, () => onPauseQueue(q, false), l.resumed(q.name)) : setPausing(q))}
              >
                {q.paused ? l.resume : l.pause}
              </DropdownMenuItem>,
            )}
          {q.failed === 0 && retry}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const queueMark = (q: PlatformQueue) => {
    const s = queueStatus(q, thresholds.queueStuckAfterMs, at)
    const oldest = toTime(q.oldestJobAt)
    if (s === "failed") return <Mark status="warning">{l.failedCount(q.failed, n(q.failed))}</Mark>
    if (s === "stuck") return <Mark status="warning">{l.stuck(formatDuration(at - (oldest ?? at), { locale }))}</Mark>
    if (s === "paused") return <Mark status="offline" calm>{l.paused}</Mark>
    return <Mark status="normal" calm>{l.healthy}</Mark>
  }

  const jobMark = (j: PlatformScheduledJob) => {
    const s = jobStatus(j)
    if (s === "failed") return <Mark status="danger">{l.results.failed}</Mark>
    if (s === "overdue") return <Mark status="warning">{l.overdue}</Mark>
    if (s === "running") return <Mark status="active" calm>{l.results.running}</Mark>
    if (s === "never") return <Mark status="none" calm>{l.neverRun}</Mark>
    return <Mark status="normal" calm>{l.results.succeeded}</Mark>
  }

  const relative = (t: DateInput | null | undefined) =>
    now === null || toTime(t) === null ? null : formatRelative(t as DateInput, { now, locale, minUnit: "minute" })

  const storage = database?.storage
  const storageShare = storage?.capacityBytes ? storage.usedBytes / storage.capacityBytes : null
  const storageHigh = storageShare !== null && thresholds.storageAfter !== undefined && storageShare >= thresholds.storageAfter
  const replicas = database?.replicas ?? []

  return (
    <div data-slot="platform-health" className="flex w-full flex-col gap-6">
      <section aria-label={l.summary}>
        <MetricGrid>
          <MetricCard
            label={l.workers}
            {...metric("workers")}
            value={ready("workers") ? l.workersAlive(n(workers.length - down), n(workers.length)) : undefined}
            caption={ready("workers") ? (workers.length === 0 ? l.noneReporting : down > 0 ? l.workersDown(down, n(down)) : l.allAlive) : undefined}
            tone={ready("workers") && (down > 0 || workers.length === 0) ? "danger" : undefined}
          />
          <MetricCard
            label={l.queued}
            {...metric("queues")}
            value={ready("queues") ? n(depth) : undefined}
            caption={ready("queues") ? (failedJobs > 0 ? l.failedCount(failedJobs, n(failedJobs)) : l.noneFailed) : undefined}
            tone={ready("queues") && failedJobs > 0 ? "warning" : undefined}
          />
          <MetricCard
            label={l.jobs}
            {...metric("jobs")}
            value={ready("jobs") ? n(jobs.length) : undefined}
            caption={ready("jobs") ? (attention > 0 ? l.overdueCount(attention, n(attention)) : l.allOnTime) : undefined}
            tone={ready("jobs") && attention > 0 ? "warning" : undefined}
          />
          <MetricCard
            label={l.emailSent}
            {...metric("email")}
            value={ready("email") && email ? n(email.sent) : undefined}
            unavailable={ready("email") && !email ? l.notReported : metric("email").unavailable}
            caption={ready("email") && email ? (email.failed > 0 ? l.emailFailedCount(email.failed, n(email.failed)) : windowText) : undefined}
            tone={ready("email") && email && email.failed > 0 ? "warning" : undefined}
          />
        </MetricGrid>
      </section>

      {notice && (
        <p role={notice.error ? "alert" : "status"} className={cn("text-sm", notice.error ? "text-danger" : "text-muted-foreground")}>
          {notice.text}
        </p>
      )}

      {section(
        "workers",
        l.workers,
        l.workersBody,
        workers.length === 0 ? (
          <EmptyState size="inline" title={l.noWorkers} />
        ) : (
          <Table bare aria-label={l.workers}>
            <TableHeader>
              <TableRow>
                <TableHead>{l.worker}</TableHead>
                <TableHead>{l.status}</TableHead>
                <TableHead className="hidden sm:table-cell">{l.heartbeat}</TableHead>
                <TableHead className="hidden md:table-cell">{l.upSince}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell className="w-full max-w-0 whitespace-normal sm:w-auto sm:max-w-none">
                    <span className="block truncate font-medium">{w.name}</span>
                    {w.detail && <span className="block text-xs text-muted-foreground">{w.detail}</span>}
                    {/* On a phone the heartbeat sits under the name, where it has the row's width to wrap in. */}
                    <span className="mt-1 block sm:hidden">
                      <FreshnessStamp
                        lastAt={w.lastHeartbeatAt}
                        thresholds={thresholds.heartbeat}
                        offline={!w.alive}
                        now={now ?? undefined}
                        locale={locale}
                        timeZone={timeZone}
                        labels={freshness}
                        className="whitespace-normal"
                      />
                    </span>
                  </TableCell>
                  <TableCell className="align-top sm:align-middle">
                    {workerStates[i] === "down" ? (
                      <Mark status="danger">{l.down}</Mark>
                    ) : workerStates[i] === "late" ? (
                      <Mark status="warning">{l.late}</Mark>
                    ) : (
                      <Mark status="normal" calm>
                        {l.alive}
                      </Mark>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <FreshnessStamp lastAt={w.lastHeartbeatAt} thresholds={thresholds.heartbeat} offline={!w.alive} now={now ?? undefined} locale={locale} timeZone={timeZone} labels={freshness} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{relative(w.startedAt) ?? <span className="text-muted-foreground">{l.notReported}</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
      )}

      {section(
        "queues",
        l.queues,
        l.queuesBody,
        queues.length === 0 ? (
          <EmptyState size="inline" title={l.noQueues} />
        ) : (
          <Table bare aria-label={l.queues}>
            <TableHeader>
              <TableRow>
                <TableHead>{l.queue}</TableHead>
                <TableHead className="text-right">{l.waiting}</TableHead>
                <TableHead className="hidden sm:table-cell">{l.oldest}</TableHead>
                <TableHead className="hidden text-right md:table-cell">{l.failedJobs}</TableHead>
                <TableHead className="hidden lg:table-cell">{l.status}</TableHead>
                <TableHead className="w-0 pr-2 pl-0 sm:px-4">
                  <span className="sr-only">{l.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((q) => {
                const oldest = toTime(q.oldestJobAt)
                return (
                  <TableRow key={q.name}>
                    <TableCell className="w-full max-w-0 whitespace-normal lg:w-auto lg:max-w-none">
                      <span className="block font-mono text-sm wrap-anywhere">{q.name}</span>
                      {/* Below 1024 px the state sits under the name, so the counts keep their columns. */}
                      <span className="mt-1 block lg:hidden">{queueMark(q)}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{n(q.depth)}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">{oldest === null || now === null ? "—" : formatDuration(now - oldest, { locale })}</TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">{n(q.failed)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{queueMark(q)}</TableCell>
                    <TableActionsCell>{queueMenu(q)}</TableActionsCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ),
      )}

      {section(
        "jobs",
        l.jobs,
        l.jobsBody,
        jobs.length === 0 ? (
          <EmptyState size="inline" title={l.noJobs} />
        ) : (
          <Table bare aria-label={l.jobs}>
            <TableHeader>
              <TableRow>
                <TableHead>{l.job}</TableHead>
                <TableHead>{l.lastRun}</TableHead>
                <TableHead className="hidden md:table-cell">{l.nextRun}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.name}>
                  <TableCell className="w-full max-w-0 whitespace-normal md:w-auto md:max-w-none">
                    <span className="block font-mono text-sm wrap-anywhere">{j.name}</span>
                    <span className="block text-xs text-muted-foreground">{j.schedule}</span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {jobMark(j)}
                    {relative(j.lastRunAt) && <span className="block text-xs text-muted-foreground tabular-nums">{relative(j.lastRunAt)}</span>}
                    {j.lastResult === "failed" && j.lastError && <span className="block text-xs text-muted-foreground">{j.lastError}</span>}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{relative(j.nextRunAt) ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {section(
          "email",
          l.email,
          l.emailBody(windowText),
          email ? (
            <DescriptionList
              variant="bare"
              columns={3}
              items={[
                { label: l.sent, value: n(email.sent) },
                { label: l.bounced, value: n(email.bounced) },
                {
                  label: l.emailFailed,
                  value: email.failed > 0 ? <Mark status="warning">{n(email.failed)}</Mark> : n(email.failed),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{l.notReported}</p>
          ),
        )}

        {section(
          "database",
          l.database,
          l.databaseBody,
          database ? (
            <div className="flex flex-col gap-4">
              <DescriptionList
                variant="bare"
                columns={2}
                items={[
                  {
                    label: l.storage,
                    value: storage ? (
                      <span className="flex flex-col gap-1">
                        <span>{storage.capacityBytes ? l.storageOf(bytes(storage.usedBytes, locale), bytes(storage.capacityBytes, locale)) : bytes(storage.usedBytes, locale)}</span>
                        {storageHigh && <Mark status="warning">{l.storageHigh}</Mark>}
                      </span>
                    ) : null,
                  },
                  {
                    label: l.replicas,
                    value:
                      replicas.length === 0 ? (
                        l.noReplicas
                      ) : (
                        <span className="flex flex-col gap-1">
                          {replicas.map((r) =>
                            r.lagMs === null ? (
                              <Mark key={r.name} status="danger">
                                {l.replicaDown(r.name)}
                              </Mark>
                            ) : thresholds.replicationLagAfterMs !== undefined && r.lagMs >= thresholds.replicationLagAfterMs ? (
                              <Mark key={r.name} status="warning">
                                {l.replicaLag(r.name, lag(r.lagMs, locale))}
                              </Mark>
                            ) : (
                              <span key={r.name}>{l.replicaLag(r.name, lag(r.lagMs, locale))}</span>
                            ),
                          )}
                        </span>
                      ),
                  },
                ]}
                labels={{ notSet: l.notReported }}
              />
              {!!database.partitions?.length && (
                <Table bare aria-label={l.partitions}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{l.table}</TableHead>
                      <TableHead className="text-right">{l.partitionCount}</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">{l.size}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {database.partitions.map((p) => (
                      <TableRow key={p.table}>
                        <TableCell className="w-full max-w-0 whitespace-normal">
                          <span className="block font-mono text-sm wrap-anywhere">{p.table}</span>
                          {p.partitioned === false ? (
                            <span className="block text-xs text-muted-foreground">{l.notPartitioned}</span>
                          ) : (
                            p.newest && <span className="block font-mono text-xs text-muted-foreground wrap-anywhere">{`${l.newest}: ${p.newest}`}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.partitioned === false ? "—" : n(p.count)}</TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">{p.sizeBytes != null ? bytes(p.sizeBytes, locale) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{l.notReported}</p>
          ),
        )}
      </div>

      <AlertDialog open={pausing !== null} onOpenChange={(o) => !o && busy === null && setPausing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pausing ? l.pauseTitle(pausing.name) : l.pause}</AlertDialogTitle>
            <AlertDialogDescription>{l.pauseBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>{l.keep}</AlertDialogCancel>
            <Button
              variant="primary"
              loading={busy !== null}
              onClick={() => {
                const q = pausing
                if (q && onPauseQueue) void run(`${q.name}:pause`, () => onPauseQueue(q, true), l.pausedNow(q.name)).then((ok) => ok && setPausing(null))
              }}
            >
              {l.pauseConfirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Sample ----------

const sampleNowAt = Date.parse("2026-11-27T06:00:00Z")
const ago = (ms: number) => new Date(sampleNowAt - ms).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN

export const samplePlatformThresholds: PlatformHealthThresholds = {
  heartbeat: { laggingAfterMs: 30_000, staleAfterMs: 2 * MIN },
  queueStuckAfterMs: 15 * MIN,
  replicationLagAfterMs: 10_000,
  storageAfter: 0.85,
}

export const samplePlatformWorkers: PlatformWorker[] = [
  { id: "w1", name: "worker-1", alive: true, lastHeartbeatAt: ago(8_000), startedAt: ago(26 * HOUR), detail: "pid 4321 on api-1" },
  { id: "w2", name: "worker-2", alive: true, lastHeartbeatAt: ago(12_000), startedAt: ago(26 * HOUR), detail: "pid 4388 on api-2" },
  { id: "w3", name: "worker-3", alive: false, lastHeartbeatAt: ago(14 * MIN), startedAt: ago(3 * HOUR), detail: "pid 5102 on api-3" },
]

export const samplePlatformQueues: PlatformQueue[] = [
  { name: "dispatch-webhook", depth: 12, failed: 3, oldestJobAt: ago(2 * MIN) },
  { name: "send-email", depth: 0, failed: 0, oldestJobAt: null },
  { name: "device-telemetry", depth: 418, failed: 0, oldestJobAt: ago(22 * MIN) },
  { name: "audit-export", depth: 2, failed: 0, oldestJobAt: ago(40 * MIN), paused: true },
]

export const samplePlatformJobs: PlatformScheduledJob[] = [
  { name: "webhook-outbox-drain", schedule: "Every 5 seconds", lastRunAt: ago(4_000), nextRunAt: ago(-1_000), lastResult: "succeeded" },
  { name: "partition-maintenance", schedule: "Daily at 03:00", lastRunAt: ago(27 * HOUR), nextRunAt: ago(-21 * HOUR), lastResult: "failed", lastError: "Lock timeout on audit_logs" },
  { name: "session-cleanup", schedule: "Every hour", lastRunAt: ago(3 * HOUR), nextRunAt: ago(2 * HOUR), lastResult: "succeeded", overdue: true },
  { name: "licence-expiry-notice", schedule: "Monthly on the 1st", lastRunAt: null, nextRunAt: "2026-12-01T00:00:00Z" },
]

export const samplePlatformEmail: PlatformEmailDelivery = { sent: 1284, bounced: 9, failed: 2 }

export const samplePlatformDatabase: PlatformDatabase = {
  storage: { usedBytes: 438_000_000_000, capacityBytes: 500_000_000_000 },
  replicas: [
    { name: "replica-1", lagMs: 420 },
    { name: "replica-2", lagMs: 18_000 },
  ],
  partitions: [
    { table: "audit_logs", count: 14, sizeBytes: 38_400_000_000, newest: "audit_logs_20261123" },
    { table: "device_heartbeats", count: 9, sizeBytes: 121_000_000_000, newest: "device_heartbeats_20261123" },
    { table: "email_deliveries", count: 0, partitioned: false },
  ],
}

const adminNav: AppNavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Projects", href: "#projects", icon: Building2 },
      { label: "Users", href: "#users", icon: Users },
      { label: "System health", href: "#health", icon: Activity },
    ],
  },
]

/**
 * The platform's own health: workers and heartbeats, job queues, scheduled jobs, email delivery and the
 * database, with retry and pause for a queue. This is PlatformHealthContent on sample data, in a sample shell.
 */
export function PlatformHealth() {
  const [queues, setQueues] = React.useState(samplePlatformQueues)
  return (
    <AppShell product="Platform admin" nav={adminNav} current="#health" title="System health" user={sampleUser}>
      <PlatformHealthContent
        workers={samplePlatformWorkers}
        queues={queues}
        jobs={samplePlatformJobs}
        email={samplePlatformEmail}
        database={samplePlatformDatabase}
        thresholds={samplePlatformThresholds}
        now={sampleNowAt}
        timeZone="Asia/Taipei"
        onRetryFailed={async (q) => setQueues((all) => all.map((x) => (x.name === q.name ? { ...x, failed: 0, depth: x.depth + q.failed } : x)))}
        onPauseQueue={async (q, paused) => setQueues((all) => all.map((x) => (x.name === q.name ? { ...x, paused } : x)))}
      />
    </AppShell>
  )
}
