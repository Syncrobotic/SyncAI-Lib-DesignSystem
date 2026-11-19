// @syncrobotic/incident-queue v0.13.0 · update: npx shadcn add @syncrobotic/incident-queue --overwrite
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

type Incident = {
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

const sevTone: Record<Incident["severity"], Status> = { 1: "danger", 2: "warning", 3: "offline" }
const order: Incident["state"][] = ["Unassigned", "Investigating", "Monitoring", "Resolved"]

/**
 * The incident queue: unowned incidents first, then by severity, then by age. Severity has a shape and a number, and only
 * the two that stop or slow work are coloured. An incident nobody owns says so, in words, in the owner column.
 */
export function IncidentQueue() {
  const [tab, setTab] = React.useState("open")
  const shown = incidents
    .filter((i) => (tab === "open" ? i.state !== "Resolved" : i.state === "Resolved"))
    .sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state) || a.severity - b.severity)
  const openCount = incidents.filter((i) => i.state !== "Resolved").length
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#alarms"
      title="Incidents"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" />
          Declare incident
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl aria-label="Show incidents" value={tab} onValueChange={(v) => v && setTab(v)} className="self-start">
          <SegmentedControlItem value="open">Open {openCount}</SegmentedControlItem>
          <SegmentedControlItem value="resolved">Resolved</SegmentedControlItem>
        </SegmentedControl>
        <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Robots</TableHead>
                <TableHead className="text-right">Open for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <span className={cn("flex items-center gap-2 font-medium", i.severity === 1 && "text-danger", i.severity === 2 && "text-warning")}>
                      <StatusGlyph status={sevTone[i.severity]} />
                      Sev {i.severity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a href={`#${i.id}`} className="flex flex-col hover:underline">
                      <span className="font-medium">{i.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                    </a>
                  </TableCell>
                  <TableCell>{i.state}</TableCell>
                  <TableCell>
                    {i.owner ? (
                      <span className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">{i.owner.initials}</AvatarFallback>
                        </Avatar>
                        {i.owner.name}
                      </span>
                    ) : (
                      <Button size="sm" variant="secondary" aria-label={`Take ${i.id}`}>
                        Take
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{i.robots}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{i.open}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}
