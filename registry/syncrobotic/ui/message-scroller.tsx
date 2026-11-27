// @syncrobotic/message-scroller v0.53.0 · update: npx shadcn add @syncrobotic/message-scroller --overwrite
"use client"

import * as React from "react"
import { ArrowDownToLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Button } from "@/registry/syncrobotic/ui/button"

/*
  Follows the newest words while the reader is at the bottom and lets go when they scroll up. Older turns loaded in front
  keep the first turn in view in place (anchoring done here: Safari has no overflow-anchor). role="log" with its live
  region off, since StreamingText already reads answers in sentences and the log would read them twice: a turn arriving
  complete is read once, a streamed one only if nothing inside it was read. Turns present at mount, older turns and the
  reader's own are never read.
*/

export type MessageScrollerLabels = {
  /** The log's name. */
  name: string
  /** The button that goes back to the newest turn. */
  jump: string
  /** After it, the turns that arrived since the reader scrolled up: "3 new". */
  newCount: (n: number, locale: string | undefined) => string
  /** Its accessible name: "Jump to latest, 3 new messages". */
  jumpLabel: (n: number, locale: string | undefined) => string
  loadEarlier: string
  /** What is read when a turn arrives complete: its name ("Assistant, 14:02") and its text. */
  newTurn: (name: string, text: string) => string
}

export const defaultMessageScrollerLabels: MessageScrollerLabels = {
  name: "Conversation",
  jump: "Jump to latest",
  newCount: (n, locale) => `${formatCount(n, { locale })} new`,
  jumpLabel: (n, locale) => (n > 0 ? `Jump to latest, ${formatCount(n, { locale })} new ${n === 1 ? "message" : "messages"}` : "Jump to latest"),
  loadEarlier: "Load earlier messages",
  newTurn: (name, text) => (text ? `${name}: ${text}` : name),
}

// Within this of the bottom counts as at the bottom: a turn's last few pixels never break following.
const NEAR = 32
// A long turn is read up to here; the rest is on screen and a key press away.
const READ_MAX = 600

const turnOf = (el: Element) => (el.matches("[data-slot=message]") ? el : el.querySelector("[data-slot=message]"))

/** The words a turn says aloud: its name, then its body's text. */
function spoken(el: Element, l: MessageScrollerLabels) {
  const turn = turnOf(el)
  const name = turn?.getAttribute("aria-label") ?? ""
  const body = (turn?.querySelector("[data-slot=message-body]") ?? turn ?? el).textContent ?? ""
  const text = body.replace(/\s+/g, " ").trim()
  return l.newTurn(name, text.length > READ_MAX ? `${text.slice(0, READ_MAX).trimEnd()}…` : text).trim()
}

/**
 * A conversation's scrolling log that follows the newest turn at the bottom, offers Jump to latest, holds still when
 * older turns load, and reads each complete turn once. Jump to latest counts the turns below.
 */
