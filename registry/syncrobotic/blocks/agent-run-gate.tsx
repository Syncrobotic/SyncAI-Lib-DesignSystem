// @syncrobotic/agent-run-gate v0.48.0 · update: npx shadcn add @syncrobotic/agent-run-gate --overwrite
"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"
import { formatCount, formatNumber } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code } from "@/registry/syncrobotic/ui/code"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { Trace, TraceItem, type TraceStatus } from "@/registry/syncrobotic/ui/trace"

/*
  An agent run, step by step, that stops before a step that would move robots and waits for a person. The gate sits in
  the run, under the step it holds: what it will change robot by robot, why, the facts it used, and when it expires.
  Approve and the run goes on; Revise sends it back to the agent with a reason and the run keeps waiting; Deny skips the
  held step and every step that depends on it, with the reason, and the steps that do not depend on it still run.

  The run here is a script, so the block works without an agent: after a decision each step runs for STEP_MS and settles
  to its `result`. Replace that with your run's events (set a step's status as they arrive). It is deterministic, and
  under reduced motion the steps after a decision settle at once instead of one by one.
*/

/** One robot the held step would change: what it does now and what it will do after. */
export type AgentRunRobotChange = { robot: string; now: string; after: string }

/** A gate on a step: it waits for a person before it runs. */
export type AgentRunApproval = {
  /** What the change is, in words: "Reroute around door C3". */
  title: string
  /** Robot by robot, what changes. */
  changes: AgentRunRobotChange[]
  /** Why the agent wants it, one reason a line. */
  why: string[]
  /** The facts it decided on, with their values. */
  facts: { label: string; value: React.ReactNode }[]
  /** The clock time the gate expires, as written ("22:23"). Past it, nothing applies itself. */
  expiresAt: string
  /** Minutes left until then; 0 or less is expired. */
  expiresInMin: number
}

export type AgentRunStep = {
  id: string
  title: string
  /** The tool it calls (`missions.dispatch`), or `model`. */
  tool?: string
  status: TraceStatus
  /** One line under the title before it runs or while it does. */
  description?: string
  /** One line under the title once it is done. */
  result?: string
  durationMs?: number
  /** Steps that must have run for this one to make sense. Deny skips a held step and every step that depends on it. */
  dependsOn?: string[]
  /** A step that moves robots waits for a person: a gate. */
  approval?: AgentRunApproval
}

export type AgentRunDecision = { stepId: string; decision: "approve" | "revise" | "deny"; reason?: string }

export type AgentRun = {
  id: string
  agent: string
  goal: string
  /** What started it: "Incident IN-2041, 21:58". */
  trigger: string
  steps: AgentRunStep[]
}

// ---------- Sample data: incident IN-2041 at warehouse B ----------

