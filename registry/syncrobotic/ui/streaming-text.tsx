// @syncrobotic/streaming-text v0.41.0 · update: npx shadcn add @syncrobotic/streaming-text --overwrite
"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, CircleStop } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount, formatNumber } from "@/registry/syncrobotic/lib/format-number"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Markdown, markdownToText, type MarkdownProps } from "@/registry/syncrobotic/ui/markdown"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/*
  One answer from a model that arrives a few tokens at a time (server-sent events from a VLM or an LLM): the text grows
  in place under a status row that says where it is (in the queue, reasoning, generating, done, stopped, failed).

  The product owns the stream: it appends each chunk to a string and passes it as `text`, with the `phase`. React batches
  the renders, so even 100 tokens a second is a few dozen cheap renders: only the last paragraph changes.

  Calm while it waits: no blinking caret and no colour, only the kit's Spinner (it appears after 300 ms and stands still
  under reduced motion) and a word. The status row sits above the text and keeps its height in every phase, so Stop
  never moves under a finger while the answer grows below it, and the final words replace the status in the same place.

  Accessibility: the status word is a polite live region, so each phase is said once ("Generating", "Done in 2.4 s").
  The answer is read in whole sentences, at most every `announceEveryMs` (5 s), never token by token; what is left is
  read when the answer ends. An answer that was already finished when it mounted is not read aloud.

  `format="markdown"` renders the answer with the kit's Markdown (headings, lists, tables, code) while it streams. The
  reading stays here, on the words without their syntax (`markdownToText`): a screen reader hears "The plate is clear",
  never "asterisk asterisk", and a code block as "Code in bash." Markdown itself never speaks, so there is one voice.
*/

export const streamingTextPhases = ["queued", "streaming", "done", "stopped", "error"] as const
export type StreamingTextPhase = (typeof streamingTextPhases)[number]

/** How long it took, in ms. Either may be missing; the words leave it out. */
export type StreamingTextTiming = { durationMs?: number; firstTokenMs?: number }

export type StreamingTextLabels = {
  /** The answer's name, for screen readers. */
  name: string
  /** In the queue: with the place in it (1 is next), or without one. */
  queued: (position: number | undefined, locale: string | undefined) => string
  /** Streaming the reasoning part, before the first word of the answer. */
  thinking: string
  generating: string
  /** Finished: with how long it took and how long until the first token, when known. */
  done: (timing: StreamingTextTiming, locale: string | undefined) => string
  /** Stopped by someone: with how long it ran, and whether any answer had arrived. */
  stopped: (timing: StreamingTextTiming & { empty: boolean }, locale: string | undefined) => string
  /** The word for an error, in the danger colour; the error's own message follows it. */
  failed: string
  /** After an error's message when part of the answer had arrived. */
  incomplete: string
  /** Done, with no text at all. */
  empty: string
  /** The button while streaming, and while queued. */
  stop: string
  cancel: string
  retry: string
  /** The button that shows or hides the reasoning part. */
  reasoningToggle: string
  /** A duration: "2.4 s", "1 min 12 s". */
  duration: (ms: number, locale: string | undefined) => string
}

/** A duration in words: tenths of a second below 10 s, whole seconds below a minute, then minutes and seconds. */
export function formatDuration(ms: number, locale?: string) {
  const s = Math.max(0, ms) / 1000
  if (s < 10) return `${formatNumber(s, { locale, minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`
  if (s < 60) return `${formatCount(Math.round(s), { locale })} s`
  const whole = Math.round(s)
  const m = Math.floor(whole / 60)
  const rest = whole % 60
  return rest ? `${formatCount(m, { locale })} min ${formatCount(rest, { locale })} s` : `${formatCount(m, { locale })} min`
}

export const defaultStreamingTextLabels: StreamingTextLabels = {
  name: "Answer",
  queued: (position, locale) => (position === undefined ? "Waiting in the queue" : position <= 1 ? "Next in the queue" : `Number ${formatCount(position, { locale })} in the queue`),
  thinking: "Thinking",
  generating: "Generating",
  done: ({ durationMs, firstTokenMs }, locale) =>
    [durationMs === undefined ? "Done" : `Done in ${formatDuration(durationMs, locale)}`, firstTokenMs !== undefined && `first token ${formatDuration(firstTokenMs, locale)}`]
      .filter(Boolean)
      .join(" · "),
  stopped: ({ durationMs, empty }, locale) =>
    empty ? "Cancelled before the answer started" : [durationMs === undefined ? "Stopped" : `Stopped after ${formatDuration(durationMs, locale)}`, "answer incomplete"].join(" · "),
  failed: "Failed",
  incomplete: "answer incomplete",
  empty: "The answer has no text",
  stop: "Stop generating",
  cancel: "Cancel",
  retry: "Try again",
  reasoningToggle: "Reasoning",
  duration: formatDuration,
}

