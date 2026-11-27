// @syncrobotic/use-reduced-motion v0.52.0 · update: npx shadcn add @syncrobotic/use-reduced-motion --overwrite
"use client"

import * as React from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Whether the person asked for less motion, read now: for a handler or an effect deciding whether to glide or jump
 * (a scroll, a camera fly-to). `fallback` is the answer where it cannot be asked (the server, a browser without
 * matchMedia).
 */
export function prefersReducedMotion(fallback = false): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return fallback
  return window.matchMedia(QUERY).matches
}

// One subscribe function per query, so useSyncExternalStore does not resubscribe on every render.
const subscribers = new Map<string, (onChange: () => void) => () => void>()
const subscribeTo = (query: string) => {
  let s = subscribers.get(query)
  if (!s) {
    s = (onChange) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {}
      const q = window.matchMedia(query)
      q.addEventListener?.("change", onChange)
      return () => q.removeEventListener?.("change", onChange)
    }
    subscribers.set(query, s)
  }
  return s
}

/**
 * Whether a CSS media query matches, followed while mounted. `fallback` on the server, while the page hydrates and in a
 * browser without matchMedia, so both renders agree; it is also the layout drawn before the scripts run.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return React.useSyncExternalStore(
    subscribeTo(query),
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : fallback),
    () => fallback,
  )
}

/**
 * Whether the person asked for less motion, followed while mounted: the component renders again when the setting
 * changes. False on the server and while the page hydrates, so both render the same; CSS `motion-reduce:` covers what
 * is drawn before that.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(QUERY)
}
