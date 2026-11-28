// @syncrobotic/restricted-preview v0.58.0 · update: npx shadcn add @syncrobotic/restricted-preview --overwrite
"use client"

import * as React from "react"
import { EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A neutral placeholder, with the reason, for a preview not loaded until someone asks: restricted data, or pictures
 * with faces or number plates. The children render, and so fetch, only after that. Neutral, since being restricted is
 * not something wrong; the app decides whether a reveal is logged.
 */
export function RestrictedPreview({
  restricted,
  children,
  label = "Restricted: show preview",
  reason,
  onReveal,
  className,
  "data-slot": slot = "restricted-preview",
}: {
  /** When false, the children show at once. */
  restricted: boolean
  children: React.ReactNode
  /** The button's words. */
  label?: string
  /** Why it is hidden, e.g. "T2 · faces". */
  reason?: string
  /** Called when someone asks to see it, e.g. to log the view. */
  onReveal?: () => void
  /** Size the placeholder like the preview it stands for, e.g. aspect-4/3 w-full. */
  className?: string
  /** The reveal button's data-slot, for a component that holds it (image-grid: "image-grid-reveal"). */
  "data-slot"?: string
}) {
  const [shown, setShown] = React.useState(false)
  if (!restricted) return <>{children}</>
  // Revealed: the preview fades in where the placeholder was (same size), instead of replacing it in one frame.
  if (shown)
    return (
      <div data-slot="restricted-preview" data-revealed="" className={cn("animate-fade-in", className)}>
        {children}
      </div>
    )
  return (
    <button
      type="button"
      data-slot={slot}
      onClick={() => {
        setShown(true)
        onReveal?.()
      }}
      className={cn(
        "press flex flex-col items-center justify-center gap-1 rounded-sm bg-muted p-2 text-center text-xs text-muted-foreground border border-dashed border-border hover:text-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <EyeOff aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </span>
      {reason && <span>{reason}</span>}
    </button>
  )
}
