// @syncrobotic/users-audit-log v0.53.0 · update: npx shadcn add @syncrobotic/users-audit-log --overwrite
"use client"

import * as React from "react"
import { Download, Search, SearchX } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

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
 * Who did what, when and from where, narrowed by person and kind, with values before and after; exports what is shown.
 * A table with search, a list on a phone. Nothing is coloured: an emergency stop is a fact here, not an alarm.
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
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <Input type="search" aria-label="Search actions and targets" placeholder="Search actions and targets" value={q} onChange={(e) => setQ(e.target.value)} />
          </InputGroup>
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
        {/* One list of columns: the action is the row's title, the time its trailing value, who, the target and the change
            the line under it on a phone; the address stays in the table. */}
        <ResponsiveTable
          label="Audit log"
          rows={shown}
          rowKey={(r) => r.at}
          columns={[
            { id: "time", header: "Time", phone: "trailing", cell: (r) => <time dateTime={r.at}>{r.time}</time>, className: "whitespace-nowrap text-muted-foreground tabular-nums" },
            { id: "who", header: "Person", cell: (r) => r.who },
            { id: "action", header: "Action", phone: "title", cell: (r) => <span className="font-medium">{r.action}</span>, phoneCell: (r) => r.action },
            { id: "target", header: "Target", cell: (r) => r.target },
            {
              id: "change",
              header: "Change",
              cell: (r) => (r.from ? <Change from={r.from} to={r.to} /> : "—"),
              phoneCell: (r) => (r.from ? <Change from={r.from} to={r.to} /> : undefined),
              className: "hidden text-muted-foreground lg:table-cell",
            },
            { id: "ip", header: "IP address", phone: "hidden", cell: (r) => r.ip, className: "hidden font-mono text-xs text-muted-foreground lg:table-cell" },
          ]}
          empty={<EmptyState size="inline" icon={SearchX} title="No entries match" description="Clear the search or choose Everyone." />}
        />
      </div>
    </AppShell>
  )
}
