// @syncrobotic/agent-tool-permissions v0.43.0 · update: npx shadcn add @syncrobotic/agent-tool-permissions --overwrite
"use client"

import * as React from "react"
import { Lock, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Code } from "@/registry/syncrobotic/ui/code"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

/** What an agent may do with a tool: call it on its own, ask a person each time, or not call it at all. */
export type ToolPolicy = "auto" | "ask" | "blocked"

export type AgentTool = {
  id: string
  /** What the tool does, in words: "Send a robot to a place". */
  name: string
  /** One line on what it reads or changes. */
  description: string
  /** It changes what a robot does (moves, pauses, docks): never Auto, a person approves every call. */
  movesRobot?: boolean
}

export type ToolAgent = {
  id: string
  name: string
  description: string
  tools: AgentTool[]
}

/** Policies by agent id, then tool id. */
export type ToolPolicies = Record<string, Record<string, ToolPolicy>>

/** One change waiting to be saved. */
export type ToolPolicyChange = { agent: ToolAgent; tool: AgentTool; from: ToolPolicy; to: ToolPolicy }

export type ToolCallResult = "auto" | "approved" | "denied" | "blocked"

export type ToolCall = {
  id: string
  /** ISO time, for <time dateTime>. */
  at: string
  /** The time as people read it: "26 Nov 21:58". */
  time: string
  agentId: string
  toolId: string
  /** The arguments in short: `robot=9E37 to=dock-2`. */
  args: string
  result: ToolCallResult
  /** Who approved or denied it. */
  by?: string
}

const tool = {
  robotState: { id: "read-robot-state", name: "Read robot state", description: "Position, battery, mission and faults of any robot." },
  schedule: { id: "read-schedule", name: "Read schedule", description: "Missions planned for the next 7 days." },
  camera: { id: "read-camera-frame", name: "Read camera frame", description: "One still from a robot's camera, not the live feed." },
  alarms: { id: "read-alarms", name: "Read alarms", description: "Open and recent alarms, with who handled them." },
  draft: { id: "draft-schedule-change", name: "Draft schedule change", description: "A proposal people review; it changes nothing until approved." },
  report: { id: "draft-incident-report", name: "Draft incident report", description: "A summary saved as a draft for the shift lead." },
  send: { id: "send-robot", name: "Send robot to a place", description: "Drives a robot to a named place on the map.", movesRobot: true },
  pause: { id: "pause-robot", name: "Pause a robot", description: "Holds a robot where it is until someone resumes it.", movesRobot: true },
} satisfies Record<string, AgentTool>

// Sample data: three agents and the tools each can call.
export const sampleToolAgents: ToolAgent[] = [
  {
    id: "route-planner",
    name: "Route planner",
    description: "Plans patrols and reroutes around blocked doors.",
    tools: [tool.robotState, tool.schedule, tool.draft, tool.send, tool.pause],
  },
  {
    id: "fleet-assistant",
    name: "Fleet assistant",
    description: "Answers questions about the fleet in the chat.",
    tools: [tool.robotState, tool.schedule, tool.camera, tool.draft, tool.send, tool.pause],
  },
  {
    id: "incident-writer",
    name: "Incident writer",
    description: "Summarises incidents for the morning shift.",
    tools: [tool.robotState, tool.alarms, tool.camera, tool.report],
  },
]

export const sampleToolPolicies: ToolPolicies = {
  "route-planner": { "read-robot-state": "auto", "read-schedule": "auto", "draft-schedule-change": "auto", "send-robot": "ask", "pause-robot": "ask" },
  "fleet-assistant": {
    "read-robot-state": "auto",
    "read-schedule": "auto",
    "read-camera-frame": "ask",
    "draft-schedule-change": "ask",
    "send-robot": "blocked",
    "pause-robot": "blocked",
  },
  "incident-writer": { "read-robot-state": "auto", "read-alarms": "auto", "read-camera-frame": "blocked", "draft-incident-report": "auto" },
}

