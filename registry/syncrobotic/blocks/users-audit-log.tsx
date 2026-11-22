// @syncrobotic/users-audit-log v0.28.0 · update: npx shadcn add @syncrobotic/users-audit-log --overwrite
"use client"

import * as React from "react"
import { Download, Search } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

type Row = {
  at: string
  time: string
  who: string
  kind: "access" | "robots" | "settings"
  action: string
  target: string
  from?: string
  to?: string
  ip: string
}

// Sample data, newest first.
const rows: Row[] = [
  {
    at: "2026-11-17T14:02",
    time: "17 Nov 14:02",
    who: "Mei Lin",
    kind: "access",
    action: "Changed role",
    target: "Kai Chen",
    from: "Viewer",
    to: "Operator",
    ip: "10.2.4.18",
  },
  { at: "2026-11-17T13:40", time: "17 Nov 13:40", who: "Kai Chen", kind: "robots", action: "Released after stop", target: "Patrol dog 9E37", ip: "10.2.4.33" },
  { at: "2026-11-17T13:38", time: "17 Nov 13:38", who: "Kai Chen", kind: "robots", action: "Emergency stop", target: "Patrol dog 9E37", ip: "10.2.4.33" },
  {
    at: "2026-11-17T11:30",
    time: "17 Nov 11:30",
    who: "System",
    kind: "robots",
    action: "Updated firmware",
    target: "Patrol dog 7F3A",
    from: "2.4.0",
    to: "2.4.1",
    ip: "—",
  },
  {
    at: "2026-11-17T09:15",
    time: "17 Nov 09:15",
    who: "Ana Ruiz",
    kind: "settings",
    action: "Edited route",
    target: "Perimeter",
    from: "11 checkpoints",
    to: "12 checkpoints",
    ip: "10.2.7.2",
  },
  { at: "2026-11-16T18:47", time: "16 Nov 18:47", who: "Mei Lin", kind: "access", action: "Revoked API key", target: "Old test script", ip: "10.2.4.18" },
  { at: "2026-11-16T08:02", time: "16 Nov 08:02", who: "Mei Lin", kind: "access", action: "Signed in", target: "Fleet console", ip: "10.2.4.18" },
]

function Change({ from, to }: { from: string; to?: string }) {
  return (
    <span className="whitespace-nowrap">
      {from} <span aria-hidden="true">→</span>
      <span className="sr-only">to</span> <span className="text-foreground">{to}</span>
    </span>
  )
}

/**
 * Who did what, when, from where: a table you can narrow by person and kind, and search. Values changed show before and
 * after. Nothing is coloured: an emergency stop is a fact here, not an alarm. Export takes the filtered rows.
 */
export function UsersAuditLog() {
  const [who, setWho] = React.useState("all")
  const [kind, setKind] = React.useState("all")
  const [q, setQ] = React.useState("")
  const people = [...new Set(rows.map((r) => r.who))]
  const shown = rows.filter(
    (r) => (who === "all" || r.who === who) && (kind === "all" || r.kind === kind) && (!q || `${r.action} ${r.target}`.toLowerCase().includes(q.toLowerCase())),
  )
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#audit-log"
      title="Audit log"
      user={sampleUser}
      actions={
        <Button size="sm" variant="secondary">
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search actions and targets"
              placeholder="Search actions and targets"
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={who} onValueChange={setWho}>
            <SelectTrigger aria-label="Person" className="flex-1 sm:w-40 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              {people.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger aria-label="Kind of action" className="flex-1 sm:w-40 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="robots">Robots</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <span role="status" className="text-sm text-muted-foreground tabular-nums max-sm:w-full sm:ml-auto">
            {shown.length} of {rows.length} entries
          </span>
        </div>
        {/* Table draws its own edge, scroll and fades; a second frame around it clipped or doubled them. */}
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead className="hidden sm:table-cell">Person</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden lg:table-cell">Target</TableHead>
              <TableHead className="hidden lg:table-cell">Change</TableHead>
              <TableHead className="hidden lg:table-cell">IP address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.at}>
                <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                  <time dateTime={r.at}>{r.time}</time>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{r.who}</TableCell>
                <TableCell className="py-2 max-lg:whitespace-normal">
                  <span className="font-medium">{r.action}</span>
                  {/* Below 768 px the person, target and change stack under the action instead of scrolling off the side. */}
                  <span className="flex flex-col text-xs text-muted-foreground lg:hidden">
                    <span>
                      <span className="sm:hidden">{r.who} · </span>
                      {r.target}
                    </span>
                    {r.from && <Change from={r.from} to={r.to} />}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{r.target}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{r.from ? <Change from={r.from} to={r.to} /> : "—"}</TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">{r.ip}</TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center whitespace-normal text-muted-foreground">
                  No entries match. Clear the search or choose Everyone.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  )
}
