import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/registry/syncrobotic/ui/calendar"

const meta: Meta = { title: "Inputs/Calendar" }
export default meta
type S = StoryObj

// A fixed day keeps examples and screenshots stable.
const day = new Date(2026, 10, 17)

export const CalendarSingle: S = {
  render: function Single() {
    const [d, setD] = React.useState<Date | undefined>(day)
    return <Calendar mode="single" selected={d} onSelect={setD} defaultMonth={day} today={day} className="rounded-md bg-card p-3 ring-1 ring-border" />
  },
}

export const CalendarRange: S = {
  render: function Range() {
    const [r, setR] = React.useState<DateRange | undefined>({ from: day, to: addDays(day, 4) })
    return <Calendar mode="range" selected={r} onSelect={setR} defaultMonth={day} today={day} className="rounded-md bg-card p-3 ring-1 ring-border" />
  },
}

export const CalendarDisabledDays: S = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={day}
      today={day}
      // Past days and weekends are closed for maintenance bookings.
      disabled={[{ before: day }, { dayOfWeek: [0, 6] }]}
      className="rounded-md bg-card p-3 ring-1 ring-border"
    />
  ),
}

export const CalendarMultiple: S = {
  render: function Multiple() {
    const [ds, setDs] = React.useState<Date[] | undefined>([day, addDays(day, 2), addDays(day, 7)])
    return (
      <div className="flex flex-col gap-2">
        <Calendar mode="multiple" selected={ds} onSelect={setDs} defaultMonth={day} today={day} className="rounded-md bg-card p-3 ring-1 ring-border" />
        <p className="text-sm text-muted-foreground">{ds?.length ?? 0} patrol days picked</p>
      </div>
    )
  },
}

export const CalendarWeekNumbers: S = {
  render: () => <Calendar mode="single" defaultMonth={day} today={day} showWeekNumber className="rounded-md bg-card p-3 ring-1 ring-border" />,
}

export const CalendarMonthYearDropdowns: S = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={day}
      today={day}
      captionLayout="dropdown"
      startMonth={new Date(2024, 0)}
      endMonth={new Date(2028, 11)}
      className="rounded-md bg-card p-3 ring-1 ring-border"
    />
  ),
}

export const CalendarTwoMonths: S = {
  render: function Two() {
    const [r, setR] = React.useState<DateRange | undefined>({ from: addDays(day, 10), to: addDays(day, 18) })
    return (
      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={r}
        onSelect={setR}
        defaultMonth={day}
        today={day}
        className="rounded-md bg-card p-3 ring-1 ring-border"
      />
    )
  },
}

export const CalendarWithEvents: S = {
  render: function Events() {
    const events: Record<string, string[]> = {
      [addDays(day, 1).toDateString()]: ["Lidar cleaning · 2B19"],
      [addDays(day, 3).toDateString()]: ["Firmware 4.9 rollout", "Battery swap · 7F3A"],
    }
    const [d, setD] = React.useState<Date | undefined>(addDays(day, 3))
    const list = d ? (events[d.toDateString()] ?? []) : []
    return (
      <div className="flex flex-col gap-3 rounded-md bg-card p-3 ring-1 ring-border">
        <Calendar
          mode="single"
          selected={d}
          onSelect={setD}
          defaultMonth={day}
          today={day}
          modifiers={{ booked: Object.keys(events).map((k) => new Date(k)) }}
          modifiersClassNames={{
            booked: "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
          }}
        />
        <ul className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
          {list.length ? list.map((e) => <li key={e}>{e}</li>) : <li className="text-muted-foreground">No maintenance this day</li>}
        </ul>
      </div>
    )
  },
}
