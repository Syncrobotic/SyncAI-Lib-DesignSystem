// @syncrobotic/choice-field v0.53.0 · update: npx shadcn add @syncrobotic/choice-field --overwrite
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
  // The last note stays in the closing line while it fades. It is state set during render, not a ref, so the React
  // Compiler can see the value the markup depends on.
  const [last, setLast] = React.useState<{ note: React.ReactNode; error: boolean }>({ note: null, error: false })
  if (note && (last.note !== note || last.error !== !!error)) setLast({ note, error: !!error })
  const shown = note ? { note, error: !!error } : last
  return (
    <fieldset
      data-slot="fieldset"
      aria-describedby={note ? `${id}-note` : undefined}
      aria-invalid={error ? true : undefined}
      // A fieldset is as wide as its widest content by default (min-inline-size: min-content); min-w-0 lets it take its
      // column's width, so a long legend wraps instead of being cut off.
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      <legend className="pb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col">{children}</div>
      {/* Same note line as Field: it grows open, and a fixed error fades out while the line closes. */}
      <div className={cn("grid transition-[grid-template-rows] duration-(--motion-base) ease-(--ease-standard)", note ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden" aria-hidden={note ? undefined : true}>
          {shown.note && (
            <p
              id={note ? `${id}-note` : undefined}
              className={cn(
                "flex items-start gap-2 text-xs transition-opacity duration-(--motion-base) ease-(--ease-standard)",
                shown.error ? "text-danger" : "text-muted-foreground",
                shown.error && note && "animate-appear",
                !note && "opacity-0",
              )}
            >
              {shown.error && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
              <span>{shown.note}</span>
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}

/**
 * A choice as a whole tappable row (checkbox, radio or switch with label, description and count); FieldSet groups them
 * under one question. The row is a label, so a tap anywhere toggles it; a switch sits at the end, checkboxes and radios
 * at the start.
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
      className={cn("flex min-h-(--h-md) cursor-pointer items-center gap-3 py-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted-foreground", className)}
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
