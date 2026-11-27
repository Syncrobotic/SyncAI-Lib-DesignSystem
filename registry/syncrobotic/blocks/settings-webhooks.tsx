// @syncrobotic/settings-webhooks v0.55.0 · update: npx shadcn add @syncrobotic/settings-webhooks --overwrite
"use client"

import * as React from "react"
import { ChevronDown, CircleAlert, CircleCheck, Plug, Plus, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Code } from "@/registry/syncrobotic/ui/code"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type WebhookEventType = { key: string; label: string; hint: string }

export const webhookEvents: WebhookEventType[] = [
  { key: "robot.estop", label: "Emergency stop", hint: "Anyone stops a robot, and when it is released." },
  { key: "robot.attention", label: "Robot needs attention", hint: "Stuck, low battery, lost signal." },
  { key: "mission.completed", label: "Mission completed", hint: "A mission reaches its last checkpoint." },
  { key: "mission.failed", label: "Mission failed", hint: "A mission ends before its last checkpoint." },
  { key: "firmware.finished", label: "Update finished", hint: "Firmware or a map reaches every robot in a rollout." },
  { key: "dataset.ready", label: "Dataset ready", hint: "A recording is processed and can be downloaded." },
]

export type WebhookDelivery = {
  id: string
  event: string
  /** ISO 8601: written as "Today, 14:02" in the reader's language and time zone. */
  at: string
  /** The HTTP status your endpoint answered; null when it did not answer in time. */
  status: number | null
  durationMs: number
  /** What the endpoint answered, kept for failed deliveries so they can be read here. */
  response?: string
}

export type WebhookEndpoint = {
  id: string
  url: string
  events: string[]
  status: "active" | "failing" | "disabled"
  /** For a failing endpoint: what went wrong, in words. */
  lastError?: string
  /** ISO 8601: when it began failing. */
  failingSince?: string
  /** For SettingsWebhooks only; SettingsWebhooksContent takes the selected endpoint's `deliveries` as a page. */
  deliveries?: WebhookDelivery[]
}

