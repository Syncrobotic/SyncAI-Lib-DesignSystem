// @syncrobotic/form v0.49.0 · update: npx shadcn add @syncrobotic/form --overwrite
"use client"

// A form with React Hook Form and zod, drawn with the kit's Field: an example to copy and change, not a component.
// The kit has no form wrapper. Each control sits in a Controller and a Field (or a FieldSet for a group); Field shows
// the label, the hint and the error and wires aria-invalid and aria-describedby onto the control.
//
// What it does, and the line that does it:
// - Errors wait for the first submit, then follow each change: React Hook Form's defaults (mode "onSubmit").
// - The browser's own bubbles are off: noValidate on the form. Errors are the kit's, in words with an icon.
// - A failed submit focuses the first field in error, in page order: React Hook Form's shouldFocusError, which needs
//   field.ref on something focusable. An Input takes it through {...field}; a Select takes it on its trigger, a group on
//   its first choice.
// - A refusal from the server goes where it belongs: form.setError("name", …) on a field, form.setError("root.server",
//   …) for the whole save, shown above the fields as an Alert.
// - The submit button shows its spinner while onSubmit is awaited: loading={formState.isSubmitting}.
import { Controller, useForm } from "react-hook-form"
// @hookform/resolvers 7 takes a zod 3 schema (zod 3.25 or later) and a zod 4 one through the same zodResolver, so this
// file works unchanged on either: a project already on zod 4 keeps its zod and needs no other import.
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CircleAlert } from "lucide-react"
import { Alert, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

// The messages are the schema's, in the page's language: say how to fix it, not just that it is wrong.
const schema = z.object({
  name: z.string().trim().min(3, "At least 3 characters, e.g. “Night perimeter”"),
  robot: z.string().min(1, "Pick the robot that runs it"),
  repeat: z.enum(["once", "daily", "weekdays"]),
  notes: z.string().max(200, "200 characters at most"),
})
export type MissionValues = z.infer<typeof schema>

const robots = [
  ["7F3A", "Patrol dog 7F3A"],
  ["2B10", "Patrol dog 2B10"],
] as const

/** Create (or, with `defaultValues`, edit) a patrol mission. `onSave` may throw: its message is shown above the fields. */
export function MissionForm({
  defaultValues = { name: "", robot: "", repeat: "daily", notes: "" },
  onSave = async () => {},
}: {
  defaultValues?: MissionValues
  onSave?: (values: MissionValues) => Promise<void>
}) {
  const form = useForm<MissionValues>({ resolver: zodResolver(schema), defaultValues })
  const serverError = form.formState.errors.root?.server?.message

  async function submit(values: MissionValues) {
    try {
      await onSave(values)
    } catch (e) {
      form.setError("root.server", { message: e instanceof Error ? e.message : "Could not save. Your changes are kept; try again." })
    }
  }

  return (
    <form noValidate onSubmit={(e) => void form.handleSubmit(submit)(e)} className="flex w-md max-w-full flex-col gap-6">
      {serverError && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{serverError}</AlertTitle>
        </Alert>
      )}

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="Mission name" hint="Shown in the schedule and on the island." error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" />
          </Field>
        )}
      />

      <Controller
        name="robot"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="Robot" error={fieldState.error?.message}>
            <Select name={field.name} value={field.value} onValueChange={field.onChange}>
              {/* The trigger takes field.ref, so a failed submit can focus it. */}
              <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                <SelectValue placeholder="Choose a robot" />
              </SelectTrigger>
              <SelectContent>
                {robots.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="repeat"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet legend="Repeat" error={fieldState.error?.message}>
            <RadioGroup name={field.name} value={field.value} onValueChange={field.onChange}>
              {/* The group's first choice takes field.ref. */}
              <ChoiceField label="Once" control={<RadioGroupItem ref={field.ref} value="once" />} />
              <ChoiceField label="Every day" control={<RadioGroupItem value="daily" />} />
              <ChoiceField label="Weekdays" control={<RadioGroupItem value="weekdays" />} />
            </RadioGroup>
          </FieldSet>
        )}
      />

      <Controller
        name="notes"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="Notes" hint="Optional. Operators see this before the mission starts." error={fieldState.error?.message}>
            <Textarea {...field} />
          </Field>
        )}
      />

      <div className="flex flex-wrap gap-3">
        {/* Name the result, not the mechanism. The spinner shows, and a second press is blocked, until the save settles. */}
        <Button type="submit" loading={form.formState.isSubmitting}>
          Create mission
        </Button>
        <Button type="button" variant="ghost" onClick={() => form.reset(defaultValues)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
