// @syncrobotic/toast v0.32.0 · update: npx shadcn add @syncrobotic/toast --overwrite
"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "radix-ui"
import { CircleCheck, CircleAlert, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A short, transient message about something the user just did, or a minor event.
 * Same timings as the island's notices: 4 s, 8 s when it offers an action (undo), failures until dismissed.
 * Never an alarm: anything that needs an operator to act goes to the alarm list.
 */
export type ToastTone = "neutral" | "success" | "danger"

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  /** e.g. Undo. A toast with an action stays 8 s. */
  action?: { label: string; altText?: string; onClick: () => void }
}

type Item = ToastInput & { id: number; open: boolean }

export const toastDuration = (t: ToastInput) => (t.tone === "danger" ? Infinity : t.action ? 8000 : 4000)

const icons = { neutral: Info, success: CircleCheck, danger: CircleAlert } as const
const iconColor = { neutral: "text-muted-foreground", success: "text-success", danger: "text-danger" } as const

// A tiny store, so any code can call toast() without a context.
let items: Item[] = []
let next = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

/**
 * Show a toast. Three show at a time, newest in front; the others wait behind the third, kept with their timers running,
 * and come forward as the ones in front go. Nothing is closed for you to make room. Returns its id.
 */
export function toast(input: ToastInput) {
  const id = ++next
  items = [...items, { ...input, id, open: true }]
  emit()
  return id
}

toast.dismiss = (id: number) => {
  items = items.map((t) => (t.id === id ? { ...t, open: false } : t))
  emit()
}

/** For tests and stories. */
toast.clear = () => {
  items = []
  emit()
}

const remove = (id: number) => {
  if (!items.some((t) => t.id === id)) return
  items = items.filter((t) => t.id !== id)
  emit()
}

function useToasts() {
  return React.useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  )
}

// Only the first Toaster mounted draws the toasts. A block that brings its own <Toaster /> into an app that has one at the
// root would otherwise draw every toast twice, in two stacks on top of each other, and pause only the one under the pointer.
let toasters: symbol[] = []
const useFirstToaster = () =>
  React.useSyncExternalStore(
    subscribe,
    () => toasters[0],
    () => undefined,
  )

// ---------- Parts ----------

export function ToastProvider(props: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider swipeDirection="right" {...props} />
}

export function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        // focus-ring: F8 lands on the region and Tab moves into the notices, which show their own rings.
        // Full width on a phone, so its gutters match (16 px each side); 24rem at the right from sm up.
        "fixed right-0 bottom-0 z-50 m-0 flex w-full list-none flex-col gap-2 p-4 outline-none sm:max-w-sm",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Escape while focus is inside an open native <dialog> belongs to the dialog. An open toast listens for Escape on the
 * whole document and took it, so the toast closed and the dialog stayed open. Here the toast keeps out of it: it stays,
 * and the dialog is asked to close as if it had the key itself (a `cancel` event it can refuse, then close), as the
 * tooltip does. Escape with focus in the toast, or outside any dialog, still dismisses the toast.
 */
function escapeToDialog(e: KeyboardEvent) {
  const dialog = (document.activeElement as HTMLElement | null)?.closest("dialog[open]") as HTMLDialogElement | null
  if (!dialog) return
  e.preventDefault()
  if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close()
}

export function Toast({
  className,
  tone = "neutral",
  children,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & { tone?: ToastTone }) {
  const Icon = icons[tone]
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      // Failures interrupt (assertive); everything else waits its turn (polite).
      type={tone === "danger" ? "foreground" : "background"}
      onEscapeKeyDown={(e) => {
        onEscapeKeyDown?.(e)
        if (!e.defaultPrevented) escapeToDialog(e)
      }}
      className={cn(
        "relative rounded-md bg-float p-4 pr-(--h-md) text-sm shadow-float ring-1 ring-edge backdrop-blur-xl",
        tone === "danger" && "ring-danger",
        "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
        // A swipe that goes far enough leaves from where the finger let go, instead of jumping back while it fades.
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=cancel]:duration-(--motion-base) ease-(--ease-standard) data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=end]:animate-disappear",
        className,
      )}
      {...props}
    >
      {/* The content's own height, which the Toaster measures to stack toasts of different heights. */}
      <div data-slot="toast-content" className="flex items-start gap-2">
        <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", iconColor[tone])} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      </div>
    </ToastPrimitive.Root>
  )
}

export function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title data-slot="toast-title" className={cn("font-medium", className)} {...props} />
}

export function ToastDescription({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description data-slot="toast-description" className={cn("text-muted-foreground", className)} {...props} />
}

export function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn("press mt-1 h-(--h-sm) self-start rounded-sm px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent", className)}
      {...props}
    />
  )
}

export function ToastClose({ className, label = "Dismiss", ...props }: React.ComponentProps<typeof ToastPrimitive.Close> & { label?: string }) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label={label}
      className={cn(
        "press -mt-1 -mr-1 flex size-(--h-sm) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
      {...props}
    >
      <X aria-hidden="true" className="size-4" />
    </ToastPrimitive.Close>
  )
}