// Newest first. The incident writer has made no calls yet, so choosing it shows the empty state.
export const sampleToolCalls: ToolCall[] = [
  { id: "c9", at: "2026-11-26T21:58", time: "26 Nov 21:58", agentId: "route-planner", toolId: "send-robot", args: "robot=9E37 to=dock-2", result: "approved", by: "Kai Chen" },
  { id: "c8", at: "2026-11-26T21:57", time: "26 Nov 21:57", agentId: "route-planner", toolId: "draft-schedule-change", args: "route=perimeter avoid=C3", result: "auto" },
  { id: "c7", at: "2026-11-26T21:55", time: "26 Nov 21:55", agentId: "fleet-assistant", toolId: "pause-robot", args: "robot=7F3A", result: "blocked" },
  { id: "c6", at: "2026-11-26T21:54", time: "26 Nov 21:54", agentId: "fleet-assistant", toolId: "read-camera-frame", args: "robot=7F3A camera=front", result: "denied", by: "Ana Ruiz" },
  { id: "c5", at: "2026-11-26T21:52", time: "26 Nov 21:52", agentId: "fleet-assistant", toolId: "read-robot-state", args: "robot=7F3A", result: "auto" },
  { id: "c4", at: "2026-11-26T21:40", time: "26 Nov 21:40", agentId: "route-planner", toolId: "pause-robot", args: "robot=2C10 reason=door-C3", result: "approved", by: "Mei Lin" },
  { id: "c3", at: "2026-11-26T21:39", time: "26 Nov 21:39", agentId: "route-planner", toolId: "read-schedule", args: "site=north days=1", result: "auto" },
  { id: "c2", at: "2026-11-26T21:12", time: "26 Nov 21:12", agentId: "fleet-assistant", toolId: "send-robot", args: "robot=2C10 to=loading-bay", result: "blocked" },
  { id: "c1", at: "2026-11-26T20:05", time: "26 Nov 20:05", agentId: "fleet-assistant", toolId: "read-schedule", args: "site=north days=7", result: "auto" },
]

const policyWord: Record<ToolPolicy, string> = { auto: "Auto", ask: "Ask", blocked: "Blocked" }
const order: ToolPolicy[] = ["auto", "ask", "blocked"]
// Looser is a higher rank: Blocked → Ask and Ask → Auto loosen a policy, and saving them asks the person to confirm.
const rank: Record<ToolPolicy, number> = { blocked: 0, ask: 1, auto: 2 }

/** A tool that moves a robot is never Auto, whatever the data says: it is read as Ask. */
const policyOf = (p: ToolPolicies, agent: ToolAgent, t: AgentTool): ToolPolicy => {
  const v = p[agent.id]?.[t.id] ?? "ask"
  return t.movesRobot && v === "auto" ? "ask" : v
}

