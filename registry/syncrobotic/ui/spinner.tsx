// @syncrobotic/spinner v0.5.0 · update: npx shadcn add @syncrobotic/spinner --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Appears only after `delay` (300 ms by default): work that finishes sooner never flashes a spinner.
 */
export function Spinner({ className, delay = 300, label = "Loading" }: { className?: string; delay?: number; label?: string }) {
  const [visible, setVisible] = React.useState(delay === 0)
  React.useEffect(() => {
    if (delay === 0) return
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!visible) return null
  return (
    <svg role="status" aria-label={label} viewBox="0 0 24 24" className={cn("size-5 animate-spin", className)}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 3a9 9 0 019 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
