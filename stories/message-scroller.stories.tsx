import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { MessageSquare } from "lucide-react"
import {
  locale as zhTW,
  messageActionsLabels,
  messageLabels,
  messageMetaLabels,
  messageScrollerLabels,
  promptComposerLabels,
  streamingTextLabels,
} from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Message, MessageMeta } from "@/registry/syncrobotic/ui/message"
import { MessageActions, type MessageFeedback } from "@/registry/syncrobotic/ui/message-actions"
import { MessageScroller } from "@/registry/syncrobotic/ui/message-scroller"
import { PromptComposer } from "@/registry/syncrobotic/ui/prompt-composer"
import { StreamingText, type StreamingTextPhase } from "@/registry/syncrobotic/ui/streaming-text"
import { Trace, TraceItem } from "@/registry/syncrobotic/ui/trace"

const meta: Meta = { title: "Display/Message scroller" }
export default meta
type S = StoryObj

type Turn = {
  id: string
  role: "user" | "assistant" | "tool" | "system"
  name?: string
  time: string
  text: string
  phase?: StreamingTextPhase
  durationMs?: number
  tokens?: number
}

// The fleet assistant, one evening. Every turn is data; the frame below draws it the way a product would.
const history: Turn[] = [
  { id: "s", role: "system", time: "14:00", text: "The assistant can read robot states, the schedule and open incidents. It cannot move robots." },
  { id: "q1", role: "user", name: "Kai Chen", time: "14:02", text: "Which robots can cover the loading bay tonight?" },
  { id: "t1", role: "tool", name: "robots.forecast", time: "14:02", text: "Forecast battery for each route" },
  {
    id: "a1",
    role: "assistant",
    name: "Fleet assistant",
    time: "14:02",
    phase: "done",
    durationMs: 2400,
    tokens: 1204,
    text: "Two can. Patrol dog 1715 is free after its car park round at 23:40 and ends the night at 31 % battery.\n\nPatrol dog 9E37 is free too, but it is still waiting at door C3, so it would start late.",
  },
  { id: "q2", role: "user", name: "Kai Chen", time: "14:03", text: "Draft the change for 1715 and keep 25 % in reserve." },
]
const reply =
  "Here is the draft: 1715 takes the loading bay from 23:40 to 05:30 and skips bay C after 03:00, which keeps it at 27 % at the end of the night. The schedule is not changed until you approve it."
const reasons = [
  { value: "facts", label: "Wrong facts" },
  { value: "request", label: "Did not follow the request" },
  { value: "other", label: "Something else" },
]

function TurnView({ turn, last, zh = false }: { turn: Turn; last: boolean; zh?: boolean }) {
  const labels = zh ? messageLabels : undefined
  const [feedback, setFeedback] = React.useState<MessageFeedback | null>(null)
  if (turn.role === "tool")
    return (
      <Message role="tool" name={turn.name} time={turn.time} labels={labels}>
        <Trace size="sm">
          <TraceItem status="done" title="Read robot states" meta="robots.list" duration={900} />
          <TraceItem status="done" title="Forecast battery for each route" meta="robots.forecast" duration={4100} description="1715 ends at 31 %, 9E37 at 44 %" />
        </Trace>
      </Message>
    )
  if (turn.role !== "assistant")
    return (
      <Message role={turn.role} name={turn.name} time={turn.time} align={turn.role === "user" ? "end" : "start"} labels={labels}>
        <p className={turn.role === "system" ? "text-sm text-muted-foreground" : undefined}>{turn.text}</p>
      </Message>
    )
  const settled = turn.phase === "done"
  return (
    <Message
      role="assistant"
      name={turn.name}
      time={turn.time}
      status={turn.phase === "streaming" ? "streaming" : undefined}
      labels={labels}
      actions={
        settled ? (
          <MessageActions
            copyText={turn.text}
            onRegenerate={() => {}}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            reasons={zh ? undefined : reasons}
            quiet={!last}
            labels={zh ? messageActionsLabels : undefined}
          />
        ) : undefined
      }
      footer={settled ? <MessageMeta model="Large" durationMs={turn.durationMs} tokens={turn.tokens} locale={zh ? zhTW : undefined} labels={zh ? messageMetaLabels : undefined} /> : undefined}
    >
      <StreamingText text={turn.text} phase={turn.phase ?? "done"} durationMs={turn.durationMs} labels={zh ? streamingTextLabels : undefined} locale={zh ? zhTW : undefined} />
    </Message>
  )
}

/** The card a conversation sits in: the scroller fills it, the composer ends it. */
function Frame({ children, composer }: { children: React.ReactNode; composer: React.ReactNode }) {
  return (
    <div className="flex h-128 w-full flex-col overflow-hidden rounded-md bg-card ring-1 ring-border">
      {children}
      <div className="border-t border-border p-4">{composer}</div>
    </div>
  )
}

/**
 * A whole conversation: Message turns in the scroller, actions on the answers, and the composer. Send a question: the
 * answer streams in and the view follows it; scroll up while it streams and Jump to latest appears.
 */
