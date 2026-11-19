import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ChevronsRight, Wifi } from "lucide-react"
import { Tray } from "@/registry/syncrobotic/shell/tray"
import { useLongPress } from "@/registry/syncrobotic/hooks/use-long-press"
import { useSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { useDebouncedValue } from "@/registry/syncrobotic/hooks/use-debounce"
import { useHotkeys } from "@/registry/syncrobotic/hooks/use-hotkeys"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"

// The tray and the hooks: each a small live demo of what it does on screen. The source of each is in the Source sheet.
const meta: Meta = { title: "Robot shell/Tray and hooks" }
export default meta
type S = StoryObj

/** Two rows in the tray: each row is radius 16, the tray 24 (16 + its 8 px padding), 8 px apart. */
export const TrayTwoRows: S = {
  render: () => (
    <Tray className="w-80 max-w-full">
      <div className="flex h-(--h-row) items-center gap-3 rounded-md bg-card px-4 text-sm">
        <Wifi aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <span className="font-medium">Patrol dog 7F3A</span>
        <span className="ml-auto text-muted-foreground tabular-nums">72 %</span>
      </div>
      <div className="flex h-(--h-row) items-center gap-3 rounded-md bg-card px-4 text-sm">
        <Wifi aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <span className="font-medium">Courier 9E37</span>
        <span className="ml-auto text-muted-foreground tabular-nums">49 %</span>
      </div>
    </Tray>
  ),
}

/** Hold for a second and a half: the fill shows the hold, letting go early cancels it. */
export const UseLongPressHoldToConfirm: S = {
  render: function Demo() {
    const [done, setDone] = React.useState(0)
    const { progress, handlers } = useLongPress({ onLongPress: () => setDone((n) => n + 1), duration: 1500, showAfter: 200 })
    return (
      <div className="flex w-fit flex-col items-center gap-3">
        <button
          type="button"
          {...handlers}
          className="press relative h-(--h-md) touch-none overflow-hidden rounded-sm px-4 text-sm font-medium ring-1 ring-border ring-inset select-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-muted" style={{ width: `${progress * 100}%` }} />
          <span className="relative">Hold to clear the log</span>
        </button>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {done === 0 ? "Not cleared yet" : `Cleared ${done} ${done === 1 ? "time" : "times"}`}
        </p>
      </div>
    )
  },
}

/** Drag the thumb past the end and let go; short of it, it springs back. Enter held for two seconds does the same. */
export const UseSlideReleaseTrack: S = {
  render: function Demo() {
    const [count, setCount] = React.useState(0)
    const { trackRef, thumbRef, position, dragging, released, reset, thumbHandlers, trackHandlers } = useSlideRelease({
      onRelease: () => setCount((n) => n + 1),
    })
    // Back to the start a moment after a release, so it can be tried again.
    React.useEffect(() => {
      if (!released) return
      const t = window.setTimeout(reset, 1200)
      return () => window.clearTimeout(t)
    }, [released, reset])
    const left = `calc(${position} * (100% - var(--h-thumb) - 0.5rem) + 0.25rem)`
    return (
      <div className="flex w-80 max-w-full flex-col gap-3">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Slide to unlock"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position * 100)}
          {...trackHandlers}
          className="relative flex h-(--h-stop) items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span style={{ opacity: released ? 1 : Math.max(0, 1 - position * 1.6) }}>{released ? "Unlocked" : "Slide to unlock"}</span>
          <div
            ref={thumbRef}
            {...thumbHandlers}
            className={`absolute top-1 flex size-(--h-thumb) touch-none items-center justify-center rounded-sm bg-card ring-1 ring-border ${dragging ? "" : "transition-[left] duration-(--motion-base) ease-(--ease-standard)"}`}
            style={{ left }}
          >
            <ChevronsRight aria-hidden="true" className="size-6" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          Position {Math.round(position * 100)} % · unlocked {count} {count === 1 ? "time" : "times"}
        </p>
      </div>
    )
  },
}

/** Hide the note: it stays mounted while it fades out, then leaves the page. */
export const UsePresenceNote: S = {
  render: function Demo() {
    const [show, setShow] = React.useState(true)
    const note = usePresence(show)
    return (
      <div className="flex w-80 max-w-full flex-col gap-3">
        <Button variant="secondary" className="self-start" onClick={() => setShow((s) => !s)}>
          {show ? "Hide the note" : "Show the note"}
        </Button>
        <div className="min-h-(--h-row)">
          {note.mounted && (
            <p
              onAnimationEnd={(e) => e.target === e.currentTarget && note.done()}
              className={`rounded-md bg-card p-3 text-sm ring-1 ring-border ${note.leaving ? "animate-disappear" : "animate-appear"}`}
            >
              Lidar cleaning is due on Courier 2B19.
            </p>
          )}
        </div>
      </div>
    )
  },
}

/** Type: the field updates on every key; the search is sent only once typing pauses for 300 ms. */
export const UseDebounceSearch: S = {
  render: function Demo() {
    const [text, setText] = React.useState("")
    const sent = useDebouncedValue(text, 300)
    return (
      <div className="flex w-80 max-w-full flex-col gap-3">
        <Field label="Search robots">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. courier" />
        </Field>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {sent ? (
            <>
              Searched for <span className="font-medium text-foreground">{sent}</span>
            </>
          ) : (
            "Nothing searched yet"
          )}
        </p>
      </div>
    )
  },
}

/** Press 1 or 2 while the page has focus: the key lights up and the answer is counted. */
export const UseHotkeysReview: S = {
  render: function Demo() {
    const [yes, setYes] = React.useState(0)
    const [no, setNo] = React.useState(0)
    const { pressed } = useHotkeys({ "1": () => setYes((n) => n + 1), "2": () => setNo((n) => n + 1) })
    return (
      <div className="flex w-fit flex-col items-center gap-3 text-sm">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setYes((n) => n + 1)}>
            Yes <Kbd pressed={pressed === "1"}>1</Kbd>
          </Button>
          <Button variant="outline" onClick={() => setNo((n) => n + 1)}>
            No <Kbd pressed={pressed === "2"}>2</Kbd>
          </Button>
        </div>
        <p className="text-muted-foreground tabular-nums" aria-live="polite">
          {yes} yes · {no} no
        </p>
      </div>
    )
  },
}
