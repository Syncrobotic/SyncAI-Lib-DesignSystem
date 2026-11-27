// @syncrobotic/users-invitations v0.55.0 · update: npx shadcn add @syncrobotic/users-invitations --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Mail, Send, Trash2 } from "lucide-react"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

/** A role offered to an invitee: its name, what it allows in words, and its permission strings. */
export type InvitationRole = { id: string; name: string; description?: string; permissions: readonly string[] }

export type Invitation = {
  id: string
  email: string
  roleId: string
  invitedBy: string
  /** ISO 8601. */
  sentAt: string
  /** ISO 8601. Past `now`, the invitation reads as expired. */
  expiresAt: string
}

export type UsersInvitationsLabels = {
  inviteTitle: string
  email: string
  emailInvalid: string
  duplicate: string
  role: string
  send: string
  pending: string
  table: string
  columns: { email: string; role: string; by: string; expires: string }
  /** "Mei Lin, 12 Nov". */
  by: (name: string, sent: string) => string
  expired: string
  expiredOn: (date: string) => string
  sendAgain: string
  sendAgainTo: (email: string) => string
  revoke: string
  sent: string
  resent: string
  revoked: (email: string) => string
  undo: string
  denied: string
  empty: string
  emptyBody: string
  failed: string
  failedBody: string
  errors: Record<string, string>
  dismiss: string
  data?: Partial<DataStateLabels>
}

export const defaultUsersInvitationsLabels: UsersInvitationsLabels = {
  inviteTitle: "Invite someone",
  email: "Email",
  emailInvalid: "Enter an email address, e.g. name@example.com",
  duplicate: "This person already has an invitation. Send it again from the list.",
  role: "Role",
  send: "Send invitation",
  pending: "Pending",
  table: "Pending invitations",
  columns: { email: "Email", role: "Role", by: "Invited by", expires: "Expires" },
  by: (name, sent) => `${name}, ${sent}`,
  expired: "Expired",
  expiredOn: (date) => `Expired ${date}`,
  sendAgain: "Send again",
  sendAgainTo: (email) => `Send again to ${email}`,
  revoke: "Revoke",
  sent: "Invitation sent",
  resent: "Invitation sent again",
  revoked: (email) => `Invitation for ${email} revoked`,
  undo: "Undo",
  denied: "You need the members:write permission. A project admin can grant it.",
  empty: "No pending invitations",
  emptyBody: "Everyone you invited has joined. Invite someone above.",
  failed: "That did not work",
  failedBody: "Nothing was changed. Try again.",
  errors: { CONFLICT: "This person already has an invitation. Send it again from the list." },
  dismiss: "Dismiss",
}

const relative = (iso: string, now: number, locale?: string) => {
  const s = (Date.parse(iso) - now) / 1000
  const rtf = new Intl.RelativeTimeFormat(locale ?? "en", { numeric: "auto" })
  if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), "minute")
  if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), "hour")
  return rtf.format(Math.round(s / 86400), "day")
}

export type UsersInvitationsContentProps = {
  invitations: ListPage<Invitation>
  query?: ListQuery
  onQueryChange?: (query: ListQuery) => void
  /** Highest first; the block offers only those `canAssign` allows (default: every permission in the bundle passes `can`). */
  roles: readonly InvitationRole[]
  canAssign?: (role: InvitationRole) => boolean
  inviteRoleId?: string
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  onInvite: (invite: { email: string; roleId: string }) => Promise<void>
  onResend?: (invitation: Invitation) => Promise<void>
  /** With `onRestore`, the toast offers Undo. Mount a Toaster once in your app. */
  onRevoke?: (invitation: Invitation) => Promise<void>
  onRestore?: (invitation: Invitation) => Promise<void>
  /** The clock expiry is measured from; default the browser's. */
  now?: Date
  locale?: string
  timeZone?: string
  labels?: Partial<UsersInvitationsLabels>
}