export type SettingsWebhooksLabels = {
  title: string
  description: string
  add: string
  addTitle: string
  addBody: string
  url: string
  urlHint: string
  urlMissing: string
  urlInvalid: string
  urlHttp: string
  urlTaken: string
  events: string
  eventsMissing: string
  cancel: string
  endpoints: string
  status: Record<WebhookEndpoint["status"], string>
  since: (when: string) => string
  lastError: (error: string) => string
  noEvents: string
  eventCount: (n: number) => string
  copyNow: string
  copyNewNow: string
  /** Before the endpoint's URL, above its secret. */
  secretFor: string
  copyBody: string
  secretTitle: string
  copySecret: string
  done: string
  deliveries: string
  /** Before the endpoint's URL, above its deliveries. */
  deliveriesFor: string
  deliveriesBody: string
  deliveriesTo: (host: string) => string
  sendTest: string
  enable: string
  disable: string
  enableToTest: string
  rotate: string
  rotateTitle: (host: string) => string
  rotateBody: string
  keepSecret: string
  remove: string
  removeTitle: (host: string) => string
  removeBody: (events: number) => string
  typeToConfirm: (host: string) => string
  keep: string
  removed: (host: string) => string
  testDelivered: (ms: number) => string
  testFailed: (host: string, status: string) => string
  noAnswer: string
  failedWord: string
  timedOut: (seconds: number) => string
  ms: (ms: number) => string
  showResponse: string
  hideResponse: string
  response: string
  copyResponse: string
  today: (time: string) => string
  yesterday: (time: string) => string
  denied: string
  empty: string
  emptyBody: string
  noDeliveries: string
  noDeliveriesBody: string
  failed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultSettingsWebhooksLabels: SettingsWebhooksLabels = {
  title: "Webhooks",
  description: "Send robot and mission events to your own systems as they happen.",
  add: "Add endpoint",
  addTitle: "Add an endpoint",
  addBody: "We send each event as a POST with JSON, signed with a secret you see once, next.",
  url: "Endpoint URL",
  urlHint: "HTTPS only. Your server should answer 2xx within 10 seconds.",
  urlMissing: "Enter the URL that receives events, e.g. https://ops.example.com/hooks/fleet",
  urlInvalid: "That is not a full URL. Start with https:// and include the host.",
  urlHttp: "Use https://. Events carry robot positions, so they are only sent encrypted.",
  urlTaken: "This URL is already an endpoint. Change its events there instead.",
  events: "Events to send",
  eventsMissing: "Choose at least one event to send.",
  cancel: "Cancel",
  endpoints: "Endpoints",
  status: { active: "Active", failing: "Failing", disabled: "Disabled" },
  since: (when) => `since ${when}`,
  lastError: (error) => `Last error: ${error}`,
  noEvents: "No events are sent",
  eventCount: (n) => (n === 1 ? "1 event" : `${n} events`),
  copyNow: "Copy the signing secret now",
  copyNewNow: "Copy the new signing secret now",
  secretFor: "For",
  copyBody: "Your server uses it to check that events come from us. You will not see it again; if you lose it, rotate it.",
  secretTitle: "Signing secret",
  copySecret: "Copy the signing secret",
  done: "Done, I have copied it",
  deliveries: "Recent deliveries",
  deliveriesFor: "To",
  deliveriesBody: "the last 7 days. A failed delivery is retried 5 times over 3 hours.",
  deliveriesTo: (host) => `Deliveries to ${host}`,
  sendTest: "Send test event",
  enable: "Enable endpoint",
  disable: "Disable endpoint",
  enableToTest: "Enable the endpoint to send a test event.",
  rotate: "Rotate secret",
  rotateTitle: (host) => `Rotate the signing secret for ${host}?`,
  rotateBody:
    "For the next 24 hours each event is signed with both the old and the new secret; after that, only the new one. Put the new secret on your server within that time.",
  keepSecret: "Keep current secret",
  remove: "Delete endpoint",
  removeTitle: (host) => `Delete the endpoint at ${host}?`,
  removeBody: (events) =>
    `stops receiving ${events === 1 ? "its event" : `its ${events} events`} at once, and its delivery history is deleted. This cannot be undone; to stop events for a while, disable it instead.`,
  typeToConfirm: (host) => `Type ${host} to confirm`,
  keep: "Keep endpoint",
  removed: (host) => `Deleted the endpoint at ${host}.`,
  testDelivered: (ms) => `Test event delivered: 200 in ${ms} ms.`,
  testFailed: (host, status) => `Test event failed: ${host} answered ${status}.`,
  noAnswer: "No answer",
  failedWord: "failed",
  timedOut: (s) => `timed out after ${s} s`,
  ms: (ms) => `${ms} ms`,
  showResponse: "Show the response",
  hideResponse: "Hide the response",
  response: "Response",
  copyResponse: "Copy the response",
  today: (time) => `Today, ${time}`,
  yesterday: (time) => `Yesterday, ${time}`,
  denied: "You need the webhooks:write permission. A project admin can grant it.",
  empty: "No webhooks yet",
  emptyBody: "Add an endpoint to have stops, failed missions and finished updates posted to your systems.",
  noDeliveries: "No deliveries yet",
  noDeliveriesBody: "Events appear here as they are sent. Send a test event to check the endpoint now.",
  failed: "That did not work. Nothing was changed; try again.",
  errors: { INVALID_WEBHOOK_URL: "That address cannot receive events: use a public https:// URL." },
  data: {
    loading: "Loading webhooks…",
    error: "Webhooks did not load",
    errorBody: "We could not reach the server. Your endpoints still receive events; only this page is affected.",
  },
}

const host = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** A URL kept whole, breaking after "/", "?" and "&" when it must wrap, never inside a word. */
function Url({ url, className }: { url: string; className?: string }) {
  const parts = url.split(/(?<=[/?&])/)
  return (
    <span className={cn("font-mono wrap-anywhere", className)}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && <wbr />}
        </React.Fragment>
      ))}
    </span>
  )
}

const delivered = (d: WebhookDelivery) => d.status !== null && d.status >= 200 && d.status < 300

/** "Today, 14:02", "Yesterday, 22:40" or "18 Nov, 08:30", in the reader's time zone. */
function useWhen(l: SettingsWebhooksLabels, now: number, locale?: string, timeZone?: string) {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
  const time = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
  const date = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short" })
  const today = day(new Date(now))
  const yesterday = day(new Date(now - 86_400_000))
  return (iso: string) => {
    const d = new Date(iso)
    const k = day(d)
    return k === today ? l.today(time.format(d)) : k === yesterday ? l.yesterday(time.format(d)) : `${date.format(d)}, ${time.format(d)}`
  }
}

