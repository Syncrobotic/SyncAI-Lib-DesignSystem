// @syncrobotic/users-audit-log v0.9.0 · update: npx shadcn add @syncrobotic/users-audit-log --overwrite
"use client"

import * as React from "react"
import { Download, Search } from "lucide-react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
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
      current="#events"
      title="Audit log"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        <Button size="sm" variant="secondary">
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
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
            <SelectTrigger aria-label="Person" className="w-40">
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
            <SelectTrigger aria-label="Kind of action" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="robots">Robots</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <span role="status" className="ml-auto text-sm text-muted-foreground tabular-nums">
            {shown.length} of {rows.length} entries
          </span>
        </div>
        <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>IP address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.at}>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    <time dateTime={r.at}>{r.time}</time>
                  </TableCell>
                  <TableCell>{r.who}</TableCell>
                  <TableCell className="font-medium">{r.action}</TableCell>
                  <TableCell>{r.target}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.from ? (
                      <span className="whitespace-nowrap">
                        {r.from} <span aria-hidden="true">→</span>
                        <span className="sr-only">to</span> <span className="text-foreground">{r.to}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.ip}</TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No entries match. Clear the search or choose Everyone.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}
