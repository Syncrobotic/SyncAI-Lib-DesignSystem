// @syncrobotic/wizard-commission v0.35.0 · update: npx shadcn add @syncrobotic/wizard-commission --overwrite
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PageHeader } from "@/registry/syncrobotic/ui/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"

const checks = ["Robot answers on the network", "Battery above 50 %", "Cameras and lidar", "Emergency stop responds"]

/**
 * Adding a robot to the fleet, in four steps: identify it, place it, let it check itself, then name it. Each step
 * validates before Next; finished steps can be revisited from the stepper. The self-check is the only waiting, and it
 * shows each check as it passes, in-progress blue for the one running.
 */
export function WizardCommission({ onDone }: { onDone?: (robot: { serial: string; site: string; dock: string; name: string }) => void }) {
  const [step, setStep] = React.useState(1)
  const [serial, setSerial] = React.useState("")
  const [site, setSite] = React.useState("")
  const [dock, setDock] = React.useState("")
  const [name, setName] = React.useState("")
  const [passed, setPassed] = React.useState(0)
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({})
  const [done, setDone] = React.useState(false)

  // Step 3 runs the self-check: one check passes every 700 ms.
  React.useEffect(() => {
    if (step !== 3 || passed >= checks.length) return
    const t = window.setTimeout(() => setPassed((p) => p + 1), 700)
    return () => window.clearTimeout(t)
  }, [step, passed])

  const next = () => {
    const e: Record<string, string | undefined> = {}
    if (step === 1 && !/^SR-[0-9A-F]{4}$/i.test(serial.trim())) e.serial = "Enter the serial on the robot's label, e.g. SR-9E37."
    if (step === 2 && !site) e.site = "Choose the site the robot works at."
    if (step === 2 && !dock) e.dock = "Choose its home dock."
    if (step === 4 && !name.trim()) e.name = "Give it a name your team will say on the radio."
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    if (step === 4) {
      setDone(true)
      onDone?.({ serial: serial.trim().toUpperCase(), site, dock, name: name.trim() })
      return
    }
    setStep((s) => s + 1)
  }

  const id = serial.trim().slice(-4).toUpperCase() || "9E37"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <PageHeader title="Add a robot" description="Have the robot switched on and within 10 m of its dock." className="pb-0" />
      <Stepper value={done ? 5 : step} onValueChange={setStep} navigable="done">
        <StepperItem title="Identify" />
        <StepperItem title="Place" />
        <StepperItem title="Self-check" />
        <StepperItem title="Name" />
      </Stepper>

      <Card className="gap-4">
        {done ? (
          <div role="status" className="flex animate-appear flex-col gap-4">
            <IconTile variant="muted">
              <Check aria-hidden="true" />
            </IconTile>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold">{name.trim()} is in the fleet</h2>
              <p className="text-sm text-muted-foreground">It waits at its dock until you give it a mission.</p>
            </div>
            <DescriptionList
              columns={3}
              items={[
                { label: "Serial", value: serial.trim().toUpperCase() },
                { label: "Site", value: site },
                { label: "Dock", value: dock },
              ]}
            />
          </div>
        ) : (
          <>
            {step === 1 && (
              <Field label="Serial number" hint="On the label under the robot's handle." error={errors.serial}>
                <Input value={serial} onChange={(e) => setSerial(e.target.value)} autoComplete="off" spellCheck={false} placeholder="SR-0000" />
              </Field>
            )}
            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Site" error={errors.site}>
                  <Select value={site} onValueChange={setSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Taipei HQ">Taipei HQ</SelectItem>
                      <SelectItem value="Taoyuan plant">Taoyuan plant</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Home dock" error={errors.dock}>
                  <Select value={dock} onValueChange={setDock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a dock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dock 1">Dock 1 (2 free)</SelectItem>
                      <SelectItem value="Dock 2">Dock 2 (1 free)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
            {step === 3 && (
              <ul aria-label={`Self-check of SR-${id}`} className="flex flex-col gap-3">
                {checks.map((c, i) => {
                  const state = i < passed ? "passed" : i === passed ? "running" : "waiting"
                  return (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <span aria-hidden="true" className="grid size-5 place-items-center">
                        {state === "passed" ? (
                          <Check className="size-4" />
                        ) : state === "running" ? (
                          <Spinner className="size-4 text-info" />
                        ) : (
                          <span className="size-2 rounded-full bg-border" />
                        )}
                      </span>
                      <span className={state === "waiting" ? "text-muted-foreground" : ""}>{c}</span>
                      <span className="sr-only">, {state}</span>
                    </li>
                  )
                })}
              </ul>
            )}
            {step === 4 && (
              <Field label="Name" hint={`For example Patrol dog ${id}.`} error={errors.name}>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            )}
            <div className="flex justify-between gap-2 border-t border-border pt-4">
              <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              <Button onClick={next} disabled={step === 3 && passed < checks.length}>
                {step === 4 ? "Add to fleet" : step === 3 && passed < checks.length ? "Checking…" : "Next"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
