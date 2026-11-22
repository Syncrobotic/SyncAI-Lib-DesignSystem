"use client"

import * as React from "react"
import { Alarm } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"

const steps = [
  { active: true, acknowledged: false, name: "1 · Raised", note: "The condition starts. Strongest form; sound plays for critical and high." },
  { active: true, acknowledged: true, name: "2 · Acknowledged", note: "An operator has seen it. Sound stops, the title turns regular and grey and says when; the alarm stays because the condition is still there." },
  { active: false, acknowledged: true, name: "3 · Cleared", note: "The condition is gone and it was acknowledged: it leaves the list for the history." },
] as const

/** Walk one alarm through its lifecycle. The other path: it clears before anyone acknowledges it, and waits for acknowledgement. */
export function AlarmLifecycle() {
  const [i, setI] = React.useState(0)
  const [skipped, setSkipped] = React.useState(false)
  const s = skipped ? { active: false, acknowledged: false, name: "Cleared, not acknowledged", note: "It cleared on its own. It stays, still bold, its bar dashed and saying when it cleared, until someone acknowledges it, so nothing is missed." } : steps[i]
  // Why the step buttons are off at this point of the walk, said beside them.
  const why = skipped
    ? "Acknowledge the alarm to finish, or start again."
    : i === 0
      ? "Condition clears waits for an acknowledgement: acknowledge the alarm first."
      : i === 1
        ? "Clears before acknowledged is the other path: start again to take it."
        : "Both paths are done: start again to walk it once more."
  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-(--h-row)">
        {s.active || !s.acknowledged ? (
          <Alarm
            priority="high"
            title="Localisation degraded · Floor 3"
            source="Courier 2B19"
            time="14:05:44"
            active={s.active}
            acknowledged={s.acknowledged}
            acknowledgedAt="14:06"
            clearedAt="14:07"
            onAcknowledge={() => (skipped ? (setSkipped(false), setI(2)) : setI(1))}
          />
        ) : (
          <p className="flex min-h-(--h-row) items-center rounded-md px-4 text-sm text-muted-foreground ring-1 ring-border ring-dashed">Moved to history</p>
        )}
      </div>
      <p aria-live="polite" className="text-sm">
        <span className="font-medium">{s.name}.</span> <span className="text-muted-foreground">{s.note}</span>
      </p>
      {/* Kit buttons: a disabled one keeps its words readable (muted fill), and the line under them says why it is off. */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={i !== 1 || skipped} onClick={() => setI(2)}>
            Condition clears
          </Button>
          <Button variant="secondary" size="sm" disabled={i !== 0 || skipped} onClick={() => setSkipped(true)}>
            Clears before acknowledged
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setI(0)
              setSkipped(false)
            }}
          >
            Start again
          </Button>
        </div>
        {why && <p className="text-xs text-muted-foreground">{why}</p>}
      </div>
    </div>
  )
}