export const MessageScrollerConversation: S = {
  render: function Render() {
    const [turns, setTurns] = React.useState<Turn[]>(() => [...history, { id: "a2", role: "assistant", name: "Fleet assistant", time: "14:03", phase: "done", durationMs: 3100, tokens: 1630, text: reply }])
    const timer = React.useRef<number | undefined>(undefined)
    React.useEffect(() => () => window.clearInterval(timer.current), [])
    const streaming = turns.some((t) => t.phase === "streaming")
    const finish = (phase: StreamingTextPhase) => {
      window.clearInterval(timer.current)
      setTurns((ts) => ts.map((t) => (t.phase === "streaming" ? { ...t, phase, durationMs: 2600, tokens: phase === "done" ? 980 : undefined } : t)))
    }
    const ask = (text: string) => {
      const n = turns.length
      setTurns((ts) => [...ts, { id: `q${n}`, role: "user", name: "Kai Chen", time: "14:05", text }, { id: `a${n}`, role: "assistant", name: "Fleet assistant", time: "14:05", phase: "streaming", text: "" }])
      const words = reply.split(" ")
      let i = 0
      timer.current = window.setInterval(() => {
        i += 2
        setTurns((ts) => ts.map((t) => (t.phase === "streaming" ? { ...t, text: words.slice(0, i).join(" ") } : t)))
        if (i >= words.length) finish("done")
      }, 150)
    }
    return (
      <Frame composer={<PromptComposer onSubmit={ask} streaming={streaming} onStop={() => finish("stopped")} allowFiles maxLength={4000} />}>
        <MessageScroller className="min-h-0 flex-1">
          {turns.map((t, i) => (
            <TurnView key={t.id} turn={t} last={i === turns.length - 1} />
          ))}
        </MessageScroller>
      </Frame>
    )
  },
}

/** An answer still arriving: the view follows it, the turn is aria-busy and the composer's Send is Stop. */
export const MessageScrollerStreaming: S = {
  render: () => (
    <Frame composer={<PromptComposer onSubmit={() => {}} streaming onStop={() => {}} />}>
      <MessageScroller className="min-h-0 flex-1">
        {[...history, { id: "a2", role: "assistant" as const, name: "Fleet assistant", time: "14:03", phase: "streaming" as const, text: reply.slice(0, 96) }].map((t, i, all) => (
          <TurnView key={t.id} turn={t} last={i === all.length - 1} />
        ))}
      </MessageScroller>
    </Frame>
  ),
}

/** Older turns load in front: the turn you were reading stays where it was. */
export const MessageScrollerLoadEarlier: S = {
  render: function Render() {
    const [older, setOlder] = React.useState<Turn[]>([])
    const [loading, setLoading] = React.useState(false)
    const timer = React.useRef<number | undefined>(undefined)
    React.useEffect(() => () => window.clearTimeout(timer.current), [])
    const load = () => {
      setLoading(true)
      timer.current = window.setTimeout(() => {
        setOlder([
          { id: "y1", role: "user", name: "Kai Chen", time: "Yesterday 18:10", text: "How did last night's patrols go?" },
          { id: "y2", role: "assistant", name: "Fleet assistant", time: "Yesterday 18:10", phase: "done", text: "All 14 rounds finished. 9E37 waited 12 min at door C3, which is still open in incidents." },
        ])
        setLoading(false)
      }, 600)
    }
    const turns = [...older, ...history.slice(1)]
    return (
      <div className="flex h-96 w-full flex-col overflow-hidden rounded-md bg-card ring-1 ring-border">
        <MessageScroller className="min-h-0 flex-1" hasEarlier={older.length === 0} loadingEarlier={loading} onLoadEarlier={load}>
          {turns.map((t, i) => (
            <TurnView key={t.id} turn={t} last={i === turns.length - 1} />
          ))}
        </MessageScroller>
      </div>
    )
  },
}

/** A new conversation: an EmptyState with a few questions to start from. */
export const MessageScrollerEmpty: S = {
  render: () => (
    <Frame composer={<PromptComposer onSubmit={() => {}} />}>
      <MessageScroller
        className="min-h-0 flex-1"
        empty={
          <EmptyState
            icon={MessageSquare}
            title="Ask about your fleet"
            description="The assistant reads robot states, the schedule and open incidents."
            action={
              <div className="flex flex-col items-center gap-2">
                {["Which robots are free tonight?", "Summarise today's alarms", "Who needs a battery check?"].map((q) => (
                  <Button key={q} variant="outline" size="sm">
                    {q}
                  </Button>
                ))}
              </div>
            }
          />
        }
      />
    </Frame>
  ),
}

/** Every word through `labels`. */
export const MessageScrollerZhTw: S = {
  render: () => (
    <Frame composer={<PromptComposer onSubmit={() => {}} labels={promptComposerLabels} locale={zhTW} />}>
      <MessageScroller className="min-h-0 flex-1" labels={messageScrollerLabels} locale={zhTW}>
        <TurnView turn={{ id: "q", role: "user", name: "陳凱", time: "14:02", text: "今晚哪些機器人可以支援卸貨區？" }} last={false} zh />
        <TurnView
          turn={{ id: "a", role: "assistant", name: "車隊助理", time: "14:02", phase: "done", durationMs: 2400, text: "兩台可以。巡邏犬 1715 在 23:40 結束停車場巡邏後就有空，整晚結束時電量 31 %。" }}
          last
          zh
        />
      </MessageScroller>
    </Frame>
  ),
}
