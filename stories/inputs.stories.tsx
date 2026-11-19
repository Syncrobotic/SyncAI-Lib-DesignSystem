import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Eye, EyeOff, Info, Search, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/registry/syncrobotic/ui/input-group"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { Label } from "@/registry/syncrobotic/ui/label"
import { RadioGroup, RadioGroupItem } from "@/registry/syncrobotic/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Slider } from "@/registry/syncrobotic/ui/slider"
import { Switch } from "@/registry/syncrobotic/ui/switch"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"

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

function SearchWithClear() {
  const [q, setQ] = React.useState("North gate")
  return (
    <InputGroup>
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <Input type="search" aria-label="Search robots" placeholder="Search robots, sites or events" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && (
        <InputGroupButton aria-label="Clear search" onClick={() => setQ("")}>
          <X aria-hidden="true" />
        </InputGroupButton>
      )}
    </InputGroup>
  )
}

export const InputGroupSearch: S = { render: () => <SearchWithClear /> }

function PasswordReveal() {
  const [shown, setShown] = React.useState(false)
  return (
    <Field label="Robot Wi-Fi password">
      <InputGroup>
        <Input type={shown ? "text" : "password"} autoComplete="new-password" defaultValue="patrol-7F3A" />
        <InputGroupButton aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onClick={() => setShown((v) => !v)}>
          {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </InputGroupButton>
      </InputGroup>
    </Field>
  )
}

export const InputGroupPassword: S = { render: () => <PasswordReveal /> }

export const InputGroupUnit: S = {
  render: () => (
    <Field label="Geofence radius" hint="Measured from the dock">
      <InputGroup className="w-48">
        <Input inputMode="numeric" defaultValue="120" />
        <InputGroupAddon>m</InputGroupAddon>
      </InputGroup>
    </Field>
  ),
}

export const NumberFieldSpeed: S = {
  render: () => (
    <Field label="Speed limit" hint="0.2 to 2.0 m/s. Shift+↑↓ moves by 1.0">
      <NumberField defaultValue={1.2} min={0.2} max={2} step={0.1} unit="m/s" className="w-56" />
    </Field>
  ),
}

export const NumberFieldInterval: S = {
  render: () => (
    <Field label="Patrol interval" hint="Between 15 and 240 minutes">
      <NumberField defaultValue={120} min={15} max={240} step={5} largeStep={60} unit="min" className="w-56" />
    </Field>
  ),
}

export const NumberFieldError: S = {
  render: () => (
    <Field label="Return to dock below" error="Must be at least 10 %, or the robot may not reach the dock">
      <NumberField defaultValue={5} min={0} max={50} unit="%" className="w-56" />
    </Field>
  ),
}

function ValidateOnBlur() {
  const [name, setName] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const error = touched && name.trim().length < 3 ? "At least 3 characters, e.g. “Dock A”" : undefined
  return (
    <Field label="Dock name" error={error}>
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
    </Field>
  )
}

// Leave the field empty and press Tab: the message line grows open and the error appears. No shake.
export const InputErrorOnBlur: S = { render: () => <ValidateOnBlur /> }

export const InputError: S = {
  render: () => (
    <Field label="Robot name" error="Already used by another robot on this site">
      <Input defaultValue="Patrol dog 7F3A" />
    </Field>
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

/** Field labels a Select's trigger and carries its hint and error, like any other control. */
export const FieldWithSelect: S = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="Patrol route" hint="Routes for the north site">
        <Select defaultValue="perimeter">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perimeter">Perimeter</SelectItem>
            <SelectItem value="parking">Parking lot</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Return dock" error="Choose a dock before starting">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose a dock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Dock A</SelectItem>
            <SelectItem value="b">Dock B</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
}

/** Checkboxes under one question, each a whole 44 px row with a count at the end. */
export const ChoiceFieldCheckboxes: S = {
  render: () => (
    <FieldSet legend="Status" hint="Show robots in any of these states">
      <ChoiceField label="Patrolling" trailing={5} control={<Checkbox defaultChecked />} />
      <ChoiceField label="Docked" trailing={2} control={<Checkbox />} />
      <ChoiceField label="Offline" trailing={1} control={<Checkbox />} />
    </FieldSet>
  ),
}

/** Switches act at once, so they sit at the end of the row, with a line saying what they do. */
export const ChoiceFieldSwitches: S = {
  render: () => (
    <FieldSet legend="Notifications">
      <ChoiceField label="Critical alarms by SMS" description="Every critical alarm, day and night." controlAt="end" control={<Switch defaultChecked />} />
      <ChoiceField label="Daily summary email" description="Patrols, events and battery health at 08:00." controlAt="end" control={<Switch />} />
    </FieldSet>
  ),
}

export const TextareaWithCount: S = {
  render: function T() {
    const [v, setV] = React.useState("Door 3 sticks on the second push. Robot waits, then retries.")
    return (
      <Field label="Handover note" hint={`${v.length} / 280`}>
        <Textarea value={v} maxLength={280} onChange={(e) => setV(e.target.value)} rows={3} />
      </Field>
    )
  },
}

export const TextareaDisabled: S = {
  render: () => (
    <Field label="Robot's last message">
      <Textarea disabled defaultValue="Stopped: obstacle in path for 30 s at waypoint 14." rows={2} />
    </Field>
  ),
}

export const CheckboxIndeterminate: S = {
  render: function C() {
    const [picked, setPicked] = React.useState(["7f3a"])
    const all = ["7f3a", "9c44", "1a08"]
    const state = picked.length === all.length ? true : picked.length ? "indeterminate" : false
    return (
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex min-h-(--h-md) items-center gap-3 font-medium">
          <Checkbox checked={state} onCheckedChange={(c) => setPicked(c === true ? all : [])} /> All patrol dogs
        </label>
        {all.map((id) => (
          <label key={id} className="flex min-h-(--h-md) items-center gap-3 pl-8">
            <Checkbox checked={picked.includes(id)} onCheckedChange={(c) => setPicked((p) => (c === true ? [...p, id] : p.filter((x) => x !== id)))} />
            {id.toUpperCase()}
          </label>
        ))}
      </div>
    )
  },
}

export const CheckboxDisabled: S = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex min-h-(--h-md) items-center gap-3 text-muted-foreground">
        <Checkbox disabled /> Night vision (not on this model)
      </label>
      <label className="flex min-h-(--h-md) items-center gap-3 text-muted-foreground">
        <Checkbox disabled defaultChecked /> Collision stop (always on)
      </label>
    </div>
  ),
}

