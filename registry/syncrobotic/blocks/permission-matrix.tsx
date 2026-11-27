// @syncrobotic/permission-matrix v0.57.0 · update: npx shadcn add @syncrobotic/permission-matrix --overwrite
"use client"

import { Building2, Check, Minus, ShieldCheck, Users } from "lucide-react"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { AppShell, sampleUser, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { Code } from "@/registry/syncrobotic/ui/code"
import { DataState, type DataStateError, type DataStateKind, type DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** A permission string and words for it. `resource` groups it; default the part before ":". */
export type MatrixPermission = { value: string; label?: string; description?: string; resource?: string }

export type MatrixRole = { id: string; name: string; description?: string }

/**
 * One axis of roles (the platform's system roles, a project's roles): its permissions as rows, its roles as columns,
 * and each role's bundle. Axes never share a grid: a system role grants nothing inside a project, and the reverse.
 */
export type PermissionAxis = {
  id: string
  title: string
  description?: string
  permissions: readonly MatrixPermission[]
  roles: readonly MatrixRole[]
  /** Each role's permission strings, by role id, as the server defines them. */
  bundles: Record<string, readonly string[]>
}

export type PermissionMatrixLabels = {
  permission: string
  granted: string
  notGranted: string
  /** Under each axis title: how many permissions and roles. */
  summary: (permissions: string, roles: string) => string
  empty: string
  data?: Partial<DataStateLabels>
}

export const defaultPermissionMatrixLabels: PermissionMatrixLabels = {
  permission: "Permission",
  granted: "Granted",
  notGranted: "Not granted",
  summary: (p, r) => `${p} permissions, ${r} roles`,
  empty: "No permissions on this axis.",
}

const resourceOf = (p: MatrixPermission) => p.resource ?? p.value.split(":")[0] ?? p.value

function groupRows(permissions: readonly MatrixPermission[]) {
  const groups = new Map<string, MatrixPermission[]>()
  for (const p of permissions) groups.set(resourceOf(p), [...(groups.get(resourceOf(p)) ?? []), p])
  return [...groups]
}

export type PermissionMatrixContentProps = {
  /** One table per axis, in this order. Roles and bundles come from the server; none is assumed. */
  axes: readonly PermissionAxis[]
  /** Words for a resource's heading row ("devices" → "Devices"). */
  resourceLabels?: Record<string, string>
  state?: DataStateKind
  error?: DataStateError | null
  onRetry?: () => void
  /** 1 when the axes' titles are the page's sections (h2); 2 inside a dialog or a section that has one. */
  headingLevel?: 1 | 2
  locale?: string
  labels?: Partial<PermissionMatrixLabels>
}

/**
 * Which role holds which permission, as a read-only reference: one table per axis, permission strings as rows grouped by
 * resource, roles as columns. It documents the server's bundles and decides nothing.
 */
export function PermissionMatrixContent({ axes, resourceLabels, state = "ready", error, onRetry, headingLevel = 1, locale, labels }: PermissionMatrixContentProps) {
  const l = { ...defaultPermissionMatrixLabels, ...labels }
  const heading = headingLevel === 1 ? "h2" : "h3"
  return (
    <DataState state={state === "empty" ? "ready" : state} error={error} onRetry={onRetry} labels={l.data}>
      <div data-slot="permission-matrix" className="flex flex-col gap-8">
        {axes.map((axis) => {
          const id = `permission-matrix-${axis.id}`
          return (
            <section key={axis.id} aria-labelledby={id} className="flex flex-col gap-3">
              <SectionHeader
                id={id}
                as={heading}
                title={axis.title}
                description={
                  <>
                    {axis.description && <span className="block">{axis.description}</span>}
                    <span className="block tabular-nums">{l.summary(formatCount(axis.permissions.length, { locale }), formatCount(axis.roles.length, { locale }))}</span>
                  </>
                }
              />
              {axis.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{l.empty}</p>
              ) : (
                <Table aria-label={axis.title}>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="sticky left-0 z-10 min-w-40 bg-muted sm:min-w-48">
                        {l.permission}
                      </TableHead>
                      {axis.roles.map((r) => (
                        <TableHead key={r.id} scope="col" className="text-center" title={r.description}>
                          {r.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  {groupRows(axis.permissions).map(([resource, rows]) => (
                    <TableBody key={resource}>
                      <TableRow className="bg-muted/50">
                        <TableHead scope="colgroup" colSpan={axis.roles.length + 1} className="h-(--h-sm) text-xs">
                          {resourceLabels?.[resource] ?? resource}
                        </TableHead>
                      </TableRow>
                      {rows.map((p) => (
                        <TableRow key={p.value}>
                          {/* The permission stays in view while a phone scrolls the roles under it. */}
                          <TableHead scope="row" className="sticky left-0 z-10 h-auto bg-card py-2 font-normal whitespace-normal">
                            <span className="flex flex-col items-start gap-1">
                              <Code>{p.value}</Code>
                              {(p.label || p.description) && <span className="text-xs text-muted-foreground">{p.label ?? p.description}</span>}
                            </span>
                          </TableHead>
                          {axis.roles.map((r) => {
                            const on = (axis.bundles[r.id] ?? []).includes(p.value)
                            return (
                              <TableCell key={r.id} className="text-center" data-granted={on || undefined}>
                                {/* Granted is ink, not green: a reference, not a status. */}
                                {on ? <Check aria-hidden="true" className="inline size-4 text-foreground" /> : <Minus aria-hidden="true" className="inline size-4 text-muted-foreground" />}
                                <span className="sr-only">{on ? l.granted : l.notGranted}</span>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  ))}
                </Table>
              )}
            </section>
          )
        })}
      </div>
    </DataState>
  )
}

const systemPermissions = ["users:read", "users:write", "projects:read", "projects:write", "audit-logs:read", "billing:read", "billing:write", "support:read", "support:write"]
const projectPermissions = [
  "project:read",
  "project:write",
  "project:delete",
  "project:transfer-ownership",
  "members:read",
  "members:write",
  "apikeys:read",
  "apikeys:write",
  "webhooks:read",
  "webhooks:write",
  "devices:read",
  "devices:write",
]

export const samplePermissionAxes: PermissionAxis[] = [
  {
    id: "system",
    title: "Platform roles",
    description: "Given by the platform's staff. They grant nothing inside a project.",
    permissions: systemPermissions.map((value) => ({ value })),
    roles: [
      { id: "super-admin", name: "Super admin" },
      { id: "platform-manager", name: "Platform manager" },
      { id: "billing-manager", name: "Billing manager" },
      { id: "support-agent", name: "Support agent" },
    ],
    bundles: {
      "super-admin": systemPermissions,
      "platform-manager": ["users:read", "users:write", "projects:read", "projects:write", "audit-logs:read"],
      "billing-manager": ["users:read", "projects:read", "audit-logs:read", "billing:read", "billing:write"],
      "support-agent": ["users:read", "projects:read", "audit-logs:read", "billing:read", "support:read", "support:write"],
    },
  },
  {
    id: "project",
    title: "Project roles",
    description: "One per membership. They grant nothing on the platform.",
    permissions: projectPermissions.map((value) => ({ value })),
    roles: [
      { id: "owner", name: "Owner" },
      { id: "admin", name: "Admin" },
      { id: "member", name: "Member" },
      { id: "viewer", name: "Viewer" },
    ],
    bundles: {
      owner: projectPermissions,
      admin: ["project:read", "project:write", "members:read", "members:write", "apikeys:read", "apikeys:write", "webhooks:read", "webhooks:write", "devices:read", "devices:write"],
      member: ["project:read", "members:read", "devices:read"],
      viewer: ["project:read", "members:read", "devices:read"],
    },
  },
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
 * Which role holds which permission, as a read-only reference: platform roles and project roles in two tables, never
 * one grid. This is PermissionMatrixContent on sample data, in a sample shell.
 */
export function PermissionMatrix() {
  return (
    <AppShell product="Platform admin" nav={adminNav} current="#permissions" title="Permissions" user={sampleUser}>
      <div className="flex max-w-5xl flex-col gap-4">
        <PermissionMatrixContent axes={samplePermissionAxes} />
      </div>
    </AppShell>
  )
}
