// @syncrobotic/all-or-some-field v0.57.0 · update: npx shadcn add @syncrobotic/all-or-some-field --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"

/** One thing in the checklist. `reason` says why a disabled one cannot be picked. */
export type AllOrSomeOption = { value: string; label?: React.ReactNode; description?: React.ReactNode; disabled?: boolean; reason?: string }

export type AllOrSomeFieldLabels = {
  all: string
  allHint: string
  some: string
  someHint: string
  /** Under an empty "only these": a legal choice with its own meaning, not an unfinished form. */
  none: string
}

export const defaultAllOrSomeFieldLabels: AllOrSomeFieldLabels = {
  all: "All, including future ones",
  allHint: "Anything added later is included too.",
  some: "Only these",
  someHint: "Fixed: anything added later is not included.",
  none: "None picked: nothing is included.",
}

export type AllOrSomeFieldProps = {
  options: readonly AllOrSomeOption[]
  /** `null` is all, including future ones; an array is exactly these (empty is none). */
  value: readonly string[] | null
  onValueChange: (value: string[] | null) => void
  legend: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Why "all" cannot be chosen here (a limit above the viewer's); it shows disabled with this reason. */
  allDisabledReason?: string
  disabled?: boolean
  labels?: Partial<AllOrSomeFieldLabels>
  className?: string
}

/**
 * "All, including future ones" or "only these" with a checklist, for an entitlement such as licensed modules. `null`
 * is all; ticking every box today is a list, which stops matching the moment something new ships.
 */
export function AllOrSomeField({ options, value, onValueChange, legend, hint, error, allDisabledReason, disabled, labels, className }: AllOrSomeFieldProps) {
  const l = { ...defaultAllOrSomeFieldLabels, ...labels }
  const all = value === null
  // The checklist a person ticked survives a trip to "all" and back.
  const [kept, setKept] = React.useState<string[]>(() => (value ? [...value] : []))
  const picked = value ?? kept
  const toggle = (v: string, on: boolean) => {
    const next = on ? [...picked.filter((x) => x !== v), v] : picked.filter((x) => x !== v)
    setKept(next)
    onValueChange(next)
  }
  return (
    <FieldSet legend={legend} hint={hint} error={error} className={cn("gap-2", className)}>
      <div data-slot="all-or-some-field" className="flex flex-col gap-2">
        <RadioGroup value={all ? "all" : "some"} disabled={disabled} onValueChange={(v) => onValueChange(v === "all" ? null : kept)} className="gap-0">
          <ChoiceField
            label={l.all}
            description={allDisabledReason && !all ? allDisabledReason : l.allHint}
            control={<RadioGroupItem value="all" disabled={!!allDisabledReason && !all} />}
          />
          <ChoiceField label={l.some} description={l.someHint} control={<RadioGroupItem value="some" />} />
        </RadioGroup>
        {!all && (
          <div data-slot="all-or-some-field-list" className="flex flex-col border-t border-border pt-2 pl-8">
            {options.map((o) => (
              <ChoiceField
                key={o.value}
                label={o.label ?? <span className="font-mono">{o.value}</span>}
                description={o.disabled && o.reason ? o.reason : o.description}
                control={<Checkbox disabled={disabled || o.disabled} checked={picked.includes(o.value)} onCheckedChange={(c) => toggle(o.value, c === true)} />}
              />
            ))}
            {picked.length === 0 && <p className="pt-1 text-xs text-muted-foreground">{l.none}</p>}
          </div>
        )}
      </div>
    </FieldSet>
  )
}