export const sampleAgentRun: AgentRun = {
  id: "run_8c21",
  agent: "Route planner",
  goal: "Reroute around door C3",
  trigger: "Incident IN-2041, 21:58",
  steps: [
    { id: "states", title: "Read robot states", tool: "robots.list", status: "done", durationMs: 900, result: "14 robots, 12 available" },
    { id: "incidents", title: "Read open incidents", tool: "incidents.list", status: "done", durationMs: 700, result: "1 open: door C3 closed" },
    { id: "forecast", title: "Forecast battery for each route", tool: "robots.forecast", status: "done", durationMs: 4100, result: "1715 ends the night at 27 %" },
    { id: "plan", title: "Plan the reroute", tool: "model", status: "done", durationMs: 6200, result: "3 robots change routes; bay C waits for 9E37" },
    {
      id: "dispatch",
      title: "Send the new routes to 3 robots",
      tool: "missions.dispatch",
      status: "pending",
      durationMs: 1400,
      result: "3 robots accepted their new routes",
      dependsOn: ["plan"],
      approval: {
        title: "Reroute around door C3",
        changes: [
          { robot: "Patrol dog 9E37", now: "Waiting at door C3", after: "Return to Dock 1 and charge" },
          { robot: "Patrol dog 1715", now: "Car park until 23:40, then dock", after: "Car park, then loading bay A and B until 05:30" },
          { robot: "AMR 12", now: "Pallet runs through door C3", after: "Pallet runs through door C2, about 40 m longer" },
        ],
        why: [
          "Door C3 is expected closed for at least 30 more minutes (incident update, 21:58).",
          "9E37 is at 14 % and cannot finish the loading bay after the door opens.",
          "1715 has enough charge for bays A and B and keeps the 25 % reserve.",
        ],
        facts: [
          { label: "Door C3", value: "Closed since 21:41" },
          // Below 15 % the level shows the warning shape, and says "low" to a screen reader, as in the fleet table.
          {
            label: "9E37 battery",
            value: (
              <span className="inline-flex items-center gap-2">
                <StatusGlyph status="warning" />
                14 %<span className="sr-only">, low</span>
              </span>
            ),
          },
          { label: "1715 at 05:30", value: "27 %, reserve 25 %" },
          { label: "Robot data from", value: "21:58" },
        ],
        expiresAt: "22:23",
        expiresInMin: 25,
      },
    },
    {
      id: "confirm",
      title: "Confirm each robot took its route",
      tool: "robots.watch",
      status: "pending",
      durationMs: 2600,
      result: "All 3 reported their new route",
      dependsOn: ["dispatch"],
    },
    { id: "schedule", title: "Update tonight's schedule", tool: "schedule.update", status: "pending", durationMs: 800, result: "Schedule saved", dependsOn: ["confirm"] },
    {
      id: "note",
      title: "Write a note on incident IN-2041",
      tool: "incidents.comment",
      status: "pending",
      durationMs: 1100,
      result: "Note added for the morning shift",
    },
  ],
}

// ---------- The script ----------

/** How long each step runs after a decision, in the sample's script. */
const STEP_MS = 1200
/** The pause between one step settling and the next starting. */
const GAP_MS = 200

/** The step and every step that depends on it, however far down. */
function dependents(steps: AgentRunStep[], id: string): Set<string> {
  const out = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const s of steps)
      if (!out.has(s.id) && s.dependsOn?.some((d) => out.has(d))) {
        out.add(s.id)
        grew = true
      }
  }
  return out
}

type Decided = { decision: AgentRunDecision["decision"]; reason?: string }

/** The next step that can run now: the first one waiting, unless it is a gate nobody has approved. */
function nextRunnable(steps: AgentRunStep[], status: Record<string, TraceStatus>, decided: Record<string, Decided>) {
  const next = steps.find((s) => status[s.id] === "pending")
  if (!next || (next.approval && decided[next.id]?.decision !== "approve")) return undefined
  return next
}

const minutes = (n: number) => `${formatNumber(n)} min`

export type AgentRunGateContentProps = {
  /** The run: its steps in order, each gate on the step it holds. */
  run?: AgentRun
  /** Called when a person decides at a gate, with their reason for Revise and Deny. */
  onDecide?: (decision: AgentRunDecision) => void
  /**
   * The sample's script: after a decision the steps that can run do, one by one. Set false when your run's events set
   * the steps instead (change `run` as they arrive).
   */
  script?: boolean
  /** The level of the run's title: 2 under a page's title, 3 in a sheet or a section. The gate's sections are one below. */
  headingLevel?: 2 | 3
  className?: string
}

/**
 * The run without a frame: its state and goal, the steps as a Trace with the gate under the step it holds, and the facts
 * about the run beside them from 1024 px.
 */
