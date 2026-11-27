// @syncrobotic/use-list-query v0.55.0 · update: npx shadcn add @syncrobotic/use-list-query --overwrite
"use client"

import * as React from "react"
import { useDebouncedCallback } from "@/registry/syncrobotic/hooks/use-debounce"
import { type ListQuery, type ListQueryOptions, type SortOrder, parseListQuery, serializeListQuery } from "@/registry/syncrobotic/lib/list-query"

/**
 * Where the query lives: the URL's search string, read and written. The default writes `window.history`; pass one built
 * on your router to go through it (see the docs for Next.js).
 */
export type ListQueryAdapter = {
  /** The current search string, with or without its "?". */
  read: () => string
  /** Replaces the search string (no "?"; empty for none). */
  write: (search: string, mode: "push" | "replace") => void
  /** Calls back when the URL changes from outside (back and forward). Leave it out when the router re-renders anyway. */
  subscribe?: (onChange: () => void) => () => void
  /** What the server rendered, for hydration. Defaults to `read`. */
  readOnServer?: () => string
}

const CHANGE = "syncrobotic:list-query"

/** The browser's URL, through `history.pushState`/`replaceState`, keeping the path and the hash. */
export const historyAdapter: ListQueryAdapter = {
  read: () => (typeof window === "undefined" ? "" : window.location.search),
  readOnServer: () => "",
  write: (search, mode) => {
    const { pathname, hash } = window.location
    const url = `${pathname}${search ? `?${search}` : ""}${hash}`
    if (mode === "push") window.history.pushState(window.history.state, "", url)
    else window.history.replaceState(window.history.state, "", url)
    window.dispatchEvent(new Event(CHANGE))
  },
  subscribe: (onChange) => {
    window.addEventListener("popstate", onChange)
    window.addEventListener(CHANGE, onChange)
    return () => {
      window.removeEventListener("popstate", onChange)
      window.removeEventListener(CHANGE, onChange)
    }
  },
}

/** A URL held in memory: for tests, stories, and a list inside a dialog that must not touch the page's URL. */
export function memoryAdapter(initial = ""): ListQueryAdapter & { current: () => string } {
  let search = initial.replace(/^\?/, "")
  const listeners = new Set<() => void>()
  return {
    read: () => search,
    current: () => search,
    write: (next) => {
      search = next
      listeners.forEach((l) => l())
    },
    subscribe: (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
  }
}

const noSubscribe = () => () => {}

export type UseListQueryOptions = ListQueryOptions & {
  /** Where the query lives. Default: the browser's URL through `historyAdapter`. */
  adapter?: ListQueryAdapter
  /** How long typing must pause before the search goes to the URL, in ms (300). Clearing never waits. */
  debounce?: number
  /** "replace" (default) keeps Back for leaving the list; "push" makes each page and sort a step of history. */
  mode?: "push" | "replace"
}

/**
 * A server-paged list's query kept in the URL, so a filtered view is a link: page, limit, sortBy, order and search, read
 * through `list-query`'s grammar. The search box's text updates at once and reaches the URL when typing pauses; a new
 * search, sort or limit goes back to page 1.
 */
export function useListQuery(options: UseListQueryOptions = {}) {
  const { adapter = historyAdapter, debounce = 300, mode = "replace", ...grammar } = options
  const raw = React.useSyncExternalStore(adapter.subscribe ?? noSubscribe, adapter.read, adapter.readOnServer ?? adapter.read)
  const params = new URLSearchParams(raw)
  const query = parseListQuery(params, grammar)
  const urlSearch = query.search ?? ""

  // The box's text runs ahead of the URL while typing. A URL change this hook did not write (Back) replaces it.
  const [text, setText] = React.useState(urlSearch)
  const [seen, setSeen] = React.useState({ url: urlSearch, wrote: urlSearch })
  if (seen.url !== urlSearch) {
    if (urlSearch !== seen.wrote) setText(urlSearch)
    setSeen({ url: urlSearch, wrote: urlSearch })
  }

  const write = (patch: Partial<ListQuery>, extra?: Record<string, string | null | undefined>) => {
    const current = new URLSearchParams(adapter.read())
    const next = { ...parseListQuery(current, grammar), ...patch }
    const out = serializeListQuery(next, { ...grammar, base: current })
    for (const [k, v] of Object.entries(extra ?? {})) {
      if (v === null || v === undefined || v === "") out.delete(k)
      else out.set(k, v)
    }
    adapter.write(out.toString(), mode)
  }

  const sendSearch = useDebouncedCallback((value: string) => {
    setSeen((s) => ({ ...s, wrote: value.trim() }))
    write({ search: value.trim() || undefined, page: 1 })
  }, debounce)

  const setSearch = (value: string, { now = value === "" }: { now?: boolean } = {}) => {
    setText(value)
    sendSearch(value)
    if (now) sendSearch.flush()
  }

  return {
    /** The query as the URL holds it: what to request. */
    query,
    /** The search box's text, which leads the URL while someone types. */
    search: text,
    setSearch,
    setPage: (page: number) => write({ page: Math.max(1, Math.floor(page)) }),
    setLimit: (limit: number) => write({ limit, page: 1 }),
    /** Sorts by a column; `order` left out flips it when the column is already sorted, else ascending. */
    setSort: (sortBy: string | undefined, order?: SortOrder) =>
      write({ sortBy, order: sortBy ? (order ?? (query.sortBy === sortBy && query.order === "asc" ? "desc" : "asc")) : undefined, page: 1 }),
    /** Another key in the URL (a status filter, a tab), kept beside the query. A change goes back to page 1. */
    param: (key: string) => params.get(key),
    setParam: (key: string, value: string | null | undefined) => write({ page: 1 }, { [key]: value }),
    /** Every field back to its default, other keys kept. */
    reset: () => {
      sendSearch.cancel()
      setText("")
      setSeen((s) => ({ ...s, wrote: "" }))
      write({ page: undefined, limit: undefined, sortBy: undefined, order: undefined, search: undefined })
    },
  }
}
