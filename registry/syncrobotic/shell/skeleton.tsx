// @syncrobotic/skeleton v0.8.0 · update: npx shadcn add @syncrobotic/skeleton --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/**
 * Skeleton bone. Rules: show what is already known with the real components; use bones only
 * for unknown values; same shape and radius as the real thing; no border; the whole group breathes.
 * `onCard` uses the border colour so the bone stays visible on a card surface.
 */
export function Bone({ className, onCard }: { className?: string; onCard?: boolean }) {
  return <span aria-hidden="true" className={cn("block animate-breath rounded-xs", onCard ? "bg-border" : "bg-muted", className)} />
}

/** One line saying what we are waiting for, above the skeleton. */
export function LoadingLine({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner className="size-4" />
      {children}
    </p>
  )
}
