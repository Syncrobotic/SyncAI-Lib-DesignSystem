// @syncrobotic/maintenance-work-order v0.13.0 · update: npx shadcn add @syncrobotic/maintenance-work-order --overwrite
"use client"

import * as React from "react"
import { Wrench } from "lucide-react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Label } from "@/registry/syncrobotic/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

const steps = [
  "Power off and lock the robot at the bench",
  "Inspect all four knee bearings for play",
  "Replace bearings that move more than 0.2 mm",
  "Grease hip and knee joints (2 g each)",
  "Run the gait test: 20 m straight, 2 turns",
]
const parts = [
  { part: "Knee bearing 6801-2RS", code: "BR-6801", qty: 2 },
  { part: "Joint grease, 50 g", code: "GR-050", qty: 1 },
]

/**
 * A work order at the bench: the robot is out of service until it is signed off. Steps are a checklist done in order;
 * parts used are listed for stock; sign-off stays disabled, and says why, until every step is ticked.
 */
export function MaintenanceWorkOrder() {
  const [done, setDone] = React.useState<boolean[]>([true, true, true, false, false])
  const [signed, setSigned] = React.useState(false)
  const left = done.filter((d) => !d).length
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="WO-0318" user={{ name: "Mei Lin", initials: "ML" }}>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <StatusEyebrow status={signed ? "normal" : "offline"}>{signed ? "Back in service" : "Out of service for maintenance"}</StatusEyebrow>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Wrench aria-hidden="true" className="size-5" />
              Leg joints and bearings, Patrol dog 9E37
            </h2>
          </div>

          <fieldset className="flex flex-col gap-1 rounded-md bg-card p-4 ring-1 ring-border">
            <legend className="sr-only">Steps</legend>
            <div className="flex items-baseline justify-between pb-2">
              <span className="text-sm font-medium">Steps</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {steps.length - left} of {steps.length} done
              </span>
            </div>
            {steps.map((s, i) => (
              <div key={s} className="flex min-h-(--h-lg) items-center gap-3 border-b border-border last:border-b-0">
                <Checkbox
                  id={`wo-step-${i}`}
                  checked={done[i]}
                  disabled={signed}
                  onCheckedChange={(v) => setDone((d) => d.map((x, j) => (j === i ? v === true : x)))}
                />
                <Label htmlFor={`wo-step-${i}`} className={done[i] ? "font-normal text-muted-foreground line-through" : "font-normal"}>
                  {i + 1}. {s}
                </Label>
              </div>
            ))}
          </fieldset>

          <section aria-labelledby="parts-title" className="flex flex-col gap-3">
            <h3 id="parts-title" className="text-sm font-medium">
              Parts used
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.code}>
                    <TableCell className="py-2 max-sm:whitespace-normal">
                      {p.part}
                      {/* On a phone the code sits under the part, so the quantity keeps its place on the right. */}
                      <span className="block font-mono text-xs text-muted-foreground sm:hidden">{p.code}</span>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{p.code}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <Field label="Notes" hint="What you found, for the next person.">
            <Textarea rows={3} defaultValue="Front-left bearing had 0.4 mm play, replaced. Front-right replaced as a pair." />
          </Field>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button disabled={left > 0 || signed} onClick={() => setSigned(true)}>
              Sign off and return to service
            </Button>
            <span role="status" className="text-sm text-muted-foreground">
              {signed
                ? "Signed off by Mei Lin. 9E37 can take missions again."
                : left > 0
                  ? `${left} ${left === 1 ? "step" : "steps"} left before sign-off.`
                  : "Ready to sign off."}
            </span>
          </div>
        </div>

        <aside aria-label="Work order facts">
          <DescriptionList
            columns={1}
            items={[
              { label: "Opened", value: "Today, 08:10, by the service plan" },
              { label: "Assigned to", value: "Mei Lin" },
              { label: "Hours run", value: "212 of 200 h (overdue by 12 h)" },
              { label: "Bench", value: "Taoyuan plant, workshop 1" },
            ]}
          />
        </aside>
      </div>
    </AppShell>
  )
}
