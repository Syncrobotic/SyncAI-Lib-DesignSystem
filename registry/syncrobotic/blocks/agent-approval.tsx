// @syncrobotic/agent-approval v0.13.0 · update: npx shadcn add @syncrobotic/agent-approval --overwrite
"use client"

import * as React from "react"
import { Check, Sparkles } from "lucide-react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

const changes = [
  { robot: "Patrol dog 9E37", before: "Loading bay sweep, waiting at door C3", after: "Return to Dock 1 and charge" },
  { robot: "Patrol dog 1715", before: "Car park until 23:00, then dock", after: "Car park, then Loading bay A–B (skips C) until 01:30" },
]

/**
 * An AI agent's proposal waiting for a person: what it wants to change, robot by robot, before and after; why, with the
 * facts it used; and what it does not know. Approve, or send it back with a reason. Nothing moves until a person says so,
 * and the proposal expires rather than applying itself.
 */
export function AgentApproval() {
  const [state, setState] = React.useState<"open" | "rejecting" | "approved" | "rejected">("open")
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string>()
  const decided = state === "approved" || state === "rejected"

  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#alarms" title="Approval" user={{ name: "Mei Lin", initials: "ML" }}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <StatusEyebrow status={decided ? "normal" : "warning"}>
            {state === "approved" ? "Approved by you" : state === "rejected" ? "Sent back" : "Needs your approval · expires in 25 min"}
          </StatusEyebrow>
          <h2 className="text-xl font-bold">Reroute around door C3</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-4" />
            Proposed by Route planner for incident IN-2041
          </p>
        </div>

        <section aria-labelledby="changes-title" className="flex flex-col gap-3">
          <h3 id="changes-title" className="text-sm font-medium">
            What changes
          </h3>
          <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Robot</TableHead>
                  <TableHead>Now</TableHead>
                  <TableHead>After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((c) => (
                  <TableRow key={c.robot}>
                    <TableCell className="font-medium">{c.robot}</TableCell>
                    <TableCell className="text-muted-foreground">{c.before}</TableCell>
                    <TableCell>{c.after}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section aria-labelledby="why-title" className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
            <h3 id="why-title" className="text-sm font-medium">
              Why
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Door C3 is expected closed for at least 30 more minutes (incident update, 21:58).</li>
              <li>9E37 is at 14 % and cannot finish the sweep after the door opens.</li>
              <li>1715 ends its car park round at 23:00 with 58 %, enough for bays A and B.</li>
            </ul>
          </section>
          <section aria-labelledby="unknown-title" className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
            <h3 id="unknown-title" className="text-sm font-medium">
              What it does not know
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Whether bay C has deliveries tonight. It is left unpatrolled until 9E37 returns.</li>
              <li>Battery forecast is from the last 7 nights; cold nights use more.</li>
            </ul>
          </section>
        </div>

        {decided ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Check aria-hidden="true" className="size-4" />
            {state === "approved" ? "Sent to the robots. 9E37 is heading to Dock 1." : "Sent back to Route planner with your reason. Nothing changed."}
          </p>
        ) : state === "rejecting" ? (
          <form
            noValidate
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!reason.trim()) return setError("Say what to change, so the agent can propose again.")
              setState("rejected")
            }}
          >
            <Field label="What should change?" error={error}>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">
                Send back
              </Button>
              <Button type="button" variant="ghost" onClick={() => setState("open")}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={() => setState("approved")}>Approve and send to robots</Button>
            <Button variant="secondary" onClick={() => setState("rejecting")}>
              Send back
            </Button>
            <Button variant="ghost">Open in the planner</Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