// ---------- The stack ----------
// The Toaster stacks its toasts the way sonner does. Collapsed, the newest is in front at full size and two more peek
// out above it, each a little narrower; the rest wait hidden behind them. Hovering, focusing or touching the stack
// spreads the three into a list. A toast arrives from the screen's edge and the others move back to make room; one
// that leaves fades while the ones behind move forward. Every move is a transition on transform, so a toast arriving
// or leaving in the middle of another move carries on from where it is instead of jumping.

/** Toasts on screen at once; the rest are kept, hidden, until one in front goes. */
export const VISIBLE_TOASTS = 3
const GAP = 8 // px between spread toasts: the kit's gap-2
const PEEK = 10 // px of each toast behind that shows above the one in front of it
const SHRINK = 0.05 // each toast behind is 5 % narrower

type Place = { index: number; offset: number }

// Toasts slide on transform and resize on height, at the Move pattern's pace; one that leaves goes at the exit's.
const stacked = cn(
  "absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] origin-top overflow-hidden data-[state=open]:animate-none",
  "transition-[transform,opacity,height,visibility] duration-(--motion-base) ease-(--ease-standard) data-[state=closed]:duration-(--motion-fast) data-[state=closed]:ease-(--ease-exit)",
  "*:transition-opacity *:duration-(--motion-base) *:ease-(--ease-standard)",
)

