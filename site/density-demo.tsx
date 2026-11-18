"use client"

import * as React from "react"
import { ChevronRight, Pause } from "lucide-react"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const modes = [
  { value: "default", label: "Default", note: "A bare finger: 44 px controls, 56 px rows." },
  { value: "glove", label: "Glove", note: "Work gloves: 48 px controls, 64 px rows and stop." },
  { value: "compact", label: "Compact", note: "A console with a mouse: 36 px controls, 40 px rows. On a touch screen it stays at the default." },
] as const

/** The same controls under each density: only the attribute on the container changes. */
export function DensityDemo() {
  const [mode, setMode] = React.useState<(typeof modes)[number]["value"]>("default")
  const m = modes.find((x) => x.value === mode)!
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl aria-label="Density" value={mode} onValueChange={(v) => v && setMode(v as typeof mode)} className="sm:w-auto sm:self-start">
        {modes.map((x) => (
          <SegmentedControlItem key={x.value} value={x.value}>
            {x.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        <code className="font-mono text-xs text-foreground">{mode === "default" ? "no attribute" : `data-density="${mode}"`}</code> · {m.note}
      </p>
      <div data-density={mode === "default" ? undefined : mode} className="flex max-w-md flex-col gap-3">
        <div className="flex gap-2">
          <Input aria-label="Robot name" defaultValue="Patrol dog 7F3A" />
          <Button variant="secondary">
            <Pause aria-hidden="true" /> Pause
          </Button>
        </div>
        <ul className="flex flex-col rounded-md bg-card ring-1 ring-border">
          {["Patrol dog 7F3A", "Courier 2B19"].map((r) => (
            <li key={r} className="flex h-(--h-row) items-center justify-between border-b border-border px-4 text-sm last:border-b-0">
              {r}
              <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
        <StopButton onStop={() => {}} />
      </div>
    </div>
  )
}
