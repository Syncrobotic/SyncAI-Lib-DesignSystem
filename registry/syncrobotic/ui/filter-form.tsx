// @syncrobotic/filter-form v0.51.0 · update: npx shadcn add @syncrobotic/filter-form --overwrite
"use client"

import * as React from "react"

export type NavigateMode = "push" | "replace"
/** How the form moves the page. Next.js: (url, mode) => router[mode](url, { scroll: false }). */
export type Navigate = (url: string, mode: NavigateMode) => void

/** Without a router, the browser itself: a full load, so it works in any app. Pass `onNavigate` to stay client-side. */
export const browserNavigate: Navigate = (url, mode) => (mode === "push" ? window.location.assign(url) : window.location.replace(url))

/** The URL a form's filters lead to: its non-empty fields, in order; keys in `drop` (the page number) left out. */
export function filterUrl(path: string, data: Iterable<[string, FormDataEntryValue]>, drop: string[] = ["page"]) {
  const q = new URLSearchParams()
  for (const [k, v] of data) if (typeof v === "string" && v !== "" && !drop.includes(k)) q.append(k, v)
  const s = q.toString()
  return s ? `${path}?${s}` : path
}

/**
 * Filters in the URL, so a view can be shared and undone with Back. A plain GET form: after typing pauses, or at once on a
 * select or checkbox, the URL takes the non-empty fields and the page resets. Works without JavaScript.
 */
export function FilterForm({
  children,
  action,
  onNavigate = browserNavigate,
  delay = 400,
  drop = ["page"],
  label = "Filters",
  className,
}: {
  children: React.ReactNode
  /** The path to filter; the current one when left out. */
  action?: string
  onNavigate?: Navigate
  /** Wait after typing stops, in ms. */
  delay?: number
  /** Fields that reset when a filter changes. */
  drop?: string[]
  /** Names the search landmark. */
  label?: string
  className?: string
}) {
  const timer = React.useRef<number | undefined>(undefined)
  const typedUrl = React.useRef<string | null>(null)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const go = (form: HTMLFormElement, typed = false) => {
    window.clearTimeout(timer.current)
    const here = window.location.pathname + window.location.search
    const url = filterUrl(action ?? window.location.pathname, new FormData(form), drop)
    // Typing refines the history entry its first keystroke made, unless the URL moved since (Back, a link).
    const refine = typed && typedUrl.current === here
    typedUrl.current = typed ? url : null
    if (url === here) return
    onNavigate(url, refine ? "replace" : "push")
  }

  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label={label}
      data-slot="filter-form"
      className={className}
      onInput={(e) => {
        const form = e.currentTarget
        const t = e.target as HTMLElement
        window.clearTimeout(timer.current)
        // A pick applies at once; typing waits until it stops.
        const typing = t instanceof HTMLInputElement && !["checkbox", "radio"].includes(t.type)
        if (typing || t instanceof HTMLTextAreaElement) timer.current = window.setTimeout(() => go(form, true), delay)
        else go(form)
      }}
      onChange={(e) => {
        // Radix Select and other custom controls update a hidden native field without an input event.
        if ((e.target as HTMLElement).getAttribute("aria-hidden") === "true") go(e.currentTarget)
      }}
      onSubmit={(e) => {
        e.preventDefault()
        go(e.currentTarget)
      }}
    >
      {children}
    </form>
  )
}