export const RadioGroupHorizontal: S = {
  render: () => (
    <RadioGroup defaultValue="normal" aria-label="Speed profile" className="flex flex-row flex-wrap gap-6 text-sm">
      {["Slow", "Normal", "Fast"].map((v) => (
        <label key={v} className="flex min-h-(--h-md) items-center gap-3">
          <RadioGroupItem value={v.toLowerCase()} /> {v}
        </label>
      ))}
    </RadioGroup>
  ),
}

export const RadioGroupDisabledOption: S = {
  render: () => (
    <RadioGroup defaultValue="wifi" aria-label="Uplink" className="text-sm">
      {[
        ["wifi", "Site Wi-Fi", false],
        ["lte", "LTE", false],
        ["sat", "Satellite (not installed)", true],
      ].map(([v, l, d]) => (
        <label key={v as string} className={`flex min-h-(--h-md) items-center gap-3 ${d ? "text-muted-foreground" : ""}`}>
          <RadioGroupItem value={v as string} disabled={d as boolean} /> {l as string}
        </label>
      ))}
    </RadioGroup>
  ),
}

export const SwitchWithDescription: S = {
  render: () => (
    <label className="flex items-start justify-between gap-4 text-sm">
      <span className="flex flex-col gap-1">
        <span className="font-medium">Return to dock under 20 %</span>
        <span className="text-muted-foreground">The robot stops its task and drives home to charge.</span>
      </span>
      <Switch defaultChecked />
    </label>
  ),
}

export const SwitchDisabled: S = {
  render: () => (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex min-h-(--h-md) items-center justify-between gap-4 text-muted-foreground">
        Remote override (admin only) <Switch disabled />
      </label>
      <label className="flex min-h-(--h-md) items-center justify-between gap-4 text-muted-foreground">
        Collision stop (always on) <Switch disabled defaultChecked />
      </label>
    </div>
  ),
}

