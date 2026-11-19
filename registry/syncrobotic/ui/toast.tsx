// @syncrobotic/toast v0.17.2 · update: npx shadcn add @syncrobotic/toast --overwrite
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
const MAX = 3

/**
 * Show a toast. At most three are on screen: the oldest that is not a failure makes room. Failures are never closed for
 * you, so with several at once more than three can show, until someone dismisses them. Returns its id.
 */
export function toast(input: ToastInput) {
  const id = ++next
  items = [...items, { ...input, id, open: true }]
  const open = items.filter((t) => t.open)
  if (open.length > MAX) {
    const drop = open.find((t) => t.tone !== "danger")
    if (drop) items = items.map((t) => (t.id === drop.id ? { ...t, open: false } : t))
  }
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
  items = items.filter((t) => t.id !== id)
  emit()
}

function useToasts() {
  return React.useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => items,
    () => items,
  )
}

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
        "fixed right-0 bottom-0 z-50 m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  )
}

export function Toast({ className, tone = "neutral", children, ...props }: React.ComponentProps<typeof ToastPrimitive.Root> & { tone?: ToastTone }) {
  const Icon = icons[tone]
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      // Failures interrupt (assertive); everything else waits its turn (polite).
      type={tone === "danger" ? "foreground" : "background"}
      className={cn(
        "relative flex items-start gap-2 rounded-lg bg-float p-4 pr-(--h-md) text-sm shadow-float ring-1 ring-edge backdrop-blur-xl",
        tone === "danger" && "ring-danger",
        "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=cancel]:duration-(--motion-base) ease-(--ease-standard) data-[swipe=end]:animate-disappear",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", iconColor[tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
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

/** Mount once near the root. Renders every toast() call. `label` names the region for screen readers. */
export function Toaster({ label = "Notifications ({hotkey})", dismissLabel = "Dismiss" }: { label?: string; dismissLabel?: string }) {
  const list = useToasts()
  return (
    <ToastProvider label={label}>
      {list.map((t) => (
        <Toast
          key={t.id}
          tone={t.tone}
          open={t.open}
          duration={toastDuration(t)}
          onOpenChange={(open) => {
            if (!open) toast.dismiss(t.id)
          }}
          onAnimationEnd={() => {
            if (!t.open) remove(t.id)
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
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
