// @syncrobotic/time-picker v0.10.0 · update: npx shadcn add @syncrobotic/time-picker --overwrite
"use client"

import * as React from "react"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useField } from "@/registry/syncrobotic/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"

/** Times are "HH:mm" strings on a 24-hour clock, the unit operators schedule in; `hour12` only changes how they read. */
export type Time = string

const toMin = (t: Time) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
const fromMin = (m: number): Time => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
export const formatTime = (t: Time, hour12 = false) => {
  if (!hour12) return t
  const [h, m] = t.split(":").map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`
}

/** Reads what a person typed: "930", "9:30", "21.30", "9:30 pm". Returns null when it is not a time. */
export function parseTime(text: string): Time | null {
  const s = text.trim().toLowerCase()
  const m = s.match(/^(\d{1,2})[:.\s]?(\d{2})?\s*(am|pm)?$/)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] ?? 0)
  if (m[3]) {
    if (h < 1 || h > 12) return null
    h = (h % 12) + (m[3] === "pm" ? 12 : 0)
  }
  if (h > 23 || min > 59) return null
  return fromMin(h * 60 + min)
}

const field =
  "flex h-(--h-md) w-full min-w-0 items-center gap-2 rounded-sm bg-card px-3 text-base ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring aria-invalid:ring-2 aria-invalid:ring-danger"

/**
 * A time typed as text, for people who know the time they want. Accepts "930", "9:30", "21.30" or "9:30 pm" and shows
 * it back as the canonical form on blur. Out of range or unreadable input keeps the text and marks the field invalid.
 */
export function TimeInput({
  value,
  onValueChange,
  hour12 = false,
  min,
  max,
  className,
  id,
  "aria-label": ariaLabel,
  disabled,
}: {
  value?: Time
  onValueChange?: (t: Time | undefined) => void
  hour12?: boolean
  min?: Time
  max?: Time
  className?: string
  id?: string
  "aria-label"?: string
  disabled?: boolean
}) {
  const f = useField()
  const [text, setText] = React.useState(value ? formatTime(value, hour12) : "")
  const [bad, setBad] = React.useState(false)
  React.useEffect(() => setText(value ? formatTime(value, hour12) : ""), [value, hour12])
  const commit = () => {
    if (!text.trim()) {
      setBad(false)
      return onValueChange?.(undefined)
    }
    const t = parseTime(text)
    const ok = !!t && (!min || toMin(t) >= toMin(min)) && (!max || toMin(t) <= toMin(max))
    setBad(!ok)
    if (ok) {
      onValueChange?.(t)
      setText(formatTime(t, hour12))
    }
  }
  const invalid = bad || f?.invalid
  return (
    <div className={cn(field, invalid && "ring-2 ring-danger", className)}>
      <Clock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <input
        id={id ?? f?.id}
        aria-label={ariaLabel}
        aria-describedby={f?.describedBy}
        aria-invalid={invalid || undefined}
        inputMode="text"
        autoComplete="off"
        placeholder={hour12 ? "9:30 AM" : "09:30"}
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  )
}

/**
 * A time picked from a list of slots, for a fixed grid of times (every 15 minutes, opening hours). Taken slots stay in
 * the list, disabled and struck through, so people see why a time is missing. The list scrolls to the picked slot.
 */
export function TimePicker({
  value,
  onValueChange,
  step = 30,
  min = "00:00",
  max = "23:59",
  unavailable = [],
  hour12 = false,
  placeholder = "Pick a time",
  className,
  id,
  "aria-label": ariaLabel,
  disabled,
}: {
  value?: Time
  onValueChange?: (t: Time) => void
  /** Minutes between slots. */
  step?: number
  min?: Time
  max?: Time
  /** Slots that exist but cannot be picked. */
  unavailable?: Time[]
  hour12?: boolean
  placeholder?: string
  className?: string
  id?: string
  "aria-label"?: string
  disabled?: boolean
}) {
  const f = useField()
  const uid = React.useId()
  const [open, setOpen] = React.useState(false)
  const slots: Time[] = []
  for (let m = toMin(min); m <= toMin(max); m += step) slots.push(fromMin(m))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id ?? f?.id}
          // Label then shown value, so the name contains what is on screen (WCAG 2.5.3).
          aria-labelledby={ariaLabel ? `${uid}-l ${uid}-v` : undefined}
          aria-describedby={f?.describedBy}
          aria-invalid={f?.invalid || undefined}
          disabled={disabled}
          data-empty={!value}
          className={cn(field, "press text-left data-[empty=true]:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground", className)}
        >
          <Clock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          {ariaLabel && (
            <span id={`${uid}-l`} className="sr-only">
              {ariaLabel}
            </span>
          )}
          <span id={`${uid}-v`} className="truncate tabular-nums">
            {value ? formatTime(value, hour12) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        <div
          role="listbox"
          aria-label={ariaLabel ?? "Times"}
          className="flex max-h-64 flex-col overflow-y-auto"
          ref={(el) => {
            el?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView({ block: "center" })
          }}
        >
          {slots.map((t) => {
            const taken = unavailable.includes(t)
            const selected = t === value
            return (
              <button
                key={t}
                type="button"
                className={cn(
                  "press flex h-(--h-sm) shrink-0 items-center justify-between rounded-sm px-3 text-sm tabular-nums outline-none hover:bg-accent focus-visible:bg-accent",
                  selected && "font-medium",
                  taken && "text-muted-foreground line-through hover:bg-transparent",
                )}
                role="option"
                aria-selected={selected}
                aria-disabled={taken || undefined}
                disabled={taken}
                onClick={() => {
                  onValueChange?.(t)
                  setOpen(false)
                }}
              >
                {formatTime(t, hour12)}
                {selected && <Check aria-hidden="true" className="size-4" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