function validateUrl(value: string, taken: string[], l: SettingsWebhooksLabels) {
  const v = value.trim()
  if (!v) return l.urlMissing
  let u: URL
  try {
    u = new URL(v)
  } catch {
    return l.urlInvalid
  }
  if (u.protocol !== "https:") return l.urlHttp
  if (taken.includes(u.href) || taken.includes(v)) return l.urlTaken
  return undefined
}

function EndpointStatus({ endpoint: e, l, when }: { endpoint: WebhookEndpoint; l: SettingsWebhooksLabels; when: (iso: string) => string }) {
  // Calm states are grey; only a failing endpoint needs someone, so only it gets colour: its shape and the word Failing.
  // Since when and the last error are the details, in grey.
  const detail =
    e.status === "failing"
      ? [e.failingSince && l.since(when(e.failingSince)), e.lastError && l.lastError(e.lastError)].filter(Boolean).join(" · ")
      : e.status === "disabled"
        ? l.noEvents
        : undefined
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <InlineStatus status={e.status === "failing" ? "danger" : e.status === "active" ? "normal" : "offline"}>{l.status[e.status]}</InlineStatus>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </span>
  )
}

function DeliveryRow({ delivery: d, l, when }: { delivery: WebhookDelivery; l: SettingsWebhooksLabels; when: (iso: string) => string }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const ok = delivered(d)
  const summary = (
    <>
      <span className={cn("flex items-center gap-2 text-sm whitespace-nowrap tabular-nums", ok ? "text-muted-foreground" : "text-danger")}>
        {ok ? <CircleCheck aria-hidden="true" className="size-4 shrink-0" /> : <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
        {d.status ?? l.noAnswer}
        {!ok && (
          <>
            {" "}
            <span className="sr-only">{l.failedWord}</span>
          </>
        )}
      </span>
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm">
          <Code>{d.event}</Code>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <time dateTime={d.at}>{when(d.at)}</time> · {d.status === null ? l.timedOut(d.durationMs / 1000) : l.ms(d.durationMs)}
        </span>
      </span>
    </>
  )
  const grid = "grid min-h-(--h-md) w-full grid-cols-[5.5rem_1fr_auto] items-center gap-3 px-4 py-2"
  if (ok || !d.response)
    return (
      <li className="border-b border-border last:border-b-0">
        <div className={grid}>
          {summary}
          <span className="size-5" />
        </div>
      </li>
    )
  return (
    <li className="border-b border-border last:border-b-0">
      <button data-slot="settings-webhooks-delivery" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={cn("press hover:bg-accent", grid)}>
        {summary}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 text-muted-foreground transition-transform duration-(--motion-base) ease-(--ease-standard)", open && "rotate-180")}
        />
        <span className="sr-only">{open ? l.hideResponse : l.showResponse}</span>
      </button>
      {open && (
        <div id={id} className="animate-appear px-4 pb-4">
          <CodeBlock code={d.response} title={l.response} wrap="words" copyLabel={l.copyResponse} />
        </div>
      )}
    </li>
  )
}

function AddEndpoint({
  taken,
  events,
  defaultEvents,
  onAdd,
  allowed,
  l,
}: {
  allowed: boolean
  taken: string[]
  events: readonly WebhookEventType[]
  defaultEvents: readonly string[]
  onAdd: (url: string, events: string[]) => Promise<string | null>
  l: SettingsWebhooksLabels
}) {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>([...defaultEvents])
  const [errors, setErrors] = React.useState<{ url?: string; events?: string; form?: string }>({})
  const [busy, setBusy] = React.useState(false)
  const urlRef = React.useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = { url: validateUrl(url, taken, l), events: picked.length ? undefined : l.eventsMissing }
    setErrors(next)
    if (next.url) return urlRef.current?.focus()
    if (next.events) return
    setBusy(true)
    const failed = await onAdd(new URL(url.trim()).href, picked)
    setBusy(false)
    if (failed !== null) return setErrors({ form: failed || undefined })
    setOpen(false)
    setUrl("")
    setErrors({})
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <PermissionGate allowed={allowed} mode="disabled" reason={l.denied}>
        <SheetTrigger asChild>
          <Button variant="secondary">
            <Plus aria-hidden="true" />
            {l.add}
          </Button>
        </SheetTrigger>
      </PermissionGate>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{l.addTitle}</SheetTitle>
          <SheetDescription>{l.addBody}</SheetDescription>
        </SheetHeader>
        <form id="add-endpoint" noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <Field label={l.url} hint={l.urlHint} error={errors.url}>
            <Input ref={urlRef} type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
          <FieldSet legend={l.events} error={errors.events}>
            {events.map((ev) => (
              <ChoiceField
                key={ev.key}
                label={ev.label}
                description={ev.hint}
                control={
                  <Checkbox
                    checked={picked.includes(ev.key)}
                    onCheckedChange={(v) => {
                      setPicked((s) => (v === true ? [...s, ev.key] : s.filter((k) => k !== ev.key)))
                      setErrors((x) => ({ ...x, events: undefined }))
                    }}
                  />
                }
              />
            ))}
          </FieldSet>
          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}
        </form>
        <SheetFooter className="sm:flex-row-reverse">
          <Button type="submit" form="add-endpoint" loading={busy}>
            {l.add}
          </Button>
          <SheetClose asChild>
            <Button variant="ghost">{l.cancel}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteEndpoint({ endpoint, onDelete, l, allowed }: { endpoint: WebhookEndpoint; onDelete: () => void; l: SettingsWebhooksLabels; allowed: boolean }) {
  const name = host(endpoint.url)
  const [typed, setTyped] = React.useState("")
  return (
    <AlertDialog onOpenChange={() => setTyped("")}>
      <PermissionGate allowed={allowed} mode="disabled" reason={l.denied}>
        <AlertDialogTrigger asChild>
          {/* A destructive action looks it on the page too (danger outline and text); the confirmation asks for the name. */}
          <Button variant="destructive" size="sm">
            {l.remove}
          </Button>
        </AlertDialogTrigger>
      </PermissionGate>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{l.removeTitle(name)}</AlertDialogTitle>
          <AlertDialogDescription>
            <Url url={endpoint.url} className="text-foreground" /> {l.removeBody(endpoint.events.length)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field label={l.typeToConfirm(name)}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>{l.keep}</AlertDialogCancel>
          <AlertDialogAction destructive disabled={typed.trim() !== name} onClick={onDelete}>
            {l.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export type SettingsWebhooksContentProps = {
  endpoints: ListPage<WebhookEndpoint>
  /** The events an endpoint can subscribe to. */
  events: readonly WebhookEventType[]
  defaultEvents?: readonly string[]
  /** The endpoint whose deliveries show; leave both out to let the block choose (the first). */
  selectedId?: string
  onSelect?: (id: string) => void
  /** The selected endpoint's deliveries, newest first, with the server's total. */
  deliveries?: ListPage<WebhookDelivery>
  deliveriesState?: DataStateKind
  deliveriesError?: DataStateError | null
  onDeliveriesRetry?: () => void
  deliveriesQuery?: ListQuery
  onDeliveriesQueryChange?: (query: ListQuery) => void
  /** Resolves with the signing secret, shown once and then dropped: never put it in a cache, a store or the URL. */
  onCreate: (endpoint: { url: string; events: string[] }) => Promise<{ secret: string }>
  onRotateSecret?: (endpoint: WebhookEndpoint) => Promise<{ secret: string }>
  onSetEnabled?: (endpoint: WebhookEndpoint, enabled: boolean) => Promise<void>
  onDelete?: (endpoint: WebhookEndpoint) => Promise<void>
  /** Resolves with the test delivery, which the block reads out. */
  onSendTest?: (endpoint: WebhookEndpoint) => Promise<WebhookDelivery | void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  /** "Today" is measured from here; default the browser's clock. */
  now?: Date
  locale?: string
  timeZone?: string
  labels?: Partial<SettingsWebhooksLabels>
}

/** Webhooks from your data: endpoints, the selected one's deliveries as a page, secrets from the callbacks shown once. */
export function SettingsWebhooksContent({
  endpoints,
  events,
  defaultEvents = events.slice(0, 2).map((e) => e.key),
  selectedId: controlledId,
  onSelect,
  deliveries,
  deliveriesState = "ready",
  deliveriesError,
  onDeliveriesRetry,
  deliveriesQuery,
  onDeliveriesQueryChange,
  onCreate,
  onRotateSecret,
  onSetEnabled,
  onDelete,
  onSendTest,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  now,
  locale,
  timeZone,
  labels,
}: SettingsWebhooksContentProps) {
  const l = { ...defaultSettingsWebhooksLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "webhooks:write") : true
  const showWrites = mayWrite || denied === "disabled"
  const [ownId, setOwnId] = React.useState<string | undefined>(undefined)
  const selectedId = controlledId ?? ownId ?? endpoints.items[0]?.id
  const select = (id: string) => {
    setOwnId(id)
    onSelect?.(id)
  }
  // The secret lives only here, only until "Done". Never put it in a cache, a store or the URL.
  const [secret, setSecret] = React.useState<{ value: string; url: string; rotated: boolean } | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [said, setSaid] = React.useState("")
  const [failure, setFailure] = React.useState<string | null>(null)
  const [clock] = React.useState(() => Date.now())
  const when = useWhen(l, now?.getTime() ?? clock, locale, timeZone)
  const selected = endpoints.items.find((e) => e.id === selectedId)
  const say = (e: unknown) => (isStepUpCancelled(e) ? null : (l.errors[errorCodeOf(e) ?? ""] ?? l.failed))

  const run = async (fn: () => Promise<void>) => {
    setFailure(null)
    try {
      await fn()
      return true
    } catch (e) {
      setFailure(say(e))
      return false
    }
  }

  // Resolves with null when added, or the words of what went wrong ("" when the step-up was cancelled).
  const add = async (url: string, picked: string[]) => {
    try {
      const { secret: value } = await onCreate({ url, events: picked })
      setSecret({ value, url, rotated: false })
      setSaid("")
      return null
    } catch (e) {
      return say(e) ?? ""
    }
  }

  const sendTest = async (e: WebhookEndpoint) => {
    if (!onSendTest) return
    setTesting(true)
    setSaid("")
    await run(async () => {
      const d = await onSendTest(e)
      if (d) setSaid(delivered(d) ? l.testDelivered(d.durationMs) : l.testFailed(host(e.url), d.status === null ? l.noAnswer : String(d.status)))
    })
    setTesting(false)
  }

  const addButton = (taken: string[]) =>
    showWrites && <AddEndpoint allowed={mayWrite} taken={taken} events={events} defaultEvents={defaultEvents} onAdd={add} l={l} />

  return (
    <section aria-labelledby="webhooks-title" className="flex flex-col gap-4">
      <SectionHeader
        id="webhooks-title"
        title={l.title}
        description={l.description}
        actions={state === "ready" && endpoints.items.length > 0 && !secret && addButton(endpoints.items.map((e) => e.url))}
      />

      {/* Read out only: what changed is already on screen (a new delivery at the top, an endpoint gone). */}
      <p role="status" className="sr-only">
        {said}
      </p>

      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure}
        </p>
      )}

      {secret && (
        <div role="status" className="flex animate-appear flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{secret.rotated ? l.copyNewNow : l.copyNow}</span>
            <span className="text-sm text-muted-foreground">
              {l.secretFor} <Url url={secret.url} className="text-foreground" />. {l.copyBody}
            </span>
          </div>
          <CodeBlock code={secret.value} title={l.secretTitle} secret copyLabel={l.copySecret} />
          <Button variant="secondary" className="self-start" onClick={() => setSecret(null)}>
            {l.done}
          </Button>
        </div>
      )}

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        {endpoints.items.length === 0 ? (
          <Card className="p-0">
            <EmptyState icon={Plug} title={l.empty} description={l.emptyBody} action={addButton([])} />
          </Card>
        ) : (
          <>
            <Card className="gap-0 p-0">
              <ul aria-label={l.endpoints}>
                {endpoints.items.map((e) => {
                  const current = e.id === selectedId
                  return (
                    <li key={e.id} className="border-b border-border last:border-b-0">
                      <button
                        data-slot="settings-webhooks-endpoint"
                        type="button"
                        aria-current={current ? "true" : undefined}
                        onClick={() => {
                          select(e.id)
                          setSaid("")
                        }}
                        className={cn(
                          "press flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-accent in-[li:first-child]:rounded-t-md in-[li:last-child]:rounded-b-md",
                          current && "bg-accent",
                        )}
                      >
                        <Plug aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          {/* The whole URL, never cut: two endpoints often differ only at the end. It breaks anywhere rather than run off. */}
                          <Url url={e.url} className="text-sm" />
                          <EndpointStatus endpoint={e} l={l} when={when} />
                          <span className="text-xs text-muted-foreground">
                            {l.eventCount(e.events.length)}: {e.events.join(", ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>

            {selected && (
              <section aria-labelledby="deliveries-title" className="flex flex-col gap-3">
                <SectionHeader
                  id="deliveries-title"
                  as="h3"
                  title={l.deliveries}
                  description={
                    <>
                      {l.deliveriesFor} <Url url={selected.url} className="text-foreground" />, {l.deliveriesBody}
                    </>
                  }
                />
                {showWrites && (
                  <div className="flex flex-wrap gap-2">
                    {onSendTest && (
                      <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
                        <Button size="sm" variant="secondary" loading={testing} disabled={selected.status === "disabled"} onClick={() => void sendTest(selected)}>
                          <Send aria-hidden="true" />
                          {l.sendTest}
                        </Button>
                      </PermissionGate>
                    )}
                    {onSetEnabled && (
                      <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
                        <Button size="sm" variant="outline" onClick={() => void run(() => onSetEnabled(selected, selected.status === "disabled"))}>
                          {selected.status === "disabled" ? l.enable : l.disable}
                        </Button>
                      </PermissionGate>
                    )}
                    {onRotateSecret && (
                      <AlertDialog>
                        <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              {l.rotate}
                            </Button>
                          </AlertDialogTrigger>
                        </PermissionGate>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{l.rotateTitle(host(selected.url))}</AlertDialogTitle>
                            <AlertDialogDescription>{l.rotateBody}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{l.keepSecret}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                void run(async () => {
                                  const { secret: value } = await onRotateSecret(selected)
                                  setSecret({ value, url: selected.url, rotated: true })
                                })
                              }
                            >
                              {l.rotate}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {onDelete && (
                      <DeleteEndpoint
                        endpoint={selected}
                        allowed={mayWrite}
                        l={l}
                        onDelete={() =>
                          void run(() => onDelete(selected)).then((ok) => {
                            if (!ok) return
                            setOwnId(undefined)
                            setSaid(l.removed(host(selected.url)))
                          })
                        }
                      />
                    )}
                  </div>
                )}
                {selected.status === "disabled" && onSendTest && mayWrite && <p className="text-xs text-muted-foreground">{l.enableToTest}</p>}
                <DataState state={deliveriesState === "empty" ? "ready" : deliveriesState} error={deliveriesError} onRetry={onDeliveriesRetry} size="inline" labels={l.data}>
                  <Card className="gap-0 p-0">
                    {!deliveries || deliveries.items.length === 0 ? (
                      <EmptyState icon={Send} title={l.noDeliveries} description={l.noDeliveriesBody} />
                    ) : (
                      <ul aria-label={l.deliveriesTo(host(selected.url))}>
                        {deliveries.items.map((d) => (
                          <DeliveryRow key={d.id} delivery={d} l={l} when={when} />
                        ))}
                      </ul>
                    )}
                  </Card>
                </DataState>
                {deliveries && deliveriesQuery && onDeliveriesQueryChange && deliveries.total > deliveriesQuery.limit && (
                  <Pagination
                    page={deliveriesQuery.page - 1}
                    pageSize={deliveriesQuery.limit}
                    total={deliveries.total}
                    onPageChange={(p) => onDeliveriesQueryChange({ ...deliveriesQuery, page: p + 1 })}
                    locale={locale}
                  />
                )}
              </section>
            )}
          </>
        )}
      </DataState>
    </section>
  )
}

/** The clock the sample is written against. */
const sampleNow = new Date("2026-11-20T15:30:00+08:00")

export const sampleEndpoints: WebhookEndpoint[] = [
  {
    id: "wh1",
    url: "https://ops.example.com/hooks/fleet-events",
    events: ["robot.estop", "robot.attention", "mission.failed"],
    status: "active",
    deliveries: [
      { id: "d1", event: "mission.failed", at: "2026-11-20T14:02:00+08:00", status: 200, durationMs: 182 },
      { id: "d2", event: "robot.attention", at: "2026-11-20T13:47:00+08:00", status: 200, durationMs: 214 },
      {
        id: "d3",
        event: "robot.estop",
        at: "2026-11-20T11:30:00+08:00",
        status: 502,
        durationMs: 1240,
        response: '502 Bad Gateway\n\n{"error":"upstream ticketing service unavailable"}',
      },
      { id: "d4", event: "robot.estop", at: "2026-11-20T11:31:00+08:00", status: 200, durationMs: 197 },
    ],
  },
  {
    id: "wh2",
    url: "https://warehouse-wms.example.net/api/v2/integrations/syncrobotic/webhook?site=taoyuan-plant-floor-2",
    events: ["mission.completed", "mission.failed"],
    status: "failing",
    lastError: "503 Service Unavailable",
    failingSince: "2026-11-20T09:15:00+08:00",
    deliveries: [
      {
        id: "d5",
        event: "mission.completed",
        at: "2026-11-20T13:58:00+08:00",
        status: 503,
        durationMs: 30,
        response: "503 Service Unavailable\n\nThe server is down for maintenance until 16:00.",
      },
      { id: "d6", event: "mission.failed", at: "2026-11-20T09:15:00+08:00", status: null, durationMs: 10000 },
      { id: "d7", event: "mission.completed", at: "2026-11-19T22:40:00+08:00", status: 200, durationMs: 341 },
    ],
  },
  {
    id: "wh3",
    url: "https://hooks.example.org/old-dashboard",
    events: ["dataset.ready"],
    status: "disabled",
    deliveries: [],
  },
]

// The sample's stand-in for the server. A real secret comes from your API once, in the create or rotate response.
const fakeSecret = (seed: string) => `whsec_${(seed.length * 104729).toString(36)}${"Hq7Vt2KmXc9RbZ4pWn8Ls3Jd".slice(0, 24)}`

/**
 * Webhook endpoints with their events and state: adding one with its signing secret shown once, test events, recent
 * deliveries, rotating and deleting. Only failing is coloured; deleting asks for the host to be typed. This is
 * SettingsWebhooksContent on sample data, the sample answering as the server would.
 */
export function SettingsWebhooks({
  endpoints: initial = sampleEndpoints,
  state = "ready",
  onRetry,
}: {
  endpoints?: WebhookEndpoint[]
  /** "loading" while the list is fetched, "error" when it could not be; the header stays either way. */
  state?: "ready" | "loading" | "error"
  onRetry?: () => void
}) {
  const [endpoints, setEndpoints] = React.useState(initial)
  const [selectedId, setSelectedId] = React.useState(initial[0]?.id)
  const selected = endpoints.find((e) => e.id === selectedId)
  const update = (id: string, change: (e: WebhookEndpoint) => WebhookEndpoint) => setEndpoints((all) => all.map((e) => (e.id === id ? change(e) : e)))
  const list = selected?.deliveries ?? []

  return (
    <SettingsWebhooksContent
      endpoints={{ items: endpoints, total: endpoints.length }}
      events={webhookEvents}
      selectedId={selectedId}
      onSelect={setSelectedId}
      deliveries={{ items: list, total: list.length }}
      state={state}
      onRetry={onRetry}
      now={sampleNow}
      timeZone="Asia/Taipei"
      onCreate={async ({ url, events }) => {
        const id = `wh${endpoints.length + 1}`
        setEndpoints((all) => [...all, { id, url, events, status: "active", deliveries: [] }])
        setSelectedId(id)
        return { secret: fakeSecret(url) }
      }}
      onRotateSecret={async (e) => ({ secret: fakeSecret(`${e.url}-rotated`) })}
      onSetEnabled={async (e, enabled) => update(e.id, (x) => ({ ...x, status: enabled ? "active" : "disabled" }))}
      onDelete={async (e) => {
        const rest = endpoints.filter((x) => x.id !== e.id)
        setEndpoints(rest)
        setSelectedId(rest[0]?.id)
      }}
      onSendTest={async (e) => {
        await new Promise((r) => window.setTimeout(r, 700))
        // The sample answers like the endpoint would: a failing one fails again.
        const fails = e.status === "failing"
        const d: WebhookDelivery = {
          id: `d${Date.now()}`,
          event: "ping",
          at: sampleNow.toISOString(),
          status: fails ? 503 : 200,
          durationMs: fails ? 28 : 164,
          response: fails ? "503 Service Unavailable\n\nThe server is down for maintenance until 16:00." : undefined,
        }
        update(e.id, (x) => ({ ...x, deliveries: [d, ...(x.deliveries ?? [])] }))
        return d
      }}
    />
  )
}