/** The timing to show: durations given win; otherwise the differences of the timestamps. Nothing negative or unknown. */
export function streamingTextTiming({
  startedAt,
  firstTokenAt,
  finishedAt,
  durationMs,
  firstTokenMs,
}: {
  startedAt?: number
  firstTokenAt?: number
  finishedAt?: number
  durationMs?: number
  firstTokenMs?: number
}): StreamingTextTiming {
  const ok = (n: number | undefined) => (n !== undefined && Number.isFinite(n) && n >= 0 ? n : undefined)
  const diff = (to: number | undefined) => (startedAt === undefined || to === undefined ? undefined : to - startedAt)
  return { durationMs: ok(durationMs ?? diff(finishedAt)), firstTokenMs: ok(firstTokenMs ?? diff(firstTokenAt)) }
}

/**
 * Where the text read aloud so far should stop: after the last whole sentence (or line) in `rest`. A long run with no
 * sentence end is cut at its last space once it passes `max` characters, so a list without full stops is still read.
 */
export function sentenceEnd(rest: string, max = 400) {
  let end = 0
  for (const m of rest.matchAll(/[.!?…](?=\s|$)|[。！？]|\n/g)) end = m.index + m[0].length
  if (end > 0) return end
  if (rest.length <= max) return 0
  const space = rest.lastIndexOf(" ")
  return space > 0 ? space + 1 : rest.length
}

// Paragraphs are split at blank lines; single line breaks stay inside a paragraph (pre-wrap).
const paragraphs = (text: string) => text.split(/\n{2,}/)

type Props = {
  /** The answer so far. Append each chunk to it. As plain text (blank lines start paragraphs), or Markdown with `format`. */
  text: string
  /** "text" (default): plain text, nothing parsed. "markdown": rendered with the kit's Markdown as it streams, read without its syntax. */
  format?: "text" | "markdown"
  /** Markdown's options with `format="markdown"`: `cite` for citation markers, `headingLevel`, `imageOrigins`, `labels`. */
  markdownProps?: Omit<MarkdownProps, "text" | "streaming">
  phase: StreamingTextPhase
  /** While queued: the place in the queue, 1 being next. */
  queuePosition?: number
  /** Shows Stop while streaming (Cancel while queued). The product aborts the request and sets `phase` to "stopped". */
  onStop?: () => void
  /** After an error: shows Try again. */
  onRetry?: () => void
  /** The error, in words, after "Failed". */
  error?: string
  /** A reasoning part the model streams before the answer: shown apart, under a Reasoning button, closed by default. */
  reasoning?: string
  /** Open the reasoning part at first. */
  defaultReasoningOpen?: boolean
  /** When the request was sent, when the first token arrived and when it ended, in ms (Date.now() or performance.now()). */
  startedAt?: number
  firstTokenAt?: number
  finishedAt?: number
  /** Durations the server reports, in ms; they win over the timestamps. */
  durationMs?: number
  firstTokenMs?: number
  /** The answer's name for screen readers ("Caption", "Answer from PerceptionVLM"). Wins over `labels.name`. */
  label?: string
  /** Read the answer aloud in sentences while it streams ("text", default), say only the phases ("status"), or nothing. */
  announce?: "text" | "status" | false
  /** The shortest time between two readings of the answer. Default 5,000 ms. */
  announceEveryMs?: number
  /** Formats the times and the queue position. */
  locale?: string
  labels?: Partial<StreamingTextLabels>
  className?: string
}

const live = (phase: StreamingTextPhase) => phase === "queued" || phase === "streaming"

/**
 * A model's answer as it streams in: the text grows in place under a calm status row (queue position, Thinking,
 * Generating with Stop), which turns into the final state in the same place ("Done in 2.4 s · first token 0.3 s",
 * Stopped, Failed with Try again). An optional reasoning part is kept apart and closed.
 */
