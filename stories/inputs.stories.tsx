import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Label } from "@/registry/syncrobotic/ui/label"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Slider } from "@/registry/syncrobotic/ui/slider"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

const meta: Meta = { title: "Inputs" }
export default meta
type S = StoryObj

export const InputStates: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Field label="Robot name" hint="Shown on the island and in event logs">
        <Input defaultValue="Patrol dog 7F3A" />
      </Field>
      <Field label="Wi-Fi password" error="At least 8 characters">
        <Input type="password" defaultValue="1234" />
      </Field>
      <Field label="Serial number">
        <Input placeholder="SR-0000-0000" disabled />
      </Field>
    </div>
  ),
}

export const TextareaDefault: S = {
  render: () => (
    <Field label="Shift notes" hint="Visible to every operator on this site">
      <Textarea placeholder="Gate B is closed for maintenance until Friday" />
    </Field>
  ),
}

export const CheckboxDefault: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      {[
        { id: "c1", label: "Record video on patrol", checked: true },
        { id: "c2", label: "Upload over cellular", checked: false },
        { id: "c3", label: "All zones", checked: "indeterminate" as const },
      ].map((c) => (
        <div key={c.id} className="flex min-h-(--h-md) items-center gap-3">
          <Checkbox id={c.id} defaultChecked={c.checked} />
          <Label htmlFor={c.id}>{c.label}</Label>
        </div>
      ))}
    </div>
  ),
}

export const RadioGroupDefault: S = {
  render: () => (
    <RadioGroup defaultValue="return" aria-label="When the battery is low">
      {[
        { v: "return", l: "Return to the dock" },
        { v: "finish", l: "Finish the current route first" },
        { v: "stay", l: "Stay and alert an operator" },
      ].map((o) => (
        <div key={o.v} className="flex min-h-(--h-md) items-center gap-3">
          <RadioGroupItem value={o.v} id={`r-${o.v}`} />
          <Label htmlFor={`r-${o.v}`}>{o.l}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
}

export const SwitchDefault: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      {[
        { id: "s1", label: "Night vision", on: true },
        { id: "s2", label: "Two-way audio", on: false },
        { id: "s3", label: "Obstacle override", on: false, disabled: true },
      ].map((s) => (
        <div key={s.id} className="flex min-h-(--h-md) items-center justify-between gap-3">
          <Label htmlFor={s.id}>{s.label}</Label>
          <Switch id={s.id} defaultChecked={s.on} disabled={s.disabled} />
        </div>
      ))}
    </div>
  ),
}

export const SelectDefault: S = {
  render: () => (
    <Field label="Patrol route">
      <Select defaultValue="perimeter">
        <SelectTrigger>
          <SelectValue placeholder="Choose a route" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="perimeter">Perimeter</SelectItem>
          <SelectItem value="parking">Parking lot</SelectItem>
          <SelectItem value="warehouse">Warehouse aisles</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
}

export const SliderDefault: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Max speed · 1.2 m/s</Label>
        <Slider defaultValue={[60]} aria-label="Max speed" />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Patrol hours · 22:00–06:00</Label>
        <Slider defaultValue={[22, 30]} max={36} aria-label="Patrol hours" />
      </div>
    </div>
  ),
}
