// @syncrobotic/date-selector v0.17.2 · update: npx shadcn add @syncrobotic/date-selector --overwrite
"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { CalendarDays, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/registry/syncrobotic/ui/calendar"
import { useField } from "@/registry/syncrobotic/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"

export type { DateRange }
export type DatePreset<T> = { label: string; value: () => T }

const trigger =
  "press flex h-(--h-md) w-full min-w-0 items-center gap-2 rounded-sm bg-card px-3 text-left text-base ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard) aria-invalid:ring-2 aria-invalid:ring-danger disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground data-[empty=true]:text-muted-foreground"

type Common = {
  placeholder?: string
  /** date-fns pattern for the trigger. */
  displayFormat?: string
  disabled?: boolean
  /** Days that cannot be picked, in react-day-picker's matcher form, e.g. `{ before: new Date() }`. */
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
  /** Shows an × to clear the value. */
  clearable?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

/**
 * A field that opens a calendar to pick one day. The trigger reads like an input and shows the day in words; inside a
 * Field it takes the field's label, note and error. Presets (Today, Tomorrow) sit beside the calendar when given.
 */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a day",
  displayFormat = "d MMM yyyy",
  presets,
  disabled,
  disabledDays,
  clearable,
  className,
  ...rest
}: Common & { value?: Date; onValueChange?: (d: Date | undefined) => void; presets?: DatePreset<Date>[] }) {
  const [open, setOpen] = React.useState(false)
  const pick = (d: Date | undefined) => {
    onValueChange?.(d)
    if (d) setOpen(false)
  }
  return (
    <Picker
      open={open}
      setOpen={setOpen}
      label={value ? format(value, displayFormat) : placeholder}
      empty={!value}
      disabled={disabled}
      onClear={clearable ? () => onValueChange?.(undefined) : undefined}
      className={className}
      {...rest}
    >
      {presets && <Presets presets={presets} active={(p) => !!value && isSameDay(p.value(), value)} onPick={(p) => pick(p.value())} />}
      <Calendar mode="single" selected={value} onSelect={pick} defaultMonth={value} disabled={disabledDays} autoFocus />
    </Picker>
  )
}

/** A field that opens a calendar for a from–to range, two months wide on larger screens, with optional presets. */
export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Pick a range",
  displayFormat = "d MMM yyyy",
  presets,
  numberOfMonths = 2,
  disabled,
  disabledDays,
  clearable,
  className,
  ...rest
}: Common & { value?: DateRange; onValueChange?: (r: DateRange | undefined) => void; presets?: DatePreset<DateRange>[]; numberOfMonths?: number }) {
  const [open, setOpen] = React.useState(false)
  const text = value?.from
    ? value.to
      ? `${format(value.from, displayFormat)} – ${format(value.to, displayFormat)}`
      : format(value.from, displayFormat)
    : placeholder
  return (
    <Picker
      open={open}
      setOpen={setOpen}
      label={text}
      empty={!value?.from}
      disabled={disabled}
      onClear={clearable ? () => onValueChange?.(undefined) : undefined}
      className={className}
      {...rest}
    >
      {presets && (
        <Presets
          presets={presets}
          active={(p) => {
            const r = p.value()
            return !!(value?.from && value.to && r.from && r.to && isSameDay(r.from, value.from) && isSameDay(r.to, value.to))
          }}
          onPick={(p) => {
            onValueChange?.(p.value())
            setOpen(false)
          }}
        />
      )}
      <Calendar
        mode="range"
        selected={value}
        onSelect={onValueChange}
        numberOfMonths={numberOfMonths}
        defaultMonth={value?.from}
        disabled={disabledDays}
        autoFocus
      />
    </Picker>
  )
}

function Picker({
  open,
  setOpen,
  label,
  empty,
  disabled,
  onClear,
  className,
  children,
  id,
  "aria-label": ariaLabel,
}: {
  open: boolean
  setOpen: (o: boolean) => void
  label: string
  empty: boolean
  disabled?: boolean
  onClear?: () => void
  className?: string
  children: React.ReactNode
  id?: string
  "aria-label"?: string
}) {
  const field = useField()
  const uid = React.useId()
  const triggerId = id ?? field?.id ?? `${uid}-t`
  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={triggerId}
            // The name is the label followed by the shown value, so it contains what is on screen (WCAG 2.5.3).
            aria-labelledby={ariaLabel ? `${uid}-l ${uid}-v` : undefined}
            aria-describedby={field?.describedBy}
            aria-invalid={field?.invalid || undefined}
            data-empty={empty}
            disabled={disabled}
            className={cn(trigger, onClear && "pr-(--h-md)")}
          >
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            {ariaLabel && (
              <span id={`${uid}-l`} className="sr-only">
                {ariaLabel}
              </span>
            )}
            <span id={`${uid}-v`} className="truncate">
              {label}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          // The calendar is named by its field, so it is announced as "Start date, dialog" and not as a nameless dialog.
          aria-labelledby={triggerId}
          // On a phone the calendar and its presets can be taller than the space under the field: it scrolls instead of
          // running off the screen, so the last week stays reachable.
          className="flex max-h-(--radix-popover-content-available-height) w-auto flex-col gap-3 overflow-y-auto p-3 sm:flex-row"
        >
          {children}
        </PopoverContent>
      </Popover>
      {onClear && (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          // Always rendered, like Autocomplete's, so it fades in with a value and out when cleared instead of popping;
          // hidden, it is out of the tab order and the accessibility tree.
          aria-hidden={empty || disabled || undefined}
          tabIndex={empty || disabled ? -1 : undefined}
          className={cn(
            "press absolute top-1/2 right-1 flex size-(--h-sm) -translate-y-1/2 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground",
            "transition-[opacity,visibility,background-color,color,scale] duration-(--motion-fast) ease-(--ease-standard)",
            empty || disabled ? "invisible opacity-0" : "visible opacity-100",
          )}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  )
}

function Presets<T>({ presets, active, onPick }: { presets: DatePreset<T>[]; active: (p: DatePreset<T>) => boolean; onPick: (p: DatePreset<T>) => void }) {
  return (
    <div role="group" aria-label="Presets" className="flex gap-1 overflow-x-auto sm:w-36 sm:flex-col sm:border-r sm:border-border sm:pr-3">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          aria-pressed={active(p)}
          onClick={() => onPick(p)}
          className="press flex h-(--h-sm) shrink-0 items-center rounded-xs px-3 text-left text-sm whitespace-nowrap hover:bg-accent aria-pressed:bg-muted aria-pressed:font-medium"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
