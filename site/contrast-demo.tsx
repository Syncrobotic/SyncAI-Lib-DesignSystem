"use client"

import * as React from "react"
import { ChevronRight, Pause } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { Badge, CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const modes = [
  { value: "default", label: "Default", note: "Calm, for indoor screens." },
  { value: "more", label: "High contrast", note: "Bright sun and low vision: 7:1 text, 3:1 edges, nothing translucent." },
] as const

/** The same screen in each contrast: only the attribute on the container changes. */
export function ContrastDemo() {
  const [mode, setMode] = React.useState<(typeof modes)[number]["value"]>("more")
  const m = modes.find((x) => x.value === mode)!
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl aria-label="Contrast" value={mode} onValueChange={(v) => v && setMode(v as typeof mode)} className="sm:w-auto sm:self-start">
        {modes.map((x) => (
          <SegmentedControlItem key={x.value} value={x.value}>
            {x.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        <code className="font-mono text-xs text-foreground">{mode === "default" ? "no attribute" : `data-contrast="more"`}</code> · {m.note}
      </p>
      <div data-contrast={mode === "default" ? undefined : mode} className="flex max-w-md flex-col gap-3 rounded-md bg-background p-4 text-foreground">
        <div className="flex gap-2">
          <Input aria-label="Robot name" defaultValue="Patrol dog 7F3A" />
          <Button variant="secondary">
            <Pause aria-hidden="true" /> Pause
          </Button>
        </div>
        <ul className="flex flex-col rounded-md bg-card ring-1 ring-border">
          {[
            { r: "Patrol dog 7F3A", s: <InlineStatus status="active">Patrolling</InlineStatus> },
            { r: "Courier 2B19", s: <InlineStatus status="warning">Battery 12 %</InlineStatus> },
            { r: "Courier 4C02", s: <InlineStatus status="offline">Offline</InlineStatus> },
          ].map(({ r, s }) => (
            <li key={r} className="flex h-(--h-row) items-center justify-between gap-3 border-b border-border px-4 text-sm last:border-b-0">
              <span className="flex flex-col">
                {r}
                <span className="text-xs text-muted-foreground">Hall B</span>
              </span>
              <span className="flex items-center gap-2">
                {s}
                <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Badge tone="outline">Production</Badge>
          <Badge>Beta</Badge>
          <span className="inline-flex items-center gap-2 text-sm">
            Alarms <CountBadge count={3} />
          </span>
        </div>
        <StopButton onStop={() => {}} />
      </div>
    </div>
  )
}