/** Pending invitations and the invite form, from your data: dates through Intl, actions as callbacks. */
export function UsersInvitationsContent({
  invitations,
  query,
  onQueryChange,
  roles,
  canAssign,
  inviteRoleId,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  onInvite,
  onResend,
  onRevoke,
  onRestore,
  now,
  locale,
  timeZone,
  labels,
}: UsersInvitationsContentProps) {
  const l = { ...defaultUsersInvitationsLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "members:write") : true
  const assignable = (r: InvitationRole) => (canAssign ? canAssign(r) : can ? r.permissions.every(can) : true)
  const offered = roles.filter(assignable)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState(inviteRoleId ?? offered.at(-1)?.id ?? "")
  const [fieldError, setFieldError] = React.useState<string>()
  const [sending, setSending] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)
  const [clock] = React.useState(() => Date.now())
  const at = now?.getTime() ?? clock
  const day = new Intl.DateTimeFormat(locale ?? "en-GB", { timeZone, day: "numeric", month: "short" })
  const say = (e: unknown) => (isStepUpCancelled(e) ? null : (l.errors[errorCodeOf(e) ?? ""] ?? l.failedBody))
  const expired = (i: Invitation) => Date.parse(i.expiresAt) <= at
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id

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

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFieldError(l.emailInvalid)
    if (invitations.items.some((i) => i.email === email)) return setFieldError(l.duplicate)
    setSending(true)
    try {
      await onInvite({ email, roleId: role })
      toast({ tone: "success", title: l.sent, description: email })
      setEmail("")
      setFieldError(undefined)
    } catch (err) {
      const said = say(err)
      if (said) setFieldError(said)
    } finally {
      setSending(false)
    }
  }

  const resend = (i: Invitation) =>
    onResend &&
    void run(() => onResend(i)).then((ok) => {
      if (ok) toast({ title: l.resent, description: i.email })
    })
  const revoke = (i: Invitation) =>
    onRevoke &&
    void run(() => onRevoke(i)).then((ok) => {
      if (ok) toast({ title: l.revoked(i.email), action: onRestore ? { label: l.undo, onClick: () => void run(() => onRestore(i)) } : undefined })
    })

  // An expired invitation says so with the warning shape and word; one that is still open is a quiet date.
  const expiry = (i: Invitation) =>
    expired(i) ? (
      <InlineStatus status="warning">{l.expiredOn(day.format(new Date(i.expiresAt)))}</InlineStatus>
    ) : (
      <span className="text-muted-foreground">{relative(i.expiresAt, at, locale)}</span>
    )

  return (
    <div className="flex flex-col gap-6">
      {(mayWrite || denied === "disabled") && state !== "forbidden" && (
        <PermissionGate allowed={mayWrite} mode="read-only" reason={l.denied}>
          <form noValidate onSubmit={(e) => void send(e)} className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
            <SectionHeader variant="surface" as="h2" title={l.inviteTitle} />
            <div className="grid items-start gap-3 sm:grid-cols-[1fr_12rem_auto]">
              <Field label={l.email} error={fieldError}>
                <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label={l.role} hint={roles.find((r) => r.id === role)?.description}>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {offered.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {/* A blank line the height of a label, so the button lines up with the fields. */}
              <div className="flex flex-col gap-2">
                <span aria-hidden="true" className="hidden h-5 sm:block" />
                <Button type="submit" loading={sending}>
                  {l.send}
                </Button>
              </div>
            </div>
          </form>
        </PermissionGate>
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

      <section aria-labelledby="pending-title" className="flex flex-col gap-3">
        <SectionHeader id="pending-title" title={l.pending} count={state === "ready" || state === "stale" ? invitations.total : undefined} />
        <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
          {/* One list of columns: the email is the row's title, the role the line under it, an expiry its trailing state. */}
          <ResponsiveTable
            label={l.table}
            rows={invitations.items}
            rowKey={(i) => i.id}
            columns={[
              { id: "email", header: l.columns.email, cell: (i) => <span className="font-medium">{i.email}</span>, phoneCell: (i) => i.email },
              { id: "role", header: l.columns.role, cell: (i) => roleName(i.roleId) },
              {
                id: "by",
                header: l.columns.by,
                cell: (i) => l.by(i.invitedBy, day.format(new Date(i.sentAt))),
                phone: "hidden",
                className: "hidden text-muted-foreground lg:table-cell",
              },
              {
                id: "expires",
                header: l.columns.expires,
                phone: "trailing",
                cell: expiry,
                phoneCell: (i) => (expired(i) ? <InlineStatus status="warning">{l.expired}</InlineStatus> : undefined),
              },
            ]}
            // An expired invitation offers to send it again in view; every row has both actions in its ⋯ menu.
            rowActions={
              mayWrite && (onResend || onRevoke)
                ? (i) => (
                    <span className="flex items-center gap-2">
                      {expired(i) && onResend && (
                        <Button size="sm" variant="secondary" onClick={() => resend(i)} aria-label={l.sendAgainTo(i.email)}>
                          {l.sendAgain}
                        </Button>
                      )}
                      <DropdownMenu modal={false}>
                        <DropdownMenuMoreTrigger name={i.email} size="icon-sm" />
                        <DropdownMenuContent align="end">
                          {onResend && (
                            <DropdownMenuItem onSelect={() => resend(i)}>
                              <Send aria-hidden="true" /> {l.sendAgain}
                            </DropdownMenuItem>
                          )}
                          {onRevoke && (
                            <DropdownMenuItem destructive onSelect={() => revoke(i)}>
                              <Trash2 aria-hidden="true" /> {l.revoke}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  )
                : undefined
            }
            empty={<EmptyState size="inline" icon={Mail} title={l.empty} description={l.emptyBody} />}
          />
        </DataState>
        {query && onQueryChange && invitations.total > query.limit && (
          <Pagination page={query.page - 1} pageSize={query.limit} total={invitations.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
        )}
      </section>
    </div>
  )
}

const sampleRoles: InvitationRole[] = [
  { id: "supervisor", name: "Supervisor", description: "Everything an Operator does, plus schedules and routes.", permissions: ["devices:write", "routes:write"] },
  { id: "operator", name: "Operator", description: "Runs missions, acknowledges alarms, stops and releases robots.", permissions: ["devices:write"] },
  { id: "viewer", name: "Viewer", description: "Sees robots, maps and logs; changes nothing.", permissions: ["devices:read"] },
]

/** The clock the sample is written against. */
const sampleNow = new Date("2026-11-20T10:00:00+08:00")

const sampleInvitations: Invitation[] = [
  { id: "i1", email: "night.shift@example.com", roleId: "operator", invitedBy: "Mei Lin", sentAt: "2026-11-20T09:00:00+08:00", expiresAt: "2026-11-27T09:00:00+08:00" },
  { id: "i2", email: "contractor@partner.example", roleId: "viewer", invitedBy: "Kai Chen", sentAt: "2026-11-12T11:00:00+08:00", expiresAt: "2026-11-22T11:00:00+08:00" },
  { id: "i3", email: "ana.ruiz@example.com", roleId: "supervisor", invitedBy: "Mei Lin", sentAt: "2026-11-03T15:00:00+08:00", expiresAt: "2026-11-10T15:00:00+08:00" },
]

/**
 * Pending invitations: invite in one row with what the role allows, then the list, where expired ones say so and
 * revoking can be undone. A table where there is room, a list on a phone; an expired invitation offers to send it
 * again. This is UsersInvitationsContent on sample data, in a sample shell.
 */
export function UsersInvitations() {
  const [invites, setInvites] = React.useState(sampleInvitations)
  const week = (from: number) => new Date(from + 7 * 86_400_000).toISOString()
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#invitations" title="Invitations" user={sampleUser}>
      <UsersInvitationsContent
        invitations={{ items: invites, total: invites.length }}
        roles={sampleRoles}
        inviteRoleId="operator"
        now={sampleNow}
        timeZone="Asia/Taipei"
        onInvite={async ({ email, roleId }) =>
          setInvites((l) => [{ id: crypto.randomUUID(), email, roleId, invitedBy: "Mei Lin", sentAt: sampleNow.toISOString(), expiresAt: week(sampleNow.getTime()) }, ...l])
        }
        onResend={async (i) => setInvites((l) => l.map((x) => (x.id === i.id ? { ...x, sentAt: sampleNow.toISOString(), expiresAt: week(sampleNow.getTime()) } : x)))}
        onRevoke={async (i) => setInvites((l) => l.filter((x) => x.id !== i.id))}
        onRestore={async (i) => setInvites((l) => [...l, i])}
      />
      <Toaster />
    </AppShell>
  )
}
