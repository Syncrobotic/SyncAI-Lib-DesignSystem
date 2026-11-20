import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormField, FormFieldSet, FormMessage, FormSubmit } from "@/registry/syncrobotic/ui/form"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField } from "@/registry/syncrobotic/ui/choice-field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

const meta: Meta = { title: "Inputs/Form" }
export default meta
type S = StoryObj

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------- Create: a schema, every kind of control, focus on the first error ----------

const mission = z.object({
  name: z.string().trim().min(3, "At least 3 characters, e.g. “Night perimeter”"),
  robot: z.string().min(1, "Pick the robot that runs it"),
  repeat: z.enum(["once", "daily", "weekdays"]),
  notes: z.string().max(200, "200 characters at most").optional(),
})
type Mission = z.infer<typeof mission>

function CreateMission() {
  const form = useForm<Mission>({ resolver: zodResolver(mission), defaultValues: { name: "", robot: "", repeat: "daily", notes: "" } })
  const [saved, setSaved] = React.useState<string | null>(null)
  return (
    <Form
      form={form}
      onSubmit={async (v) => {
        await wait(600)
        setSaved(`${v.name} saved`)
      }}
      className="w-md max-w-full"
    >
      <FormField name="name" label="Mission name" hint="Shown in the schedule and on the island." render={({ field }) => <Input {...field} autoComplete="off" />} />
      {/* A Select maps value / onValueChange; its trigger takes the label and the error from Field. */}
      <FormField
        name="robot"
        label="Robot"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger onBlur={field.onBlur}>
              <SelectValue placeholder="Choose a robot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7F3A">Patrol dog 7F3A</SelectItem>
              <SelectItem value="2B10">Patrol dog 2B10</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <FormFieldSet
        name="repeat"
        legend="Repeat"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange}>
            <ChoiceField label="Once" control={<RadioGroupItem value="once" />} />
            <ChoiceField label="Every day" control={<RadioGroupItem value="daily" />} />
            <ChoiceField label="Weekdays" control={<RadioGroupItem value="weekdays" />} />
          </RadioGroup>
        )}
      />
      <FormField name="notes" label="Notes" hint="Optional. Operators see this before the mission starts." render={({ field }) => <Textarea {...field} />} />
      <div className="flex flex-wrap items-center gap-3">
        <FormSubmit>Create mission</FormSubmit>
        {saved && (
          <span role="status" className="text-sm text-muted-foreground">
            {saved}
          </span>
        )}
      </div>
    </Form>
  )
}

export const FormCreate: S = { render: () => <CreateMission /> }

// ---------- What the server says: one field's error, and the whole form's ----------

const robotName = z.object({ name: z.string().trim().min(1, "Give the robot a name") })

function RenameRobot() {
  const form = useForm<z.infer<typeof robotName>>({ resolver: zodResolver(robotName), defaultValues: { name: "Patrol dog 7F3A" } })
  return (
    <Form
      form={form}
      onSubmit={async ({ name }) => {
        await wait(500)
        // A refusal that belongs to one field goes on that field; one that does not goes on the form.
        if (/2b10/i.test(name)) form.setError("name", { message: "Another robot is already called “Patrol dog 2B10”" })
        else form.setError("root.server", { message: "Could not save: the fleet server did not answer. Your change is kept; try again." })
      }}
      className="w-md max-w-full"
    >
      <FormMessage />
      <FormField name="name" label="Robot name" hint="Try “Patrol dog 2B10” for a name that is taken." render={({ field }) => <Input {...field} />} />
      <FormSubmit>Rename robot</FormSubmit>
    </Form>
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
    <Form form={form} onSubmit={() => wait(400)} className="w-md max-w-full">
      <FormFieldSet
        name="channels"
        legend="Tell me about stops and faults"
        render={({ field }) => (
          <>
            {channels.map(([value, label, description]) => (
              <ChoiceField
                key={value}
                label={label}
                description={description}
                control={
                  <Checkbox
                    checked={field.value.includes(value)}
                    onCheckedChange={(on) => field.onChange(on ? [...field.value, value] : field.value.filter((v: string) => v !== value))}
                  />
                }
              />
            ))}
          </>
        )}
      />
      <FormFieldSet
        name="quiet"
        legend="Quiet hours"
        render={({ field }) => (
          <ChoiceField label="No texts from 22:00 to 07:00" description="Stops still come through." controlAt="end" control={<Switch checked={field.value} onCheckedChange={field.onChange} />} />
        )}
      />
      <FormSubmit>Save alerts</FormSubmit>
    </Form>
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
  const { isDirty } = form.formState
  return (
    <Form form={form} onSubmit={async (v) => (await wait(500), form.reset(v))} className="w-md max-w-full">
      <FormField name="name" label="Site name" render={({ field }) => <Input {...field} />} />
      <FormField name="speed" label="Top speed" hint="Metres per second, 0.2 to 1.5." render={({ field }) => <Input {...field} inputMode="decimal" className="w-32" />} />
      <div className="flex flex-wrap gap-3">
        <FormSubmit>Save site</FormSubmit>
        {/* Undo is offered only once there is something to undo. */}
        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => form.reset(saved)}>
            Undo changes
          </Button>
        )}
      </div>
    </Form>
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
    <div lang="zh-Hant" className="w-md max-w-full">
      <Form form={form} onSubmit={() => wait(500)}>
        <FormField name="name" label="任務名稱" hint="顯示在排程與狀態列上。" render={({ field }) => <Input {...field} autoComplete="off" />} />
        <FormField
          name="robot"
          label="機器人"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger onBlur={field.onBlur}>
                <SelectValue placeholder="選擇機器人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7F3A">巡邏犬 7F3A</SelectItem>
                <SelectItem value="2B10">巡邏犬 2B10</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FormSubmit>建立任務</FormSubmit>
      </Form>
    </div>
  )
}

export const FormTraditionalChinese: S = { render: () => <CreateMissionZh /> }
