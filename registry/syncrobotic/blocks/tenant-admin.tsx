// @syncrobotic/tenant-admin v0.57.0 · update: npx shadcn add @syncrobotic/tenant-admin --overwrite
"use client"

import * as React from "react"
import { Building2, CircleAlert, Search, ShieldCheck, Undo2, Users } from "lucide-react"
import { useSearchText } from "@/registry/syncrobotic/hooks/use-list-query"
import { errorCodeOf, isStepUpCancelled } from "@/registry/syncrobotic/hooks/use-step-up"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import type { ListPage, ListQuery } from "@/registry/syncrobotic/lib/list-query"
import { formatAbsolute, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { AllOrSomeField, type AllOrSomeFieldLabels, type AllOrSomeOption } from "@/registry/syncrobotic/ui/all-or-some-field"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/registry/syncrobotic/ui/item"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { PermissionGate } from "@/registry/syncrobotic/ui/permission-gate"
import { QuotaField, type QuotaFieldLabels } from "@/registry/syncrobotic/ui/quota-field"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** A tenant's project with its quotas. `deviceSeats: null` is unlimited; `licensedModules: null` is all, including future ones. */
export type TenantProject = {
  id: string
  name: string
  slug?: string
  owner?: string
  /** Devices enrolled now, from the server. */
  devices: number
  deviceSeats: number | null
  licensedModules: readonly string[] | null
}

/** A soft-deleted project. `restorableUntil` is the server's deadline, shown as given and never worked out here. */
export type DeletedTenantProject = { id: string; name: string; slug?: string; deletedAt: DateInput; restorableUntil: DateInput; deletedBy?: string }

export type TenantAdminLabels = {
  count: (total: number, formatted: string) => string
  search: string
  searchPlaceholder: string
  table: string
  project: string
  devices: string
  modules: string
  actions: string
  seatsOf: (devices: string, seats: string) => string
  seatsUnlimited: (devices: string) => string
  over: (by: string) => string
  allModules: string
  noModules: string
  moduleCount: (n: number, formatted: string) => string
  editSeats: string
  editModules: string
  seatsTitle: (project: string) => string
  seatsBody: string
  seatsLegend: string
  seatsUnit: string
  modulesTitle: (project: string) => string
  modulesBody: string
  modulesLegend: string
  save: string
  cancel: string
  deleted: string
  deletedBody: string
  deletedBy: (date: string, who?: string) => string
  restorableUntil: (date: string) => string
  restore: string
  restoreName: (name: string) => string
  /** Why Restore is disabled past the server's deadline. */
  closed: string
  denied: string
  empty: string
  emptyBody: string
  noMatch: (search: string) => string
  failed: string
  errors: Record<string, string>
  quota?: Partial<QuotaFieldLabels>
  field?: Partial<AllOrSomeFieldLabels>
  data?: Partial<DataStateLabels>
}

export const defaultTenantAdminLabels: TenantAdminLabels = {
  count: (total, n) => `${n} ${total === 1 ? "project" : "projects"} on the platform.`,
  search: "Search projects",
  searchPlaceholder: "Name, slug or owner",
  table: "Projects",
  project: "Project",
  devices: "Devices",
  modules: "Licensed modules",
  actions: "Actions",
  seatsOf: (d, s) => `${d} of ${s} seats`,
  seatsUnlimited: (d) => `${d}, unlimited seats`,
  over: (by) => `Over by ${by}`,
  allModules: "All, including future ones",
  noModules: "None",
  moduleCount: (n, f) => `${f} ${n === 1 ? "module" : "modules"}`,
  editSeats: "Change device seats…",
  editModules: "Change licensed modules…",
  seatsTitle: (p) => `Device seats for ${p}`,
  seatsBody: "How many devices the project may hold at once. A lower limit removes nothing; it stops the next enrolment.",
  seatsLegend: "Device seats",
  seatsUnit: "devices",
  modulesTitle: (p) => `Licensed modules for ${p}`,
  modulesBody: "Which modules the project may put in a device's licence.",
  modulesLegend: "Licensed modules",
  save: "Save",
  cancel: "Cancel",
  deleted: "Deleted projects",
  deletedBody: "Restorable until the date shown, which the server sets; after it they are gone for good.",
  deletedBy: (date, who) => (who ? `Deleted ${date} by ${who}` : `Deleted ${date}`),
  restorableUntil: (date) => `Restorable until ${date}`,
  restore: "Restore",
  restoreName: (name) => `Restore ${name}`,
  closed: "Its restore window has closed.",
  denied: "You need the projects:write permission.",
  empty: "No projects yet",
  emptyBody: "Projects show here once someone creates one.",
  noMatch: (q) => `No project matches "${q}".`,
  failed: "That did not work. Nothing was changed; try again.",
  errors: {},
}

export type TenantAdminContentProps = {
  /** One page of projects and the server's count of all that match. */
  projects: ListPage<TenantProject>
  query: ListQuery
  onQueryChange: (query: ListQuery) => void
  /** Every module a project can be licensed for. */
  modules: readonly AllOrSomeOption[]
  onSaveSeats?: (project: TenantProject, deviceSeats: number | null) => Promise<void>
  onSaveModules?: (project: TenantProject, licensedModules: string[] | null) => Promise<void>
  /** Soft-deleted projects, each with the server's `restorableUntil`. */
  deleted?: readonly DeletedTenantProject[]
  onRestore?: (project: DeletedTenantProject) => Promise<void>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  can?: (permission: string) => boolean
  permissions?: { write?: string }
  denied?: "disabled" | "hidden"
  searchDelay?: number
  now?: number
  locale?: string
  timeZone?: string
  labels?: Partial<TenantAdminLabels>
}

type Editing = { kind: "seats" | "modules"; project: TenantProject }

/**
 * Every project on the platform from your data, with its quotas: device seats (unlimited is not 0) and licensed modules
 * (all, including future ones, is not every box ticked), edited in place, and soft-deleted projects restorable until
 * the server's deadline.
 */
export function TenantAdminContent({
  projects,
  query,
  onQueryChange,
  modules,
  onSaveSeats,
  onSaveModules,
  deleted = [],
  onRestore,
  state = "ready",
  error,
  onRetry,
  can,
  permissions,
  denied = "disabled",
  searchDelay,
  now,
  locale,
  timeZone,
  labels,
}: TenantAdminContentProps) {
  const l = { ...defaultTenantAdminLabels, ...labels }
  const mayWrite = can ? can(permissions?.write ?? "projects:write") : true
  const [search, setSearch] = useSearchText(query.search, (s) => onQueryChange({ ...query, search: s, page: 1 }), searchDelay)
  const [editing, setEditing] = React.useState<Editing | null>(null)
  const [seats, setSeats] = React.useState<number | null>(null)
  const [picked, setPicked] = React.useState<string[] | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [failure, setFailure] = React.useState<string | null>(null)
  const [clock] = React.useState(() => Date.now())
  const at = now ?? clock
  const n = (x: number) => formatCount(x, { locale })
  const date = (d: DateInput) => formatAbsolute(d, { locale, timeZone, precision: "date" })
  const say = (e: unknown) => (isStepUpCancelled(e) ? null : (l.errors[errorCodeOf(e) ?? ""] ?? l.failed))

  const edit = (kind: Editing["kind"], project: TenantProject) => {
    setFailure(null)
    setSeats(project.deviceSeats)
    setPicked(project.licensedModules === null ? null : [...project.licensedModules])
    setEditing({ kind, project })
  }
  const save = async () => {
    if (!editing) return
    setBusy("save")
    setFailure(null)
    try {
      if (editing.kind === "seats") await onSaveSeats?.(editing.project, seats)
      else await onSaveModules?.(editing.project, picked)
      setEditing(null)
    } catch (e) {
      setFailure(say(e))
    } finally {
      setBusy(null)
    }
  }
  const restore = async (p: DeletedTenantProject) => {
    if (!onRestore) return
    setBusy(p.id)
    setFailure(null)
    try {
      await onRestore(p)
    } catch (e) {
      setFailure(say(e))
    } finally {
      setBusy(null)
    }
  }
  const modulesText = (m: readonly string[] | null) => (m === null ? l.allModules : m.length === 0 ? l.noModules : l.moduleCount(m.length, n(m.length)))
  const unchanged =
    editing?.kind === "seats"
      ? seats === editing.project.deviceSeats
      : !!editing && JSON.stringify(picked === null ? null : [...picked].sort()) === JSON.stringify(editing.project.licensedModules === null ? null : [...editing.project.licensedModules].sort())
  const ready = state === "ready" || state === "stale"

  return (
    <div data-slot="tenant-admin" className="flex flex-col gap-6">
      <section aria-label={l.table} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{ready ? l.count(projects.total, n(projects.total)) : null}</p>
          {state !== "forbidden" && (
            <InputGroup className="sm:w-72">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={l.searchPlaceholder} aria-label={l.search} />
            </InputGroup>
          )}
        </div>

        {failure && !editing && (
          <p role="alert" className="flex items-start gap-2 text-sm text-danger">
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
            {failure}
          </p>
        )}

        <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
          <Table aria-label={l.table}>
            <TableHeader>
              <TableRow>
                <TableHead>{l.project}</TableHead>
                <TableHead>{l.devices}</TableHead>
                <TableHead className="hidden md:table-cell">{l.modules}</TableHead>
                <TableHead className="w-0 pr-2 pl-0 sm:px-4">
                  <span className="sr-only">{l.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-auto py-4 whitespace-normal">
                    <EmptyState size="inline" icon={Building2} title={query.search ? l.noMatch(query.search) : l.empty} description={query.search ? undefined : l.emptyBody} />
                  </TableCell>
                </TableRow>
              )}
              {projects.items.map((p) => {
                const over = p.deviceSeats !== null && p.devices > p.deviceSeats
                return (
                  <TableRow key={p.id}>
                    <TableCell className="w-full max-w-0 py-2 whitespace-normal">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[p.slug, p.owner].filter(Boolean).join(" · ")}</span>
                      <span className="block text-xs text-muted-foreground md:hidden">{modulesText(p.licensedModules)}</span>
                    </TableCell>
                    <TableCell className="py-2 whitespace-normal tabular-nums">
                      <span className="block sm:whitespace-nowrap">{p.deviceSeats === null ? l.seatsUnlimited(n(p.devices)) : l.seatsOf(n(p.devices), n(p.deviceSeats))}</span>
                      {/* Above its seats is the one state that needs someone; within them is grey. */}
                      {over && <span className="flex items-start gap-1 text-xs text-warning">{l.over(n(p.devices - p.deviceSeats!))}</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{modulesText(p.licensedModules)}</TableCell>
                    <TableActionsCell>
                      {(onSaveSeats || onSaveModules) && (mayWrite || denied === "disabled") && (
                        <DropdownMenu>
                          <DropdownMenuMoreTrigger name={p.name} size="icon-sm" />
                          <DropdownMenuContent align="end">
                            {onSaveSeats && (
                              <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied} className={mayWrite ? undefined : "text-disabled"}>
                                <DropdownMenuItem onSelect={() => edit("seats", p)}>{l.editSeats}</DropdownMenuItem>
                              </PermissionGate>
                            )}
                            {onSaveModules && (
                              <PermissionGate allowed={mayWrite} mode="disabled" reason={l.denied} className={mayWrite ? undefined : "text-disabled"}>
                                <DropdownMenuItem onSelect={() => edit("modules", p)}>{l.editModules}</DropdownMenuItem>
                              </PermissionGate>
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
        {projects.total > query.limit && (
          <Pagination page={query.page - 1} pageSize={query.limit} total={projects.total} onPageChange={(p) => onQueryChange({ ...query, page: p + 1 })} locale={locale} />
        )}
      </section>

      {ready && deleted.length > 0 && (
        <section aria-labelledby="tenant-admin-deleted" className="flex flex-col gap-3">
          <SectionHeader id="tenant-admin-deleted" title={l.deleted} description={l.deletedBody} count={deleted.length} locale={locale} />
          <Card className="gap-0 p-0">
            <ItemGroup className="gap-0">
              {deleted.map((p) => {
                const closed = (toTime(p.restorableUntil) ?? 0) <= at
                return (
                  <Item key={p.id} role="listitem" className="flex-wrap rounded-none border-b border-border px-4 last:border-b-0">
                    <ItemContent>
                      <ItemTitle>{p.name}</ItemTitle>
                      <ItemDescription className="line-clamp-none text-xs">
                        {l.deletedBy(date(p.deletedAt), p.deletedBy)} · <span data-slot="tenant-admin-restorable">{l.restorableUntil(date(p.restorableUntil))}</span>
                      </ItemDescription>
                    </ItemContent>
                    {onRestore && (mayWrite || denied === "disabled") && (
                      <ItemActions>
                        <PermissionGate allowed={mayWrite && !closed} mode="disabled" reason={!mayWrite ? l.denied : l.closed}>
                          <Button variant="outline" size="sm" loading={busy === p.id} aria-label={l.restoreName(p.name)} onClick={() => void restore(p)}>
                            <Undo2 aria-hidden="true" />
                            {l.restore}
                          </Button>
                        </PermissionGate>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          </Card>
        </section>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && busy !== "save" && setEditing(null)}>
        <DialogContent>
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.kind === "seats" ? l.seatsTitle(editing.project.name) : l.modulesTitle(editing.project.name)}</DialogTitle>
                <DialogDescription>{editing.kind === "seats" ? l.seatsBody : l.modulesBody}</DialogDescription>
              </DialogHeader>
              {editing.kind === "seats" ? (
                <QuotaField legend={l.seatsLegend} value={seats} onValueChange={setSeats} used={editing.project.devices} unit={l.seatsUnit} locale={locale} labels={l.quota} />
              ) : (
                <AllOrSomeField legend={l.modulesLegend} options={modules} value={picked} onValueChange={setPicked} labels={l.field} />
              )}
              {failure && (
                <p role="alert" className="text-sm text-danger">
                  {failure}
                </p>
              )}
              <DialogFooter>
                <Button variant="ghost" disabled={busy === "save"} onClick={() => setEditing(null)}>
                  {l.cancel}
                </Button>
                <Button loading={busy === "save"} disabled={unchanged} onClick={() => void save()}>
                  {l.save}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Sample ----------

const sampleAt = Date.parse("2026-11-27T06:00:00Z")
const DAY = 86_400_000

const sampleModules: AllOrSomeOption[] = [
  { value: "vision", label: "Vision" },
  { value: "speech", label: "Speech" },
  { value: "search", label: "Search" },
  { value: "agents", label: "Agents" },
  { value: "fine-tuning", label: "Fine-tuning" },
]

export const sampleTenantProjects: TenantProject[] = [
  { id: "p1", name: "Taipei DC", slug: "taipei-dc", owner: "mei.lin@example.com", devices: 8, deviceSeats: 10, licensedModules: null },
  { id: "p2", name: "Hsinchu lab", slug: "hsinchu-lab", owner: "kai@example.com", devices: 7, deviceSeats: 5, licensedModules: ["vision", "search"] },
  { id: "p3", name: "Kaohsiung port", slug: "kaohsiung-port", owner: "ana@example.com", devices: 3, deviceSeats: null, licensedModules: ["vision", "speech", "search", "agents"] },
  { id: "p4", name: "Trial: Tainan", slug: "trial-tainan", owner: "tom@example.com", devices: 0, deviceSeats: 0, licensedModules: [] },
]

export const sampleDeletedProjects: DeletedTenantProject[] = [
  { id: "p9", name: "Old pilot", slug: "old-pilot", deletedAt: sampleAt - 4 * DAY, restorableUntil: "2026-12-23T06:00:00Z", deletedBy: "kai@example.com" },
]

const adminNav: AppNavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Projects", href: "#projects", icon: Building2 },
      { label: "Users", href: "#users", icon: Users },
      { label: "Permissions", href: "#permissions", icon: ShieldCheck },
    ],
  },
]

/**
 * Every project on the platform with its quotas, device seats and licensed modules, and deleted projects restorable
 * until the server's deadline. Unlimited is not 0, and all modules is not every box ticked. This is TenantAdminContent
 * on sample data, in a sample shell.
 */
export function TenantAdmin() {
  const [list, setList] = React.useState(sampleTenantProjects)
  const [gone, setGone] = React.useState(sampleDeletedProjects)
  const [query, setQuery] = React.useState<ListQuery>({ page: 1, limit: 20 })
  // The sample's stand-in for the server's search.
  const rows = list.filter((p) => !query.search || `${p.name} ${p.slug} ${p.owner}`.toLowerCase().includes(query.search.toLowerCase()))
  return (
    <AppShell product="Platform admin" nav={adminNav} current="#projects" title="Projects" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <TenantAdminContent
          projects={{ items: rows, total: rows.length }}
          query={query}
          onQueryChange={setQuery}
          modules={sampleModules}
          now={sampleAt}
          timeZone="Asia/Taipei"
          onSaveSeats={async (p, deviceSeats) => setList((all) => all.map((x) => (x.id === p.id ? { ...x, deviceSeats } : x)))}
          onSaveModules={async (p, licensedModules) => setList((all) => all.map((x) => (x.id === p.id ? { ...x, licensedModules } : x)))}
          deleted={gone}
          onRestore={async (p) => {
            setGone((all) => all.filter((x) => x.id !== p.id))
            setList((all) => [...all, { id: p.id, name: p.name, slug: p.slug, devices: 0, deviceSeats: 5, licensedModules: [] }])
          }}
        />
      </div>
    </AppShell>
  )
}
