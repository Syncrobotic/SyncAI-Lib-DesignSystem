// @syncrobotic/search-field v0.51.0 · update: npx shadcn add @syncrobotic/search-field --overwrite
"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { browserNavigate, type Navigate } from "@/registry/syncrobotic/ui/filter-form"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"

export type SearchFieldLabels = {
  /** Names the search landmark and the box, for screen readers. */
  label: string
  /** In the empty box. */
  placeholder: string
}

export const defaultSearchFieldLabels: SearchFieldLabels = { label: "Search", placeholder: "Search" }

/**
 * The tool's one search box, in the top bar; `/` focuses it. Enter opens the results page; there (`live`) it holds the
 * URL's query and applies itself as typing pauses. A GET form without JavaScript. With `onValueChange` it filters the
 * screen instead and never navigates.
 */
export function SearchField({
  action = "/search",
  name = "q",
  live = false,
  onNavigate = browserNavigate,
  delay = 400,
  label: labelProp,
  placeholder: placeholderProp,
  labels,
  hotkey = "/",
  value,
  onValueChange,
  className,
}: {
  /** The results page. */
  action?: string
  /** The query parameter. */
  name?: string
  /** True on the results page: follow the URL and apply while typing. */
  live?: boolean
  onNavigate?: Navigate
  delay?: number
  /** Same as `labels.label`, and wins over it. */
  label?: string
  /** Same as `labels.placeholder`, and wins over it. */
  placeholder?: string
  /** The words it says, to translate them. */
  labels?: Partial<SearchFieldLabels>
  /** The key that focuses the box; null for none. */
  hotkey?: string | null
  /** With `onValueChange`: the text in the box, controlled. Left out, the box keeps its own. */
  value?: string
  /**
   * Filters in place instead of navigating: called with the text as it is typed, on data already on the screen (a tree, a
   * list). Enter then does nothing more, and `action`, `name`, `live` and `onNavigate` are not used.
   */
  onValueChange?: (value: string) => void
  className?: string
}) {
  const l = { ...defaultSearchFieldLabels, ...labels }
  const label = labelProp ?? l.label
  const placeholder = placeholderProp ?? l.placeholder
  const input = React.useRef<HTMLInputElement>(null)
  const timer = React.useRef<number | undefined>(undefined)
  const id = React.useId()
  const go = (replace: boolean) => {
    window.clearTimeout(timer.current)
    const q = input.current?.value.trim()
    onNavigate(q ? `${action}?${name}=${encodeURIComponent(q)}` : action, replace ? "replace" : "push")
  }

  // On the results page the box mirrors ?q=: on arrival, and on Back or Forward.
  React.useEffect(() => {
    if (!live) return
    const sync = () => {
      const q = new URLSearchParams(window.location.search).get(name) ?? ""
      if (input.current && input.current.value !== q) input.current.value = q
    }
    sync()
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [live, name])

  React.useEffect(() => {
    if (!hotkey) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null
      if (e.key !== hotkey || e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return
      e.preventDefault()
      input.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hotkey])

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <form
      role="search"
      aria-label={label}
      action={action}
      data-slot="search-field"
      className={cn("relative w-full", className)}
      onInput={() => {
        if (!live || onValueChange) return
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => go(true), delay)
      }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!onValueChange) go(live)
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <Input
          ref={input}
          id={id}
          name={name}
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          {...(onValueChange ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value) } : {})}
        />
        {hotkey && (
          <InputGroupAddon aria-hidden="true" className="max-md:hidden">
            <Kbd>{hotkey}</Kbd>
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}
