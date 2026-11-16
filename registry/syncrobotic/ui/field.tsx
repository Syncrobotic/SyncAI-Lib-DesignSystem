"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { Label } from "@/registry/syncrobotic/ui/label"

/**
 * Label, control, then one line under it: the hint, or the error in its place.
 * Wires id, aria-describedby and aria-invalid onto the single child control.
 */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactElement
}) {
  const id = React.useId()
  const noteId = `${id}-note`
  const note = error ?? hint
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Slot.Root id={id} aria-describedby={note ? noteId : undefined} aria-invalid={error ? true : undefined}>
        {children}
      </Slot.Root>
      {note && (
        <p id={noteId} className={cn("text-xs", error ? "text-danger" : "text-muted-foreground")}>
          {note}
        </p>
      )}
    </div>
  )
}
