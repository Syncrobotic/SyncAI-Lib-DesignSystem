// @syncrobotic/quota-field v0.57.0 · update: npx shadcn add @syncrobotic/quota-field --overwrite
"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { Switch } from "@/registry/syncrobotic/ui/switch"

export type QuotaFieldLabels = {
  unlimited: string
  unlimitedHint: string
  /** The number box's name, after the legend. */
  limit: string
  /** "8 of 10 in use". */
  usedOf: (used: string, limit: string) => string
  /** "8 in use, no limit". */
  usedUnlimited: (used: string) => string
  /** A limit of 0: legal, and not the same as unlimited. */
  zero: string
  /** A limit below what is in use: nothing is taken away, the next one is refused. */
  over: (used: string, limit: string) => string
  decrease: string
  increase: string
}

export const defaultQuotaFieldLabels: QuotaFieldLabels = {
  unlimited: "Unlimited",
  unlimitedHint: "No limit at all. Turn it off to set a number; 0 means none allowed.",
  limit: "Limit",
  usedOf: (used, limit) => `${used} of ${limit} in use`,
  usedUnlimited: (used) => `${used} in use, no limit`,
  zero: "0: nothing new can be added.",
  over: (used, limit) => `${used} in use, above the limit of ${limit}. Nothing is removed; the next one is refused.`,
  decrease: "Decrease",
  increase: "Increase",
}

/** A quota in words: "Unlimited" for null, the number (and unit) otherwise. 0 stays 0. */
export function formatQuota(value: number | null, { unit, locale, labels }: { unit?: string; locale?: string; labels?: Partial<QuotaFieldLabels> } = {}) {
  if (value === null) return labels?.unlimited ?? defaultQuotaFieldLabels.unlimited
  return unit ? `${formatCount(value, { locale })} ${unit}` : formatCount(value, { locale })
}

export type QuotaFieldProps = {
  /** `null` is unlimited; 0 is a limit of none. Never one for the other. */
  value: number | null
  onValueChange: (value: number | null) => void
  legend: string
  hint?: React.ReactNode
  error?: React.ReactNode
  min?: number
  max?: number
  step?: number
  /** Written after the number ("devices"). */
  unit?: string
  /** How many are in use now, from the server: shown against the limit. */
  used?: number
  /** The number a limit starts at when Unlimited is turned off and none was set before. Default `used`, else `min`. */
  initialLimit?: number
  disabled?: boolean
  locale?: string
  labels?: Partial<QuotaFieldLabels>
  className?: string
}

/**
 * A limit that may be unlimited: a switch for Unlimited (`null`) and a number for any limit, 0 included, so a cleared
 * box never has to guess which was meant. Shows how many are in use against it; a limit below that takes nothing away.
 */
export function QuotaField({
  value,
  onValueChange,
  legend,
  hint,
  error,
  min = 0,
  max,
  step = 1,
  unit,
  used,
  initialLimit,
  disabled,
  locale,
  labels,
  className,
}: QuotaFieldProps) {
  const l = { ...defaultQuotaFieldLabels, ...labels }
  const unlimited = value === null
  // The last number survives a trip to Unlimited and back, so toggling twice changes nothing.
  const [kept, setKept] = React.useState<number>(value ?? initialLimit ?? Math.max(min, used ?? min))
  const n = (x: number) => formatCount(x, { locale })
  const over = used !== undefined && value !== null && used > value
  const usage =
    used === undefined ? (value === 0 ? l.zero : null) : value === null ? l.usedUnlimited(n(used)) : over ? l.over(n(used), n(value)) : value === 0 ? l.zero : l.usedOf(n(used), n(value))

  return (
    <FieldSet legend={legend} hint={hint} error={error} className={className}>
      <div data-slot="quota-field" className="flex flex-col gap-2">
        <ChoiceField
          controlAt="end"
          label={l.unlimited}
          description={l.unlimitedHint}
          control={<Switch disabled={disabled} checked={unlimited} onCheckedChange={(on) => onValueChange(on ? null : kept)} />}
        />
        {!unlimited && (
          <NumberField
            aria-label={`${legend}: ${l.limit}`}
            value={value}
            min={min}
            max={max}
            step={step}
            unit={unit}
            disabled={disabled}
            labels={{ decrease: l.decrease, increase: l.increase }}
            onValueChange={(v) => {
              // An emptied box is not unlimited: it keeps the last number until something is typed.
              if (v === null) return
              setKept(v)
              onValueChange(v)
            }}
          />
        )}
        {usage && (
          <p data-slot="quota-field-usage" className={cn("flex items-start gap-2 text-xs tabular-nums", over ? "text-warning" : "text-muted-foreground")}>
            {over && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
            <span>{usage}</span>
          </p>
        )}
      </div>
    </FieldSet>
  )
}
