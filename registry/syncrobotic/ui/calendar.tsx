// @syncrobotic/calendar v0.9.0 · update: npx shadcn add @syncrobotic/calendar --overwrite
"use client"

import * as React from "react"
import { DateLib, DayPicker, type DayButtonProps, type Modifiers } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A month grid for picking a day, several days or a range (react-day-picker). Days are 36 px with a mouse and 44 px on
 * touch, like every compact control. The picked day is inverted, today is bold with a ring, a range fills between its
 * ends with the muted surface. Weeks start on Monday unless `weekStartsOn` says otherwise.
 */
// Spoken name of a day button. It starts with the day number shown on the button ("26 October 2026, Monday"), so speech
// input users can say what they see (WCAG 2.5.3); the library's default ("Monday, October 26th") does not contain it.
const labelDayButton = (date: Date, modifiers: Modifiers, options?: ConstructorParameters<typeof DateLib>[0], dateLib?: DateLib) => {
  let label = (dateLib ?? new DateLib(options)).format(date, "d MMMM yyyy, EEEE")
  if (modifiers.today) label = `${label}, today`
  if (modifiers.selected) label = `${label}, selected`
  return label
}

export function Calendar({ className, classNames, showOutsideDays = true, weekStartsOn = 1, labels, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      labels={{ labelDayButton, ...labels }}
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      className={cn("w-fit text-sm", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex h-(--h-sm) items-center justify-center px-8 font-medium",
        caption_label: "text-sm font-medium",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative",
        dropdown: "absolute inset-0 opacity-0",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday: "flex size-(--h-sm) items-center justify-center text-xs font-normal text-muted-foreground",
        week: "mt-1 flex",
        week_number_header: "flex size-(--h-sm) items-center justify-center text-xs text-muted-foreground",
        week_number: "flex size-(--h-sm) items-center justify-center text-xs text-muted-foreground tabular-nums",
        day: "group/day relative size-(--h-sm) p-0 text-center",
        range_start: "rounded-l-xs bg-muted",
        range_middle: "bg-muted",
        range_end: "rounded-r-xs bg-muted",
        today: "",
        outside: "text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />,
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

const navButton =
  "press inline-flex size-(--h-sm) items-center justify-center rounded-sm text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const selectedSingle = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
  return (
    <button
      ref={ref}
      data-day={day.date.toISOString().slice(0, 10)}
      className={cn(
        "press inline-flex size-full items-center justify-center rounded-xs tabular-nums transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
        modifiers.today && "font-bold ring-1 ring-border ring-inset",
        (selectedSingle || modifiers.range_start || modifiers.range_end) && "bg-primary text-primary-foreground ring-0 hover:bg-primary",
        modifiers.range_middle && "rounded-none hover:bg-accent",
        modifiers.disabled && "line-through",
        className,
      )}
      {...props}
    />
  )
}
