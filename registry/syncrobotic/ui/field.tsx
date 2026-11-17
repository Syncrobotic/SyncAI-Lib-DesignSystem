// @syncrobotic/field v0.7.0 · update: npx shadcn add @syncrobotic/field --overwrite
"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { CircleAlert } from "lucide-react"
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
  const generated = React.useId()
  // A control that brings its own id keeps it, and the label follows it.
  const id = (children.props as { id?: string }).id ?? generated
  const noteId = `${id}-note`
  const note = error ?? hint
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Slot.Root id={id} aria-describedby={note ? noteId : undefined} aria-invalid={error ? true : undefined}>
        {children}
      </Slot.Root>
      {/*
        The note line grows open when a hint or error arrives (height at --motion-base), and the error itself appears
        with an icon, so it never relies on colour alone. An error that replaces a hint keeps the height: no jump. Never a shake.
      */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-(--motion-base) ease-(--ease-standard)",
          note ? "grid-rows-[1fr]" : "-mt-2 grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {note && (
            <p
              id={noteId}
              key={error ? "error" : "hint"}
              className={cn("flex items-start gap-1 text-xs", error ? "animate-appear text-danger" : "text-muted-foreground")}
            >
              {error && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
              <span>{note}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
