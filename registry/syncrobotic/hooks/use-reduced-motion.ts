// @syncrobotic/use-reduced-motion v0.36.0 · update: npx shadcn add @syncrobotic/use-reduced-motion --overwrite
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

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {}
  const q = window.matchMedia(QUERY)
  q.addEventListener?.("change", onChange)
  return () => q.removeEventListener?.("change", onChange)
}

/**
 * Whether the person asked for less motion, followed while mounted: the component renders again when the setting
 * changes. False on the server and while the page hydrates, so both render the same; CSS `motion-reduce:` covers what
 * is drawn before that.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, () => prefersReducedMotion(), () => false)
}
