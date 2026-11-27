// @syncrobotic/project-members v0.57.0 · update: npx shadcn add @syncrobotic/project-members --overwrite
"use client"

import * as React from "react"
import { CircleAlert, KeyRound, Server, Users, Webhook } from "lucide-react"
import { cn } from "@/lib/utils"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { formatAbsolute, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** A project role as the server defines it: its name and permission bundle. The block never reads the name. */
export type ProjectRole = { id: string; name: string; description?: string; permissions: readonly string[] }

export type ProjectMember = { id: string; name: string; email: string; roleId: string; invited?: boolean }

/** A handover the owner started and the new owner has not accepted yet. */
export type PendingOwnershipTransfer = { toMemberId: string; createdAt?: DateInput; expiresAt?: DateInput | null }

export type ProjectOwnershipTransfer = { to: ProjectMember; formerOwnerRoleId: string }

export type ProjectMembersLabels = {
  count: (total: number, formatted: string) => string
  table: string
  person: string
  role: string
  actions: string
  invited: string
  roleOf: (name: string) => string
  /** Under the owner's role: it changes only by a transfer. */
  ownerHint: string
  self: string
  locked: string
  denied: string
  remove: string
  removed: (name: string) => string
  transfer: string
  transferTitle: string
  transferBody: string
  newOwner: string
  newOwnerHint: string
  choose: string
  formerRole: string
  formerRoleHint: string
  transferSummary: (name: string, role: string) => string
  transferConfirm: string
  cancel: string
  /** Why Transfer ownership is disabled: nobody else has joined. */
  noCandidates: string
  deniedTransfer: string
  pendingTitle: (name: string) => string
  pendingBody: (until: string | null) => string
  cancelTransfer: string
  empty: string
  emptyBody: string
  failed: string
  failedBody: string
  errors: Record<string, string>
  dismiss: string
  data?: Partial<DataStateLabels>
}

export const defaultProjectMembersLabels: ProjectMembersLabels = {
  count: (total, n) => `${n} ${total === 1 ? "member" : "members"} in this project.`,
  table: "Members",
  person: "Member",
  role: "Role",
  actions: "Actions",
  invited: "Invited",
  roleOf: (name) => `Role of ${name}`,
  ownerHint: "Changes only by a transfer of ownership.",
  self: "You cannot change your own role.",
  locked: "Their role holds permissions you do not have, so only someone with them can change it.",
  denied: "You need the members:write permission. A project admin can grant it.",
  remove: "Remove from project",
  removed: (name) => `${name} removed`,
  transfer: "Transfer ownership",
  transferTitle: "Transfer ownership",
  transferBody: "The project gets one new owner, who must already be a member. Nothing changes until they accept.",
  newOwner: "New owner",
  newOwnerHint: "Only people who have joined; an invitation that is not accepted cannot own a project.",
  choose: "Choose a member",
  formerRole: "Your role afterwards",
  formerRoleHint: "What you keep once they accept.",
  transferSummary: (name, role) => `${name} becomes the owner when they accept, and you become ${role}.`,
  transferConfirm: "Transfer ownership",
  cancel: "Cancel",
  noCandidates: "Nobody else has joined yet. Ownership goes only to a member: invite someone first.",
  deniedTransfer: "You need the project:transfer-ownership permission.",
  pendingTitle: (name) => `Waiting for ${name} to accept ownership`,
  pendingBody: (until) => `Nothing changes until they accept. You stay the owner${until ? `; the offer lapses on ${until}` : ""}.`,
  cancelTransfer: "Cancel transfer",
  empty: "No members yet",
  emptyBody: "Invite the people who work in this project; they sign in with their own account.",
  failed: "That did not work",
  failedBody: "Nothing was changed. Try again.",
  errors: {},
  dismiss: "Dismiss",
}

const initials = (u: ProjectMember) =>
  (u.name || u.email)
    .split(/[ .@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("")

export type ProjectMembersContentProps = {
  members: ListPage<ProjectMember>
  query?: ListQuery
  onQueryChange?: (query: ListQuery) => void
  /** Highest first, the owner's among them. Names and bundles come from the server; none is assumed. */
  roles: readonly ProjectRole[]
  /** The role that makes its holder the owner. It is never offered in a role picker: only a transfer gives it. */
  ownerRoleId: string
  /** Whether the viewer may give a role. Default: every permission in its bundle passes `can`. */
  canAssign?: (role: ProjectRole) => boolean
  currentUserId?: string
  onRoleChange: (member: ProjectMember, roleId: string) => Promise<void>
  onRemove?: (member: ProjectMember) => Promise<void>
  /** Starts a handover; run it through your step-up. Shown to the owner only. */
  onTransfer?: (transfer: ProjectOwnershipTransfer) => Promise<void>
  pendingTransfer?: PendingOwnershipTransfer | null
  onCancelTransfer?: () => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string; transfer?: string }
  denied?: "disabled" | "hidden"
  locale?: string
  timeZone?: string
  labels?: Partial<ProjectMembersLabels>
}

/**
 * A project's members from your data: the owner's row, roles changed in place and bounded by the viewer's own
 * permissions, and ownership handed to an existing member, the old owner choosing the role they keep.
 */
export function ProjectMembersContent({
  members,
  query,
  onQueryChange,
  roles,
  ownerRoleId,
  canAssign,
  currentUserId,
  onRoleChange,
  onRemove,
  onTransfer,
  pendingTransfer,
  onCancelTransfer,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  locale,
  timeZone,
  labels,
}: ProjectMembersContentProps) {
  const l = { ...defaultProjectMembersLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "members:write") : true
  const mayTransfer = can ? can(permissions?.transfer ?? "project:transfer-ownership") : true
  const assignable = (r: ProjectRole) => r.id !== ownerRoleId && (canAssign ? canAssign(r) : can ? r.permissions.every(can) : true)
  const roleById = (id: string) => roles.find((r) => r.id === id)
  const lesser = roles.filter((r) => r.id !== ownerRoleId)
  const owner = members.items.find((m) => m.roleId === ownerRoleId)
  const isOwner = !!owner && owner.id === currentUserId
  // Ownership goes to someone already in: not an open invitation, not the owner.
  const candidates = members.items.filter((m) => m.roleId !== ownerRoleId && !m.invited)
  const pendingTo = pendingTransfer ? members.items.find((m) => m.id === pendingTransfer.toMemberId) : undefined

  const [failure, setFailure] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [to, setTo] = React.useState("")
  const [former, setFormer] = React.useState(lesser[0]?.id ?? "")
  const [busy, setBusy] = React.useState(false)
  const [dialogError, setDialogError] = React.useState<string | null>(null)
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

  const transfer = async () => {
    const target = candidates.find((m) => m.id === to)
    if (!onTransfer || !target || !former) return
    setBusy(true)
    setDialogError(null)
    try {
      await onTransfer({ to: target, formerOwnerRoleId: former })
      setOpen(false)
      setTo("")
    } catch (e) {
      // A cancelled step-up never ran the transfer: the dialog stays as it was, with nothing to say.
      setDialogError(say(e))
    } finally {
      setBusy(false)
    }
  }

  const transferButton = onTransfer && isOwner && !pendingTransfer && (mayTransfer || denied === "disabled") && (
    <PermissionGate allowed={mayTransfer && candidates.length > 0} mode="disabled" reason={mayTransfer ? l.noCandidates : l.deniedTransfer}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setDialogError(null)
          setOpen(true)
        }}
      >
        {l.transfer}
      </Button>
    </PermissionGate>
  )

  const name = (m?: ProjectMember) => (m ? m.name || m.email : (pendingTransfer?.toMemberId ?? ""))
  const ready = state === "ready" || state === "stale"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{ready ? l.count(members.total, formatCount(members.total, { locale })) : null}</p>
        {ready && transferButton}
      </div>

      {ready && pendingTransfer && (
        <Alert data-slot="project-members-pending">
          <AlertTitle>{l.pendingTitle(name(pendingTo))}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{l.pendingBody(pendingTransfer.expiresAt ? formatAbsolute(pendingTransfer.expiresAt, { locale, timeZone, precision: "date" }) : null)}</span>
            {onCancelTransfer && isOwner && (
              <Button variant="secondary" size="sm" onClick={() => void run(onCancelTransfer)}>
                {l.cancelTransfer}
              </Button>
            )}
          </AlertDescription>
        </Alert>
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
              const who = u.name || u.email
              const current = roleById(u.roleId)
              const self = u.id === currentUserId
              const isOwnerRow = u.roleId === ownerRoleId
              const locked = isOwnerRow || self || (!!current && !assignable(current))
              const why = isOwnerRow ? l.ownerHint : self ? l.self : mayWrite ? l.locked : l.denied
              return (
                <TableRow key={u.id} data-owner={isOwnerRow || undefined}>
                  <TableCell className="w-full max-w-0 py-2 whitespace-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="hidden sm:flex">
                        <AvatarFallback>{initials(u)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col items-start">
                        {u.name ? <span className="max-w-full truncate font-medium">{u.name}</span> : <span className="text-muted-foreground">{l.invited}</span>}
                        <span className={cn("max-w-full text-xs wrap-anywhere", u.name ? "text-muted-foreground" : "mt-1 font-medium text-foreground")}>{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4">
                    {mayWrite && !locked ? (
                      <Select value={u.roleId} onValueChange={(v) => void run(() => onRoleChange(u, v))}>
                        <SelectTrigger aria-label={l.roleOf(who)} className="h-(--h-sm)">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lesser.map((r) => (
                            <SelectItem key={r.id} value={r.id} disabled={r.id !== u.roleId && !assignable(r)}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="flex flex-col">
                        <span className={cn(isOwnerRow && "font-medium")}>{current?.name}</span>
                        {(isOwnerRow || mayWrite || denied === "disabled") && <span className="text-xs text-muted-foreground">{why}</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableActionsCell>
                    {onRemove && !self && !isOwnerRow && (mayWrite || denied === "disabled") && (
                      <DropdownMenu>
                        <DropdownMenuMoreTrigger name={who} size="icon-sm" />
                        <DropdownMenuContent align="end">
                          <PermissionGate allowed={mayWrite && !locked} mode="disabled" reason={mayWrite ? l.locked : l.denied}>
                            <DropdownMenuItem destructive onSelect={() => void run(() => onRemove(u))}>
                              {l.remove}
                            </DropdownMenuItem>
                          </PermissionGate>
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

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l.transferTitle}</DialogTitle>
            <DialogDescription>{l.transferBody}</DialogDescription>
          </DialogHeader>
          <Field label={l.newOwner} hint={l.newOwnerHint}>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger data-slot="project-members-new-owner">
                <SelectValue placeholder={l.choose} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={l.formerRole} hint={roleById(former)?.description ?? l.formerRoleHint}>
            <Select value={former} onValueChange={setFormer}>
              <SelectTrigger data-slot="project-members-former-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lesser.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {to && former && (
            <p className="text-sm text-muted-foreground" data-slot="project-members-summary">
              {l.transferSummary(name(candidates.find((m) => m.id === to)), roleById(former)?.name ?? "")}
            </p>
          )}
          {dialogError && (
            <p role="alert" className="text-sm text-danger">
              {dialogError}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              {l.cancel}
            </Button>
            <Button loading={busy} disabled={!to || !former} onClick={() => void transfer()}>
              {l.transferConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const sampleRoles: ProjectRole[] = [
  { id: "owner", name: "Owner", description: "Everything, including deleting the project", permissions: ["project:delete", "project:transfer-ownership", "members:write", "devices:write"] },
  { id: "admin", name: "Admin", description: "Members, devices, keys and webhooks", permissions: ["members:write", "devices:write"] },
  { id: "member", name: "Member", description: "Work with the project's resources", permissions: ["resources:write"] },
  { id: "viewer", name: "Viewer", description: "See everything, change nothing", permissions: ["project:read"] },
]

const sampleMembers: ProjectMember[] = [
  { id: "u1", name: "Mei Lin", email: "mei.lin@example.com", roleId: "owner" },
  { id: "u2", name: "Kai Chen", email: "kai@example.com", roleId: "admin" },
  { id: "u3", name: "Ana Ruiz", email: "ana@example.com", roleId: "member" },
  { id: "u4", name: "Tom Okafor", email: "tom@example.com", roleId: "viewer" },
  { id: "u5", name: "", email: "night.shift@example.com", roleId: "viewer", invited: true },
]

export const projectNav: AppNavGroup[] = [
  {
    label: "Project",
    items: [
      { label: "Devices", href: "#devices", icon: Server },
      { label: "Members", href: "#members", icon: Users },
      { label: "API keys", href: "#api-keys", icon: KeyRound },
      { label: "Webhooks", href: "#webhooks", icon: Webhook },
    ],
  },
]

/**
 * A project's members: the owner's row, roles changed in place within the viewer's own permissions, and ownership
 * handed to an existing member, who must accept. This is ProjectMembersContent on sample data, in a sample shell.
 */
export function ProjectMembers() {
  const [list, setList] = React.useState(sampleMembers)
  const [pending, setPending] = React.useState<PendingOwnershipTransfer | null>(null)
  return (
    <AppShell product="Device console" nav={projectNav} current="#members" title="Members" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <ProjectMembersContent
          members={{ items: list, total: list.length }}
          roles={sampleRoles}
          ownerRoleId="owner"
          currentUserId="u1"
          timeZone="Asia/Taipei"
          onRoleChange={async (u, roleId) => setList((all) => all.map((x) => (x.id === u.id ? { ...x, roleId } : x)))}
          onRemove={async (u) => setList((all) => all.filter((x) => x.id !== u.id))}
          onTransfer={async ({ to }) => setPending({ toMemberId: to.id, expiresAt: "2026-12-04T00:00:00Z" })}
          pendingTransfer={pending}
          onCancelTransfer={async () => setPending(null)}
        />
      </div>
    </AppShell>
  )
}
