// @syncrobotic/choice-field v0.8.0 · update: npx shadcn add @syncrobotic/choice-field --overwrite
"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A group of choices under one question: a legend, the options, and one line for a hint or an error.
 * Use it around ChoiceFields of checkboxes, radios or switches.
 */
export function FieldSet({
  legend,
  hint,
  error,
  className,
  children,
}: {
  legend: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  const note = error ?? hint
  return (
    <fieldset
      data-slot="fieldset"
      aria-describedby={note ? `${id}-note` : undefined}
      aria-invalid={error ? true : undefined}
      className={cn("flex flex-col gap-1", className)}
    >
      <legend className="pb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col">{children}</div>
      {note && (
        <p id={`${id}-note`} className={cn("flex items-start gap-1 text-xs", error ? "animate-appear text-danger" : "text-muted-foreground")}>
          {error && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
          <span>{note}</span>
        </p>
      )}
    </fieldset>
  )
}

/**
 * One choice as a whole tappable row, at least 44 px: the control, its label and an optional description, and an optional
 * detail at the end (a count). Checkboxes and radios sit at the start; a switch, which acts at once, sits at the end.
 * The row is a label, so a tap anywhere on it toggles the control.
 */
export function ChoiceField({
  label,
  description,
  control,
  trailing,
  controlAt = "start",
  className,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  /** A Checkbox, RadioGroupItem or Switch. */
  control: React.ReactElement
  /** A count or a value at the end of the row. */
  trailing?: React.ReactNode
  controlAt?: "start" | "end"
  className?: string
}) {
  return (
    <label
      data-slot="choice-field"
      className={cn("flex min-h-(--h-md) cursor-pointer items-center gap-3 py-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50", className)}
    >
      {controlAt === "start" && control}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      {trailing !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{trailing}</span>}
      {controlAt === "end" && control}
    </label>
  )
}
