import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Field } from "@/registry/syncrobotic/ui/field"
import { TimeInput, TimePicker } from "@/registry/syncrobotic/ui/time-picker"

const meta: Meta = { title: "Inputs/Time picker" }
export default meta
type S = StoryObj

export const TimePickerSlots: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>("22:00")
    return <TimePicker value={t} onValueChange={setT} aria-label="Patrol starts" />
  },
}

export const TimePickerQuarterHours: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>()
    return (
      <Field label="Charging window starts" hint="Every 15 minutes.">
        <TimePicker value={t} onValueChange={setT} step={15} />
      </Field>
    )
  },
}

export const TimePickerOpeningHours: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>()
    return (
      <Field label="Lift maintenance" hint="The building allows lift work 08:00 to 17:00. Taken slots are struck through.">
        <TimePicker value={t} onValueChange={setT} min="08:00" max="17:00" step={60} unavailable={["10:00", "13:00", "14:00"]} />
      </Field>
    )
  },
}

export const TimePickerTwelveHour: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>("21:30")
    return <TimePicker value={t} onValueChange={setT} hour12 aria-label="Quiet hours start" />
  },
}

export const TimeInputTyped: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>("09:30")
    return (
      <Field label="Report sent at" hint='Type "930", "9:30" or "21.30".'>
        <TimeInput value={t} onValueChange={setT} />
      </Field>
    )
  },
}

export const TimeInputRange: S = {
  render: function T() {
    const [from, setFrom] = React.useState<string | undefined>("22:00")
    const [to, setTo] = React.useState<string | undefined>("06:00")
    return (
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="pb-2 text-sm font-medium">Night patrol</legend>
        <div className="flex items-center gap-2">
          <TimeInput value={from} onValueChange={setFrom} aria-label="From" className="min-w-0 flex-1" />
          <span className="text-muted-foreground">–</span>
          <TimeInput value={to} onValueChange={setTo} aria-label="To" className="min-w-0 flex-1" />
        </div>
        <p className="text-xs text-muted-foreground">Ends the next morning.</p>
      </fieldset>
    )
  },
}

export const TimeInputBounded: S = {
  render: function T() {
    const [t, setT] = React.useState<string | undefined>()
    return (
      <Field label="Delivery time" hint="Between 07:00 and 19:00. Anything else is marked invalid.">
        <TimeInput value={t} onValueChange={setT} min="07:00" max="19:00" />
      </Field>
    )
  },
}
