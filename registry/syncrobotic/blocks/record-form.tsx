// @syncrobotic/record-form v0.53.0 · update: npx shadcn add @syncrobotic/record-form --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { TimeInput } from "@/registry/syncrobotic/ui/time-picker"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

type Errors = Partial<Record<"name" | "robot" | "start", string>>

// The rules, in one place: say how to fix it, not just that it is wrong.
function validate(v: { name: string; robot: string; start: string }): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 3) e.name = "At least 3 characters, e.g. “Night perimeter”"
  if (!v.robot) e.robot = "Pick the robot that runs it"
  if (!v.start) e.start = "Pick a start time"
  return e
}

/**
 * A form to create or edit a record: one column, labels above fields, errors in the hint line on submit with focus on
 * the first, and a primary action that names the result. Here a patrol mission. Validates like the `form` example
 * without a form library; pass initial values to make it an edit form.
 */
export function RecordForm({ initial }: { initial?: { name: string; robot: string; repeat: string; start: string; notes: string } }) {
  const [name, setName] = React.useState(initial?.name ?? "")
  // The sample's save; cleared on unmount so it never lands on a page that is gone.
  const reply = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(reply.current), [])
  const [robot, setRobot] = React.useState(initial?.robot ?? "")
  const [repeat, setRepeat] = React.useState(initial?.repeat ?? "daily")
  const [start, setStart] = React.useState(initial?.start ?? "22:00")
  const [notes, setNotes] = React.useState(initial?.notes ?? "")
  // Errors are worked out from the values once a submit has been tried, so a fixed field clears as you type.
  const [submitted, setSubmitted] = React.useState(false)
  const errors = submitted ? validate({ name, robot, start }) : {}
  const [saving, setSaving] = React.useState(false)
  const form = React.useRef<HTMLFormElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate({ name, robot, start })).length) {
      // Take the user to the first problem once the errors have rendered.
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setSaving(true)
    reply.current = setTimeout(() => {
      setSaving(false)
      toast({ tone: "success", title: "Mission created", description: `${name} · ${repeat} at ${start}` })
    }, 600)
  }

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#schedule"
      title={initial ? "Edit mission" : "New mission"}
      user={sampleUser}
    >
      <form ref={form} noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-6">
        <Field label="Mission name" error={errors.name} hint="Shown in the schedule and on the island.">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>

        {/* Field labels the Select's trigger and carries its error, like any other control. */}
        <Field label="Robot" error={errors.robot}>
          <Select value={robot} onValueChange={setRobot}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a robot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7F3A">Patrol dog 7F3A</SelectItem>
              <SelectItem value="2B10">Patrol dog 2B10</SelectItem>
              <SelectItem value="1A08">Patrol dog 1A08</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <FieldSet legend="Repeat">
          <RadioGroup value={repeat} onValueChange={setRepeat} className="gap-0">
            {([
              ["once", "Once"],
              ["daily", "Every day"],
              ["weekdays", "Weekdays"],
            ] as const).map(([v, l]) => (
              <ChoiceField key={v} label={l} control={<RadioGroupItem value={v} />} />
            ))}
          </RadioGroup>
        </FieldSet>

        <Field label="Start" error={errors.start}>
          {/* Typed on the kit's 24-hour clock (HH:mm), never the browser's own, which shows "10:00 PM" in an English locale. */}
          <TimeInput value={start || undefined} onValueChange={(t) => setStart(t ?? "")} className="w-40" />
        </Field>

        <Field label="Notes" hint="Optional. Operators see this before the mission starts.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" loading={saving}>
            {initial ? "Save mission" : "Create mission"}
          </Button>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </div>
      </form>
      <Toaster />
    </AppShell>
  )
}
