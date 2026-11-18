// @syncrobotic/number-field v0.10.0 · update: npx shadcn add @syncrobotic/number-field --overwrite
"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"

type NumberFieldProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step"> & {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  /** Arrow keys and the buttons move by this much; Shift or PageUp/PageDown by `largeStep`. */
  step?: number
  largeStep?: number
  /** Shown inside the edge after the value, and read with it: "2.0 m/s". */
  unit?: string
  labels?: { decrease?: string; increase?: string }
}

const decimalsOf = (n: number) => (String(n).split(".")[1] ?? "").length
const clamp = (n: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, n))

/**
 * A number with a range and a unit: speed limits, battery thresholds, intervals.
 * Type freely; the value is kept in range when you leave the field, never blocked while you type.
 * 44 px buttons for touch; ↑↓ step, Shift+↑↓ and PageUp/PageDown step by largeStep, Home/End go to the limits.
 */
export function NumberField({
  value: controlled,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = step * 10,
  unit,
  labels,
  className,
  disabled,
  onBlur,
  onKeyDown,
  ...props
}: NumberFieldProps) {
  const [inner, setInner] = React.useState<number | null>(defaultValue)
  const value = controlled !== undefined ? controlled : inner
  const decimals = decimalsOf(step)
  const format = (n: number | null) => (n === null ? "" : n.toFixed(decimals))
  const [draft, setDraft] = React.useState(format(value))

  // Follow the value when it changes from outside (or from the buttons) while the user is not typing.
  const typing = React.useRef(false)
  React.useEffect(() => {
    if (!typing.current) setDraft(format(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals])

  const commit = (n: number | null) => {
    const next = n === null ? null : Number(clamp(n, min, max).toFixed(decimals))
    if (controlled === undefined) setInner(next)
    onValueChange?.(next)
    setDraft(format(next))
  }
  const nudge = (by: number) => commit((value ?? min ?? 0) + by)

  return (
    <InputGroup className={cn("w-auto", className)}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={labels?.decrease ?? "Decrease"}
        disabled={disabled || (min !== undefined && value !== null && value <= min)}
        onClick={() => nudge(-step)}
        className="press flex h-full w-(--h-md) shrink-0 items-center justify-center rounded-l-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4"
      >
        <Minus aria-hidden="true" />
      </button>
      <input
        {...props}
        data-slot="input"
        type="text"
        inputMode={decimals ? "decimal" : "numeric"}
        role="spinbutton"
        autoComplete="off"
        disabled={disabled}
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={value === null ? undefined : `${format(value)}${unit ? ` ${unit}` : ""}`}
        value={draft}
        onChange={(e) => {
          typing.current = true
          setDraft(e.target.value)
        }}
        onBlur={(e) => {
          typing.current = false
          const t = draft.trim().replace(",", ".")
          commit(t === "" ? null : Number.isFinite(Number(t)) ? Number(t) : value)
          onBlur?.(e)
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented) return
          const keys: Record<string, () => void> = {
            ArrowUp: () => nudge(e.shiftKey ? largeStep : step),
            ArrowDown: () => nudge(-(e.shiftKey ? largeStep : step)),
            PageUp: () => nudge(largeStep),
            PageDown: () => nudge(-largeStep),
            Home: () => min !== undefined && commit(min),
            End: () => max !== undefined && commit(max),
            Enter: () => {
              typing.current = false
              const t = draft.trim().replace(",", ".")
              commit(t === "" ? null : Number.isFinite(Number(t)) ? Number(t) : value)
            },
          }
          const run = keys[e.key]
          if (!run) return
          e.preventDefault()
          typing.current = false
          run()
        }}
        className="h-full w-full min-w-16 bg-transparent text-center text-base tabular-nums outline-none focus-visible:outline-none"
      />
      {unit && <InputGroupAddon className="pl-0">{unit}</InputGroupAddon>}
      <button
        type="button"
        tabIndex={-1}
        aria-label={labels?.increase ?? "Increase"}
        disabled={disabled || (max !== undefined && value !== null && value >= max)}
        onClick={() => nudge(step)}
        className="press flex h-full w-(--h-md) shrink-0 items-center justify-center rounded-r-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4"
      >
        <Plus aria-hidden="true" />
      </button>
    </InputGroup>
  )
}