export function AgentRunGateContent({ run = sampleAgentRun, onDecide, script = true, headingLevel = 2, className }: AgentRunGateContentProps) {
  const { steps } = run
  // What the decisions and the script changed, over the statuses the run came with: with `script` off, your run's events
  // still set every step a decision has not.
  const [over, setStatus] = React.useState<Record<string, TraceStatus>>({})
  const status: Record<string, TraceStatus> = { ...Object.fromEntries(steps.map((s) => [s.id, s.status])), ...over }
  const [notes, setNotes] = React.useState<Record<string, string>>({})
  const [decided, setDecided] = React.useState<Record<string, Decided>>({})
  const [playing, setPlaying] = React.useState(false)

  // The script: a running step settles after STEP_MS, then the next one that can run starts. Every change is on a timer,
  // so the effect only schedules; the cleanup drops what is pending when the state moves on or the block leaves.
  React.useEffect(() => {
    if (!playing || !script) return
    const status: Record<string, TraceStatus> = { ...Object.fromEntries(steps.map((s) => [s.id, s.status])), ...over }
    const running = steps.find((s) => status[s.id] === "running")
    if (running) {
      const t = setTimeout(() => setStatus((st) => ({ ...st, [running.id]: "done" })), STEP_MS)
      return () => clearTimeout(t)
    }
    const next = nextRunnable(steps, status, decided)
    if (!next) return
    const t = setTimeout(() => {
      if (!prefersReducedMotion()) return setStatus((st) => ({ ...st, [next.id]: "running" }))
      // Under reduced motion every step that can run settles at once, up to the next gate nobody has approved.
      setStatus((st) => {
        const out = { ...Object.fromEntries(steps.map((s) => [s.id, s.status])), ...st }
        for (let s = nextRunnable(steps, out, decided); s; s = nextRunnable(steps, out, decided)) out[s.id] = "done"
        return out
      })
    }, GAP_MS)
    return () => clearTimeout(t)
  }, [playing, script, steps, over, decided])

  const decide = (step: AgentRunStep, decision: Decided["decision"], reason?: string) => {
    setDecided((d) => ({ ...d, [step.id]: { decision, reason } }))
    onDecide?.({ stepId: step.id, decision, reason })
    if (decision === "approve") {
      if (script) setStatus((st) => ({ ...st, [step.id]: prefersReducedMotion() ? "done" : "running" }))
      setPlaying(true)
    } else if (decision === "deny") {
      // Skipped, not failed: nothing went wrong, a person said no. The reason goes on each step it holds back.
      const held = dependents(steps, step.id)
      setStatus((st) => ({ ...st, ...Object.fromEntries([...held].map((id) => [id, "skipped" as const])) }))
      setNotes((n) => ({
        ...n,
        ...Object.fromEntries(
          [...held].map((id) => [id, id === step.id ? `Skipped: you denied it. ${reason}` : `Skipped: it depends on “${step.title}”, which you denied`]),
        ),
      }))
      setPlaying(true)
    }
  }

  const count = (s: TraceStatus) => steps.filter((x) => status[x.id] === s).length
  const gate = steps.find((s) => s.approval && status[s.id] === "pending" && decided[s.id]?.decision !== "approve")
  const waiting = gate && !(gate.approval!.expiresInMin <= 0)
  const finished = !steps.some((s) => status[s.id] === "pending" || status[s.id] === "running")
  const skipped = count("skipped")
  const [state, word]: [Status, string] = waiting
    ? decided[gate.id]?.decision === "revise"
      ? ["offline", "Sent back to the agent"]
      : ["warning", "Waiting for your approval"]
    : gate
      ? ["offline", "Approval expired"]
      : finished
        ? ["normal", skipped ? `Done, ${formatCount(skipped)} skipped` : "Done"]
        : ["active", "Running"]

  const Title = `h${headingLevel}` as "h2" | "h3"
  const sub = headingLevel === 2 ? "h3" : "h4"

  return (
    <div data-slot="agent-run-gate" className={className}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <StatusEyebrow status={state}>{word}</StatusEyebrow>
            <Title className="text-base font-bold text-pretty">{run.goal}</Title>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {run.agent}, started by {run.trigger}
              </span>
            </p>
          </div>
          <section aria-label="Steps" className="flex min-w-0 flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCount(count("done"))} of {formatCount(steps.length)} steps done
              {skipped ? `, ${formatCount(skipped)} skipped` : ""}
            </p>
            <Trace>
              {steps.map((s) => {
                const st = status[s.id]!
                const d = decided[s.id]
                const isGate = s === gate
                return (
                  <TraceItem
                    key={s.id}
                    data-gate={s.approval ? (isGate ? "open" : "closed") : undefined}
                    status={st}
                    title={s.title}
                    meta={s.tool}
                    duration={st === "done" ? s.durationMs : undefined}
                    description={describe(s, st, d, notes[s.id], isGate)}
                    defaultOpen={isGate || undefined}
                  >
                    {s.approval ? (
                      <GatePanel
                        step={s}
                        approval={s.approval}
                        decided={d}
                        status={st}
                        heading={sub}
                        held={dependents(steps, s.id).size - 1}
                        onDecide={(decision, reason) => decide(s, decision, reason)}
                      />
                    ) : undefined}
                  </TraceItem>
                )
              })}
            </Trace>
          </section>
        </div>
        <aside aria-label="Run facts">
          <DescriptionList
            columns={1}
            items={[
              { label: "Run", value: <Code>{run.id}</Code> },
              { label: "Agent", value: run.agent },
              { label: "Started by", value: run.trigger },
              { label: "Tools it may use", value: "Read robots, the schedule and incidents; send routes after a person approves" },
            ]}
          />
        </aside>
      </div>
    </div>
  )
}

