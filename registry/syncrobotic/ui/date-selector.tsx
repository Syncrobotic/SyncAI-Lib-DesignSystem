// @syncrobotic/date-selector v0.32.0 · update: npx shadcn add @syncrobotic/date-selector --overwrite
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
  "press flex h-(--h-md) w-full min-w-0 items-center gap-2 rounded-sm bg-card px-3 text-left text-base ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard) aria-invalid:ring-2 aria-invalid:ring-danger disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:ring-border data-[empty=true]:text-muted-foreground"

export type DatePickerLabels = {
  /** DatePicker's trigger when no day is picked. */
  pickDay: string
  /** DateRangePicker's trigger when no range is picked. */
  pickRange: string
  /** The clear button's name. */
  clear: string
  /** Names the group of presets. */
  presets: string
}

export const defaultDatePickerLabels: DatePickerLabels = {
  pickDay: "Pick a day",
  pickRange: "Pick a range",
  clear: "Clear",
  presets: "Presets",
}

type Common = {
  /** Same as `labels.pickDay` (or `pickRange`), and wins over it. */
  placeholder?: string
  /** date-fns pattern for the trigger. Wins over `locale`. */
  displayFormat?: string
  /**
   * Writes the day on the trigger in this language with Intl ("2026年11月3日" for "zh-TW"), unless `displayFormat` is
   * given. Left out, the trigger reads "3 Nov 2026" as before. The calendar's month and day names follow `calendarLocale`.
   */
  locale?: string
  /** react-day-picker's locale for the calendar's month and day names and its labels: `import { zhTW } from "react-day-picker/locale/zh-TW"`. */
  calendarLocale?: React.ComponentProps<typeof Calendar>["locale"]
  /** The words it says, to translate them. */
  labels?: Partial<DatePickerLabels>
  disabled?: boolean
  /** Days that cannot be picked, in react-day-picker's matcher form, e.g. `{ before: new Date() }`. */
  disabledDays?: React.ComponentProps<typeof Calendar>["disabled"]
  /**
   * The day the calendar marks as today. Left out, the device's today. Give it when the app's today differs (a site in
   * another time zone, a fixed day in a demo or a test), and build presets from the same day, so "Today" and the
   * calendar's today agree.
   */
  today?: Date
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
  placeholder,
  displayFormat,
  locale,
  calendarLocale,
  labels,
  presets,
  disabled,
  disabledDays,
  today,
  clearable,
  className,
  ...rest
}: Common & { value?: Date; onValueChange?: (d: Date | undefined) => void; presets?: DatePreset<Date>[] }) {
  const l = { ...defaultDatePickerLabels, ...labels }
  const show = dayFormatter(displayFormat, locale)
  const [open, setOpen] = React.useState(false)
  const pick = (d: Date | undefined) => {
    onValueChange?.(d)
    if (d) setOpen(false)
  }
  return (
    <Picker
      open={open}
      setOpen={setOpen}
      label={value ? show(value) : (placeholder ?? l.pickDay)}
      empty={!value}
      disabled={disabled}
      onClear={clearable ? () => onValueChange?.(undefined) : undefined}
      clearLabel={l.clear}
      className={className}
      {...rest}
    >
      {presets && (
        <Presets presets={presets} label={l.presets} active={(p) => !!value && isSameDay(p.value(), value)} onPick={(p) => pick(p.value())} />
      )}
      <Calendar mode="single" selected={value} onSelect={pick} defaultMonth={value} disabled={disabledDays} today={today} locale={calendarLocale} autoFocus />
    </Picker>
  )
}

/**
 * A field that opens a calendar for a from–to range, with optional presets. Two months side by side (`numberOfMonths`)
 * from 640 px up; on a phone one month, which fits the screen, and the arrows reach the next.
 */
export function DateRangePicker({
  value,
  onValueChange,
  placeholder,
  displayFormat,
  locale,
  calendarLocale,
  labels,
  presets,
  numberOfMonths = 2,
  disabled,
  disabledDays,
  today,
  clearable,
  className,
  ...rest
}: Common & { value?: DateRange; onValueChange?: (r: DateRange | undefined) => void; presets?: DatePreset<DateRange>[]; numberOfMonths?: number }) {
  const l = { ...defaultDatePickerLabels, ...labels }
  const show = dayFormatter(displayFormat, locale)
  const [open, setOpen] = React.useState(false)
  const wide = useWide()
  const text = value?.from
    ? value.to
      ? rangeText(value.from, value.to, show, displayFormat, locale)
      : show(value.from)
    : (placeholder ?? l.pickRange)
  return (
    <Picker
      open={open}
      setOpen={setOpen}
      label={text}
      empty={!value?.from}
      disabled={disabled}
      onClear={clearable ? () => onValueChange?.(undefined) : undefined}
      clearLabel={l.clear}
      className={className}
      {...rest}
    >
      {presets && (
        <Presets
          presets={presets}
          label={l.presets}
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
        numberOfMonths={wide ? numberOfMonths : 1}
        defaultMonth={value?.from}
        disabled={disabledDays}
        today={today}
        locale={calendarLocale}
        autoFocus
      />
    </Picker>
  )
}

// Two months are 656 px with the presets beside them: wider than a phone. Below Tailwind's sm (640 px) the range picker
// shows one. The calendar renders only once opened, in the browser, so the server's answer is never seen. Without
// matchMedia (an old test environment) it stays wide, as before.
const wideQuery = "(min-width: 40rem)"
const subscribeWide = (onChange: () => void) => {
  const m = typeof window.matchMedia === "function" ? window.matchMedia(wideQuery) : null
  m?.addEventListener("change", onChange)
  return () => m?.removeEventListener("change", onChange)
}
const useWide = () =>
  React.useSyncExternalStore(
    subscribeWide,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(wideQuery).matches : true),
    () => true,
  )

/** The trigger's words for a day: the date-fns pattern if one is given, else Intl in `locale`, else "3 Nov 2026". */
function dayFormatter(displayFormat: string | undefined, locale: string | undefined) {
  if (displayFormat || !locale) return (d: Date) => format(d, displayFormat ?? "d MMM yyyy")
  const f = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" })
  return (d: Date) => f.format(d)
}

/** A range as the language writes it (Intl's formatRange) when only `locale` is given; "3 Nov 2026 – 5 Nov 2026" otherwise. */
function rangeText(from: Date, to: Date, show: (d: Date) => string, displayFormat: string | undefined, locale: string | undefined) {
  if (!displayFormat && locale) return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).formatRange(from, to)
  return `${show(from)} – ${show(to)}`
}

function Picker({
  open,
  setOpen,
  label,
  empty,
  disabled,
  onClear,
  clearLabel,
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
  clearLabel: string
  className?: string
  children: React.ReactNode
  id?: string
  "aria-label"?: string
}) {
  const field = useField()
  const uid = React.useId()
  const triggerId = id ?? field?.id ?? `${uid}-t`
  return (
    <div data-slot="date-selector" className={cn("relative w-full", className)}>
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
        <button data-slot="date-selector-clear"
          type="button"
          aria-label={clearLabel}
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

function Presets<T>({
  presets,
  label,
  active,
  onPick,
}: {
  presets: DatePreset<T>[]
  label: string
  active: (p: DatePreset<T>) => boolean
  onPick: (p: DatePreset<T>) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 overflow-x-auto sm:w-36 sm:flex-col sm:border-r sm:border-border sm:pr-3">
      {presets.map((p) => (
        <button data-slot="date-selector-preset"
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
