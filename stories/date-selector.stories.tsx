import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { addDays, startOfMonth, subDays } from "date-fns"
import { DatePicker, DateRangePicker, type DateRange } from "@/registry/syncrobotic/ui/date-selector"
import { Field } from "@/registry/syncrobotic/ui/field"

const meta: Meta = { title: "Inputs/Date selector" }
export default meta
type S = StoryObj

const day = new Date(2026, 10, 17)

export const DatePickerDefault: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>()
    return <DatePicker value={d} onValueChange={setD} aria-label="Mission day" />
  },
}

export const DatePickerInField: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>(day)
    return (
      <Field label="Start on" hint="The mission runs from this day.">
        <DatePicker value={d} onValueChange={setD} clearable />
      </Field>
    )
  },
}

export const DatePickerFutureOnly: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>()
    return (
      <Field label="Maintenance day" hint="Past days and weekends are closed.">
        <DatePicker value={d} onValueChange={setD} disabledDays={[{ before: day }, { dayOfWeek: [0, 6] }]} />
      </Field>
    )
  },
}

export const DatePickerPresets: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>(day)
    return (
      <DatePicker
        value={d}
        onValueChange={setD}
        aria-label="Report day"
        presets={[
          { label: "Today", value: () => day },
          { label: "Yesterday", value: () => subDays(day, 1) },
          { label: "A week ago", value: () => subDays(day, 7) },
        ]}
      />
    )
  },
}

export const DatePickerError: S = {
  render: () => (
    <Field label="Licence renewal" error="Pick a day before the licence ends on 19 Nov.">
      <DatePicker value={addDays(day, 10)} />
    </Field>
  ),
}

export const DatePickerDisabled: S = {
  render: () => <DatePicker value={day} disabled aria-label="Created on" />,
}

export const DateRangePickerDefault: S = {
  render: function R() {
    const [r, setR] = React.useState<DateRange | undefined>({ from: subDays(day, 6), to: day })
    return <DateRangePicker value={r} onValueChange={setR} aria-label="Event range" clearable />
  },
}

export const DateRangePickerPresets: S = {
  render: function R() {
    const [r, setR] = React.useState<DateRange | undefined>({ from: subDays(day, 6), to: day })
    return (
      <Field label="Show events from">
        <DateRangePicker
          value={r}
          onValueChange={setR}
          presets={[
            { label: "Today", value: () => ({ from: day, to: day }) },
            { label: "Last 7 days", value: () => ({ from: subDays(day, 6), to: day }) },
            { label: "Last 30 days", value: () => ({ from: subDays(day, 29), to: day }) },
            { label: "This month", value: () => ({ from: startOfMonth(day), to: day }) },
          ]}
        />
      </Field>
    )
  },
}

/** The day in a shorter form, when space is tight. */
export const DatePickerShortFormat: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>(day)
    return <DatePicker value={d} onValueChange={setD} displayFormat="EEE d MMM" aria-label="Patrol day" className="w-44" />
  },
}

/** Weekdays only: weekends are disabled in the calendar. */
export const DatePickerWeekdays: S = {
  render: function D() {
    const [d, setD] = React.useState<Date | undefined>()
    return (
      <Field label="Service visit" hint="Technicians come Monday to Friday.">
        <DatePicker value={d} onValueChange={setD} disabledDays={[{ before: day }, { dayOfWeek: [0, 6] }]} clearable />
      </Field>
    )
  },
}

/** A range in one month, for narrow panels. */
export const DateRangePickerOneMonth: S = {
  render: function R() {
    const [r, setR] = React.useState<DateRange | undefined>({ from: startOfMonth(day), to: day })
    return <DateRangePicker value={r} onValueChange={setR} numberOfMonths={1} aria-label="Report range" />
  },
}

/** A range that is too long, said under the field. */
export const DateRangePickerError: S = {
  render: () => (
    <Field label="Export events" error="Exports cover at most 31 days. Shorten the range.">
      <DateRangePicker value={{ from: subDays(day, 45), to: day }} />
    </Field>
  ),
}
