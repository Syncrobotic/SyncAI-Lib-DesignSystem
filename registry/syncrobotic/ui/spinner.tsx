// @syncrobotic/spinner v0.53.0 · update: npx shadcn add @syncrobotic/spinner --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type SpinnerLabels = {
  /** The spinner's name for screen readers. */
  loading: string
}

export const defaultSpinnerLabels: SpinnerLabels = { loading: "Loading" }

/**
 * A turning indicator for work with no measurable progress, shown only after 300 ms so quick work never flashes it.
 * `delay` sets the wait.
 */
export function Spinner({
  className,
  delay = 300,
  label,
  labels,
}: {
  className?: string
  delay?: number
  /** Same as `labels.loading`, and wins over it. */
  label?: string
  /** The words it says, to translate them. */
  labels?: Partial<SpinnerLabels>
}) {
  const l = { ...defaultSpinnerLabels, ...labels }
  const [visible, setVisible] = React.useState(delay === 0)
  React.useEffect(() => {
    if (delay === 0) return
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!visible) return null
  return (
    <svg role="status" aria-label={label ?? l.loading} viewBox="0 0 24 24" className={cn("size-5 animate-spin", className)}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 3a9 9 0 019 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
