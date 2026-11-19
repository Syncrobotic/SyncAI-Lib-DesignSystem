// @syncrobotic/record-form v0.8.0 · update: npx shadcn add @syncrobotic/record-form --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Label } from "@/registry/syncrobotic/ui/label"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { TimeInput } from "@/registry/syncrobotic/ui/time-picker"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"

type Errors = Partial<Record<"name" | "robot" | "start", string>>

/**
 * Create a record (here: a patrol mission). One column, labels above fields, errors in the hint line on submit,
 * the primary action names the result. Works as an edit form by passing initial values.
 */
export function RecordForm({ initial }: { initial?: { name: string; robot: string; repeat: string; start: string; notes: string } }) {
  const [name, setName] = React.useState(initial?.name ?? "")
  const [robot, setRobot] = React.useState(initial?.robot ?? "")
  const [repeat, setRepeat] = React.useState(initial?.repeat ?? "daily")
  const [start, setStart] = React.useState(initial?.start ?? "22:00")
  const [notes, setNotes] = React.useState(initial?.notes ?? "")
  const [errors, setErrors] = React.useState<Errors>({})
  const [saving, setSaving] = React.useState(false)
  const form = React.useRef<HTMLFormElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (name.trim().length < 3) next.name = "At least 3 characters, e.g. “Night perimeter”"
    if (!robot) next.robot = "Pick the robot that runs it"
    if (!start) next.start = "Pick a start time"
    setErrors(next)
    if (Object.keys(next).length) {
      // Take the user to the first problem once the errors have rendered.
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setSaving(true)
    window.setTimeout(() => {
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
      user={{ name: "Mei Lin", initials: "ML" }}
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

        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium">Repeat</legend>
          <RadioGroup value={repeat} onValueChange={setRepeat} className="flex flex-col gap-1">
            {[
              ["once", "Once"],
              ["daily", "Every day"],
              ["weekdays", "Weekdays"],
            ].map(([v, l]) => (
              <div key={v} className="flex min-h-(--h-md) items-center gap-3">
                <RadioGroupItem id={`repeat-${v}`} value={v} />
                <Label htmlFor={`repeat-${v}`} className="font-normal">
                  {l}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

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
