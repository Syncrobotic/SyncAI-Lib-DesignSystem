// @syncrobotic/scope-picker v0.57.0 · update: npx shadcn add @syncrobotic/scope-picker --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Code } from "@/registry/syncrobotic/ui/code"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"

/** A permission a grant can hold: its string, and words for it. `resource` groups it; default the part before ":". */
export type ScopeOption = { value: string; label?: string; description?: string; resource?: string }

export type ScopePickerLabels = {
  /** The choice that follows the catalog: a scope added later is granted too. */
  all: string
  allHint: string
  /** Why "all" is disabled: the viewer does not hold every scope, so they cannot give the ones to come. */
  allAbove: string
  some: string
  someHint: string
  /** Under a scope outside `allowedScopes`. */
  outside: string
  /** The group's own checkbox, named for screen readers. */
  group: (resource: string) => string
  selected: (count: number, formatted: string) => string
  none: string
}

export const defaultScopePickerLabels: ScopePickerLabels = {
  all: "All scopes, including ones added later",
  allHint: "A scope added to the product later is granted too.",
  allAbove: "You do not hold every scope, so you cannot grant the ones added later.",
  some: "Only these scopes",
  someHint: "Fixed: a scope added later is not granted.",
  outside: "Not in your own permissions, so you cannot grant it.",
  group: (resource) => `Every ${resource} scope`,
  selected: (n, f) => `${f} ${n === 1 ? "scope" : "scopes"} selected`,
  none: "No scopes: it can only prove who it is.",
}

/** The resource a scope belongs to: `resource` when set, else the part of its string before ":" ("devices:write" → "devices"). */
export const scopeResource = (s: ScopeOption) => s.resource ?? s.value.split(":")[0] ?? s.value

/** The scopes grouped by resource, in the order they first appear. */
export function groupScopes(scopes: readonly ScopeOption[]) {
  const groups = new Map<string, ScopeOption[]>()
  for (const s of scopes) {
    const r = scopeResource(s)
    groups.set(r, [...(groups.get(r) ?? []), s])
  }
  return [...groups].map(([resource, items]) => ({ resource, items }))
}

/** `value` without the scopes the viewer may not grant: what a create request may send. Null (all) stays null only if every scope is allowed. */
export function boundScopes(value: readonly string[] | null, scopes: readonly ScopeOption[], allowedScopes?: readonly string[]): string[] | null {
  const allowed = (v: string) => !allowedScopes || allowedScopes.includes(v)
  if (value === null) return scopes.every((s) => allowed(s.value)) ? null : scopes.map((s) => s.value).filter(allowed)
  return value.filter(allowed)
}

export type ScopePickerProps = {
  /** Every scope a grant can hold, in the order to list them. */
  scopes: readonly ScopeOption[]
  /** The picked scopes; `null` is all, including ones added later (only with `allowAll`). */
  value: readonly string[] | null
  onValueChange: (value: string[] | null) => void
  /** The scopes the viewer holds and so may grant; the rest show disabled with the reason. Default: all of `scopes`. */
  allowedScopes?: readonly string[]
  /** Offer "all, including ones added later" beside "only these". */
  allowAll?: boolean
  legend: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Words for a resource's heading ("devices" → "Devices"). Default: the resource as written. */
  resourceLabels?: Record<string, string>
  disabled?: boolean
  locale?: string
  labels?: Partial<ScopePickerLabels>
  className?: string
}

/**
 * Permission scopes to grant, grouped by resource and bounded by what the viewer holds: a scope outside
 * `allowedScopes` is listed, disabled, with the reason. With `allowAll`, "all, including ones added later" is a choice
 * of its own, never the same as ticking every box today.
 */
export function ScopePicker({
  scopes,
  value,
  onValueChange,
  allowedScopes,
  allowAll = false,
  legend,
  hint,
  error,
  resourceLabels,
  disabled,
  locale,
  labels,
  className,
}: ScopePickerProps) {
  const l = { ...defaultScopePickerLabels, ...labels }
  const allowed = (v: string) => !allowedScopes || allowedScopes.includes(v)
  const allAllowed = scopes.every((s) => allowed(s.value))
  const all = allowAll && value === null
  // The list a person ticked survives a trip to "all" and back.
  const [kept, setKept] = React.useState<string[]>(() => (value ? [...value] : []))
  const picked = value ?? kept
  const set = (next: string[]) => {
    setKept(next)
    onValueChange(next)
  }
  const toggle = (v: string, on: boolean) => set(on ? [...picked.filter((x) => x !== v), v] : picked.filter((x) => x !== v))

  const list = (
    <div data-slot="scope-picker-list" className="flex flex-col gap-3">
      {groupScopes(scopes).map(({ resource, items }) => {
        const open = items.filter((s) => allowed(s.value))
        const on = open.filter((s) => picked.includes(s.value)).length
        const name = resourceLabels?.[resource] ?? resource
        return (
          <fieldset key={resource} data-slot="scope-picker-group" className="flex min-w-0 flex-col">
            <legend className="sr-only">{name}</legend>
            <ChoiceField
              className="border-b border-border"
              label={<span className="font-medium">{name}</span>}
              trailing={`${formatCount(items.filter((s) => picked.includes(s.value)).length, { locale })}/${formatCount(items.length, { locale })}`}
              control={
                <Checkbox
                  aria-label={l.group(name)}
                  disabled={disabled || open.length === 0}
                  checked={on === 0 ? false : on === open.length ? true : "indeterminate"}
                  onCheckedChange={() => {
                    const values = open.map((s) => s.value)
                    set(on === open.length ? picked.filter((x) => !values.includes(x)) : [...picked.filter((x) => !values.includes(x)), ...values])
                  }}
                />
              }
            />
            <div className="flex flex-col pl-8">
              {items.map((s) => (
                <ChoiceField
                  key={s.value}
                  label={s.label ?? <Code>{s.value}</Code>}
                  description={allowed(s.value) ? s.description : l.outside}
                  control={
                    <Checkbox
                      data-scope={s.value}
                      // An out-of-bound scope keeps whatever it had: it can be neither given nor taken from here.
                      disabled={disabled || !allowed(s.value)}
                      checked={picked.includes(s.value)}
                      onCheckedChange={(c) => toggle(s.value, c === true)}
                    />
                  }
                />
              ))}
            </div>
          </fieldset>
        )
      })}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {picked.length === 0 ? l.none : l.selected(picked.length, formatCount(picked.length, { locale }))}
      </p>
    </div>
  )

  return (
    <FieldSet legend={legend} hint={hint} error={error} className={cn("gap-2", className)}>
      <div data-slot="scope-picker" className="flex flex-col gap-2">
        {allowAll && (
          <RadioGroup
            value={all ? "all" : "some"}
            disabled={disabled}
            onValueChange={(v) => onValueChange(v === "all" ? null : kept)}
            className="gap-0"
          >
            <ChoiceField
              label={l.all}
              description={allAllowed ? l.allHint : l.allAbove}
              control={<RadioGroupItem value="all" disabled={!allAllowed} />}
            />
            <ChoiceField label={l.some} description={l.someHint} control={<RadioGroupItem value="some" />} />
          </RadioGroup>
        )}
        {!all && list}
      </div>
    </FieldSet>
  )
}
