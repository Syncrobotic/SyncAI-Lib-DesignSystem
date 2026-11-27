// @syncrobotic/users-roles v0.53.0 · update: npx shadcn add @syncrobotic/users-roles --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CircleAlert, UserPlus, Users } from "lucide-react"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

/** A role as the server defines it: its name and the permission strings it bundles. The block never reads the name. */
export type MemberRole = { id: string; name: string; description?: string; permissions: readonly string[] }

export type Member = { id: string; name: string; email: string; roleId: string; invited?: boolean }

export type UsersRolesLabels = {
  /** The line above the table, from the server's total. */
  count: (total: number, formatted: string) => string
  invite: string
  inviteTitle: string
  inviteBody: string
  email: string
  emailInvalid: string
  role: string
  sendInvite: string
  /** Under an option the viewer may not give: it holds permissions they lack. */
  above: string
  table: string
  person: string
  actions: string
  invited: string
  roleOf: (name: string) => string
  resend: string
  resent: string
  activity: string
  remove: string
  removed: (name: string) => string
  undo: string
  /** Why the role and remove are disabled for a viewer without the write permission. */
  denied: string
  /** Why one person's role is locked: theirs is above the viewer's, or it is the viewer. */
  locked: string
  self: string
  empty: string
  emptyBody: string
  sent: string
  failed: string
  failedBody: string
  errors: Record<string, string>
  dismiss: string
  data?: Partial<DataStateLabels>
}

export const defaultUsersRolesLabels: UsersRolesLabels = {
  count: (total, n) => `${n} ${total === 1 ? "person" : "people"} can sign in to this site.`,
  invite: "Invite",
  inviteTitle: "Invite someone",
  inviteBody: "They get an email with a link that works for 7 days.",
  email: "Email",
  emailInvalid: "Enter an email address, e.g. name@example.com",
  role: "Role",
  sendInvite: "Send invitation",
  above: "Holds permissions you do not have, so you cannot give it.",
  table: "People",
  person: "Person",
  actions: "Actions",
  invited: "Invited",
  roleOf: (name) => `Role of ${name}`,
  resend: "Resend invitation",
  resent: "Invitation sent again",
  activity: "View activity",
  remove: "Remove from site",
  removed: (name) => `${name} removed`,
  undo: "Undo",
  denied: "You need the members:write permission. A project admin can grant it.",
  locked: "Their role holds permissions you do not have, so only someone with them can change it.",
  self: "You cannot change your own role.",
  empty: "Nobody here yet",
  emptyBody: "Invite the people who run this site; they sign in with their own account.",
  sent: "Invitation sent",
  failed: "That did not work",
  failedBody: "Nothing was changed. Try again.",
  errors: {},
  dismiss: "Dismiss",
}