export function MessageScroller({
  children,
  empty,
  hasEarlier = false,
  loadingEarlier = false,
  onLoadEarlier,
  locale,
  labels,
  className,
  contentClassName,
}: {
  /** The turns, oldest first: Message elements (or your own rows, each a direct child). */
  children?: React.ReactNode
  /** Shown when there is no turn yet: an EmptyState, suggested prompts. */
  empty?: React.ReactNode
  /** Older turns exist: shows Load earlier at the top. */
  hasEarlier?: boolean
  loadingEarlier?: boolean
  /** Put the older turns in front of `children`; the view stays where it is. */
  onLoadEarlier?: () => void
  /** Formats the count of new turns. */
  locale?: string
  labels?: Partial<MessageScrollerLabels>
  /** On the outer box: give it a height (h-96, or min-h-0 flex-1 in a column). */
  className?: string
  /** On the list of turns: its gap and padding. */
  contentClassName?: string
}) {
  const l = { ...defaultMessageScrollerLabels, ...labels }
  const viewport = React.useRef<HTMLDivElement>(null)
  const content = React.useRef<HTMLDivElement>(null)
  const jumpRef = React.useRef<HTMLButtonElement>(null)
  // Following the bottom. A ref, so a scroll and a resize read the same answer within one frame.
  const stuck = React.useRef(true)
  const lastTop = React.useRef(0)
  // The first turn in view, and how far its top is from the viewport's: kept still when turns are put in front.
  const anchor = React.useRef<{ el: HTMLElement; offset: number } | null>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  const [fresh, setFresh] = React.useState(0)
  const [said, setSaid] = React.useState("")
  const hasTurns = React.Children.toArray(children).length > 0

  const remember = () => {
    const v = viewport.current
    const c = content.current
    if (!v || !c) return
    const top = v.scrollTop
    for (const child of Array.from(c.children) as HTMLElement[]) {
      if (child.offsetTop + child.offsetHeight > top) {
        anchor.current = { el: child, offset: child.offsetTop - top }
        return
      }
    }
    anchor.current = null
  }

  // After anything changes size or order: stay at the bottom, or keep the anchor turn where it was.
  const follow = React.useEffectEvent(() => {
    const v = viewport.current
    if (!v) return
    if (stuck.current) {
      v.scrollTop = v.scrollHeight
    } else if (anchor.current?.el.isConnected) {
      const want = anchor.current.el.offsetTop - anchor.current.offset
      if (Math.abs(v.scrollTop - want) >= 1) v.scrollTop = want
    }
    lastTop.current = v.scrollTop
  })

  const onScroll = () => {
    const v = viewport.current
    if (!v) return
    const distance = v.scrollHeight - v.scrollTop - v.clientHeight
    if (distance <= NEAR) {
      stuck.current = true
      setAtBottom(true)
      setFresh(0)
    } else if (v.scrollTop < lastTop.current - 1) {
      // Only a move up lets go: content growing under a following view moves nothing up.
      stuck.current = false
      setAtBottom(false)
    }
    lastTop.current = v.scrollTop
    remember()
  }

  // Every commit: React may have added, removed or grown turns.
  React.useLayoutEffect(() => {
    follow()
  })

  // Sizes that change without a render (images loading, a turn's own state) and the turns that arrive.
  const onArrive = React.useEffectEvent((records: MutationRecord[]) => {
    for (const r of records) {
      if (r.type === "attributes") {
        // A streamed turn that ended: read it only when nothing inside it read it already.
        const el = r.target as Element
        if (el.getAttribute("data-slot") !== "message" || r.oldValue !== "true" || el.getAttribute("aria-busy") === "true") continue
        if (el.getAttribute("data-role") === "user" || el.querySelector("[data-slot=streaming-text-announcer]")) continue
        setSaid(spoken(el, l))
        continue
      }
      // Only the turns themselves (the list's children); what changes inside a turn is the turn's own business.
      if (r.target !== content.current) continue
      const added = new Set(Array.from(r.addedNodes).filter((n): n is Element => n instanceof Element))
      for (const el of added) {
        // Appended: nothing after it but other new nodes. A turn put in front is history: neither counted nor read.
        let next = el.nextElementSibling
        while (next && added.has(next)) next = next.nextElementSibling
        if (next) continue
        const turn = turnOf(el)
        if (turn?.getAttribute("data-role") === "user") {
          // The reader sent it: back to the bottom.
          stuck.current = true
          setAtBottom(true)
          setFresh(0)
          continue
        }
        if (!stuck.current) setFresh((n) => n + 1)
        const busy = (turn ?? el).getAttribute("aria-busy") === "true"
        if (!busy) setSaid(spoken(el, l))
      }
    }
    follow()
  })

  React.useEffect(() => {
    const c = content.current
    const v = viewport.current
    if (!c || !v) return
    const mo = new MutationObserver((records) => onArrive(records))
    // One call: a second observe() on the same node would replace these options, not add to them.
    mo.observe(c, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"], attributeOldValue: true })
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => follow())
      ro.observe(c)
      ro.observe(v)
    }
    return () => {
      mo.disconnect()
      ro?.disconnect()
    }
  }, [])

  const jump = () => {
    const v = viewport.current
    if (!v) return
    const hadFocus = document.activeElement === jumpRef.current
    stuck.current = true
    setAtBottom(true)
    setFresh(0)
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth"
    if (typeof v.scrollTo === "function") v.scrollTo({ top: v.scrollHeight, behavior })
    else v.scrollTop = v.scrollHeight
    // The button leaves: focus goes to the conversation it scrolled, never to the page.
    if (hadFocus) v.focus({ preventScroll: true })
  }

  const presence = usePresence(!atBottom && hasTurns)

  return (
    <div data-slot="message-scroller" className={cn("relative flex min-h-0 flex-col", className)}>
      {/* focus-ring: the viewport takes focus for keyboard scrolling and shows the kit's ring inside its edge. */}
      <div
        ref={viewport}
        data-slot="message-scroller-viewport"
        role="log"
        aria-live="off"
        aria-label={l.name}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1)
        tabIndex={0}
        onScroll={onScroll}
        // Anchoring is done above, the same in every browser; the browser's own would move the view twice.
        style={{ overflowAnchor: "none" }}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {hasEarlier && onLoadEarlier && (
          <div className="flex justify-center pt-4">
            <Button data-slot="message-scroller-earlier" variant="ghost" size="sm" loading={loadingEarlier} onClick={onLoadEarlier}>
              {l.loadEarlier}
            </Button>
          </div>
        )}
        <div ref={content} data-slot="message-scroller-content" className={cn("@container flex min-w-0 flex-col gap-6 p-4", contentClassName)}>
          {hasTurns ? children : empty}
        </div>
      </div>

      {presence.mounted && (
        <div
          // Leaving, it is gone for everyone at once; only the fade is left to see.
          aria-hidden={presence.leaving || undefined}
          className={cn("pointer-events-none absolute inset-x-0 bottom-4 flex justify-center", presence.leaving ? "animate-disappear" : "animate-appear")}
          onAnimationEnd={(e) => e.target === e.currentTarget && presence.done()}
        >
          <Button
            ref={jumpRef}
            data-slot="message-scroller-jump"
            variant="outline"
            size="sm"
            aria-label={l.jumpLabel(fresh, locale)}
            onClick={jump}
            tabIndex={presence.leaving ? -1 : undefined}
            className="pointer-events-auto bg-float shadow-float ring-edge backdrop-blur-xl hover:bg-accent"
          >
            <ArrowDownToLine aria-hidden="true" />
            {l.jump}
            {fresh > 0 && <span className="text-muted-foreground tabular-nums">{l.newCount(fresh, locale)}</span>}
          </Button>
        </div>
      )}

      <div data-slot="message-scroller-announcer" aria-live="polite" className="sr-only">
        {said}
      </div>
    </div>
  )
}