/** The line under a step's title: its result, why it waits or why it was skipped. Shape and word for what needs someone. */
function describe(step: AgentRunStep, status: TraceStatus, decided: Decided | undefined, note: string | undefined, isGate: boolean): React.ReactNode {
  if (status === "skipped") return note
  if (status === "done") return step.result ?? step.description
  if (status === "pending" && step.approval) {
    const a = step.approval
    if (a.expiresInMin <= 0)
      return (
        <InlineStatus status="offline" className="text-xs">
          Expired at {a.expiresAt}: nothing changed
        </InlineStatus>
      )
    if (decided?.decision === "revise")
      return (
        <InlineStatus status="offline" className="text-xs">
          Sent back for changes
        </InlineStatus>
      )
    // The gate the run waits at, and gates further down: a person approves each before it runs.
    return isGate ? (
      <InlineStatus status="warning" className="text-xs">
        Needs your approval · expires {a.expiresAt}, in {minutes(a.expiresInMin)}
      </InlineStatus>
    ) : (
      "Moves robots: waits for a person's approval"
    )
  }
  return step.description
}

/**
 * Robot, now and after: three columns from 640 px; on a phone now and after stack under the robot in full, so the
 * approver reads both before deciding (a list row would cut them to one line).
 */
function ChangesTable({ label, changes }: { label: string; changes: AgentRunRobotChange[] }) {
  return (
    <Table bare aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Robot</TableHead>
          <TableHead className="hidden sm:table-cell">Now</TableHead>
          <TableHead className="hidden sm:table-cell">After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((c) => (
          <TableRow key={c.robot}>
            <TableCell className="py-3 align-top whitespace-normal sm:align-middle">
              <span className="font-medium sm:whitespace-nowrap">{c.robot}</span>
              <dl className="mt-2 flex flex-col gap-1 sm:hidden">
                <dt className="text-xs text-muted-foreground">Now</dt>
                <dd className="text-muted-foreground">{c.now}</dd>
                <dt className="mt-1 text-xs text-muted-foreground">After</dt>
                <dd>{c.after}</dd>
              </dl>
            </TableCell>
            <TableCell className="hidden whitespace-normal text-muted-foreground sm:table-cell">{c.now}</TableCell>
            <TableCell className="hidden whitespace-normal sm:table-cell">{c.after}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** The gate under the step it holds: the change robot by robot, why, the facts, and the decision. */
function GatePanel({
  step,
  approval: a,
  decided,
  status,
  heading,
  held,
  onDecide,
}: {
  step: AgentRunStep
  approval: AgentRunApproval
  decided?: Decided
  status: TraceStatus
  heading: "h3" | "h4"
  /** How many steps depend on this one, and so are skipped if it is denied. */
  held: number
  onDecide: (decision: Decided["decision"], reason?: string) => void
}) {
  const id = React.useId()
  const [mode, setMode] = React.useState<"choose" | "revise" | "deny">("choose")
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string>()
  const outcome = React.useRef<HTMLParagraphElement>(null)
  const opener = React.useRef<HTMLButtonElement | null>(null)
  const expired = a.expiresInMin <= 0
  // Revise sends it back and the run keeps waiting: the person can still approve or deny what is there.
  const open = !expired && status === "pending" && (!decided || decided.decision === "revise")

  // After a decision the buttons leave; focus goes to the line that says what happened, never to the page.
  const [focusOutcome, setFocusOutcome] = React.useState(false)
  React.useEffect(() => {
    if (focusOutcome) outcome.current?.focus()
  }, [focusOutcome, decided])

  const ask = (m: "revise" | "deny", e: React.MouseEvent<HTMLButtonElement>) => {
    opener.current = e.currentTarget
    setMode(m)
    setReason("")
    setError(undefined)
  }
  const cancel = () => {
    setMode("choose")
    setError(undefined)
    // The button that opened the form is gone and back; find it again by its name.
    requestAnimationFrame(() => document.getElementById(`${id}-${opener.current?.dataset.mode}`)?.focus())
  }

  return (
    <div
      data-slot="agent-run-gate-panel"
      // Inside the step's card: a hairline and space set it apart, not a box of its own, so edges never nest.
      className="flex flex-col gap-4 border-t border-border pt-4"
    >
      <section aria-labelledby={`${id}-changes`} className="flex flex-col gap-2">
        <SectionHeader id={`${id}-changes`} variant="surface" as={heading} title="What changes" count={a.changes.length} />
        <ChangesTable label={`What changes, ${a.title}`} changes={a.changes} />
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby={`${id}-why`} className="flex flex-col gap-2">
          <SectionHeader id={`${id}-why`} variant="surface" as={heading} title="Why" />
          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
            {a.why.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby={`${id}-facts`} className="flex flex-col gap-2">
          <SectionHeader id={`${id}-facts`} variant="surface" as={heading} title="Facts it used" />
          <DescriptionList variant="bare" columns={2} items={a.facts} />
        </section>
      </div>

      {open && mode === "choose" ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {decided?.decision === "revise" && (
            <p ref={outcome} tabIndex={-1} role="status" className="text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              You sent it back: {decided.reason} The agent has not proposed again yet; you can still approve or deny this one.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Nothing moves until you approve.{" "}
            {held > 0 ? `Deny skips this step and the ${formatCount(held)} ${held === 1 ? "step" : "steps"} that depend on it.` : "Deny skips this step."}
          </p>
          {/* Phones and tablets stack the three full width, the main one first; from 1024 px they share a row. */}
          <div className="grid gap-2 lg:flex lg:flex-wrap">
            <Button
              onClick={() => {
                setFocusOutcome(true)
                onDecide("approve")
              }}
            >
              Approve and send to robots
            </Button>
            <Button id={`${id}-revise`} data-mode="revise" variant="secondary" onClick={(e) => ask("revise", e)}>
              Revise
            </Button>
            <Button id={`${id}-deny`} data-mode="deny" variant="ghost" onClick={(e) => ask("deny", e)}>
              Deny
            </Button>
          </div>
        </div>
      ) : open ? (
        <form
          noValidate
          aria-label={mode === "revise" ? "Send back for changes" : "Deny this step"}
          className="flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (mode === "choose") return
            if (!reason.trim()) return setError(mode === "revise" ? "Say what to change, so the agent can propose again." : "Say why, so the agent and the next person know.")
            setFocusOutcome(true)
            setMode("choose")
            onDecide(mode, reason.trim())
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              cancel()
            }
          }}
        >
          <Field
            label={mode === "revise" ? "What should change?" : "Why deny it?"}
            hint={mode === "deny" ? `Skips this step and ${held > 0 ? `the ${formatCount(held)} that depend on it` : "nothing else"}. No robot moves.` : undefined}
            error={error}
          >
            {/* The form opened on a press of Revise or Deny: the cursor goes where the next keystroke belongs. */}
            <Textarea rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="grid gap-2 sm:flex">
            <Button type="submit" variant="secondary">
              {mode === "revise" ? "Send back" : "Deny"}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p ref={outcome} tabIndex={-1} role="status" className="border-t border-border pt-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {expired
            ? `Expired at ${a.expiresAt}. Nothing changed; the agent can propose again.`
            : decided?.decision === "deny"
              ? `You denied it: ${decided.reason} No robot moved.`
              : status === "done"
                ? `Approved by you. ${step.result ?? "Sent to the robots."}`
                : "Approved by you. Sending to the robots."}
        </p>
      )}
    </div>
  )
}

/**
 * An agent run that waits at a gate before a step that moves robots, as a page of the console.
 */
export function AgentRunGate(props: Omit<AgentRunGateContentProps, "className" | "headingLevel">) {
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#agents" title="Route planner run" user={sampleUser}>
      <AgentRunGateContent {...props} headingLevel={2} />
    </AppShell>
  )
}
