// @syncrobotic/agent-chat v0.53.0 · update: npx shadcn add @syncrobotic/agent-chat --overwrite
"use client"

import * as React from "react"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { prefersReducedMotion, useMediaQuery } from "@/registry/syncrobotic/hooks/use-reduced-motion"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Citations, CitationSources, citationMarker, type CitationSource } from "@/registry/syncrobotic/ui/citations"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Message, MessageMeta } from "@/registry/syncrobotic/ui/message"
import { MessageActions, type MessageFeedback } from "@/registry/syncrobotic/ui/message-actions"
import { MessageScroller } from "@/registry/syncrobotic/ui/message-scroller"
import { PromptComposer } from "@/registry/syncrobotic/ui/prompt-composer"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { StreamingText, type StreamingTextPhase } from "@/registry/syncrobotic/ui/streaming-text"
import { Trace, TraceItem, type TraceStatus } from "@/registry/syncrobotic/ui/trace"

/*
  A conversation with the fleet's assistant: Message turns in a MessageScroller, the PromptComposer at its foot, answers
  streaming as Markdown with sources, tool calls as a Trace. The assistant never moves a robot: it drafts a proposal a
  person approves (agent-approval). The streaming is a script so the block runs without a model: replace `respond` and
  the timer in `play` with your API's stream (append each chunk to the turn's text, set the phase as the request goes).
*/

/** One tool call the assistant made, as a Trace step. */
export type AgentChatStep = { title: string; tool: string; status?: TraceStatus; durationMs?: number; description?: string }

/** A proposal the assistant drafted instead of acting: it links to where a person approves it. */
export type AgentChatProposal = { title: string; detail: string; href: string; action: string }

export type AgentChatTurn =
  | { id: string; role: "system"; time: string; dateTime?: string; text: string }
  | { id: string; role: "user"; name?: string; time: string; dateTime?: string; text: string }
  | { id: string; role: "tool"; name: string; time: string; dateTime?: string; steps: AgentChatStep[] }
  | {
      id: string
      role: "assistant"
      name?: string
      time: string
      dateTime?: string
      /** Markdown, citing `sources` as [1], [2]. */
      text: string
      phase: StreamingTextPhase
      sources?: CitationSource[]
      proposal?: AgentChatProposal
      model?: string
      durationMs?: number
      tokens?: number
    }

/** What the assistant answers to a prompt: the tool calls it makes first, then its answer and the sources it cites. */
export type AgentChatReply = { steps?: AgentChatStep[]; text: string; sources?: CitationSource[]; proposal?: AgentChatProposal }

// ---------- Sample data: one evening at warehouse B ----------

const robotStates: CitationSource = { title: "Robot states, 21:48", location: "robots.list" }
const forecast: CitationSource = { title: "Battery forecast, last 7 nights", location: "robots.forecast" }
const patrolRules: CitationSource = {
  title: "Night patrol rules, warehouse B",
  url: "https://docs.example.com/sites/warehouse-b/night-patrol",
  snippet: "Every robot ends a night round with at least 25 % battery in reserve.",
}
const incident: CitationSource = { title: "Incident IN-2041: door C3 closed", location: "Incidents › IN-2041" }

const coverSteps: AgentChatStep[] = [
  { title: "Read robot states", tool: "robots.list", durationMs: 900, description: "14 robots, 12 available" },
  { title: "Read open incidents", tool: "incidents.list", durationMs: 700, description: "1 open: door C3" },
  { title: "Forecast battery for each route", tool: "robots.forecast", durationMs: 4100, description: "1715 ends at 31 %, 7F3A at 44 %" },
]

const coverAnswer = `**Patrol dog 1715** can. It finishes its car park round at 23:40 and ends the night at 31 % battery, above the 25 % reserve [1][2][3].

**Patrol dog 7F3A** has more charge left, but it is the only robot on the perimeter tonight [1].

| Robot | Free from | Battery at 06:00 |
|---|---|---|
| Patrol dog 1715 | 23:40 | 31 % |
| Patrol dog 7F3A | Not free | 44 % |

Patrol dog 9E37 stays at door C3 while incident IN-2041 is open [4].`

const proposal: AgentChatProposal = {
  title: "Reroute Patrol dog 1715",
  detail: "Car park until 23:40, then loading bay A and B · expires in 25 min",
  href: "#agents/approvals/run_8c21",
  action: "Review proposal",
}

/** The questions a new conversation offers to start from. */
export const sampleAgentChatSuggestions = ["Who can cover the loading bay tonight?", "Summarise tonight's alarms", "Which robots need a battery check?"]

