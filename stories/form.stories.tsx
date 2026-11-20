import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CircleAlert } from "lucide-react"
import { MissionForm } from "@/registry/syncrobotic/examples/form"
import { Alert, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Switch } from "@/registry/syncrobotic/ui/switch"

const meta: Meta = { title: "Inputs/Form" }
export default meta
type S = StoryObj

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ---------- Create: the installable example (npx shadcn add @syncrobotic/form) ----------

export const FormCreate: S = { render: () => <MissionForm onSave={() => wait(600)} /> }

// ---------- What the server says: one field's error, and the whole form's ----------

const robotName = z.object({ name: z.string().trim().min(1, "Give the robot a name") })

function RenameRobot() {
  const form = useForm<z.infer<typeof robotName>>({ resolver: zodResolver(robotName), defaultValues: { name: "Patrol dog 7F3A" } })
  const serverError = form.formState.errors.root?.server?.message
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async ({ name }) => {
        await wait(500)
        // A refusal that belongs to one field goes on that field; one that does not goes on the form.
        if (/2b10/i.test(name)) form.setError("name", { message: "Another robot is already called “Patrol dog 2B10”" })
        else form.setError("root.server", { message: "Could not save: the fleet server did not answer. Your change is kept; try again." })
      })}
      className="flex w-md max-w-full flex-col gap-6"
    >
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
          <Field label="Robot name" hint="Try “Patrol dog 2B10” for a name that is taken." error={fieldState.error?.message}>
            <Input {...field} />
          </Field>
        )}
      />
      <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
        Rename robot
      </Button>
    </form>
  )
}

export const FormServerErrors: S = { render: () => <RenameRobot /> }

// ---------- A group with a rule across its choices, and a switch ----------

const alerts = z.object({
  channels: z.array(z.string()).min(1, "Choose at least one way to be told"),
  quiet: z.boolean(),
})
type Alerts = z.infer<typeof alerts>
const channels = [
  ["island", "On the island", "Over the app, while it is open"],
  ["email", "Email", "To the address on your account"],
  ["sms", "Text message", "For stops and faults only"],
] as const

function AlertChannels() {
  const form = useForm<Alerts>({ resolver: zodResolver(alerts), defaultValues: { channels: [], quiet: true } })
  return (
    <form noValidate onSubmit={form.handleSubmit(() => wait(400))} className="flex w-md max-w-full flex-col gap-6">
      <Controller
        name="channels"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet legend="Tell me about stops and faults" error={fieldState.error?.message}>
            {channels.map(([value, label, description], i) => (
              <ChoiceField
                key={value}
                label={label}
                description={description}
                control={
                  <Checkbox
                    // The first choice takes field.ref, so a failed submit lands on the group.
                    ref={i === 0 ? field.ref : undefined}
                    checked={field.value.includes(value)}
                    onCheckedChange={(on) => field.onChange(on ? [...field.value, value] : field.value.filter((v) => v !== value))}
                  />
                }
              />
            ))}
          </FieldSet>
        )}
      />
      <Controller
        name="quiet"
        control={form.control}
        render={({ field }) => (
          <FieldSet legend="Quiet hours">
            <ChoiceField
              label="No texts from 22:00 to 07:00"
              description="Stops still come through."
              controlAt="end"
              control={<Switch ref={field.ref} checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FieldSet>
        )}
      />
      <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
        Save alerts
      </Button>
    </form>
  )
}

export const FormChoices: S = { render: () => <AlertChannels /> }

// ---------- Edit: start from saved values, put them back ----------

const site = z.object({
  name: z.string().trim().min(2, "At least 2 characters"),
  speed: z.coerce.number({ invalid_type_error: "A number, in metres per second" }).min(0.2, "At least 0.2 m/s").max(1.5, "At most 1.5 m/s indoors"),
})
type Site = z.infer<typeof site>

function EditSite() {
  const saved: Site = { name: "Taoyuan plant", speed: 0.8 }
  const form = useForm<Site>({ resolver: zodResolver(site), defaultValues: saved })
  return (
    <form noValidate onSubmit={form.handleSubmit(async (v) => (await wait(500), form.reset(v)))} className="flex w-md max-w-full flex-col gap-6">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="Site name" error={fieldState.error?.message}>
            <Input {...field} />
          </Field>
        )}
      />
      <Controller
        name="speed"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="Top speed" hint="Metres per second, 0.2 to 1.5." error={fieldState.error?.message}>
            <Input {...field} inputMode="decimal" className="w-32" />
          </Field>
        )}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={form.formState.isSubmitting}>
          Save site
        </Button>
        {/* Undo is offered only once there is something to undo. */}
        {form.formState.isDirty && (
          <Button type="button" variant="ghost" onClick={() => form.reset(saved)}>
            Undo changes
          </Button>
        )}
      </div>
    </form>
  )
}

export const FormEdit: S = { render: () => <EditSite /> }

// ---------- In Traditional Chinese: the messages are the schema's, the rest is the kit's ----------

const zh = z.object({
  name: z.string().trim().min(2, "至少 2 個字，例如「夜間巡邏」"),
  robot: z.string().min(1, "請選擇執行任務的機器人"),
})

function CreateMissionZh() {
  const form = useForm<z.infer<typeof zh>>({ resolver: zodResolver(zh), defaultValues: { name: "", robot: "" } })
  return (
    <form lang="zh-Hant" noValidate onSubmit={form.handleSubmit(() => wait(500))} className="flex w-md max-w-full flex-col gap-6">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="任務名稱" hint="顯示在排程與狀態列上。" error={fieldState.error?.message}>
            <Input {...field} autoComplete="off" />
          </Field>
        )}
      />
      <Controller
        name="robot"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field label="機器人" error={fieldState.error?.message}>
            <Select name={field.name} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                <SelectValue placeholder="選擇機器人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7F3A">巡邏犬 7F3A</SelectItem>
                <SelectItem value="2B10">巡邏犬 2B10</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
        建立任務
      </Button>
    </form>
  )
}

export const FormTraditionalChinese: S = { render: () => <CreateMissionZh /> }