export const SelectDisabledOption: S = {
  render: () => (
    <Field label="Map layer">
      <Select defaultValue="lidar">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="floor">Floor plan</SelectItem>
          <SelectItem value="lidar">Lidar point cloud</SelectItem>
          <SelectItem value="heat">Heat map</SelectItem>
          <SelectItem value="wifi" disabled>
            Wi-Fi coverage (no survey yet)
          </SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
}

export const SliderSteps: S = {
  render: function Sl() {
    const [v, setV] = React.useState([3])
    const labels = ["Off", "Low", "Medium", "High", "Max"]
    return (
      <div className="flex flex-col gap-2">
        <Label>Headlight · {labels[v[0]]}</Label>
        <Slider value={v} onValueChange={setV} min={0} max={4} step={1} aria-label="Headlight" />
        <div className="flex justify-between text-xs text-muted-foreground">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    )
  },
}

export const SliderVolume: S = {
  render: function Sl() {
    const [v, setV] = React.useState([40])
    return (
      <div className="flex flex-col gap-2">
        <Label>Siren volume · {v[0]} %</Label>
        <Slider value={v} onValueChange={setV} step={5} aria-label="Siren volume" />
      </div>
    )
  },
}

export const LabelRequired: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Label htmlFor="site-name">
        Site name <span className="text-muted-foreground">(required)</span>
      </Label>
      <Input id="site-name" required placeholder="North gate" />
    </div>
  ),
}

export const InputGroupWithButton: S = {
  render: () => (
    <InputGroup>
      <Input aria-label="Robot ID" placeholder="7F3A" />
      <InputGroupButton aria-label="Find robot">
        <Search aria-hidden="true" />
      </InputGroupButton>
    </InputGroup>
  ),
}

export const NumberFieldPercent: S = {
  render: () => (
    <Field label="Return to dock at" hint="Between 10 and 50 %.">
      <NumberField defaultValue={20} min={10} max={50} step={5} unit="%" />
    </Field>
  ),
}

export const FieldWithTextarea: S = {
  render: () => (
    <Field label="Why are you stopping all robots?" hint="Saved to the event log with your name." error="Write at least a few words.">
      <Textarea rows={2} />
    </Field>
  ),
}

export const ChoiceFieldRadios: S = {
  render: () => (
    <RadioGroup defaultValue="dock">
      <FieldSet legend="When the battery is low">
        <ChoiceField label="Return to dock" description="Stop the task and charge." control={<RadioGroupItem value="dock" />} />
        <ChoiceField label="Finish the task first" description="Only if it ends within 10 minutes." control={<RadioGroupItem value="finish" />} />
        <ChoiceField label="Ask an operator" control={<RadioGroupItem value="ask" />} />
      </FieldSet>
    </RadioGroup>
  ),
}

export const LabelOptional: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="lbl-note">
        Note for the operator <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Input id="lbl-note" placeholder="Gate code is on the back of the badge" />
    </div>
  ),
}

/** More about a label goes in a tooltip on a button beside it, never in the label itself. */
export const LabelWithInfo: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="lbl-speed">Top speed</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="About top speed"
              className="press grid size-(--h-sm) place-items-center rounded-sm text-muted-foreground hover:text-foreground"
            >
              <Info aria-hidden="true" className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Indoors the robot never exceeds 1.2 m/s, whatever is set here.</TooltipContent>
        </Tooltip>
      </div>
      <Input id="lbl-speed" defaultValue="1.5 m/s" />
    </div>
  ),
}

/** Label beside the control on wide forms, above it on phones. */
export const LabelInline: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[
        ["lbl-site", "Site", "Taipei warehouse"],
        ["lbl-dock", "Home dock", "Dock 2"],
      ].map(([id, l, v]) => (
        <div key={id} className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-center">
          <Label htmlFor={id}>{l}</Label>
          <Input id={id} defaultValue={v} />
        </div>
      ))}
    </div>
  ),
}

export const LabelDisabled: S = {
  render: () => (
    <div className="group flex flex-col gap-2" data-disabled>
      <Label htmlFor="lbl-serial">Serial number</Label>
      <Input id="lbl-serial" disabled defaultValue="SR-7F3A-2041" />
    </div>
  ),
}

/** A whole count with no unit. */
export const NumberFieldCount: S = {
  render: () => (
    <Field label="Robots on this route" hint="1 to 6">
      <NumberField defaultValue={2} min={1} max={6} className="w-40" />
    </Field>
  ),
}

/** Below and above zero: a calibration offset. */
export const NumberFieldNegative: S = {
  render: () => (
    <Field label="Heading offset" hint="−10 to 10 degrees">
      <NumberField defaultValue={-2.5} min={-10} max={10} step={0.5} unit="°" className="w-48" />
    </Field>
  ),
}

/** Locked while the robot is on a mission. */
export const NumberFieldDisabled: S = {
  render: () => (
    <Field label="Max speed" hint="Can’t change during a mission">
      <NumberField defaultValue={1.5} step={0.1} unit="m/s" disabled className="w-48" />
    </Field>
  ),
}
