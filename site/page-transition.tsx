"use client"

import * as React from "react"
import { ViewTransition } from "react"
import { usePathname } from "next/navigation"
import { componentBase } from "@/site/component-tabs"

// A view transition paints its snapshots of the content above everything else, an open sheet included. Going to a page
// from the navigation drawer, the old page would show through the drawer and the new one fade in over it. So that one
// navigation has no transition: the drawer stays until the new page is there, then slides away from it.
let quiet = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
/** The next page change happens without the page transition (called by the navigation drawer). */
export function quietNextPage() {
  quiet = true
  emit()
}

/**
 * The page's content leaves and arrives when you go to another page: the old one fades out (--motion-fast, exit easing),
 * the new one appears (--motion-base, 8 px rise), the kit's disappear and appear. Keyed by path, so a new page is a new
 * entry and a change of hash (or of a component page's tab) is not. Only the content takes part: the header and sidebar stay live and still, and since
 * the root is not snapshotted (globals.css) everything outside the content can be clicked during the 320 ms. In a robot
 * app the same rule keeps the stop and the island out of any transition.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  // A component page's tabs (/x, /x/properties, /x/accessibility) are one page here: the head stays and only the tab's
  // content arrives (site/component-tabs.tsx).
  const path = componentBase(usePathname())
  const q = React.useSyncExternalStore(subscribe, () => quiet, () => false)
  React.useEffect(() => {
    if (quiet) {
      quiet = false
      emit()
    }
  }, [path])
  return (
    <ViewTransition key={path} enter={q ? "none" : "page-enter"} exit={q ? "none" : "page-exit"} default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
