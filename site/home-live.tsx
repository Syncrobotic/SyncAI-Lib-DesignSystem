"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { WhenNear } from "./when-near"

// The home page's live specimens: the registry's components fed a simulated site (site/live-*.tsx). Each one's code loads
// only when it comes within a screen of the viewport; until then a box of its exact size holds its place, so nothing on
// the page moves when it arrives (CLS 0), and the first screen carries none of their weight.
const demos = {
  fleet: React.lazy(() => import("./live-fleet")),
  telemetry: React.lazy(() => import("./live-telemetry")),
  alarms: React.lazy(() => import("./live-alarms")),
}

/**
 * One live specimen in a box of fixed height (`size`). It is watched, not used: `inert` keeps it out of the tab order and
 * away from screen readers (an alarm list announcing a scripted alarm every few seconds would talk over the page); the
 * figure's caption says what it shows.
 */
export function LiveSpecimen({ demo, size }: { demo: keyof typeof demos; size: string }) {
  const Demo = demos[demo]
  const placeholder = <div aria-hidden="true" className={cn(size, "rounded-md bg-card ring-1 ring-border")} />
  return (
    <WhenNear placeholder={placeholder}>
      <React.Suspense fallback={placeholder}>
        <div inert className={size}>
          <Demo />
        </div>
      </React.Suspense>
    </WhenNear>
  )
}