/** A conversation already under way, settled: the assistant's rules, a question, its tool calls, a cited answer and a proposal. */
export const sampleAgentChatTurns: AgentChatTurn[] = [
  {
    id: "s",
    role: "system",
    time: "21:47",
    dateTime: "2026-11-26T21:47",
    text: "The assistant reads robot states, the schedule and open incidents. It drafts changes; a person approves anything that moves a robot.",
  },
  { id: "q1", role: "user", name: sampleUser.name, time: "21:48", dateTime: "2026-11-26T21:48", text: "Patrol dog 9E37 is stuck at door C3. Who can cover the loading bay tonight?" },
  { id: "t1", role: "tool", name: "Fleet data", time: "21:48", dateTime: "2026-11-26T21:48", steps: coverSteps },
  {
    id: "a1",
    role: "assistant",
    name: "Fleet assistant",
    time: "21:48",
    dateTime: "2026-11-26T21:48",
    text: coverAnswer,
    phase: "done",
    sources: [robotStates, forecast, patrolRules, incident],
    model: "Large",
    durationMs: 3100,
    tokens: 1204,
  },
  { id: "q2", role: "user", name: sampleUser.name, time: "21:50", dateTime: "2026-11-26T21:50", text: "Send 1715 to the loading bay after its car park round." },
  {
    id: "a2",
    role: "assistant",
    name: "Fleet assistant",
    time: "21:50",
    dateTime: "2026-11-26T21:50",
    text: "I cannot move robots: a person approves anything that does. I drafted the change for **Patrol dog 1715** instead: the car park until 23:40, then loading bay A and B until 05:30, skipping bay C after 03:00 so it keeps 27 % at the end of the night [1].\n\nNothing changes until someone approves it.",
    phase: "done",
    sources: [forecast],
    proposal,
    model: "Large",
    durationMs: 1800,
    tokens: 642,
  },
]

/** The sample's answers, by question. Replace with your model: this is what makes the block run without one. */
export function sampleAgentChatRespond(prompt: string): AgentChatReply {
  const p = prompt.toLowerCase()
  if (p.includes("loading bay") || p.includes("cover")) return { steps: coverSteps, text: coverAnswer, sources: [robotStates, forecast, patrolRules, incident] }
  if (p.includes("alarm"))
    return {
      steps: [{ title: "Read tonight's alarms", tool: "alarms.list", durationMs: 600, description: "2 alarms since 18:00" }],
      text: "Two alarms tonight, both at warehouse B:\n\n1. **Patrol dog 9E37** stopped at door C3 at 21:46 and is waiting there [1].\n2. **Patrol dog DAA6** has a battery health check due, so it stays on the dock [2].\n\nNeither needs a robot moved now.",
      sources: [incident, robotStates],
    }
  if (p.includes("battery"))
    return {
      steps: [{ title: "Read robot states", tool: "robots.list", durationMs: 900, description: "14 robots, 12 available" }],
      text: "**Patrol dog 9E37** is at 14 %, under the 15 % warning, and waiting at door C3 [1]. **Patrol dog DAA6** is due its battery health check and stays docked [1].\n\nEvery other robot ends tonight above the 25 % reserve [2].",
      sources: [robotStates, forecast],
    }
  if (/\b(send|move|go|dock|reroute)\b/.test(p))
    return {
      text: "I cannot move robots: a person approves anything that does. I can draft the change as a proposal, with what it changes and why, for someone with access to approve.",
    }
  return {
    text: "I can read robot states, the schedule and open incidents, and draft changes for a person to approve. Ask about a robot by name, such as Patrol dog 7F3A or Patrol dog 1715, or about tonight's schedule.",
  }
}

// ---------- The conversation ----------

const reasons = [
  { value: "facts", label: "Wrong facts" },
  { value: "request", label: "Did not follow the request" },
  { value: "other", label: "Something else" },
]

// Stable, so the Markdown's finished blocks are not drawn again on every token.
const markdownAt = {
  2: { cite: citationMarker, headingLevel: 2 },
  3: { cite: citationMarker, headingLevel: 3 },
} as const

// The script's pace: the first words after this, then a few words (or, under reduced motion, a sentence) per tick.
const FIRST_MS = 400
const TICK_MS = 50
const SENTENCE_MS = 500

/** The time now, as the turns show it: 24-hour, as the sample and the zh-TW labels write it. */
const clock = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return { time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, dateTime: d.toISOString() }
}

