// @syncrobotic/dialog-form v0.51.0 · update: npx shadcn add @syncrobotic/dialog-form --overwrite
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/syncrobotic/ui/dialog"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"

const robots = ["Patrol dog 7F3A", "Patrol dog 1715", "Patrol dog DAA6"]
const routes = ["Perimeter", "Loading bay", "Car park", "Server room"]

// The rules, in one place: say how to fix it, not just that it is wrong.
const validate = (v: { name: string; robot: string }) => ({
  name: v.name.trim() ? undefined : "Name the mission, e.g. Night patrol.",
  robot: v.robot ? undefined : "Choose the robot that runs it.",
})

/**
 * A short form in a dialog: three fields at most. Validates like the `form` example without a form library (nothing before
 * the first submit, then errors follow each value; a failed submit focuses the first error) and keeps what was typed.
 * Longer forms get their own page (record-form).
 */
export function DialogForm({
  onCreate,
  defaultOpen,
  focusOnOpen = true,
}: {
  onCreate?: (mission: { name: string; robot: string; route: string; start: string }) => void
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  const [name, setName] = React.useState("")
  const [robot, setRobot] = React.useState("")
  // The first route is preselected; with no routes there is nothing to preselect, like the robot above.
  const [route, setRoute] = React.useState(routes[0] ?? "")
  const [start, setStart] = React.useState("now")
  // Errors are worked out from the values once a submit has been tried, so a fixed field clears as you type.
  const [submitted, setSubmitted] = React.useState(false)
  const errors: ReturnType<typeof validate> = submitted ? validate({ name, robot }) : { name: undefined, robot: undefined }
  const form = React.useRef<HTMLFormElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const next = validate({ name, robot })
    if (next.name || next.robot) {
      // Take the user to the first problem once the errors have rendered.
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    onCreate?.({ name: name.trim(), robot, route, start })
    setSubmitted(false)
    setOpen(false)
  }

  return (
    <div className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus aria-hidden="true" />
            New mission
          </Button>
        </DialogTrigger>
        {/* focus-ring: the panel itself can hold focus (when nothing inside takes it); it is not a control, so it shows no ring. */}
        <DialogContent className="outline-none" onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New mission</DialogTitle>
            <DialogDescription>The robot leaves its dock when the mission starts.</DialogDescription>
          </DialogHeader>
          <form ref={form} id="new-mission" noValidate onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Name" error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Robot" error={errors.robot}>
                <Select value={robot} onValueChange={setRobot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a robot" />
                  </SelectTrigger>
                  <SelectContent>
                    {robots.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Route">
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex flex-col gap-2">
              <span id="mission-start" className="text-sm font-medium">
                Start
              </span>
              <SegmentedControl aria-labelledby="mission-start" value={start} onValueChange={(v) => v && setStart(v)} className="self-start">
                <SegmentedControlItem value="now">Now</SegmentedControlItem>
                <SegmentedControlItem value="next">At the next shift</SegmentedControlItem>
              </SegmentedControl>
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="new-mission">
              Create mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
