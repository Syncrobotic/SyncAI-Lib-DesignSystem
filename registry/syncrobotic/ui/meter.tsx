// @syncrobotic/meter v0.8.0 · update: npx shadcn add @syncrobotic/meter --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A level within a known range: battery, storage, signal. Neutral while normal; it turns warning below `low` and danger
 * below `critical` (or above `high` / `critical` when `higherIsWorse`), so colour appears only when something is wrong,
 * and the value is always written beside it. role="meter", unlike Progress, which is for work that is under way.
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  critical,
  higherIsWorse = false,
  label,
  unit = "%",
  inline = false,
  className,
}: {
  value: number
  min?: number
  max?: number
  /** Warning from here (below it, or above it when higherIsWorse). */
  low?: number
  /** Danger from here. */
  critical?: number
  higherIsWorse?: boolean
  /** What is measured, e.g. "Battery". Shown above the bar, and read with the value. */
  label: string
  unit?: string
  /** One line for table cells: bar and value, the label only read by screen readers. */
  inline?: boolean
  className?: string
}) {
  const worse = (a: number, b: number) => (higherIsWorse ? a >= b : a < b)
  const tone = critical !== undefined && worse(value, critical) ? "danger" : low !== undefined && worse(value, low) ? "warning" : "normal"
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const text = `${value}${unit === "%" ? " %" : unit ? ` ${unit}` : ""}`
  const bar = (
    <span aria-hidden="true" className={cn("relative block h-2 overflow-hidden rounded-full bg-track", inline ? "w-20" : "w-full")}>
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-(--motion-base) ease-(--ease-standard)",
          tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-muted-foreground",
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  )
  const valueText = (
    <span className={cn("tabular-nums", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : inline ? "text-muted-foreground" : "")}>
      {text}
    </span>
  )
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${text}${tone === "normal" ? "" : tone === "warning" ? ", low" : ", critical"}`}
      data-slot="meter"
      data-tone={tone}
      className={cn(inline ? "flex items-center gap-2 text-sm" : "flex flex-col gap-2", className)}
    >
      {inline ? (
        <>
          {bar}
          {valueText}
        </>
      ) : (
        <>
          <span className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{valueText}</span>
          </span>
          {bar}
        </>
      )}
    </div>
  )
}