const changesBetween = (agents: ToolAgent[], from: ToolPolicies, to: ToolPolicies): ToolPolicyChange[] =>
  agents.flatMap((agent) =>
    agent.tools.flatMap((t) => {
      const a = policyOf(from, agent, t)
      const b = policyOf(to, agent, t)
      return a === b ? [] : [{ agent, tool: t, from: a, to: b }]
    }),
  )

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`

// A call blocked by policy is the one an admin may want to look at (an agent tried what it may not do): the only one
// with colour. A person's no is a decision, not a fault, so it stays grey like the rest.
const resultStatus = { auto: "normal", approved: "normal", denied: "offline", blocked: "warning" } as const
const resultWord = (c: ToolCall) =>
  ({ auto: "Allowed automatically", approved: `Approved by ${c.by ?? "a person"}`, denied: `Denied by ${c.by ?? "a person"}`, blocked: "Blocked by policy" })[c.result]

const shortResult: Record<ToolCallResult, string> = { auto: "Allowed", approved: "Approved", denied: "Denied", blocked: "Blocked" }

/** One tool and its three-way policy. */
function ToolRow({
  agent,
  tool: t,
  value,
  saved,
  onChange,
}: {
  agent: ToolAgent
  tool: AgentTool
  value: ToolPolicy
  saved: ToolPolicy
  onChange: (v: ToolPolicy) => void
}) {
  const id = React.useId()
  return (
    <li data-slot="agent-tool-row" className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span id={`${id}-name`} className="text-sm font-medium">
          {t.name}
        </span>
        <span className="text-xs text-pretty text-muted-foreground">{t.description}</span>
        {/* Auto is not taken away silently: the reason is said in words, beside the lock, and read with the control. */}
        {t.movesRobot && (
          <span id={`${id}-locked`} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock aria-hidden="true" className="size-4 shrink-0" />
            Changes what a robot does, so a person approves every call. Auto is not available.
          </span>
        )}
        {value !== saved && (
          <span data-slot="agent-tool-changed" className="text-xs text-foreground">
            Changed from {policyWord[saved]}, not saved yet
          </span>
        )}
      </div>
      <SegmentedControl
        aria-label={`${t.name}, ${agent.name}`}
        aria-describedby={t.movesRobot ? `${id}-locked` : undefined}
        value={value}
        onValueChange={(v) => onChange(v as ToolPolicy)}
        className="h-(--h-sm) shrink-0 sm:w-64"
      >
        {order.map((p) => (
          <SegmentedControlItem key={p} value={p} disabled={p === "auto" && t.movesRobot}>
            {policyWord[p]}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </li>
  )
}

export type AgentToolPermissionsContentProps = {
  agents?: ToolAgent[]
  /** The saved policies. A tool missing from them is Ask; a tool that moves a robot is never Auto. */
  defaultPolicies?: ToolPolicies
  calls?: ToolCall[]
  /** Called with the new policies and what changed, after the person confirmed any loosening. */
  onSave?: (policies: ToolPolicies, changes: ToolPolicyChange[]) => void
  className?: string
}

/**
 * Which tools each AI agent may call: Auto (on its own), Ask (a person approves each call) or Blocked, one choice per
 * tool. Tools that move a robot are never Auto, and say why. Changes collect until Save; saving one that loosens a policy
 * asks the person to confirm with their password first. Under it, the call audit: what each agent called, with what,
 * and what happened, narrowed by agent. Without the sample frame, for a product's own shell.
 */
export function AgentToolPermissionsContent({
  agents = sampleToolAgents,
  defaultPolicies = sampleToolPolicies,
  calls = sampleToolCalls,
  onSave,
  className,
}: AgentToolPermissionsContentProps) {
  const [saved, setSaved] = React.useState(defaultPolicies)
  const [draft, setDraft] = React.useState(defaultPolicies)
  const [justSaved, setJustSaved] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState<string>()
  const [agentFilter, setAgentFilter] = React.useState("all")

  const changes = changesBetween(agents, saved, draft)
  const loosened = changes.filter((c) => rank[c.to] > rank[c.from])

  const set = (agent: ToolAgent, t: AgentTool, v: ToolPolicy) => {
    if (t.movesRobot && v === "auto") return
    setJustSaved(false)
    setDraft((d) => ({ ...d, [agent.id]: { ...d[agent.id], [t.id]: v } }))
  }
  const commit = () => {
    onSave?.(draft, changes)
    setSaved(draft)
    setJustSaved(true)
    setConfirming(false)
    setPassword("")
    setPasswordError(undefined)
  }
  const save = () => (loosened.length ? setConfirming(true) : commit())
  const discard = () => {
    setDraft(saved)
    setJustSaved(false)
  }
  const confirm = (e: React.FormEvent) => {
    e.preventDefault()
    // The sample takes any password; yours checks it on the server and returns a short-lived elevated session.
    if (!password) return setPasswordError("Enter your password to loosen these policies.")
    commit()
  }

  const agentById = new Map(agents.map((a) => [a.id, a]))
  const toolName = (c: ToolCall) => agentById.get(c.agentId)?.tools.find((t) => t.id === c.toolId)?.name ?? c.toolId
  const agentName = (c: ToolCall) => agentById.get(c.agentId)?.name ?? c.agentId
  const shown = calls.filter((c) => agentFilter === "all" || c.agentId === agentFilter)
  const filterName = agentById.get(agentFilter)?.name

  // One list of columns: the tool is the row's title on a phone, the result in a word its trailing state, the agent and
  // the time the line under it; the arguments and who decided stay in the table.
  const columns: ResponsiveTableColumn<ToolCall>[] = [
    {
      id: "time",
      header: "Time",
      cell: (c) => <time dateTime={c.at}>{c.time}</time>,
      className: "whitespace-nowrap text-muted-foreground tabular-nums",
    },
    { id: "agent", header: "Agent", cell: agentName, className: "whitespace-nowrap" },
    { id: "tool", header: "Tool", phone: "title", cell: (c) => <span className="font-medium">{toolName(c)}</span>, phoneCell: toolName },
    {
      id: "args",
      header: "Arguments",
      phone: "hidden",
      cell: (c) => <Code className="text-xs">{c.args}</Code>,
      className: "hidden whitespace-normal lg:table-cell",
    },
    {
      id: "result",
      header: "Result",
      phone: "trailing",
      cell: (c) => <InlineStatus status={resultStatus[c.result]}>{resultWord(c)}</InlineStatus>,
      phoneCell: (c) => <InlineStatus status={resultStatus[c.result]}>{shortResult[c.result]}</InlineStatus>,
    },
  ]

  return (
    <div data-slot="agent-tool-permissions" className={cn("flex flex-col gap-8", className)}>
      <section aria-labelledby="tool-access-title" className="flex flex-col gap-4">
        <SectionHeader
          id="tool-access-title"
          title="Tool access"
          description="Auto: the agent calls the tool on its own. Ask: a person approves each call. Blocked: the agent cannot call it."
        />
        {/* The save row: how many changes wait, then Discard and Save; on a phone the count takes its own line above them.
            It pins under the shell's top bar (--shell-top) on the shell's surface, like a sticky TabsList, so Save stays in
            reach while the rows of a long list are changed. */}
        <div className="sticky top-[var(--shell-top,0)] z-10 flex flex-wrap items-center justify-end gap-2 bg-[var(--shell-surface,var(--color-background))] py-2">
          <span role="status" className="mr-auto text-sm text-muted-foreground tabular-nums max-sm:w-full">
            {changes.length ? plural(changes.length, "unsaved change", "unsaved changes") : justSaved ? "Changes saved" : "No unsaved changes"}
          </span>
          <Button variant="ghost" onClick={discard} disabled={!changes.length}>
            Discard
          </Button>
          <Button onClick={save} disabled={!changes.length}>
            Save changes
          </Button>
        </div>
        {agents.map((agent) => (
          <Card key={agent.id} className="gap-0 p-0">
            <SectionHeader
              variant="surface"
              id={`tool-access-${agent.id}`}
              title={agent.name}
              description={agent.description}
              className="border-b border-border px-4 py-3"
            />
            <ul aria-labelledby={`tool-access-${agent.id}`}>
              {agent.tools.map((t) => (
                <ToolRow
                  key={t.id}
                  agent={agent}
                  tool={t}
                  value={policyOf(draft, agent, t)}
                  saved={policyOf(saved, agent, t)}
                  onChange={(v) => set(agent, t, v)}
                />
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <section aria-labelledby="tool-calls-title" className="flex flex-col gap-4">
        <SectionHeader id="tool-calls-title" title="Recent tool calls" description="What each agent called, with what, and what happened." />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger aria-label="Agent" className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span role="status" className="text-sm text-muted-foreground tabular-nums max-sm:w-full sm:ml-auto">
            {formatCount(shown.length)} of {plural(calls.length, "call", "calls")}
          </span>
        </div>
        <ResponsiveTable
          label="Recent tool calls"
          rows={shown}
          columns={columns}
          rowKey={(c) => c.id}
          empty={
            <EmptyState
              size="inline"
              icon={SearchX}
              title={filterName ? `No calls from ${filterName}` : "No tool calls yet"}
              description={filterName ? "It has not called a tool recently. Choose All agents to see the rest." : "Calls show up here as soon as an agent makes one."}
            />
          }
        />
      </section>

      <AlertDialog
        open={confirming}
        onOpenChange={(o) => {
          setConfirming(o)
          if (!o) {
            setPassword("")
            setPasswordError(undefined)
          }
        }}
      >
        <AlertDialogContent>
          <form noValidate onSubmit={confirm} className="flex flex-col gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Loosen {plural(loosened.length, "policy", "policies")}?</AlertDialogTitle>
              <AlertDialogDescription>These agents will be able to do more without asking. Confirm it is you.</AlertDialogDescription>
            </AlertDialogHeader>
            <ul aria-label="Policies that loosen" className="flex flex-col gap-1 text-sm">
              {loosened.map((c) => (
                <li key={`${c.agent.id}/${c.tool.id}`}>
                  <span className="font-medium">{c.agent.name}</span>, {c.tool.name}:{" "}
                  <span className="whitespace-nowrap">
                    {policyWord[c.from]} <span aria-hidden="true">→</span>
                    <span className="sr-only">to</span> {policyWord[c.to]}
                  </span>
                </li>
              ))}
            </ul>
            <Field label="Your password" error={passwordError}>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep them as they are</AlertDialogCancel>
              <Button type="submit">Confirm and save</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** Agent tool permissions in the sample app shell. */
export function AgentToolPermissions(props: Omit<AgentToolPermissionsContentProps, "className">) {
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#agents" title="Agent tool access" user={sampleUser}>
      <AgentToolPermissionsContent {...props} />
    </AppShell>
  )
}