function StackedToast({
  item: t,
  place,
  expanded,
  count,
  height,
  frontHeight,
  dismissLabel,
  onHeight,
}: {
  item: Item
  place: Place | undefined
  expanded: boolean
  count: number
  height: number
  frontHeight: number
  dismissLabel: string
  onHeight: (id: number, height: number | null) => void
}) {
  const [node, setNode] = React.useState<HTMLLIElement | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [swiped, setSwiped] = React.useState(false)
  // Where it stood while open: a toast that leaves leaves from there, while the others already move into its room.
  const [last, setLast] = React.useState(place)
  if (place && (place.index !== last?.index || place.offset !== last.offset)) setLast(place)

  // Arrive from the edge: the first frame draws it below its place, the next lets it travel up.
  React.useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => (second = requestAnimationFrame(() => setMounted(true))))
    return () => (cancelAnimationFrame(first), cancelAnimationFrame(second))
  }, [])

  // The content's height plus the toast's padding: its natural height, even while the stack squeezes it to the front's.
  React.useLayoutEffect(() => {
    const content = node?.querySelector<HTMLElement>("[data-slot=toast-content]")
    if (!node || !content) return
    const measure = () => {
      const s = getComputedStyle(node)
      onHeight(t.id, content.offsetHeight + parseFloat(s.paddingTop || "0") + parseFloat(s.paddingBottom || "0"))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [node, t.id, onHeight])
  React.useEffect(() => () => onHeight(t.id, null), [t.id, onHeight])

  // A closed toast is removed when its fade ends; this catches one that never got to fade (closed before it showed).
  React.useEffect(() => {
    if (t.open) return
    const timer = setTimeout(() => remove(t.id), 1000)
    return () => clearTimeout(timer)
  }, [t.open, t.id])

  const at = place ?? last ?? { index: 0, offset: 0 }
  const hidden = t.open && at.index >= VISIBLE_TOASTS
  const behind = Math.min(at.index, VISIBLE_TOASTS)
  const resting = expanded && !hidden ? `translateY(${-at.offset}px)` : `translateY(${-behind * PEEK}px) scale(${1 - behind * SHRINK})`
  const transform = !mounted
    ? "translateY(100%)"
    : t.open || swiped
      ? resting
      : at.index === 0
        ? "translateY(100%)" // the front one goes back the way it came
        : `${resting} translateY(0.5rem)`
  // Collapsed, the toasts behind take the front one's height, so only their top edge shows above it.
  const own = (expanded && !hidden) || at.index === 0
  const h = own ? height : frontHeight
  return (
    <Toast
      ref={setNode}
      tone={t.tone}
      open={t.open}
      duration={toastDuration(t)}
      onOpenChange={(open) => {
        if (!open) toast.dismiss(t.id)
      }}
      onSwipeEnd={() => setSwiped(true)}
      onAnimationEnd={(e) => {
        if (!t.open && e.target === e.currentTarget) remove(t.id)
      }}
      data-index={at.index}
      data-front={at.index === 0}
      data-visible={!hidden}
      data-expanded={expanded}
      inert={hidden || undefined}
      className={cn(stacked, !expanded && at.index > 0 && "*:opacity-0")}
      style={{
        transform,
        opacity: !mounted || hidden ? 0 : undefined,
        visibility: hidden ? "hidden" : undefined,
        height: h ? `${h}px` : undefined,
        zIndex: 2 * (count + 1 - at.index) + (t.open ? 0 : 1),
      }}
    >
      <ToastTitle>{t.title}</ToastTitle>
      {t.description && <ToastDescription>{t.description}</ToastDescription>}
      {t.action && (
        <ToastAction altText={t.action.altText ?? t.action.label} onClick={t.action.onClick}>
          {t.action.label}
        </ToastAction>
      )}
      <ToastClose label={dismissLabel} className="absolute top-3 right-3" />
    </Toast>
  )
}

/**
 * Mount once near the root. Renders every toast() call as a stack: the newest in front, three at most on screen; hover,
 * focus or touch spreads them out. Timers pause while the pointer or focus is on the stack and while the window is in
 * the background. `label` names the region for screen readers. A second Toaster draws nothing while the first is mounted.
 */
export function Toaster({ label = "Notifications ({hotkey})", dismissLabel = "Dismiss" }: { label?: string; dismissLabel?: string }) {
  const list = useToasts()
  const first = useFirstToaster()
  const [me] = React.useState(() => Symbol("toaster"))
  React.useEffect(() => {
    toasters = [...toasters, me]
    emit()
    return () => {
      toasters = toasters.filter((s) => s !== me)
      emit()
    }
  }, [me])

  const [heights, setHeights] = React.useState<Record<number, number>>({})
  const onHeight = React.useCallback((id: number, height: number | null) => {
    setHeights((was) => {
      if (height === null) {
        if (!(id in was)) return was
        const { [id]: _gone, ...rest } = was
        return rest
      }
      return was[id] === height ? was : { ...was, [id]: height }
    })
  }, [])

  const [pointer, setPointer] = React.useState(false)
  const [focus, setFocus] = React.useState(false)
  const [region, setRegion] = React.useState<HTMLOListElement | null>(null)
  // Native listeners: the toasts are portalled into the region, so React's own events bubble past it to the Toaster.
  React.useEffect(() => {
    if (!region) return
    const on = () => setPointer(true)
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setPointer(false)
    }
    // A touch spreads the stack until the next touch outside it: a finger never leaves the way a mouse does.
    const outside = (e: PointerEvent) => {
      if (!region.contains(e.target as Node)) setPointer(false)
    }
    // Focus counts only when it came from the keyboard. A click focuses the button it lands on, and closing that toast
    // moves focus to the region; held there, it would keep the stack spread and Radix's timers paused after the pointer
    // left, until a click somewhere else. So focus a click brought is ignored, and the region's is handed back.
    let viaPointer = false
    const pointerDown = () => (viaPointer = true)
    const keyDown = () => (viaPointer = false)
    let handBack = 0
    const focusIn = (e: FocusEvent) => {
      if (!viaPointer) return setFocus(true)
      // After Radix has paused on this focus (it listens further up), so its focusout resumes the timers.
      if (e.target === region) handBack = window.setTimeout(() => document.activeElement === region && region.blur())
    }
    const focusOut = (e: FocusEvent) => {
      if (!region.contains(e.relatedTarget as Node | null)) setFocus(false)
    }
    region.addEventListener("pointermove", on)
    region.addEventListener("pointerdown", on)
    region.addEventListener("pointerleave", leave)
    region.addEventListener("focusin", focusIn)
    region.addEventListener("focusout", focusOut)
    document.addEventListener("pointerdown", outside)
    document.addEventListener("pointerdown", pointerDown, true)
    document.addEventListener("keydown", keyDown, true)
    return () => {
      clearTimeout(handBack)
      document.removeEventListener("pointerdown", pointerDown, true)
      document.removeEventListener("keydown", keyDown, true)
      region.removeEventListener("pointermove", on)
      region.removeEventListener("pointerdown", on)
      region.removeEventListener("pointerleave", leave)
      region.removeEventListener("focusin", focusIn)
      region.removeEventListener("focusout", focusOut)
      document.removeEventListener("pointerdown", outside)
    }
  }, [region])

  const open = list.filter((t) => t.open).reverse() // newest first
  const expanded = (pointer || focus) && open.length > 1
  const places = new Map<number, Place>()
  let offset = 0
  open.forEach((t, index) => {
    places.set(t.id, { index, offset })
    offset += (heights[t.id] ?? 0) + GAP
  })
  const frontHeight = open[0] ? (heights[open[0].id] ?? 0) : 0
  const spread = open.slice(0, VISIBLE_TOASTS).reduce((sum, t) => sum + (heights[t.id] ?? 0) + GAP, -GAP)
  const stackHeight = Math.max(0, expanded ? spread : frontHeight + PEEK * (Math.min(open.length, VISIBLE_TOASTS) - 1))

  if (first !== me) return null
  return (
    <ToastProvider label={label}>
      {list.map((t) => (
        <StackedToast
          key={t.id}
          item={t}
          place={places.get(t.id)}
          expanded={expanded}
          count={open.length}
          height={heights[t.id] ?? 0}
          frontHeight={frontHeight}
          dismissLabel={dismissLabel}
          onHeight={onHeight}
        />
      ))}
      <ToastViewport
        ref={setRegion}
        data-expanded={expanded}
        // The region covers the stack, spread or not, so the pointer does not fall through the gaps between toasts.
        style={{ height: `calc(${stackHeight}px + 1rem + max(1rem, env(safe-area-inset-bottom)))` }}
      />
    </ToastProvider>
  )
}
