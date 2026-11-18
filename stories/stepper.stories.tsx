import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Stepper, StepperCompact, StepperItem } from "@/registry/syncrobotic/ui/stepper"

const meta: Meta = { title: "Navigation/Stepper" }
export default meta
type S = StoryObj

const setup = [
  { title: "Connect", description: "Pair over Wi-Fi" },
  { title: "Map the site", description: "Walk the robot once" },
  { title: "Set routes" },
  { title: "Test run" },
]

export const StepperDefault: S = {
  render: () => (
    <Stepper value={2}>
      {setup.map((s) => (
        <StepperItem key={s.title} title={s.title} description={s.description} />
      ))}
    </Stepper>
  ),
}

export const StepperInteractive: S = {
  render: function D() {
    const [step, setStep] = React.useState(1)
    const last = setup.length
    return (
      <div className="flex flex-col gap-6">
        <Stepper value={step} onValueChange={setStep} navigable="done">
          {setup.map((s) => (
            <StepperItem key={s.title} title={s.title} />
          ))}
        </Stepper>
        <div className="rounded-md bg-card p-4 text-sm ring-1 ring-border">
          {step > last ? "Commissioning complete." : `Step ${step}: ${setup[step - 1].title}`}
        </div>
        <div className="flex justify-between gap-2">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          <Button disabled={step > last} onClick={() => setStep((s) => s + 1)}>
            {step >= last ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    )
  },
}

export const StepperVertical: S = {
  render: () => (
    <Stepper value={2} orientation="vertical">
      <StepperItem title="Connect" description="Paired with Patrol dog 7F3A" />
      <StepperItem title="Map the site" description="Walk the robot along every corridor once">
        <div className="flex flex-col gap-3 rounded-md bg-card p-4 text-sm ring-1 ring-border">
          <span className="text-muted-foreground">Mapping Hall B · 64 % of the floor covered</span>
          <Button size="sm" variant="outline" className="self-start">
            Pause mapping
          </Button>
        </div>
      </StepperItem>
      <StepperItem title="Set routes" />
      <StepperItem title="Test run" />
    </Stepper>
  ),
}

export const StepperWithError: S = {
  render: () => (
    <Stepper value={3} errors={[2]}>
      <StepperItem title="Connect" />
      <StepperItem title="Map the site" description="Map has gaps" />
      <StepperItem title="Set routes" />
      <StepperItem title="Test run" />
    </Stepper>
  ),
}

export const StepperOptionalStep: S = {
  render: () => (
    <Stepper value={2}>
      <StepperItem title="Account" />
      <StepperItem title="Invite team" optional />
      <StepperItem title="First site" />
    </Stepper>
  ),
}

export const StepperSmall: S = {
  render: () => (
    <Stepper value={3} size="sm">
      {["Upload", "Check", "Import", "Done"].map((t) => (
        <StepperItem key={t} title={t} />
      ))}
    </Stepper>
  ),
}

export const StepperComplete: S = {
  render: () => (
    <Stepper value={5} size="sm">
      {setup.map((s) => (
        <StepperItem key={s.title} title={s.title} />
      ))}
    </Stepper>
  ),
}

export const StepperCompactBar: S = {
  render: () => <StepperCompact value={2} total={4} title="Map the site" />,
}

export const StepperVerticalChecklist: S = {
  render: () => (
    <Stepper value={4} orientation="vertical" size="sm">
      <StepperItem title="Battery above 80 %" description="94 %" />
      <StepperItem title="Lidar clean" description="Checked 07:52" />
      <StepperItem title="Emergency stop tested" description="Checked 07:53" />
      <StepperItem title="Route loaded" />
    </Stepper>
  ),
}

/** Any step can be opened, in any order: a settings wizard where nothing depends on the step before. */
export const StepperFreeOrder: S = {
  render: function F() {
    const [step, setStep] = React.useState(2)
    return (
      <Stepper value={step} onValueChange={setStep} navigable="all">
        {["Profile", "Notifications", "Security", "Billing"].map((t) => (
          <StepperItem key={t} title={t} />
        ))}
      </Stepper>
    )
  },
}

/** A step that can't be reached yet stays dimmed and says why. */
export const StepperDisabledStep: S = {
  render: () => (
    <Stepper value={2}>
      <StepperItem title="Connect" />
      <StepperItem title="Map the site" />
      <StepperItem title="Lift access" description="Needs the building’s API key" disabled />
      <StepperItem title="Test run" />
    </Stepper>
  ),
}

/** Vertical, with the failed step open and what to do about it. */
export const StepperVerticalError: S = {
  render: () => (
    <Stepper value={3} errors={[2]} orientation="vertical">
      <StepperItem title="Connect" description="Paired with 7F3A" />
      <StepperItem title="Map the site" description="Map has gaps">
        <div className="flex flex-col gap-3 rounded-md p-4 text-sm ring-1 ring-danger">
          <span>Two rooms were not reached: Hall B storage, Dock 2 office.</span>
          <Button size="sm" variant="outline" className="self-start">
            Walk those rooms again
          </Button>
        </div>
      </StepperItem>
      <StepperItem title="Set routes" />
      <StepperItem title="Test run" />
    </Stepper>
  ),
}