export type AgentChatContentProps = {
  /** The turns at first, oldest first. An empty list shows the suggested prompts. */
  defaultTurns?: AgentChatTurn[]
  /** The questions a new conversation offers as chips; one press sends it. */
  suggestions?: string[]
  /** The answer to a prompt. The sample's script by default; replace it (and `play`) with your model's stream. */
  respond?: (prompt: string) => AgentChatReply
  /** The person's name on their turns. */
  userName?: string
  /** The assistant's name on its turns. */
  assistantName?: string
  /** The level of the Sources heading and of headings in the answers: 2 under a page's title, 3 in a sheet or a section. */
  headingLevel?: 2 | 3
  className?: string
}

/**
 * The conversation without a frame: the scroller that fills its container's height and the composer at its foot. Put it
 * in a column with a height (your shell's content area, a sheet, a panel) and give it `min-h-0 flex-1` or `h-full`.
 */
export function AgentChatContent({
  defaultTurns = sampleAgentChatTurns,
  suggestions = sampleAgentChatSuggestions,
  respond = sampleAgentChatRespond,
  userName = sampleUser.name,
  assistantName = "Fleet assistant",
  headingLevel = 2,
  className,
}: AgentChatContentProps) {
  const [turns, setTurns] = React.useState(defaultTurns)
  const [feedback, setFeedback] = React.useState<Record<string, MessageFeedback | null>>({})
  const root = React.useRef<HTMLDivElement>(null)
  const nextId = React.useRef(0)
  // The answer arriving now: its turn, its timer and how long it has run, so Stop ends it where it is.
  const live = React.useRef<{ id: string; timer: ReturnType<typeof setTimeout> | undefined; elapsed: number } | null>(null)
  React.useEffect(
    () => () => {
      clearTimeout(live.current?.timer)
      live.current = null
    },
    [],
  )

  const streaming = turns.some((t) => t.role === "assistant" && (t.phase === "streaming" || t.phase === "queued"))
  const lastAnswer = [...turns].reverse().find((t) => t.role === "assistant")?.id

  const update = (id: string, change: (t: Extract<AgentChatTurn, { role: "assistant" }>) => Partial<Extract<AgentChatTurn, { role: "assistant" }>>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...change(t) } : t)))

  // The fake stream: the reply's words a few at a time (a sentence at a time under reduced motion), on one timer.
  const play = (id: string, reply: AgentChatReply) => {
    clearTimeout(live.current?.timer)
    const reduced = prefersReducedMotion()
    const parts = reduced ? reply.text.split(/(?<=[.!?:]\s+|\n+)/) : reply.text.split(/(?<=\s)/)
    const step = reduced ? 1 : 3
    const every = reduced ? SENTENCE_MS : TICK_MS
    let shown = 0
    const run = { id, timer: undefined as ReturnType<typeof setTimeout> | undefined, elapsed: 0 }
    live.current = run
    const tick = () => {
      shown = Math.min(parts.length, shown + step)
      run.elapsed = run.elapsed === 0 ? FIRST_MS : run.elapsed + every
      const text = parts.slice(0, shown).join("")
      const done = shown >= parts.length
      update(id, () =>
        done
          ? { text, phase: "done", durationMs: run.elapsed, tokens: 380 + Math.round(text.length / 4) }
          : { text, phase: "streaming" },
      )
      if (done) live.current = null
      else run.timer = setTimeout(tick, every)
    }
    run.timer = setTimeout(tick, FIRST_MS)
  }

  const stop = () => {
    const run = live.current
    if (!run) return
    clearTimeout(run.timer)
    live.current = null
    update(run.id, () => ({ phase: "stopped", durationMs: run.elapsed || undefined }))
  }

  const send = (text: string): boolean => {
    if (streaming) return false
    const reply = respond(text)
    const { time, dateTime } = clock()
    const n = nextId.current++
    const answer: AgentChatTurn = {
      id: `a-${n}`,
      role: "assistant",
      name: assistantName,
      time,
      dateTime,
      text: "",
      phase: "streaming",
      sources: reply.sources,
      proposal: reply.proposal,
      model: "Large",
    }
    setTurns((ts) => [
      ...ts,
      { id: `q-${n}`, role: "user", name: userName, time, dateTime, text },
      ...(reply.steps?.length ? [{ id: `t-${n}`, role: "tool" as const, name: "Fleet data", time, dateTime, steps: reply.steps }] : []),
      answer,
    ])
    play(answer.id, reply)
    return true
  }

  const regenerate = (id: string) => {
    const i = turns.findIndex((t) => t.id === id)
    const question = turns.slice(0, i).reverse().find((t) => t.role === "user")
    if (streaming || !question || question.role !== "user") return
    const reply = respond(question.text)
    update(id, () => ({ text: "", phase: "streaming", durationMs: undefined, tokens: undefined, sources: reply.sources, proposal: reply.proposal }))
    setFeedback((f) => ({ ...f, [id]: null }))
    play(id, reply)
  }

  // A chip leaves with the empty state it sat in: focus goes to the composer, never to the page.
  const sendSuggestion = (text: string) => {
    send(text)
    root.current?.querySelector<HTMLTextAreaElement>("[data-slot=prompt-composer-input]")?.focus()
  }

  return (
    <div ref={root} data-slot="agent-chat" className={cn("flex h-full min-h-0 flex-col", className)}>
      <MessageScroller
        className="min-h-0 flex-1"
        contentClassName="mx-auto w-full max-w-3xl min-h-full px-4 py-6"
        empty={
          <EmptyState
            icon={Sparkles}
            title="Ask about your fleet"
            description="The assistant reads robot states, the schedule and open incidents. A person approves anything that moves a robot."
            className="my-auto"
            action={
              <ul aria-label="Suggested questions" className="flex flex-wrap justify-center gap-2">
                {suggestions.map((q) => (
                  <li key={q} className="flex">
                    <Button variant="outline" size="sm" onClick={() => sendSuggestion(q)}>
                      {q}
                    </Button>
                  </li>
                ))}
              </ul>
            }
          />
        }
      >
        {turns.map((t) => (
          <TurnView
            key={t.id}
            turn={t}
            latest={t.id === lastAnswer}
            headingLevel={headingLevel}
            feedback={feedback[t.id] ?? null}
            onFeedback={(v) => setFeedback((f) => ({ ...f, [t.id]: v }))}
            onRegenerate={t.id === lastAnswer && !streaming ? () => regenerate(t.id) : undefined}
          />
        ))}
      </MessageScroller>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptComposer
          onSubmit={(text) => send(text)}
          onStop={stop}
          streaming={streaming}
          labels={{ label: "Message the assistant", placeholder: "Ask about your fleet" }}
        />
      </div>
    </div>
  )
}