export function StreamingText({
  text,
  format = "text",
  markdownProps,
  phase,
  queuePosition,
  onStop,
  onRetry,
  error,
  reasoning,
  defaultReasoningOpen = false,
  startedAt,
  firstTokenAt,
  finishedAt,
  durationMs,
  firstTokenMs,
  label,
  announce = "text",
  announceEveryMs = 5000,
  locale,
  labels,
  className,
}: Props) {
  const l = { ...defaultStreamingTextLabels, ...labels }
  const id = React.useId()
  const [open, setOpen] = React.useState(defaultReasoningOpen)
  const timing = streamingTextTiming({ startedAt, firstTokenAt, finishedAt, durationMs, firstTokenMs })
  const empty = text.trim() === ""
  const thinking = phase === "streaming" && empty && !!reasoning

  // ---------- What screen readers hear of the answer ----------
  // `spoken` is how much of `text` has been read. An answer that mounts finished counts as read: history is not read aloud.
  const spoken = React.useRef(live(phase) ? 0 : text.length)
  const [said, setSaid] = React.useState("")
  const speak = React.useEffectEvent((all: boolean) => {
    if (announce !== "text") return
    // Markdown is read as its words: the syntax never reaches the live region.
    const source =
      format === "markdown" ? markdownToText(text, { streaming: phase === "streaming", cite: !!markdownProps?.cite, labels: markdownProps?.labels }) : text
    if (source.length < spoken.current) spoken.current = 0 // a new answer in the same place
    const rest = source.slice(spoken.current)
    const end = all ? rest.length : sentenceEnd(rest)
    const sentence = rest.slice(0, end).trim()
    spoken.current += end
    if (sentence) setSaid(sentence)
  })
  const streaming = phase === "streaming"
  React.useEffect(() => {
    if (!streaming || announce !== "text") return
    const tick = setInterval(() => speak(false), announceEveryMs)
    return () => clearInterval(tick)
  }, [streaming, announce, announceEveryMs])
  // The rest of the answer once it ends (done, stopped, failed), just after the phase word, which is said on render.
  const wasStreaming = React.useRef(false)
  React.useEffect(() => {
    if (streaming) {
      wasStreaming.current = true
      return
    }
    if (!wasStreaming.current) return
    wasStreaming.current = false
    const t = setTimeout(() => speak(true), 0)
    return () => clearTimeout(t)
  }, [streaming])

  // ---------- Focus ----------
  // Stop leaves with the phase it ends. If it had focus, focus goes to the status words, never to the page's top.
  const actionFocused = React.useRef(false)
  const statusRef = React.useRef<HTMLSpanElement>(null)
  const action = live(phase) && onStop ? "stop" : phase === "error" && onRetry ? "retry" : null
  React.useEffect(() => {
    if (action === "stop" || !actionFocused.current) return
    actionFocused.current = false
    if (action === null) statusRef.current?.focus()
  }, [action])

  // ---------- The status row ----------
  const tone = phase === "error" ? "danger" : "calm"
  let glyph: React.ReactNode
  let words: React.ReactNode
  if (phase === "queued" || phase === "streaming") {
    glyph = <Spinner className="size-4" />
    words = phase === "queued" ? l.queued(queuePosition, locale) : thinking ? l.thinking : l.generating
  } else if (phase === "done") {
    glyph = <CircleCheck className="size-4" />
    words = empty ? `${l.done(timing, locale)} · ${l.empty}` : l.done(timing, locale)
  } else if (phase === "stopped") {
    glyph = <CircleStop className="size-4" />
    words = l.stopped({ durationMs: timing.durationMs, empty }, locale)
  } else {
    glyph = <CircleAlert className="size-4" />
    words = (
      <>
        <span className="font-medium text-danger">{l.failed}</span>
        {error && <span> · {error}</span>}
        {!empty && <span> · {l.incomplete}</span>}
      </>
    )
  }

  return (
    <article
      data-slot="streaming-text"
      data-phase={phase}
      aria-label={label ?? l.name}
      aria-busy={live(phase) || undefined}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div data-slot="streaming-text-status" className="flex min-h-(--h-md) flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
          {/* A fixed box, so the words do not shift when the Spinner appears after its delay. */}
          <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center", tone === "danger" && "text-danger")}>
            {glyph}
          </span>
          {/* focus-ring: the status words take focus only when Stop leaves under it; the ring is the kit's own. */}
          <span
            ref={statusRef}
            role="status"
            tabIndex={-1}
            data-slot="streaming-text-words"
            className="-mx-1 min-w-0 rounded-2xs px-1 tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {words}
          </span>
        </span>
        {action && (
          <Button
            size="sm"
            variant="outline"
            onClick={action === "stop" ? onStop : onRetry}
            onFocus={() => (actionFocused.current = true)}
            onBlur={() => (actionFocused.current = false)}
            className="ml-auto"
          >
            {action === "retry" ? l.retry : phase === "queued" ? l.cancel : l.stop}
          </Button>
        )}
      </div>

      {reasoning && (
        <div data-slot="streaming-text-reasoning" className="flex flex-col items-start gap-2">
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={open}
            aria-controls={`${id}-reasoning`}
            onClick={() => setOpen((o) => !o)}
            className="-ml-3 text-muted-foreground"
          >
            {open ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            {l.reasoningToggle}
          </Button>
          {open && (
            <div
              id={`${id}-reasoning`}
              className="flex w-full min-w-0 flex-col gap-2 border-l-2 border-border pl-3 text-sm text-muted-foreground"
            >
              {paragraphs(reasoning).map((p, i) => (
                <p key={i} className="break-words whitespace-pre-wrap">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!empty && (
        <div data-slot="streaming-text-body" className="flex min-w-0 flex-col gap-3 text-base text-foreground">
          {format === "markdown" ? (
            <Markdown {...markdownProps} text={text} streaming={phase === "streaming"} />
          ) : (
            paragraphs(text).map((p, i) => (
              <p key={i} className="break-words whitespace-pre-wrap">
                {p}
              </p>
            ))
          )}
        </div>
      )}

      {announce === "text" && (
        <span data-slot="streaming-text-announcer" aria-live="polite" className="sr-only">
          {said}
        </span>
      )}
    </article>
  )
}
