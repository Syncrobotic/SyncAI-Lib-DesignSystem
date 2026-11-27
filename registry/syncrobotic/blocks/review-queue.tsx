// @syncrobotic/review-queue v0.53.0 · update: npx shadcn add @syncrobotic/review-queue --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, CircleCheck, FileImage, Keyboard, Undo2 } from "lucide-react"
import { isMac, useHotkeys } from "@/registry/syncrobotic/hooks/use-hotkeys"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { Kbd, KbdGroup } from "@/registry/syncrobotic/ui/kbd"
import { Progress } from "@/registry/syncrobotic/ui/progress"

/** One thing to judge: an image (by file name and a description for screen readers), a question, and the text it asks about. */
export type ReviewItem = { id: string; file: string; alt: string; question: string; caption?: string }

/** An answer and the key that gives it. Keys are single characters people can reach without looking: 1, 2, 3. */
export type ReviewChoice = { value: string; label: string; key: string }

export const defaultChoices: ReviewChoice[] = [
  { value: "yes", label: "Yes", key: "1" },
  { value: "no", label: "No", key: "2" },
  { value: "skip", label: "Skip", key: "3" },
]

const scenes: Omit<ReviewItem, "id" | "file">[] = [
  {
    alt: "A forklift carrying pallets in a warehouse aisle",
    question: "Does the caption describe the image?",
    caption: "A yellow forklift carries three pallets past the loading dock.",
  },
  { alt: "A delivery robot waiting at a closed door", question: "Does the caption describe the image?", caption: "A small robot waits in front of a closed glass door." },
  { alt: "Two workers in high-visibility vests next to a conveyor", question: "Does the caption describe the image?", caption: "Two people stand next to a charging dock." },
  { alt: "A parking lot at night with three cars", question: "Does the caption describe the image?", caption: "An empty parking lot at night with three parked cars." },
  { alt: "A box lying in the middle of an aisle", question: "Does the caption describe the image?", caption: "The aisle is clear of obstacles." },
  { alt: "A robot arm placing a part into a tray", question: "Does the caption describe the image?", caption: "A robot arm picks a part from a tray on the left." },
]

/** 80 frames from a caption-check batch, the first 11 already answered. */
export const sampleItems: ReviewItem[] = Array.from({ length: 80 }, (_, i) => ({
  id: `f${i + 1}`,
  file: `frame_${String(1040 + i * 7).padStart(6, "0")}.jpg`,
  // The scenes repeat; i % scenes.length is always an index into the (non-empty) list above.
  ...scenes[i % scenes.length]!,
}))
const sampleAnswers: Record<string, string> = Object.fromEntries(
  sampleItems.slice(0, 11).map((it, i) => [it.id, i % 4 === 2 ? "no" : i === 7 ? "skip" : "yes"]),
)

type Step = { id: string; position: number; previous?: string; value: string }

const subscribeNever = () => () => {}

/**
 * Review items one at a time by keyboard: progress, the image with its question, and a key bar ([1] Yes, [2] No, [3]
 * Skip, Esc back, ⌫ undo, ? shortcuts) whose keys go down as they are pressed. ⌘Z / Ctrl+Z also undoes; every answer is
 * also a 44 px button for touch.
 */