function TurnView({
  turn,
  latest,
  headingLevel,
  feedback,
  onFeedback,
  onRegenerate,
}: {
  turn: AgentChatTurn
  latest: boolean
  headingLevel: 2 | 3
  feedback: MessageFeedback | null
  onFeedback: (v: MessageFeedback | null) => void
  onRegenerate?: () => void
}) {
  if (turn.role === "system")
    return (
      <Message role="system" time={turn.time} dateTime={turn.dateTime}>
        <p className="text-sm text-muted-foreground">{turn.text}</p>
      </Message>
    )
  if (turn.role === "user")
    return (
      <Message role="user" name={turn.name} time={turn.time} dateTime={turn.dateTime} align="end">
        <p className="whitespace-pre-wrap">{turn.text}</p>
      </Message>
    )
  if (turn.role === "tool")
    return (
      <Message role="tool" name={turn.name} time={turn.time} dateTime={turn.dateTime}>
        <Trace size="sm">
          {turn.steps.map((s) => (
            <TraceItem key={s.tool + s.title} status={s.status ?? "done"} title={s.title} meta={s.tool} duration={s.durationMs} description={s.description} />
          ))}
        </Trace>
      </Message>
    )

  const arriving = turn.phase === "streaming" || turn.phase === "queued"
  const settled = turn.phase === "done"
  const answer = (
    <StreamingText text={turn.text} format="markdown" markdownProps={markdownAt[headingLevel]} phase={turn.phase} durationMs={turn.durationMs} />
  )
  return (
    <Message
      role="assistant"
      name={turn.name}
      time={turn.time}
      dateTime={turn.dateTime}
      status={arriving ? "streaming" : undefined}
      actions={
        settled ? (
          <MessageActions
            copyText={turn.text}
            onRegenerate={onRegenerate}
            feedback={feedback}
            onFeedbackChange={onFeedback}
            reasons={reasons}
            quiet={!latest}
          />
        ) : undefined
      }
      footer={settled ? <MessageMeta model={turn.model} durationMs={turn.durationMs} tokens={turn.tokens} /> : undefined}
    >
      {turn.sources?.length ? (
        <Citations sources={turn.sources}>
          {answer}
          {!arriving && <CitationSources as={headingLevel === 2 ? "h2" : "h3"} />}
        </Citations>
      ) : (
        answer
      )}
      {turn.proposal && settled && <ProposalLink proposal={turn.proposal} />}
    </Message>
  )
}

