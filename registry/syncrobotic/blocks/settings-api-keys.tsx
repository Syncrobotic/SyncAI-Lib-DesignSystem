// @syncrobotic/settings-api-keys v0.57.0 · update: npx shadcn add @syncrobotic/settings-api-keys --overwrite
"use client"

import * as React from "react"
import { KeyRound, Plus } from "lucide-react"
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
import { Code } from "@/registry/syncrobotic/ui/code"
import { CodeBlock } from "@/registry/syncrobotic/ui/code-block"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { ScopePicker, type ScopeOption, type ScopePickerLabels } from "@/registry/syncrobotic/ui/scope-picker"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

export type ApiKey = {
  id: string
  name: string
  /** The first characters, the only part ever shown again. */
  prefix: string
  /** ISO 8601. */
  createdAt: string
  lastUsedAt?: string | null
  /** ISO 8601; none for a key that does not expire. */
  expiresAt?: string | null
  /** The permission strings the key was given. */
  scopes?: readonly string[]
}

/** A permission a key can be given: its string, and words for it. Grouped by the part before ":". */
export type ApiKeyScope = ScopeOption

export type NewApiKey = { name: string; scopes: string[]; expiresAt: string | null }

export type SettingsApiKeysLabels = {
  title: string
  description: string
  create: string
  name: string
  nameHint: string
  nameMissing: string
  scopes: string
  scopesHint: string
  /** Under a scope outside `allowedScopes`. */
  scopeAbove: string
  scopePicker?: Partial<ScopePickerLabels>
  expiry: string
  days: (days: number) => string
  never: string
  expiresOn: (date: string) => string
  cancel: string
  copyNow: string
  copyNowBody: string
  secretTitle: string
  copySecret: string
  done: string
  list: string
  created: (date: string) => string
  lastUsed: (when: string) => string
  neverUsed: string
  expires: (date: string) => string
  expired: string
  noExpiry: string
  revoke: string
  revokeName: (name: string) => string
  revokeTitle: (name: string) => string
  revokeBody: (prefix: string) => string
  keep: string
  revokeKey: string
  denied: string
  empty: string
  emptyBody: string
  failed: string
  errors: Record<string, string>
  data?: Partial<DataStateLabels>
}

export const defaultSettingsApiKeysLabels: SettingsApiKeysLabels = {
  title: "API keys",
  description: "Keys let other systems read robots and start missions as your organisation.",
  create: "Create key",
  name: "Key name",
  nameHint: "Name it after what uses it, so you know what breaks if you revoke it.",
  nameMissing: "Name the key after what uses it, e.g. Warehouse system.",
  scopes: "What it may do",
  scopesHint: "Give it only what that system needs. A key never holds more than you do.",
  scopeAbove: "Not in your own permissions, so you cannot give it.",
  expiry: "Expires",
  days: (days) => (days % 365 === 0 ? `${days / 365} ${days === 365 ? "year" : "years"}` : `${days} days`),
  never: "Never",
  expiresOn: (date) => `On ${date}`,
  cancel: "Cancel",
  copyNow: "Copy your new key now",
  copyNowBody: "You will not see it again. If you lose it, revoke it and create another.",
  secretTitle: "API key",
  copySecret: "Copy the new key",
  done: "Done, I have copied it",
  list: "API keys",
  created: (date) => `Created ${date}`,
  lastUsed: (when) => `Last used ${when}`,
  neverUsed: "Never used",
  expires: (date) => `Expires ${date}`,
  expired: "Expired",
  noExpiry: "No expiry",
  revoke: "Revoke",
  revokeName: (name) => `Revoke ${name}`,
  revokeTitle: (name) => `Revoke ${name}?`,
  revokeBody: (prefix) => `Anything using ${prefix}… stops working at once. You cannot undo this; create a new key instead.`,
  keep: "Keep key",
  revokeKey: "Revoke key",
  denied: "You need the apikeys:write permission. A project admin can grant it.",
  empty: "No API keys",
  emptyBody: "Create one for each system that reads robots or starts missions, so you can revoke it alone.",
  failed: "That did not work. Nothing was changed; try again.",
  errors: { FORBIDDEN_SCOPE: "One of these scopes is above your own permissions. Untick it and try again." },
}

const relative = (iso: string, now: number, locale?: string) => {
  const s = (Date.parse(iso) - now) / 1000
  const a = Math.abs(s)
  const rtf = new Intl.RelativeTimeFormat(locale ?? "en", { numeric: "auto" })
  if (a < 60) return rtf.format(0, "second")
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute")
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour")
  return rtf.format(Math.round(s / 86400), "day")
}

export type SettingsApiKeysContentProps = {
  keys: ListPage<ApiKey>
  query?: ListQuery
  onQueryChange?: (query: ListQuery) => void
  /** Every scope a key can hold, in the order to list them. */
  scopes: readonly ApiKeyScope[]
  /** The scopes the viewer holds and so may give; the rest show disabled with the reason. Default: all of `scopes`. */
  allowedScopes?: readonly string[]
  defaultScopes?: readonly string[]
  /** Expiry choices in days; `null` is no expiry. */
  expiryOptions?: readonly (number | null)[]
  defaultExpiry?: number | null
  /** Resolves with the secret, shown once and then dropped: never put it in a cache, a store or the URL. */
  onCreate: (key: NewApiKey) => Promise<{ secret: string }>
  onRevoke: (key: ApiKey) => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  now?: Date
  locale?: string
  timeZone?: string
  labels?: Partial<SettingsApiKeysLabels>
}