const initials = (u: Member) =>
  (u.name || u.email)
    .split(/[ .@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("")

/** A long email wraps before its @, not in the middle of a word. */
const breakAtSign = (email: string) => {
  const at = email.indexOf("@")
  return at < 0 ? (
    email
  ) : (
    <>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </>
  )
}

export type UsersRolesContentProps = {
  /** One page of people and the server's count of all of them. */
  members: ListPage<Member>
  /** With `onQueryChange`, pages through `members.total`. */
  query?: ListQuery
  onQueryChange?: (query: ListQuery) => void
  /** Highest first. Names and bundles come from the server; none is assumed. */
  roles: readonly MemberRole[]
  /** Whether the viewer may give a role. Default: every permission in its bundle passes `can`, so no one gives more than they hold. */
  canAssign?: (role: MemberRole) => boolean
  /** The viewer: their own role is locked and they cannot remove themselves here. */
  currentUserId?: string
  /** The role an invitation starts on; default the lowest the viewer may give. */
  inviteRoleId?: string
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  onRoleChange: (member: Member, roleId: string) => Promise<void>
  onInvite?: (invite: { email: string; roleId: string }) => Promise<void>
  /** With `onRestore`, the toast after removing offers Undo. Mount a Toaster once in your app. */
  onRemove?: (member: Member) => Promise<void>
  onRestore?: (member: Member) => Promise<void>
  onResend?: (member: Member) => Promise<void>
  onViewActivity?: (member: Member) => void
  locale?: string
  labels?: Partial<UsersRolesLabels>
}

/** Change a role in place, invite and remove, from your data. Roles and their permission bundles are props. */
export function UsersRolesContent({
  members,
  query,
  onQueryChange,
  roles,
  canAssign,
  currentUserId,
  inviteRoleId,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  onRoleChange,
  onInvite,
  onRemove,
  onRestore,
  onResend,
  onViewActivity,
  locale,
  labels,
}: UsersRolesContentProps) {
  const l = { ...defaultUsersRolesLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "members:write") : true
  const assignable = (r: MemberRole) => (canAssign ? canAssign(r) : can ? r.permissions.every(can) : true)
  const lowest = [...roles].reverse().find(assignable)
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState(inviteRoleId ?? lowest?.id ?? "")
  const [inviteError, setInviteError] = React.useState<string>()
  const [sending, setSending] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)
  const roleById = (id: string) => roles.find((r) => r.id === id)
  const say = (e: unknown) => (isStepUpCancelled(e) ? null : (l.errors[errorCodeOf(e) ?? ""] ?? l.failedBody))

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

  const invite = async () => {
    if (!onInvite) return
    if (!/^\S+@\S+\.\S+$/.test(email)) return setInviteError(l.emailInvalid)
    setSending(true)
    try {
      await onInvite({ email, roleId: role })
      toast({ tone: "success", title: l.sent, description: email })
      setEmail("")
      setInviteError(undefined)
      setOpen(false)
    } catch (e) {
      const said = say(e)
      if (said) setInviteError(said)
    } finally {
      setSending(false)
    }
  }

  const remove = async (u: Member) => {
    if (!onRemove || !(await run(() => onRemove(u)))) return
    toast({ title: l.removed(u.name || u.email), action: onRestore ? { label: l.undo, onClick: () => void run(() => onRestore(u)) } : undefined })
  }

  const roleOptions = (current?: string) =>
    roles.map((r) => (
      <SelectItem key={r.id} value={r.id} disabled={r.id !== current && !assignable(r)}>
        {r.name}
      </SelectItem>
    ))

  const inviteButton = onInvite && (mayWrite || denied === "disabled") && (
    <Dialog open={open} onOpenChange={setOpen}>
      <PermissionGate allowed={mayWrite} mode={denied} reason={l.denied}>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus aria-hidden="true" /> {l.invite}
          </Button>
        </DialogTrigger>
      </PermissionGate>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{l.inviteTitle}</DialogTitle>
          <DialogDescription>{l.inviteBody}</DialogDescription>
        </DialogHeader>
        <Field label={l.email} error={inviteError}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={l.role} hint={roleById(role)?.description}>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{roleOptions()}</SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button loading={sending} onClick={() => void invite()}>
            {l.sendInvite}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{state === "ready" || state === "stale" ? l.count(members.total, formatCount(members.total, { locale })) : null}</p>
        {state !== "forbidden" && inviteButton}
      </div>
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
      <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
        <Table aria-label={l.table}>
          <TableHeader>
            <TableRow>
              <TableHead>{l.person}</TableHead>
              <TableHead className="w-32 px-2 sm:w-44 sm:px-4">{l.role}</TableHead>
              <TableHead className="w-0 pr-2 pl-0 sm:px-4">
                <span className="sr-only">{l.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-auto py-4 whitespace-normal">
                  <EmptyState size="inline" icon={Users} title={l.empty} description={l.emptyBody} />
                </TableCell>
              </TableRow>
            )}
            {members.items.map((u) => {
              const name = u.name || u.email
              const current = roleById(u.roleId)
              const self = u.id === currentUserId
              // A role above the viewer's is theirs to keep: changing it would let someone take away what they lack.
              const locked = self || (!!current && !assignable(current))
              const select = (
                <Select value={u.roleId} disabled={!mayWrite || locked} onValueChange={(v) => void run(() => onRoleChange(u, v))}>
                  <SelectTrigger aria-label={l.roleOf(name)} className="h-(--h-sm)">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{roleOptions(u.roleId)}</SelectContent>
                </Select>
              )
              return (
                <TableRow key={u.id}>
                  {/* w-full max-w-0: the person takes what the role and menu leave, and a long email wraps instead of pushing the role off a phone. */}
                  <TableCell className="w-full max-w-0 py-2 whitespace-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="hidden sm:flex">
                        <AvatarFallback>{initials(u)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col items-start">
                        {/* Someone invited has no name yet: the word Invited takes the name's line, in plain grey (a state, not a
                            category, so no badge), and the email its own, whole, so it is never cut short beside it. */}
                        {u.name ? <span className="max-w-full truncate font-medium">{u.name}</span> : <span className="text-muted-foreground">{l.invited}</span>}
                        <span className={cn("max-w-full text-xs wrap-break-word", u.name ? "text-muted-foreground" : "mt-1 font-medium text-foreground")}>
                          {breakAtSign(u.email)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4">
                    {mayWrite && !locked ? (
                      select
                    ) : (
                      // Read-only for this viewer: the role as text, and the reason on the line under it.
                      <span className="flex flex-col">
                        <span>{current?.name}</span>
                        {(mayWrite || denied === "disabled") && <span className="text-xs text-muted-foreground">{self ? l.self : mayWrite ? l.locked : l.denied}</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableActionsCell>
                    {(onResend || onViewActivity || onRemove) && (
                      <DropdownMenu>
                        <DropdownMenuMoreTrigger name={name} size="icon-sm" />
                        <DropdownMenuContent align="end">
                          {u.invited && onResend && mayWrite && (
                            <DropdownMenuItem
                              onSelect={() =>
                                void run(() => onResend(u)).then((ok) => {
                                  if (ok) toast({ title: l.resent, description: u.email })
                                })
                              }
                            >
                              {l.resend}
                            </DropdownMenuItem>
                          )}
                          {onViewActivity && <DropdownMenuItem onSelect={() => onViewActivity(u)}>{l.activity}</DropdownMenuItem>}
                          {onRemove && !self && (mayWrite || denied === "disabled") && (
                            <>
                              <DropdownMenuSeparator />
                              <PermissionGate allowed={mayWrite && !locked} mode="disabled" reason={mayWrite ? l.locked : l.denied}>
                                <DropdownMenuItem destructive onSelect={() => void remove(u)}>
                                  {l.remove}
                                </DropdownMenuItem>
                              </PermissionGate>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableActionsCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataState>
      {query && onQueryChange && members.total > query.limit && (
        <Pagination page={query.page - 1} pageSize={query.limit} total={members.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
      )}
    </div>
  )
}

const sampleRoles: MemberRole[] = [
  { id: "admin", name: "Admin", description: "Everything, including users and billing", permissions: ["members:write", "devices:write", "billing:write"] },
  { id: "operator", name: "Operator", description: "Run missions and stop or release robots", permissions: ["devices:write"] },
  { id: "viewer", name: "Viewer", description: "See everything, change nothing", permissions: ["devices:read"] },
]

const sampleMembers: Member[] = [
  { id: "u1", name: "Mei Lin", email: "mei@example.com", roleId: "admin" },
  { id: "u2", name: "Kai Chen", email: "kai@example.com", roleId: "operator" },
  { id: "u3", name: "Ana Ruiz", email: "ana@example.com", roleId: "operator" },
  { id: "u4", name: "", email: "night.shift@example.com", roleId: "viewer", invited: true },
]

/**
 * Who can do what: change a role in place, invite by email in a dialog, remove from the row menu with undo. The row
 * menu puts remove last, after a separator. This is UsersRolesContent on sample data, in a sample shell.
 */
export function UsersRoles() {
  const [users, setUsers] = React.useState(sampleMembers)
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#users" title="Users" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <UsersRolesContent
          members={{ items: users, total: users.length }}
          roles={sampleRoles}
          onRoleChange={async (u, roleId) => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, roleId } : x)))}
          onInvite={async ({ email, roleId }) => setUsers((u) => [...u, { id: crypto.randomUUID(), name: "", email, roleId, invited: true }])}
          onRemove={async (u) => setUsers((list) => list.filter((x) => x.id !== u.id))}
          onRestore={async (u) => setUsers((list) => [...list, u])}
          onResend={async () => {}}
          onViewActivity={() => {}}
        />
      </div>
      <Toaster />
    </AppShell>
  )
}
