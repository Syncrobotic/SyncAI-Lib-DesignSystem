// @syncrobotic/use-presence v0.8.0 · update: npx shadcn add @syncrobotic/use-presence --overwrite
"use client"

import * as React from "react"

// If an animation never runs (animations switched off entirely), nothing waits on it longer than this.
const SAFETY_MS = 400

/**
 * Keeps one element on screen while it leaves. `show` false marks it leaving; render it with
 * `animate-disappear` and call `done` on animation end. Under reduced motion the tokens are near zero, so it ends at once.
 */
export function usePresence(show: boolean) {
  const [mounted, setMounted] = React.useState(show)
  React.useEffect(() => {
    if (show) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(false), SAFETY_MS)
    return () => window.clearTimeout(t)
  }, [show])
  return { mounted: show || mounted, leaving: !show && mounted, done: () => !show && setMounted(false) }
}

/**
 * The same for a list: items removed from `items` stay where they were, marked `leaving`, until `done(key)` is called
 * from their animation end, so a cleared alarm or a finished task fades out instead of vanishing.
 */
export function usePresenceList<T>(items: T[], key: (item: T) => string) {
  const [gone, setGone] = React.useState<Map<string, { item: T; index: number }>>(new Map())
  const previous = React.useRef<T[]>(items)

  React.useEffect(() => {
    const now = new Set(items.map(key))
    const left = previous.current.map((item, index) => ({ item, index })).filter(({ item }) => !now.has(key(item)))
    previous.current = items
    if (left.length === 0) return
    setGone((g) => {
      const next = new Map(g)
      for (const l of left) next.set(key(l.item), l)
      return next
    })
    const keys = left.map((l) => key(l.item))
    const t = window.setTimeout(() => setGone((g) => new Map([...g].filter(([k]) => !keys.includes(k)))), SAFETY_MS)
    return () => window.clearTimeout(t)
    // key is a selector; callers pass a stable one in practice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const rendered: { item: T; leaving: boolean }[] = items.map((item) => ({ item, leaving: false }))
  for (const [k, { item, index }] of gone) {
    if (items.some((i) => key(i) === k)) continue
    rendered.splice(Math.min(index, rendered.length), 0, { item, leaving: true })
  }
  const done = (k: string) =>
    setGone((g) => {
      if (!g.has(k)) return g
      const next = new Map(g)
      next.delete(k)
      return next
    })
  return { rendered, done }
}