/** API keys from your data: scopes bounded by `allowedScopes`, an expiry, the secret from `onCreate` shown once. */
export function SettingsApiKeysContent({
  keys,
  query,
  onQueryChange,
  scopes,
  allowedScopes,
  defaultScopes = [],
  expiryOptions = [30, 90, 365, null],
  defaultExpiry = 90,
  onCreate,
  onRevoke,
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
}: SettingsApiKeysContentProps) {
  const l = { ...defaultSettingsApiKeysLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "apikeys:write") : true
  const allowed = (s: string) => !allowedScopes || allowedScopes.includes(s)
  const [creating, setCreating] = React.useState(false)
  const [name, setName] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>(() => defaultScopes.filter(allowed))
  const [expiry, setExpiry] = React.useState(String(defaultExpiry))
  const [errors, setErrors] = React.useState<{ name?: string; form?: string }>({})
  const [busy, setBusy] = React.useState(false)
  const [revokeError, setRevokeError] = React.useState<string | null>(null)
  // The secret lives only here, only until "Done". Never put it in a cache, a store or the URL.
  const [secret, setSecret] = React.useState<string | null>(null)
  const [clock] = React.useState(() => Date.now())
  const at = now?.getTime() ?? clock
  const date = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" })
  const say = (e: unknown) => (isStepUpCancelled(e) ? undefined : (l.errors[errorCodeOf(e) ?? ""] ?? l.failed))
  const expiresAt = (choice: string) => (choice === "null" ? null : new Date(at + Number(choice) * 86_400_000).toISOString())

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setErrors({ name: l.nameMissing })
    setBusy(true)
    try {
      const { secret: value } = await onCreate({ name: name.trim(), scopes: picked, expiresAt: expiresAt(expiry) })
      setSecret(value)
      setCreating(false)
      setName("")
      setErrors({})
    } catch (err) {
      setErrors({ form: say(err) })
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (k: ApiKey) => {
    setRevokeError(null)
    try {
      await onRevoke(k)
    } catch (err) {
      setRevokeError(say(err) ?? null)
    }
  }

  const createButton = !creating && !secret && state !== "forbidden" && (mayWrite || denied === "disabled") && (
    <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
      <Button variant="secondary" onClick={() => setCreating(true)}>
        <Plus aria-hidden="true" />
        {l.create}
      </Button>
    </PermissionGate>
  )

  const facts = (k: ApiKey) => {
    const out = [l.created(date.format(new Date(k.createdAt))), k.lastUsedAt ? l.lastUsed(relative(k.lastUsedAt, at, locale)) : l.neverUsed]
    if (k.expiresAt && Date.parse(k.expiresAt) > at) out.push(l.expires(date.format(new Date(k.expiresAt))))
    return out.join(" · ")
  }

  return (
    <section aria-labelledby="keys-title" className="flex flex-col gap-4">
      <SectionHeader id="keys-title" title={l.title} description={l.description} actions={createButton} />

      {creating && (
        <form noValidate onSubmit={(e) => void create(e)} className="flex animate-appear flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
          <Field label={l.name} hint={l.nameHint} error={errors.name}>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the form opens on a press of Create key; the name is the next thing to type */}
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          {scopes.length > 0 && (
            <ScopePicker
              legend={l.scopes}
              hint={l.scopesHint}
              scopes={scopes}
              allowedScopes={allowedScopes}
              value={picked}
              onValueChange={(v) => setPicked(v ?? [])}
              locale={locale}
              labels={{ outside: l.scopeAbove, ...l.scopePicker }}
            />
          )}
          <Field label={l.expiry} hint={expiry === "null" ? undefined : l.expiresOn(date.format(new Date(expiresAt(expiry)!)))}>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expiryOptions.map((d) => (
                  <SelectItem key={String(d)} value={String(d)}>
                    {d === null ? l.never : l.days(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              {l.create}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              {l.cancel}
            </Button>
          </div>
        </form>
      )}

      {secret && (
        <div role="status" className="flex animate-appear flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{l.copyNow}</span>
            <span className="text-sm text-muted-foreground">{l.copyNowBody}</span>
          </div>
          <CodeBlock code={secret} title={l.secretTitle} secret copyLabel={l.copySecret} />
          <Button variant="secondary" className="self-start" onClick={() => setSecret(null)}>
            {l.done}
          </Button>
        </div>
      )}

      {revokeError && (
        <p role="alert" className="text-sm text-danger">
          {revokeError}
        </p>
      )}

      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        <Card className="gap-0 p-0">
          {keys.items.length === 0 ? (
            <EmptyState size="inline" icon={KeyRound} title={l.empty} description={l.emptyBody} />
          ) : (
            <ItemGroup aria-label={l.list} className="gap-0">
              {keys.items.map((k) => {
                const expired = !!k.expiresAt && Date.parse(k.expiresAt) <= at
                return (
                  <Item key={k.id} role="listitem" className="flex-wrap rounded-none border-b border-border px-4 last:border-b-0">
                    <ItemMedia variant="plain">
                      <KeyRound aria-hidden="true" className="size-5 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="flex-wrap">
                        <span>{k.name}</span>
                        {/* Only a key that stopped working is coloured: an expiry ahead is a date in the facts. */}
                        {expired && <InlineStatus status="warning">{l.expired}</InlineStatus>}
                      </ItemTitle>
                      {/* Every fact whole: the expiry is the one that matters most and comes last. */}
                      <ItemDescription className="line-clamp-none text-xs">
                        <Code>{k.prefix}…</Code> · {facts(k)}
                      </ItemDescription>
                      {k.scopes && k.scopes.length > 0 && <ItemDescription className="font-mono text-xs">{k.scopes.join(", ")}</ItemDescription>}
                    </ItemContent>
                    {(mayWrite || denied === "disabled") && (
                      <ItemActions>
                        <AlertDialog>
                          <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied}>
                            <AlertDialogTrigger asChild>
                              {/* Neutral in the list: three red buttons at rest would shout on a calm page. Red is for the
                                  confirmation, where the key is actually revoked. */}
                              <Button variant="outline" size="sm" aria-label={l.revokeName(k.name)}>
                                {l.revoke}
                              </Button>
                            </AlertDialogTrigger>
                          </PermissionGate>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{l.revokeTitle(k.name)}</AlertDialogTitle>
                              <AlertDialogDescription>{l.revokeBody(k.prefix)}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{l.keep}</AlertDialogCancel>
                              <AlertDialogAction destructive onClick={() => void revoke(k)}>
                                {l.revokeKey}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </Card>
      </DataState>
      {query && onQueryChange && keys.total > query.limit && (
        <Pagination page={query.page - 1} pageSize={query.limit} total={keys.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
      )}
    </section>
  )
}

/** The clock the sample is written against. */
const sampleNow = new Date("2026-11-20T15:30:00+08:00")

export const sampleKeys: ApiKey[] = [
  {
    id: "k1",
    name: "Warehouse system",
    prefix: "sk_live_7f3a",
    createdAt: "2026-03-03T10:00:00+08:00",
    lastUsedAt: "2026-11-20T15:28:00+08:00",
    expiresAt: "2027-03-03T10:00:00+08:00",
    scopes: ["robots:read", "missions:write"],
  },
  { id: "k2", name: "Nightly report export", prefix: "sk_live_c2b0", createdAt: "2026-06-18T09:00:00+08:00", lastUsedAt: "2026-11-20T02:00:00+08:00", scopes: ["robots:read"] },
  { id: "k3", name: "Old test script", prefix: "sk_live_9e37", createdAt: "2026-01-09T14:00:00+08:00", lastUsedAt: null, expiresAt: "2026-04-09T14:00:00+08:00", scopes: ["robots:read"] },
]

const sampleScopes: ApiKeyScope[] = [
  { value: "robots:read", label: "Read robots", description: "Where each robot is, its state and battery." },
  { value: "missions:read", label: "Read missions", description: "Routes, schedules and results." },
  { value: "missions:write", label: "Start and stop missions", description: "Send robots on a route and call them back." },
  { value: "datasets:read", label: "Download datasets", description: "Recordings and their labels." },
  { value: "members:write", label: "Manage people", description: "Invite, remove and change roles." },
]

// The sample's stand-in for the server. A real key comes from your API once, in the create response.
const fakeSecret = (name: string) => `sk_live_${(name.length * 7919).toString(16).padStart(4, "0")}_${"x7Kq2mVb9TzR4wYp8NcH3sLd".slice(0, 24)}`

/**
 * Create, list and revoke API keys: a new secret shown once with a copy button, revoking confirmed first. The secret is
 * dropped from memory when you leave it; afterwards only its first characters are shown. Revoking says what will stop
 * working. This is SettingsApiKeysContent on sample data.
 */
export function SettingsApiKeys({ keys: initial = sampleKeys }: { keys?: ApiKey[] }) {
  const [keys, setKeys] = React.useState(initial)
  return (
    <SettingsApiKeysContent
      keys={{ items: keys, total: keys.length }}
      scopes={sampleScopes}
      allowedScopes={["robots:read", "missions:read", "missions:write", "datasets:read"]}
      defaultScopes={["robots:read"]}
      now={sampleNow}
      timeZone="Asia/Taipei"
      onCreate={async ({ name, scopes, expiresAt }) => {
        const secret = fakeSecret(name)
        setKeys((k) => [{ id: `k${k.length + 1}`, name, prefix: secret.slice(0, 12), createdAt: sampleNow.toISOString(), expiresAt, scopes }, ...k])
        return { secret }
      }}
      onRevoke={async (k) => setKeys((all) => all.filter((x) => x.id !== k.id))}
    />
  )
}
