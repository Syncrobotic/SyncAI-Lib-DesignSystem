import type { Meta, StoryObj } from "@storybook/react"
import { Search } from "lucide-react"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Label } from "@/registry/syncrobotic/ui/label"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
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
    <Select defaultValue="perimeter">
      <Field label="Patrol route">
        <SelectTrigger>
          <SelectValue placeholder="Choose a route" />
        </SelectTrigger>
      </Field>
        <SelectContent>
          <SelectItem value="perimeter">Perimeter</SelectItem>
          <SelectItem value="parking">Parking lot</SelectItem>
          <SelectItem value="warehouse">Warehouse aisles</SelectItem>
        </SelectContent>
    </Select>
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

export const InputWithIcon: S = {
  render: () => (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" placeholder="Search robots, sites or events" aria-label="Search" className="pl-8" />
    </div>
  ),
}

export const InputWithUnit: S = {
  render: () => (
    <div className="flex items-start gap-2">
      <Field label="Patrol interval (minutes)" hint="Between 15 and 240">
        <Input type="number" defaultValue={120} min={15} max={240} className="w-28" />
      </Field>
    </div>
  ),
}

export const TextareaWithError: S = {
  render: () => (
    <Field label="Reason for override" error="Explain why, so the next shift knows. At least 10 characters">
      <Textarea defaultValue="Test" />
    </Field>
  ),
}

export const LabelWithControls: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="site-name">Site name</Label>
        <Input id="site-name" defaultValue="Taipei warehouse" />
      </div>
      <div className="flex min-h-(--h-md) items-center gap-3">
        <Checkbox id="notify" defaultChecked />
        <Label htmlFor="notify">Notify me when a patrol ends</Label>
      </div>
    </div>
  ),
}

export const FieldStates: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Field label="Dock name" hint="Visible on the map">
        <Input defaultValue="Dock A" />
      </Field>
      <Field label="Dock ID" error="This ID is already used by Dock B">
        <Input defaultValue="D-01" />
      </Field>
    </div>
  ),
}

export const CheckboxWithDescription: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { id: "cd1", t: "Record thermal video", d: "Uses about 2 GB per hour of patrol.", c: true },
        { id: "cd2", t: "Share live view with security desk", d: "Desk operators can watch but not control." },
        { id: "cd3", t: "Allow remote override", d: "Admins only.", disabled: true },
      ].map((o) => (
        <div key={o.id} className="flex gap-3">
          <Checkbox id={o.id} defaultChecked={o.c} disabled={o.disabled} className="mt-0.5" aria-describedby={`${o.id}-d`} />
          <div className="flex flex-col gap-1">
            <Label htmlFor={o.id}>{o.t}</Label>
            <p id={`${o.id}-d`} className="text-xs text-muted-foreground">
              {o.d}
            </p>
          </div>
        </div>
      ))}
    </div>
  ),
}

export const RadioGroupCards: S = {
  render: () => (
    <RadioGroup defaultValue="balanced" aria-label="Patrol mode" className="gap-2">
      {[
        { v: "quiet", t: "Quiet", d: "Slower, quieter gait. For offices at night." },
        { v: "balanced", t: "Balanced", d: "Default speed and battery use." },
        { v: "fast", t: "Fast", d: "Covers more ground; about 30% shorter battery life." },
      ].map((o) => (
        <Label
          key={o.v}
          htmlFor={`m-${o.v}`}
          className="flex items-start gap-3 rounded-md bg-card p-4 font-normal ring-1 ring-border has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary"
        >
          <RadioGroupItem value={o.v} id={`m-${o.v}`} className="mt-0.5" />
          <span className="flex flex-col gap-1">
            <span className="font-medium">{o.t}</span>
            <span className="text-xs text-muted-foreground">{o.d}</span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  ),
}

export const SwitchSettingsList: S = {
  render: () => (
    <div className="flex flex-col rounded-md bg-card px-4 ring-1 ring-border">
      {[
        { id: "ss1", t: "Auto-return at 20% battery", d: "Recommended", on: true },
        { id: "ss2", t: "Patrol during rain", d: "IP67, but slower on wet ground" },
        { id: "ss3", t: "Night lights", d: "Turns on below 10 lux", on: true },
      ].map((x) => (
        <div key={x.id} className="flex min-h-(--h-row) items-center justify-between gap-4 border-b border-border py-2 last:border-b-0">
          <span className="flex flex-col">
            <Label htmlFor={x.id}>{x.t}</Label>
            <span className="text-xs text-muted-foreground">{x.d}</span>
          </span>
          <Switch id={x.id} defaultChecked={x.on} />
        </div>
      ))}
    </div>
  ),
}

export const SelectGrouped: S = {
  render: () => (
    <Select>
      <Field label="Assign to robot" hint="Only robots on this site are listed">
        <SelectTrigger>
          <SelectValue placeholder="Choose a robot" />
        </SelectTrigger>
      </Field>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Available</SelectLabel>
          <SelectItem value="7F3A">Patrol dog 7F3A</SelectItem>
          <SelectItem value="2B10">Patrol dog 2B10</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Busy</SelectLabel>
          <SelectItem value="9C44" disabled>
            Patrol dog 9C44 · charging
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const SelectStates: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Select disabled>
        <Field label="Site" hint="Locked while a patrol is running">
          <SelectTrigger>
            <SelectValue placeholder="North campus" />
          </SelectTrigger>
        </Field>
        <SelectContent>
          <SelectItem value="n">North campus</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <Field label="Return dock" error="Choose a dock before starting">
          <SelectTrigger>
            <SelectValue placeholder="Choose a dock" />
          </SelectTrigger>
        </Field>
        <SelectContent>
          <SelectItem value="a">Dock A</SelectItem>
          <SelectItem value="b">Dock B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const SliderDisabled: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Label>Speaker volume · 40% (muted at night)</Label>
      <Slider defaultValue={[40]} disabled aria-label="Speaker volume" />
    </div>
  ),
}
