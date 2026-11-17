// @syncrobotic/dialog-form v0.9.0 · update: npx shadcn add @syncrobotic/dialog-form --overwrite
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

/**
 * A short form in a dialog: three fields at most, so it is a quick decision, not a page. Errors show under their fields on
 * submit and the dialog stays open with everything typed kept. Longer forms get their own page (Form).
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
  const [route, setRoute] = React.useState(routes[0])
  const [start, setStart] = React.useState("now")
  const [errors, setErrors] = React.useState<{ name?: string; robot?: string }>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = { name: name.trim() ? undefined : "Name the mission, e.g. Night patrol.", robot: robot ? undefined : "Choose the robot that runs it." }
    setErrors(next)
    if (next.name || next.robot) return
    onCreate?.({ name: name.trim(), robot, route, start })
    setOpen(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus aria-hidden="true" />
            New mission
          </Button>
        </DialogTrigger>
        {/* The panel itself can hold focus (when nothing inside takes it); it is not a control, so it shows no ring. */}
        <DialogContent className="outline-none" onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New mission</DialogTitle>
            <DialogDescription>The robot leaves its dock when the mission starts.</DialogDescription>
          </DialogHeader>
          <form id="new-mission" noValidate onSubmit={submit} className="flex flex-col gap-4">
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