export function ReviewQueue({
  title = "Caption check",
  batch = "forklift-captions · batch 7",
  items = sampleItems,
  choices = defaultChoices,
  defaultAnswers = sampleAnswers,
  onAnswer,
  className,
}: {
  title?: string
  batch?: string
  items?: ReviewItem[]
  choices?: ReviewChoice[]
  /** Answers given before this session; the queue opens on the first item without one. */
  defaultAnswers?: Record<string, string>
  /** Every change of an answer: a new one, a changed one, or `undefined` when one is undone. */
  onAnswer?: (id: string, value: string | undefined) => void
  className?: string
}) {
  const total = items.length
  const [answers, setAnswers] = React.useState(defaultAnswers)
  const [position, setPosition] = React.useState(() => {
    const first = items.findIndex((it) => !(it.id in defaultAnswers))
    return first === -1 ? total : first
  })
  const [history, setHistory] = React.useState<Step[]>([])
  const [help, setHelp] = React.useState(false)
  // Opened with "?", the dialog has no trigger to give focus back to: return it to whatever had it, or to the shortcuts
  // button, so the keyboard user lands somewhere on the page and not on <body>.
  const helpButton = React.useRef<HTMLButtonElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const openHelp = () => {
    opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
    setHelp(true)
  }
  const [message, setMessage] = React.useState("")
  const mac = React.useSyncExternalStore(subscribeNever, isMac, () => false)

  const item = items[position]
  // Past the last item there is no item to show: that is the queue being done. Saying it this way also tells TypeScript
  // that wherever the queue is not done, there is an item.
  const done = item === undefined
  const answered = items.filter((it) => it.id in answers).length
  const label = (value?: string) => choices.find((c) => c.value === value)?.label ?? value
  const where = (p: number) => (p >= total ? `All ${total} reviewed.` : `${p + 1} of ${total}.`)

  const answer = (value: string) => {
    if (!item) return
    setHistory((h) => [...h, { id: item.id, position, previous: answers[item.id], value }])
    setAnswers((a) => ({ ...a, [item.id]: value }))
    setPosition(position + 1)
    setMessage(`${label(value)}. ${where(position + 1)}`)
    onAnswer?.(item.id, value)
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    setAnswers((a) => {
      const next = { ...a }
      if (last.previous === undefined) delete next[last.id]
      else next[last.id] = last.previous
      return next
    })
    setPosition(last.position)
    setMessage(`Undid ${label(last.value)}. ${where(last.position)}`)
    onAnswer?.(last.id, last.previous)
  }

  const back = () => {
    if (position === 0) return
    setPosition(position - 1)
    setMessage(`Back. ${where(position - 1)}`)
  }

  const { pressed } = useHotkeys(
    {
      ...Object.fromEntries(choices.map((c) => [c.key, () => answer(c.value)])),
      Escape: back,
      Backspace: undo,
      "mod+z": undo,
      "?": openHelp,
    },
    { enabled: !help },
  )

  const mod = mac ? "⌘" : "Ctrl"
  const shortcuts: [keys: React.ReactNode, action: string][] = [
    ...choices.map((c): [React.ReactNode, string] => [<Kbd key={c.key}>{c.key}</Kbd>, `${c.label}, then the next item`]),
    [<Kbd key="esc">Esc</Kbd>, "Back to the previous item"],
    [
      <span key="undo" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Kbd>Backspace</Kbd> or
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>Z</Kbd>
        </KbdGroup>
      </span>,
      "Undo the last answer",
    ],
    [<Kbd key="help">?</Kbd>, "Show these shortcuts"],
  ]

  return (
    <section aria-labelledby="review-title" className={cn("mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6", className)}>
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="review-title" className="text-base font-bold">
            {title}
          </h2>
          <span className="truncate font-mono text-xs text-muted-foreground">{batch}</span>
        </div>
        <Button ref={helpButton} variant="ghost" size="icon" aria-label="Keyboard shortcuts" aria-keyshortcuts="?" onClick={openHelp}>
          <Keyboard aria-hidden="true" />
        </Button>
      </header>

      {/* Blue is for a process someone is waiting on: this batch going through review. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium tabular-nums">{done ? `${total} of ${total}` : `${position + 1} of ${total}`}</span>
          <span className="text-muted-foreground tabular-nums">{answered} answered</span>
        </div>
        <Progress tone="neutral" value={(answered / Math.max(total, 1)) * 100} aria-label={`${answered} of ${total} answered`} />
      </div>

      {done ? (
        <div key="done" className="flex animate-appear flex-col items-center gap-3 rounded-md bg-card p-8 text-center ring-1 ring-border">
          <CircleCheck aria-hidden="true" className="size-6 text-muted-foreground" />
          <h3 className="text-base font-bold">All {total} reviewed</h3>
          <p className="text-sm text-muted-foreground">
            {choices.map((c) => `${items.filter((it) => answers[it.id] === c.value).length} ${c.label.toLowerCase()}`).join(" · ")}
          </p>
        </div>
      ) : (
        // A new item rises in (the appear motion), so the eye sees the answer was taken and something new is here.
        <article key={item.id} aria-label={`Item ${position + 1} of ${total}`} className="flex animate-appear flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
          <div role="img" aria-label={item.alt} className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-sm bg-muted text-muted-foreground">
            <FileImage aria-hidden="true" className="size-6" />
            <span className="font-mono text-xs">{item.file}</span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold">{item.question}</h3>
            {item.caption && (
              <figure className="flex flex-col gap-1">
                <figcaption className="text-xs text-muted-foreground">Model caption</figcaption>
                <blockquote className="text-base">{item.caption}</blockquote>
              </figure>
            )}
            {answers[item.id] && <p className="text-sm text-muted-foreground">Answered {label(answers[item.id])}. Press a key to change it.</p>}
          </div>
        </article>
      )}

      {/* The key bar: every answer with its key; the key being pressed goes down. */}
      <div className="flex flex-col gap-2">
        <div role="group" aria-label="Answer" className="grid grid-cols-3 gap-2">
          {choices.map((c) => (
            <Button
              key={c.value}
              variant="outline"
              disabled={done}
              aria-keyshortcuts={c.key}
              data-pressed={pressed === c.key || undefined}
              onClick={() => answer(c.value)}
              className="data-pressed:scale-97 data-pressed:bg-accent"
            >
              <Kbd pressed={pressed === c.key}>{c.key}</Kbd>
              {c.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" disabled={position === 0} aria-keyshortcuts="Escape" onClick={back} data-pressed={pressed === "Escape" || undefined}>
            <ArrowLeft aria-hidden="true" />
            Back
            <Kbd pressed={pressed === "Escape"}>Esc</Kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={history.length === 0}
            aria-keyshortcuts="Backspace Control+Z Meta+Z"
            onClick={undo}
            data-pressed={pressed === "Backspace" || pressed === "mod+z" || undefined}
          >
            <Undo2 aria-hidden="true" />
            Undo
            <Kbd pressed={pressed === "Backspace" || pressed === "mod+z"}>
              <span aria-hidden="true">⌫</span>
              <span className="sr-only">Backspace</span>
            </Kbd>
          </Button>
        </div>
      </div>

      <p role="status" className="sr-only">
        {message}
      </p>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            ;(opener.current?.isConnected ? opener.current : helpButton.current)?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Answer without leaving the keyboard. Keys do nothing while you type in a field.</DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col text-sm">
            {shortcuts.map(([keys, action]) => (
              <div key={action} className="flex min-h-(--h-md) items-center justify-between gap-4 border-b border-border last:border-b-0">
                <dt>{action}</dt>
                <dd className="shrink-0">{keys}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </section>
  )
}
