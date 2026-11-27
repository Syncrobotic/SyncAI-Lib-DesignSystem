// @syncrobotic/incident-queue v0.53.0 · update: npx shadcn add @syncrobotic/incident-queue --overwrite
"use client"

import * as React from "react"
import { CircleCheck, Plus } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type Incident = {
  id: string
  title: string
  severity: 1 | 2 | 3
  state: "Unassigned" | "Investigating" | "Monitoring" | "Resolved"
  owner?: { name: string; initials: string }
  robots: number
  open: string
}

// Sample data. Severity 1 stops work at a site; 2 slows it; 3 is a nuisance.
const incidents: Incident[] = [
  { id: "IN-2043", title: "Two robots lost signal in the car park", severity: 1, state: "Unassigned", robots: 2, open: "4 min" },
  {
    id: "IN-2041",
    title: "Door C3 blocks the loading bay route",
    severity: 2,
    state: "Investigating",
    owner: { name: "Kai Chen", initials: "KC" },
    robots: 1,
    open: "38 min",
  },
  {
    id: "IN-2039",
    title: "Dock 2 charges slowly",
    severity: 3,
    state: "Monitoring",
    owner: { name: "Ana Ruiz", initials: "AR" },
    robots: 3,
    open: "2 h 10 min",
  },
  {
    id: "IN-2035",
    title: "Map drift on floor 2 after the refit",
    severity: 2,
    state: "Resolved",
    owner: { name: "Mei Lin", initials: "ML" },
    robots: 4,
    open: "1 day",
  },
]

// Severity 3 is calm: the hollow circle of a normal state, never the slashed circle that means offline.
const sevTone: Record<Incident["severity"], Status> = { 1: "danger", 2: "warning", 3: "normal" }
const order: Incident["state"][] = ["Unassigned", "Investigating", "Monitoring", "Resolved"]

const Severity = ({ severity }: { severity: Incident["severity"] }) => <InlineStatus status={sevTone[severity]}>Sev {severity}</InlineStatus>

// One list of columns for the table and the phone rows: the incident is the row's title, its severity the trailing
// shape and word, its state and age the line under it.
const columns: ResponsiveTableColumn<Incident>[] = [
  { id: "severity", header: "Severity", cell: (i) => <Severity severity={i.severity} />, phone: "trailing", className: "w-28" },
  {
    id: "incident",
    header: "Incident",
    phone: "title",
    cell: (i) => (
      <span className="flex flex-col whitespace-normal">
        <span>{i.title}</span>
        <span className="font-mono text-xs font-normal text-muted-foreground">{i.id}</span>
      </span>
    ),
    phoneCell: (i) => i.title,
  },
  { id: "state", header: "State", cell: (i) => i.state },
  {
    id: "owner",
    header: "Owner",
    phone: "hidden",
    // Nobody owning it is said in words; Take is the row's action, at the end of the row.
    cell: (i) =>
      i.owner ? (
        <span className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">{i.owner.initials}</AvatarFallback>
          </Avatar>
          {i.owner.name}
        </span>
      ) : (
        <span className="text-muted-foreground">Nobody</span>
      ),
  },
  { id: "robots", header: "Robots", cell: (i) => formatCount(i.robots), align: "end", phone: "hidden", className: "hidden tabular-nums lg:table-cell" },
  { id: "open", header: "Open for", cell: (i) => i.open, align: "end", className: "text-muted-foreground tabular-nums" },
]

/**
 * Open incidents, unowned first, then by severity and age; severity has a shape and a number, and nobody-owns-it is a
 * button. Only the two severities that stop or slow work are coloured. An incident nobody owns says so in the owner
 * column and offers Take at the end of its row. A table where there is room, a list on a phone (ResponsiveTable).
 */
export function IncidentQueue({ onOpen, onTake }: { onOpen?: (incident: Incident) => void; onTake?: (incident: Incident) => void } = {}) {
  const [tab, setTab] = React.useState("open")
  const shown = incidents
    .filter((i) => (tab === "open" ? i.state !== "Resolved" : i.state === "Resolved"))
    .sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state) || a.severity - b.severity)
  const openCount = incidents.filter((i) => i.state !== "Resolved").length
  const resolvedCount = incidents.length - openCount
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#incidents"
      title="Incidents"
      user={sampleUser}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" />
          Declare incident
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Two slices that cover the queue, one always on: a SegmentedControl, each count after its word. */}
        <SegmentedControl aria-label="Show incidents" value={tab} onValueChange={(v) => v && setTab(v)} className="w-auto self-start">
          <SegmentedControlItem value="open">Open {formatCount(openCount, { compact: true })}</SegmentedControlItem>
          <SegmentedControlItem value="resolved">Resolved {formatCount(resolvedCount, { compact: true })}</SegmentedControlItem>
        </SegmentedControl>
        <ResponsiveTable
          label={tab === "open" ? "Open incidents" : "Resolved incidents"}
          rows={shown}
          columns={columns}
          rowKey={(i) => i.id}
          onRowClick={(i) => onOpen?.(i)}
          rowActions={(i) =>
            i.owner ? null : (
              <Button size="sm" variant="secondary" aria-label={`Take ${i.id}`} onClick={() => onTake?.(i)}>
                Take
              </Button>
            )
          }
          empty={
            <EmptyState
              size="inline"
              icon={CircleCheck}
              title={tab === "open" ? "No open incidents" : "Nothing resolved yet"}
              description={tab === "open" ? "Every site is running as planned." : "Resolved incidents stay here for 90 days."}
            />
          }
        />
      </div>
    </AppShell>
  )
}
