// @syncrobotic/settings-webhooks v0.32.0 · update: npx shadcn add @syncrobotic/settings-webhooks --overwrite
"use client"

import * as React from "react"
import { ChevronDown, CircleAlert, CircleCheck, CloudOff, Plug, Plus, RotateCw, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
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
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
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
  /** ISO time, for <time dateTime>. */
  at: string
  /** The time as people read it, e.g. "Today, 14:02". */
  time: string
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
  /** For a failing endpoint: what went wrong, in words, and since when. */
  lastError?: string
  failingSince?: string
  deliveries: WebhookDelivery[]
}

export const sampleEndpoints: WebhookEndpoint[] = [
  {
    id: "wh1",
    url: "https://ops.example.com/hooks/fleet-events",
    events: ["robot.estop", "robot.attention", "mission.failed"],
    status: "active",
    deliveries: [
      { id: "d1", event: "mission.failed", at: "2026-11-20T14:02", time: "Today, 14:02", status: 200, durationMs: 182 },
      { id: "d2", event: "robot.attention", at: "2026-11-20T13:47", time: "Today, 13:47", status: 200, durationMs: 214 },
      {
        id: "d3",
        event: "robot.estop",
        at: "2026-11-20T11:30",
        time: "Today, 11:30",
        status: 502,
        durationMs: 1240,
        response: '502 Bad Gateway\n\n{"error":"upstream ticketing service unavailable"}',
      },
      { id: "d4", event: "robot.estop", at: "2026-11-20T11:31", time: "Today, 11:31", status: 200, durationMs: 197 },
    ],
  },
  {
    id: "wh2",
    url: "https://warehouse-wms.example.net/api/v2/integrations/syncrobotic/webhook?site=taoyuan-plant-floor-2",
    events: ["mission.completed", "mission.failed"],
    status: "failing",
    lastError: "503 Service Unavailable",
    failingSince: "Today, 09:15",
    deliveries: [
      {
        id: "d5",
        event: "mission.completed",
        at: "2026-11-20T13:58",
        time: "Today, 13:58",
        status: 503,
        durationMs: 30,
        response: "503 Service Unavailable\n\nThe server is down for maintenance until 16:00.",
      },
      { id: "d6", event: "mission.failed", at: "2026-11-20T09:15", time: "Today, 09:15", status: null, durationMs: 10000 },
      { id: "d7", event: "mission.completed", at: "2026-11-19T22:40", time: "Yesterday, 22:40", status: 200, durationMs: 341 },
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

function validateUrl(value: string, taken: string[]) {
  const v = value.trim()
  if (!v) return "Enter the URL that receives events, e.g. https://ops.example.com/hooks/fleet"
  let u: URL
  try {
    u = new URL(v)
  } catch {
    return "That is not a full URL. Start with https:// and include the host."
  }
  if (u.protocol !== "https:") return "Use https://. Events carry robot positions, so they are only sent encrypted."
  if (taken.includes(u.href) || taken.includes(v)) return "This URL is already an endpoint. Change its events there instead."
  return undefined
}

function EndpointStatus({ endpoint: e }: { endpoint: WebhookEndpoint }) {
  // Calm states are grey; only a failing endpoint needs someone, so only it gets colour: its shape and the word Failing.
  // Since when and the last error are the details, in grey.
  const detail =
    e.status === "failing"
      ? [e.failingSince && `since ${e.failingSince}`, e.lastError && `Last error: ${e.lastError}`].filter(Boolean).join(" · ")
      : e.status === "disabled"
        ? "No events are sent"
        : undefined
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <InlineStatus status={e.status === "failing" ? "danger" : e.status === "active" ? "normal" : "offline"}>
        {e.status === "failing" ? "Failing" : e.status === "active" ? "Active" : "Disabled"}
      </InlineStatus>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </span>
  )
}

function DeliveryRow({ delivery: d }: { delivery: WebhookDelivery }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const ok = delivered(d)
  const summary = (
    <>
      <span className={cn("flex items-center gap-2 text-sm whitespace-nowrap tabular-nums", ok ? "text-muted-foreground" : "text-danger")}>
        {ok ? <CircleCheck aria-hidden="true" className="size-4 shrink-0" /> : <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
        {d.status ?? "No answer"}
        {!ok && <span className="sr-only">, failed</span>}
      </span>
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm">
          <Code>{d.event}</Code>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <time dateTime={d.at}>{d.time}</time> · {d.status === null ? `timed out after ${d.durationMs / 1000} s` : `${d.durationMs} ms`}
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
        <span className="sr-only">{open ? "Hide the response" : "Show the response"}</span>
      </button>
      {open && (
        <div id={id} className="animate-appear px-4 pb-4">
          <CodeBlock code={d.response} title="Response" wrap="words" copyLabel="Copy the response" />
        </div>
      )}
    </li>
  )
}

function AddEndpoint({ taken, onAdd }: { taken: string[]; onAdd: (url: string, events: string[]) => void }) {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")
  const [events, setEvents] = React.useState<string[]>(["robot.estop", "robot.attention"])
  const [errors, setErrors] = React.useState<{ url?: string; events?: string }>({})
  const urlRef = React.useRef<HTMLInputElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = { url: validateUrl(url, taken), events: events.length ? undefined : "Choose at least one event to send." }
    setErrors(next)
    if (next.url) return urlRef.current?.focus()
    if (next.events) return
    onAdd(new URL(url.trim()).href, events)
    setOpen(false)
    setUrl("")
    setErrors({})
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <Plus aria-hidden="true" />
          Add endpoint
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add an endpoint</SheetTitle>
          <SheetDescription>We send each event as a POST with JSON, signed with a secret you see once, next.</SheetDescription>
        </SheetHeader>
        <form id="add-endpoint" noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Endpoint URL" hint="HTTPS only. Your server should answer 2xx within 10 seconds." error={errors.url}>
            <Input
              ref={urlRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <FieldSet legend="Events to send" error={errors.events}>
            {webhookEvents.map((ev) => (
              <ChoiceField
                key={ev.key}
                label={ev.label}
                description={ev.hint}
                control={
                  <Checkbox
                    checked={events.includes(ev.key)}
                    onCheckedChange={(v) => {
                      setEvents((s) => (v === true ? [...s, ev.key] : s.filter((k) => k !== ev.key)))
                      setErrors((x) => ({ ...x, events: undefined }))
                    }}
                  />
                }
              />
            ))}
          </FieldSet>
        </form>
        <SheetFooter className="sm:flex-row-reverse">
          <Button type="submit" form="add-endpoint">
            Add endpoint
          </Button>
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteEndpoint({ endpoint, onDelete }: { endpoint: WebhookEndpoint; onDelete: () => void }) {
  const name = host(endpoint.url)
  const [typed, setTyped] = React.useState("")
  return (
    <AlertDialog onOpenChange={() => setTyped("")}>
      <AlertDialogTrigger asChild>
        {/* A destructive action looks it on the page too (danger outline and text); the confirmation asks for the name. */}
        <Button variant="destructive" size="sm">
          Delete endpoint
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the endpoint at {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            <Url url={endpoint.url} className="text-foreground" /> stops receiving {endpoint.events.length === 1 ? "its event" : `its ${endpoint.events.length} events`} at once, and its delivery history is deleted.
            This cannot be undone; to stop events for a while, disable it instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field label={`Type ${name} to confirm`}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep endpoint</AlertDialogCancel>
          <AlertDialogAction destructive disabled={typed.trim() !== name} onClick={onDelete}>
            Delete endpoint
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Webhooks: endpoints that receive fleet events, each with its events and its state (failing says since when and the last
 * error, in danger text with an icon; active and disabled stay grey). Adding one shows its signing secret once, in a
 * secret code block with a copy button, and never again; rotating shows the new one the same way. One endpoint at a time
 * shows its recent deliveries, a failed one opening to what the endpoint answered, and can send a test event. Deleting
 * asks for the host to be typed.
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
  // The secret lives only here, only until "Done". Never put it in a cache, a store or the URL.
  const [secret, setSecret] = React.useState<{ value: string; url: string; rotated: boolean } | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [said, setSaid] = React.useState("")
  const selected = endpoints.find((e) => e.id === selectedId)

  const update = (id: string, change: (e: WebhookEndpoint) => WebhookEndpoint) => setEndpoints((all) => all.map((e) => (e.id === id ? change(e) : e)))

  const add = (url: string, events: string[]) => {
    const id = `wh${Date.now()}`
    setEndpoints((all) => [...all, { id, url, events, status: "active", deliveries: [] }])
    setSelectedId(id)
    setSecret({ value: fakeSecret(url), url, rotated: false })
    setSaid("")
  }

  const sendTest = async (e: WebhookEndpoint) => {
    setTesting(true)
    setSaid("")
    await new Promise((r) => window.setTimeout(r, 700))
    // The sample answers like the endpoint would: a failing one fails again.
    const fails = e.status === "failing"
    const d: WebhookDelivery = {
      id: `d${Date.now()}`,
      event: "ping",
      at: new Date().toISOString(),
      time: "Just now",
      status: fails ? 503 : 200,
      durationMs: fails ? 28 : 164,
      response: fails ? "503 Service Unavailable\n\nThe server is down for maintenance until 16:00." : undefined,
    }
    update(e.id, (x) => ({ ...x, deliveries: [d, ...x.deliveries] }))
    setTesting(false)
    setSaid(fails ? `Test event failed: ${host(e.url)} answered 503.` : `Test event delivered: 200 in ${d.durationMs} ms.`)
  }

  return (
    <section aria-labelledby="webhooks-title" className="flex flex-col gap-4">
      <SectionHeader
        id="webhooks-title"
        title="Webhooks"
        description="Send robot and mission events to your own systems as they happen."
        actions={state === "ready" && endpoints.length > 0 && !secret && <AddEndpoint taken={endpoints.map((e) => e.url)} onAdd={add} />}
      />

      {/* Read out only: what changed is already on screen (a new delivery at the top, an endpoint gone). */}
      <p role="status" className="sr-only">
        {said}
      </p>

      {secret && (
        <div role="status" className="flex animate-appear flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{secret.rotated ? "Copy the new signing secret now" : "Copy the signing secret now"}</span>
            <span className="text-sm text-muted-foreground">
              For <Url url={secret.url} className="text-foreground" />. Your server uses it to check that events come from us. You will not see
              it again; if you lose it, rotate it.
            </span>
          </div>
          <CodeBlock code={secret.value} title="Signing secret" secret copyLabel="Copy the signing secret" />
          <Button variant="secondary" className="self-start" onClick={() => setSecret(null)}>
            Done, I have copied it
          </Button>
        </div>
      )}

      {state === "loading" ? (
        <Card className="gap-4 p-4">
          <LoadingLine>Loading webhooks…</LoadingLine>
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </span>
          ))}
        </Card>
      ) : state === "error" ? (
        <Card className="p-0">
          <EmptyState
            icon={CloudOff}
            title="Webhooks did not load"
            description="We could not reach the server. Your endpoints still receive events; only this page is affected."
            action={
              <Button variant="secondary" onClick={onRetry}>
                <RotateCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Card>
      ) : endpoints.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Plug}
            title="No webhooks yet"
            description="Add an endpoint to have stops, failed missions and finished updates posted to your systems."
            action={<AddEndpoint taken={[]} onAdd={add} />}
          />
        </Card>
      ) : (
        <>
          <Card className="gap-0 p-0">
            <ul aria-label="Endpoints">
              {endpoints.map((e) => {
                const current = e.id === selectedId
                return (
                  <li key={e.id} className="border-b border-border last:border-b-0">
                    <button data-slot="settings-webhooks-endpoint"
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => {
                        setSelectedId(e.id)
                        setSaid("")
                      }}
                      className={cn("press flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-accent in-[li:first-child]:rounded-t-md in-[li:last-child]:rounded-b-md", current && "bg-accent")}
                    >
                      <Plug aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        {/* The whole URL, never cut: two endpoints often differ only at the end. It breaks anywhere rather than run off. */}
                        <Url url={e.url} className="text-sm" />
                        <EndpointStatus endpoint={e} />
                        <span className="text-xs text-muted-foreground">
                          {e.events.length === 1 ? "1 event" : `${e.events.length} events`}: {e.events.join(", ")}
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
                title="Recent deliveries"
                description={
                  <>
                    To <Url url={selected.url} className="text-foreground" />, the last 7 days. A failed delivery is retried 5 times over 3 hours.
                  </>
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" loading={testing} disabled={selected.status === "disabled"} onClick={() => sendTest(selected)}>
                  <Send aria-hidden="true" />
                  Send test event
                </Button>
                <Button size="sm" variant="outline" onClick={() => update(selected.id, (x) => ({ ...x, status: x.status === "disabled" ? "active" : "disabled" }))}>
                  {selected.status === "disabled" ? "Enable endpoint" : "Disable endpoint"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Rotate secret
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rotate the signing secret for {host(selected.url)}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        For the next 24 hours each event is signed with both the old and the new secret; after that, only the new one. Put the new
                        secret on your server within that time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep current secret</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setSecret({ value: fakeSecret(`${selected.url}${Date.now()}`), url: selected.url, rotated: true })}>
                        Rotate secret
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DeleteEndpoint
                  endpoint={selected}
                  onDelete={() => {
                    const rest = endpoints.filter((x) => x.id !== selected.id)
                    setEndpoints(rest)
                    setSelectedId(rest[0]?.id)
                    setSaid(`Deleted the endpoint at ${host(selected.url)}.`)
                  }}
                />
              </div>
              {selected.status === "disabled" && <p className="text-xs text-muted-foreground">Enable the endpoint to send a test event.</p>}
              <Card className="gap-0 p-0">
                {selected.deliveries.length === 0 ? (
                  <EmptyState icon={Send} title="No deliveries yet" description="Events appear here as they are sent. Send a test event to check the endpoint now." />
                ) : (
                  <ul aria-label={`Deliveries to ${host(selected.url)}`}>
                    {selected.deliveries.map((d) => (
                      <DeliveryRow key={d.id} delivery={d} />
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          )}
        </>
      )}
    </section>
  )
}