/** The assistant's draft, pointed to rather than acted on: a person approves it where approvals live. */
function ProposalLink({ proposal: p }: { proposal: AgentChatProposal }) {
  return (
    <div data-slot="agent-chat-proposal" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md p-4 ring-1 ring-border">
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <InlineStatus status="warning">Needs approval</InlineStatus>
        <span className="text-sm font-medium">{p.title}</span>
        <span className="text-xs text-muted-foreground">{p.detail}</span>
      </div>
      <Button asChild variant="secondary" size="sm">
        <a href={p.href}>{p.action}</a>
      </Button>
    </div>
  )
}

// ---------- The two frames ----------

/**
 * A conversation with the fleet's assistant that drafts proposals for a person to approve and never moves a robot, as a
 * page, a side sheet (AgentChatSheet) or content (AgentChatContent). As a page the conversation fills the content area
 * under the top bar, the composer pinned at its foot. New conversation clears it to the suggested prompts.
 */
export function AgentChat({ defaultTurns = sampleAgentChatTurns, ...props }: Omit<AgentChatContentProps, "className" | "headingLevel">) {
  const [session, setSession] = React.useState(0)
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#agents"
      title="Fleet assistant"
      user={sampleUser}
      bleed
      actions={
        <Button size="sm" variant="secondary" onClick={() => setSession((n) => n + 1)}>
          New conversation
        </Button>
      }
    >
      {/* Size containment: the conversation takes the content area's height and scrolls inside it, instead of growing the
          area (a scrolling <main>) to the length of the conversation. */}
      <AgentChatContent key={session} {...props} defaultTurns={session === 0 ? defaultTurns : []} headingLevel={2} className="contain-size" />
    </AppShell>
  )
}


// Wide enough for the page and the copilot side by side.
const WIDE = "(min-width: 64rem)"
/**
 * The same assistant as a copilot: Ask the assistant in a console page's top bar opens the conversation in a sheet on the
 * right. From 1024 px the sheet is not modal and the page makes room beside it, so the table stays in use while the
 * person asks about it; narrower, it covers the page and is modal.
 */
export function AgentChatSheet({
  defaultOpen,
  focusOnOpen = true,
  ...props
}: Omit<AgentChatContentProps, "className" | "headingLevel"> & {
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  const content = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  const wide = useMediaQuery(WIDE)
  return (
    <Sheet open={open} onOpenChange={setOpen} modal={!wide}>
      {/* Beside the page on a wide screen: the page gives up the sheet's width and its 8 px gutter. */}
      <div
        className={cn(
          "[--copilot-room:calc(28rem+var(--spacing)*2)] motion-safe:transition-[padding] motion-safe:duration-(--motion-sheet) motion-safe:ease-(--ease-standard)",
          open && wide && "pr-(--copilot-room)",
        )}
      >
        <AppShell
          product="Fleet console"
          nav={sampleNav}
          current="#robots"
          title="Robots"
          user={sampleUser}
          actions={
            <SheetTrigger asChild>
              <Button size="sm" variant="secondary">
                <Sparkles aria-hidden="true" />
                Ask the assistant
              </Button>
            </SheetTrigger>
          }
        >
          <FleetTable />
        </AppShell>
      </div>
      <SheetContent
        ref={content}
        side="end"
        // The conversation scrolls inside; the sheet itself does not. 28 rem: below 42, every turn starts at the start.
        className="max-w-md gap-0 overflow-hidden p-0"
        // Not modal: working on the page beside it does not close it.
        onInteractOutside={(e) => {
          if (wide) e.preventDefault()
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          if (focusOnOpen) content.current?.querySelector<HTMLTextAreaElement>("[data-slot=prompt-composer-input]")?.focus()
        }}
      >
        <SheetHeader className="flex-row items-start gap-2 border-b border-border py-2 pr-2 pl-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 py-2">
            <SheetTitle className="text-lg">Fleet assistant</SheetTitle>
            <SheetDescription>Reads robots, the schedule and incidents. A person approves anything that moves a robot.</SheetDescription>
          </div>
          {/* A visible way out, as in a dialog: 44 px, 8 px in from the corner. Esc closes it too, and the scrim where there is one. */}
          <SheetClose
            aria-label="Close"
            className="press flex size-(--h-md) shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </SheetHeader>
        <AgentChatContent {...props} headingLevel={3} className="flex-1" />
      </SheetContent>
    </Sheet>
  )
}
