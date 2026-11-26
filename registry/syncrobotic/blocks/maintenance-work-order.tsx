// @syncrobotic/maintenance-work-order v0.40.0 · update: npx shadcn add @syncrobotic/maintenance-work-order --overwrite
"use client"

import * as React from "react"
import { Wrench } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-count"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"
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
    <AppShell product="Fleet console" nav={sampleNav} current="#maintenance" title="WO-0318" user={sampleUser}>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <StatusEyebrow status={signed ? "normal" : "offline"}>{signed ? "Back in service" : "Out of service for maintenance"}</StatusEyebrow>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Wrench aria-hidden="true" className="size-5" />
              Leg joints and bearings, Patrol dog 9E37
            </h2>
          </div>

          <div className="rounded-md bg-card p-4 ring-1 ring-border">
            <FieldSet legend="Steps" hint={`${steps.length - left} of ${steps.length} done`}>
              {steps.map((step, i) => (
                <ChoiceField
                  key={step}
                  className="border-b border-border last:border-b-0"
                  label={<span className={done[i] ? "text-muted-foreground line-through" : undefined}>{`${i + 1}. ${step}`}</span>}
                  control={<Checkbox checked={done[i]} disabled={signed} onCheckedChange={(v) => setDone((d) => d.map((x, j) => (j === i ? v === true : x)))} />}
                />
              ))}
            </FieldSet>
          </div>

          <section aria-labelledby="parts-title" className="flex flex-col gap-3">
            <h3 id="parts-title" className="text-sm font-medium">
              Parts used
            </h3>
            {/* The part is the row's title, its code the line under it on a phone, the quantity at the row's end. */}
            <ResponsiveTable
              label="Parts used"
              rows={parts}
              rowKey={(p) => p.code}
              columns={[
                { id: "part", header: "Part", cell: (p) => p.part },
                { id: "code", header: "Code", cell: (p) => <span className="font-mono text-xs">{p.code}</span> },
                { id: "qty", header: "Quantity", cell: (p) => formatCount(p.qty), align: "end", phone: "trailing", className: "tabular-nums" },
              ]}
            />
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
