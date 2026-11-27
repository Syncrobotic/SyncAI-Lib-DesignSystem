// @syncrobotic/agent-run-outcome v0.53.0 · update: npx shadcn add @syncrobotic/agent-run-outcome --overwrite
"use client"

import * as React from "react"
import { RotateCw, Sparkles } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Code } from "@/registry/syncrobotic/ui/code"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

/*
  What an ended run did to the fleet, robot by robot: succeeded, failed, skipped, or not verified (sent, never confirmed;
  never counted as a success). Retry failed asks first and names the failed robots it will move; a robot that is not
  verified is left out, since sending twice could move it twice. Replace the sample `retry` with your API's (it resolves
  to each robot's new result).
*/

export type AgentRunResult = "succeeded" | "failed" | "skipped" | "unverified" | "retrying"

export type AgentRunRobotOutcome = {
  robot: string
  result: AgentRunResult
  /** What happened, in words: where it docked, the reason it failed, why it was skipped, what was last heard. */
  detail: string
  /** The clock time of the result, as written. */
  time?: string
}

export type AgentRunSummary = {
  id: string
  agent: string
  goal: string
  /** "Ended 22:46", "Ended 22:46, approved by Kai Chen". */
  ended: string
  robots: AgentRunRobotOutcome[]
}

// ---------- Sample data: docking hall 2 before the floor wash ----------

export const sampleAgentRunOutcome: AgentRunSummary = {
  id: "run_8c3e",
  agent: "Fleet planner",
  goal: "Dock every robot in hall 2 before the floor wash",
  ended: "Ended 22:46, approved by Kai Chen",
  robots: [
    { robot: "AMR 07", result: "failed", detail: "Path to Dock 4 blocked: a pallet in aisle 6", time: "22:41" },
    { robot: "Patrol dog 9E37", result: "failed", detail: "Refused the route: 9 % battery is under the route's reserve", time: "22:40" },
    { robot: "AMR 12", result: "unverified", detail: "Command sent 22:40; no reply in 5 min. Last seen in aisle 3 at 22:39", time: "22:40" },
    { robot: "Patrol dog 7F3A", result: "succeeded", detail: "Docked at Dock 2", time: "22:43" },
    { robot: "Patrol dog 1715", result: "succeeded", detail: "Docked at Dock 2", time: "22:44" },
    { robot: "Patrol dog DAA6", result: "succeeded", detail: "Docked at Dock 3", time: "22:42" },
    { robot: "AMR 04", result: "succeeded", detail: "Docked at Dock 4", time: "22:43" },
    { robot: "AMR 09", result: "succeeded", detail: "Docked at Dock 4", time: "22:45" },
    { robot: "AMR 11", result: "succeeded", detail: "Docked at Dock 5", time: "22:44" },
    { robot: "Patrol dog B812", result: "skipped", detail: "Already docked" },
    { robot: "AMR 15", result: "skipped", detail: "In maintenance; the agent leaves it alone" },
  ],
}

/** The sample's retry: the pallet was moved, so AMR 07 docks; 9E37 still has too little charge. */
export async function sampleAgentRunRetry(robot: AgentRunRobotOutcome): Promise<AgentRunRobotOutcome> {
  await new Promise((r) => setTimeout(r, 1500))
  return robot.robot === "Patrol dog 9E37"
    ? { ...robot, result: "failed", detail: "Refused again: 9 % battery. Charge it first, then retry", time: "22:52" }
    : { ...robot, result: "succeeded", detail: "Docked at Dock 4 on retry", time: "22:52" }
}

// Each result is a shape and a word; colour only for what needs someone: a failure (danger) and a result nobody has
// confirmed (warning). Success and skipped are calm.
const tone: Record<AgentRunResult, Status> = { succeeded: "normal", failed: "danger", unverified: "warning", skipped: "offline", retrying: "active" }
const word: Record<AgentRunResult, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  unverified: "Not verified",
  skipped: "Skipped",
  retrying: "Retrying",
}
// What needs someone first: failures, then what nobody confirmed, then the work under way, then the rest.
const order: Record<AgentRunResult, number> = { failed: 0, unverified: 1, retrying: 2, succeeded: 3, skipped: 4 }

const columns: ResponsiveTableColumn<AgentRunRobotOutcome>[] = [
  { id: "robot", header: "Robot", cell: (r) => <span className="font-medium whitespace-nowrap">{r.robot}</span>, phoneCell: (r) => r.robot },
  { id: "result", header: "Result", cell: (r) => <InlineStatus status={tone[r.result]}>{word[r.result]}</InlineStatus>, phone: "trailing" },
  {
    id: "detail",
    header: "Detail",
    cell: (r) => r.detail,
    // A failure's reason is the point of the row: it wraps, and on a phone it is a line of its own under the robot.
    wrap: true,
    className: "text-muted-foreground",
  },
  { id: "time", header: "Time", cell: (r) => r.time ?? "—", align: "end", phone: "hidden", className: "text-muted-foreground tabular-nums" },
]

export type AgentRunOutcomeContentProps = {
  run?: AgentRunSummary
  /** Where the run's steps are: its trace. */
  traceHref?: string
  /** Your router's link (e.g. next/link), for `traceHref`. */
  linkAs?: React.ElementType
  /** Sends the command again to one failed robot and resolves to its new result. The sample's script by default. */
  retry?: (robot: AgentRunRobotOutcome) => Promise<AgentRunRobotOutcome>
  /** The level of the run's title: 2 under a page's title, 3 in a sheet or a section. */
  headingLevel?: 2 | 3
  className?: string
}

