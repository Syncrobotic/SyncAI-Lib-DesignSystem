// @syncrobotic/rollout-plan v0.53.0 · update: npx shadcn add @syncrobotic/rollout-plan --overwrite
"use client"

import * as React from "react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Field } from "@/registry/syncrobotic/ui/field"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const FLEET = 56
type Stage = { name: string; share: number; wait: number }

/**
 * Planning a rollout: version, stages with share and watch time, update window and safety, with what will happen said
 * in plain words before it starts. Robots update only when docked and idle, in the window you choose.
 */
export function RolloutPlan() {
  const [version, setVersion] = React.useState("2.4.1")
  const [stages, setStages] = React.useState<Stage[]>([
    { name: "Canary", share: 4, wait: 24 },
    { name: "Stage 2", share: 10, wait: 12 },
    { name: "Stage 3", share: 50, wait: 12 },
    { name: "All", share: 100, wait: 0 },
  ])
  const [slot, setSlot] = React.useState("night")
  const [autoPause, setAutoPause] = React.useState(true)
  const [rollback, setRollback] = React.useState(false)
  const robots = (s: Stage) => Math.max(1, Math.round((s.share / 100) * FLEET))
  const hours = stages.reduce((h, s) => h + s.wait, 0)
  // Each stage must reach more of the fleet than the one before it; the first has nothing before it to compare with.
  const bad = stages.some((s, i) => {
    const before = stages[i - 1]
    return before !== undefined && s.share <= before.share
  })
  const [first, ...later] = stages
  const watch = (s: Stage, i: number) =>
    i === stages.length - 1 ? (
      <span className="flex justify-center text-muted-foreground">—</span>
    ) : (
      <NumberField
        aria-label={`${s.name} watch time, hours`}
        value={s.wait}
        min={1}
        max={72}
        unit="h"
        className="w-full"
        onValueChange={(v) => setStages((l) => l.map((x, j) => (j === i ? { ...x, wait: v ?? x.wait } : x)))}
      />
    )

  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#rollouts" title="New rollout" user={sampleUser}>
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Firmware" hint="Release notes: lidar drift fix, faster docking.">
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2.4.1">2.4.1 (latest)</SelectItem>
                <SelectItem value="2.4.0">2.4.0</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Update window" hint="Robots update only while docked and idle.">
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="night">Nights, 01:00–05:00</SelectItem>
                <SelectItem value="any">Any time they are docked</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <section aria-labelledby="stages-title" className="flex flex-col gap-3">
          <h2 id="stages-title" className="text-sm font-medium">
            Stages
          </h2>
          {/* Table draws its own edge, scroll and fades; a second frame around it clipped or doubled them. */}
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="w-40">
                  <span className="sm:hidden">Share, then watch</span>
                  <span className="hidden sm:inline">Share of fleet</span>
                </TableHead>
                <TableHead className="hidden text-right sm:table-cell">Robots</TableHead>
                <TableHead className="hidden w-40 sm:table-cell">Watch before next</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((s, i) => (
                <TableRow key={s.name}>
                  <TableCell>
                    <span className="font-medium">{s.name}</span>
                    {/* On a phone the robot count sits under the stage, and the watch time under the share. */}
                    <span className="block text-xs text-muted-foreground tabular-nums sm:hidden">{robots(s)} robots</span>
                  </TableCell>
                  <TableCell className="py-2 sm:py-0">
                    <span className="flex flex-col gap-2">
                      {i === stages.length - 1 ? (
                        <span className="flex justify-center tabular-nums">100 %</span>
                      ) : (
                        <NumberField
                          aria-label={`${s.name} share of fleet, percent`}
                          value={s.share}
                          min={1}
                          max={99}
                          unit="%"
                          className="w-full"
                          onValueChange={(v) => setStages((l) => l.map((x, j) => (j === i ? { ...x, share: v ?? x.share } : x)))}
                        />
                      )}
                      <span className="sm:hidden">{watch(s, i)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{robots(s)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{watch(s, i)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {bad && (
            <p role="alert" className="text-sm text-danger">
              Each stage must reach more of the fleet than the one before it.
            </p>
          )}
        </section>

        <FieldSet legend="Safety">
          <ChoiceField
            label="Pause on its own when a gate fails"
            description="More than 2 failed updates in a stage, a robot stopping within 30 min, or mission success under 95 %."
            control={<Checkbox checked={autoPause} onCheckedChange={(v) => setAutoPause(v === true)} />}
          />
          <ChoiceField
            label="Roll failed robots back to their last version"
            description="Otherwise they stay on their current version and keep working."
            control={<Checkbox checked={rollback} onCheckedChange={(v) => setRollback(v === true)} />}
          />
        </FieldSet>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm">
            {version} goes to {first ? robots(first) : 0} robots first, then {later.map(robots).join(", then ")}. At least {hours} hours from start to the
            whole fleet{slot === "night" ? ", updating only at night" : ""}.{" "}
            {autoPause ? "It pauses itself if a gate fails." : "It does not pause on its own: watch it."}
          </p>
          <div className="flex gap-2">
            <Button disabled={bad}>Start rollout</Button>
            <Button variant="ghost">Save as draft</Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
