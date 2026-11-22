import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { streamingTextLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { StreamingText, type StreamingTextPhase } from "@/registry/syncrobotic/ui/streaming-text"

const meta: Meta = { title: "Display/Streaming text" }
export default meta
type S = StoryObj

// A vision-language model's playground: one query about a camera frame, its answer streaming in. Every story but the last
// is one frozen moment (the text and the phase as props), so a screenshot is the same on every machine.
const query = "Is the charging dock in front of Patrol dog 7F3A clear?"
const answer =
  "Mostly. The dock plate is visible and free of debris, and the charging contacts are uncovered.\n\nOne cardboard box sits about 40 cm to the left of the plate. It is outside the docking path, but the robot's left side may brush it on approach."
const reasoning =
  "The frame shows the dock from about 2 m. The plate is the grey rectangle at the bottom centre; nothing lies on it.\n\nThe brown shape at the left edge has straight edges and a shipping label: a box. Its distance from the plate is about one plate width."
const partial = answer.slice(0, 118)

const noop = () => {}

/** The panel the answer sits in: the query above it, as a playground shows it. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
      <p className="text-sm text-muted-foreground">{query}</p>
      {children}
    </div>
  )
}

/** Tokens arriving: the text grows under a calm status row; Stop stays where it is while the answer grows. */
export const StreamingTextStreaming: S = {
  render: () => (
    <Panel>
      <StreamingText text={partial} phase="streaming" onStop={noop} />
    </Panel>
  ),
}

/** Waiting for a free GPU: the place in the queue, and Cancel. */
export const StreamingTextQueued: S = {
  render: () => (
    <Panel>
      <StreamingText text="" phase="queued" queuePosition={3} onStop={noop} />
    </Panel>
  ),
}

/** Finished: the status row turns into the timing, in the same place. */
export const StreamingTextDone: S = {
  render: () => (
    <Panel>
      <StreamingText text={answer} phase="done" durationMs={2400} firstTokenMs={310} />
    </Panel>
  ),
}

/** Stopped by someone: the partial answer stays and says it is incomplete. */
export const StreamingTextStopped: S = {
  render: () => (
    <Panel>
      <StreamingText text={partial} phase="stopped" durationMs={1150} />
    </Panel>
  ),
}

/** Failed mid-answer: the word in the danger colour, the message beside it, the partial text kept, and Try again. */
export const StreamingTextError: S = {
  render: () => (
    <Panel>
      <StreamingText text={partial} phase="error" error="Connection to the inference server was lost" onRetry={noop} />
    </Panel>
  ),
}

/** A model that reasons first: while only the reasoning streams, the status says Thinking. */
export const StreamingTextReasoning: S = {
  render: () => (
    <Panel>
      <StreamingText text="" reasoning={reasoning.slice(0, 140)} phase="streaming" onStop={noop} />
    </Panel>
  ),
}

/** The reasoning, opened: apart from the answer, smaller and grey, behind its own button. */
export const StreamingTextReasoningOpen: S = {
  render: () => (
    <Panel>
      <StreamingText text={answer} reasoning={reasoning} defaultReasoningOpen phase="done" durationMs={4800} firstTokenMs={2900} />
    </Panel>
  ),
}

const zhAnswer = "大致淨空。充電座平台清楚可見，沒有雜物，充電接點也沒有被遮住。\n\n平台左側約 40 公分處有一個紙箱。它不在對接路徑上，但機器人靠近時左側可能會擦到它。"

/** In Traditional Chinese: `streamingTextLabels` from labels-zh-tw, with the locale for the numbers. */
export const StreamingTextZhTw: S = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <Panel>
        <StreamingText text={zhAnswer} phase="done" durationMs={2400} firstTokenMs={310} labels={streamingTextLabels} locale={zhTW} />
      </Panel>
      <Panel>
        <StreamingText text="" phase="queued" queuePosition={2} onStop={noop} labels={streamingTextLabels} locale={zhTW} />
      </Panel>
    </div>
  ),
}

/**
 * Live: queued, then the answer arriving a few words at a time, with Stop. An automated browser (the visual checks) gets
 * the finished answer at once, so its screenshot never depends on timing.
 */
export const StreamingTextLive: S = {
  render: function Render() {
    const still = typeof navigator !== "undefined" && navigator.webdriver
    const [run, setRun] = React.useState(0)
    if (still)
      return (
        <Panel>
          <StreamingText text={answer} phase="done" durationMs={2400} firstTokenMs={310} />
        </Panel>
      )
    return <LiveAnswer key={run} onAgain={() => setRun((n) => n + 1)} />
  },
}

type Live = { phase: StreamingTextPhase; text: string; position?: number; startedAt?: number; firstTokenAt?: number; finishedAt?: number }

function LiveAnswer({ onAgain }: { onAgain: () => void }) {
  const [state, setState] = React.useState<Live>({ phase: "queued", text: "", position: 2 })
  const stop = React.useRef<() => void>(noop)
  React.useEffect(() => {
    const startedAt = performance.now()
    const words = answer.split(/(?<=\s)/)
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const chunk = () => {
      i += 1 + (i % 3)
      if (i >= words.length) {
        setState((s) => ({ ...s, phase: "done", text: answer, finishedAt: performance.now() }))
        return
      }
      setState((s) => ({ ...s, phase: "streaming", text: words.slice(0, i).join(""), firstTokenAt: s.firstTokenAt ?? performance.now() }))
      timer = setTimeout(chunk, 90)
    }
    timer = setTimeout(() => {
      setState((s) => ({ ...s, position: 1, startedAt }))
      timer = setTimeout(chunk, 900)
    }, 900)
    stop.current = () => {
      clearTimeout(timer)
      setState((s) => ({ ...s, phase: "stopped", finishedAt: performance.now() }))
    }
    return () => clearTimeout(timer)
  }, [])
  const ended = state.phase === "done" || state.phase === "stopped"
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Panel>
        <StreamingText
          text={state.text}
          phase={state.phase}
          queuePosition={state.position}
          onStop={() => stop.current()}
          startedAt={state.startedAt}
          firstTokenAt={state.firstTokenAt}
          finishedAt={state.finishedAt}
        />
      </Panel>
      {ended && (
        <Button size="sm" variant="outline" onClick={onAgain}>
          Ask again
        </Button>
      )}
    </div>
  )
}