/**
 * The result without a frame: the run's state and goal, a count per result, and the robots, those that need someone
 * first, with Retry failed above them.
 */
export function AgentRunOutcomeContent({
  run = sampleAgentRunOutcome,
  traceHref = `#agents/runs/${run.id}`,
  linkAs: Link = "a",
  retry = sampleAgentRunRetry,
  headingLevel = 2,
  className,
}: AgentRunOutcomeContentProps) {
  const [robots, setRobots] = React.useState(run.robots)
  const [said, setSaid] = React.useState("")
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const n = (r: AgentRunResult) => robots.filter((x) => x.result === r).length
  const failed = n("failed")
  const unverified = n("unverified")
  const retrying = n("retrying")
  const total = robots.length

  const retryFailed = async () => {
    const targets = robots.filter((r) => r.result === "failed")
    if (!targets.length) return
    const names = new Set(targets.map((t) => t.robot))
    setRobots((rs) => rs.map((r) => (names.has(r.robot) ? { ...r, result: "retrying", detail: "Command sent again" } : r)))
    setSaid(`Retrying ${formatCount(targets.length)} failed ${targets.length === 1 ? "robot" : "robots"}.`)
    const results = await Promise.all(
      targets.map((t) => retry(t).catch((): AgentRunRobotOutcome => ({ ...t, result: "failed", detail: "Retry could not be sent. Try again" }))),
    )
    if (!alive.current) return
    const by = new Map(results.map((r) => [r.robot, r]))
    setRobots((rs) => rs.map((r) => by.get(r.robot) ?? r))
    const ok = results.filter((r) => r.result === "succeeded").length
    setSaid(`Retry finished: ${formatCount(ok)} succeeded, ${formatCount(results.length - ok)} failed again.`)
  }

  const [state, stateWord]: [Status, string] = retrying
    ? ["active", "Retrying"]
    : failed
      ? ["danger", `Ended, ${formatCount(failed)} failed`]
      : unverified
        ? ["warning", `Ended, ${formatCount(unverified)} not verified`]
        : ["normal", "Ended"]
  const Title = `h${headingLevel}` as "h2" | "h3"
  const sorted = [...robots].sort((a, b) => order[a.result] - order[b.result])

  return (
    <div data-slot="agent-run-outcome" className={className}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            <StatusEyebrow status={state}>{stateWord}</StatusEyebrow>
            <Title className="text-base font-bold text-pretty">{run.goal}</Title>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {run.agent} · <Code>{run.id}</Code> · {run.ended}
              </span>
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={traceHref}>Open the run's steps</Link>
          </Button>
        </div>

        <MetricGrid>
          <MetricCard label="Succeeded" value={formatCount(n("succeeded"))} unit={`/ ${formatCount(total)}`} caption="Confirmed by the robot" />
          <MetricCard
            label="Failed"
            value={formatCount(failed + retrying)}
            caption={retrying ? `Retrying ${formatCount(retrying)}` : failed ? "Each says why below" : "None"}
            tone={failed ? "danger" : undefined}
          />
          <MetricCard
            label="Not verified"
            value={formatCount(unverified)}
            caption={unverified ? "Sent, but no reply: check on the floor" : "Every robot replied"}
            tone={unverified ? "warning" : undefined}
          />
          <MetricCard label="Skipped" value={formatCount(n("skipped"))} caption="Left as they were" />
        </MetricGrid>

        <section aria-labelledby="outcome-robots" className="flex flex-col gap-3">
          <SectionHeader
            id="outcome-robots"
            as={headingLevel === 2 ? "h3" : "h4"}
            title="Robots"
            count={total}
            description={
              failed
                ? `Retry sends the command again to the ${formatCount(failed)} failed only. Robots not verified are left out: the command may have arrived.`
                : "Nothing failed, so there is nothing to retry."
            }
            actions={
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="secondary" disabled={!failed || retrying > 0}>
                    <RotateCw aria-hidden="true" />
                    {failed ? `Retry ${formatCount(failed)} failed` : "Retry failed"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Send the command again to {formatCount(failed)} {failed === 1 ? "robot" : "robots"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>They will move as the run asked. The robots not verified are left out.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <ul className="flex flex-col gap-1 text-sm">
                    {robots
                      .filter((r) => r.result === "failed")
                      .map((r) => (
                        <li key={r.robot}>
                          <span className="font-medium">{r.robot}</span> <span className="text-muted-foreground">· {r.detail}</span>
                        </li>
                      ))}
                  </ul>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Not now</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void retryFailed()}>Send again</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            }
          />
          <p role="status" className="sr-only">
            {said}
          </p>
          <ResponsiveTable
            label="Robots in this run"
            rows={sorted}
            columns={columns}
            rowKey={(r) => r.robot}
            empty={<EmptyState size="inline" icon={Sparkles} title="No robots in this run" description="The run ended before it sent a command to any robot." />}
          />
        </section>
      </div>
    </div>
  )
}

/**
 * A fleet run's result robot by robot (succeeded, failed, skipped, not verified), with counts, the robots that need
 * someone first and Retry failed; AgentRunOutcomeContent drops the frame.
 */
export function AgentRunOutcome(props: Omit<AgentRunOutcomeContentProps, "className" | "headingLevel">) {
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#agents" title="Run result" user={sampleUser}>
      <AgentRunOutcomeContent {...props} headingLevel={2} />
    </AppShell>
  )
}
