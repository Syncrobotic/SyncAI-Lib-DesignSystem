// @syncrobotic/agent-trace v0.28.0 · update: npx shadcn add @syncrobotic/agent-trace --overwrite
"use client"

import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code } from "@/registry/syncrobotic/ui/code"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Trace, TraceCode, TraceDetail, TraceHeader, TraceItem } from "@/registry/syncrobotic/ui/trace"

/**
 * One agent run, step by step: what it read, which tools it called with what, and what came back, as a waterfall so slow
 * steps stand out. Steps open to their input and output as they were. A failed step shows its error and what the agent
 * did next; the run never hides a failure behind a final answer.
 */
export function AgentTrace() {
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#agents"
      title="Route planner run"
      user={sampleUser}
      actions={
        <Button size="sm" variant="secondary">
          Run again
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section aria-label="Steps" className="flex min-w-0 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
          <TraceHeader title="Plan tonight's patrols" status="warning" duration={22500} counts={{ done: 8, warning: 1 }} />
          <Trace total={22500}>
            <TraceItem status="done" title="Read the schedule" meta="schedule.get" start={0} duration={600} />
            <TraceItem status="done" title="Read robot states" meta="robots.list" start={600} duration={900} description="14 robots, 12 available" />
            <TraceItem status="done" title="Read open incidents" meta="incidents.list" start={1500} duration={700} description="1 open: door C3" />
            <TraceItem status="done" title="Think: assign routes" meta="model" start={2200} duration={9800} defaultOpen>
              <TraceDetail label="Reasoning, summarised">
                9E37 is waiting at door C3, so the loading bay goes to 1715 after its car park round. 7F3A keeps the perimeter. DAA6 stays on the dock: battery
                health check due.
              </TraceDetail>
            </TraceItem>
            <TraceItem
              status="warning"
              title="Check battery for each route"
              meta="robots.forecast"
              start={12000}
              duration={4100}
              description="1715 ends the night at 21 %, under the 25 % reserve"
            >
              <TraceDetail label="Output">
                <TraceCode>{`{
  "1715": { "route": ["Car park", "Loading bay"], "end_battery": 0.21 },
  "7F3A": { "route": ["Perimeter", "Perimeter"], "end_battery": 0.44 }
}`}</TraceCode>
              </TraceDetail>
            </TraceItem>
            <TraceItem
              status="done"
              title="Shorten the loading bay round"
              meta="model"
              start={16100}
              duration={3600}
              description="Skips bay C after 03:00; ends at 31 %"
            />
            <TraceItem status="done" title="Write the plan" meta="schedule.draft" start={19700} duration={1800} />
            <TraceItem status="done" title="Ask for approval" meta="approvals.create" start={21500} duration={600} />
            <TraceItem status="done" title="Approved by Kai Chen" start={22100} duration={400} />
          </Trace>
        </section>
        <aside aria-label="Run facts">
          <DescriptionList
            columns={1}
            items={[
              { label: "Run", value: <Code>run_8bf3</Code> },
              { label: "Agent", value: "Route planner" },
              { label: "Started by", value: "Daily 17:30" },
              { label: "Result", value: "Plan for 3 robots, approved" },
              { label: "Tools it may use", value: "Read robots, schedule and incidents; draft a schedule" },
              { label: "Model", value: "Large, 18,420 tokens" },
            ]}
          />
        </aside>
      </div>
    </AppShell>
  )
}
