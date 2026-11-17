"use client"

import * as React from "react"
import { Alarm } from "@/registry/syncrobotic/ui/alarm"

const steps = [
  { active: true, acknowledged: false, name: "1 · Raised", note: "The condition starts. Strongest form; sound plays for critical and high." },
  { active: true, acknowledged: true, name: "2 · Acknowledged", note: "An operator has seen it. Sound stops; the alarm stays because the condition is still there." },
  { active: false, acknowledged: true, name: "3 · Cleared", note: "The condition is gone and it was acknowledged: it leaves the list for the history." },
] as const

/** Walk one alarm through its lifecycle. The other path: it clears before anyone acknowledges it, and waits for acknowledgement. */
export function AlarmLifecycle() {
  const [i, setI] = React.useState(0)
  const [skipped, setSkipped] = React.useState(false)
  const s = skipped ? { active: false, acknowledged: false, name: "Cleared, not acknowledged", note: "It cleared on its own. It stays, quieter, until someone acknowledges it, so nothing is missed." } : steps[i]
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
            onAcknowledge={() => (skipped ? (setSkipped(false), setI(2)) : setI(1))}
          />
        ) : (
          <p className="flex min-h-(--h-row) items-center rounded-md px-4 text-sm text-muted-foreground ring-1 ring-border ring-dashed">Moved to history</p>
        )}
      </div>
      <p aria-live="polite" className="text-sm">
        <span className="font-medium">{s.name}.</span> <span className="text-muted-foreground">{s.note}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="press h-(--h-sm) rounded-sm bg-secondary px-3 text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={i !== 1 || skipped} onClick={() => setI(2)}>
          Condition clears
        </button>
        <button type="button" className="press h-(--h-sm) rounded-sm bg-secondary px-3 text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={i !== 0 || skipped} onClick={() => setSkipped(true)}>
          Clears before acknowledged
        </button>
        <button
          type="button"
          className="press h-(--h-sm) rounded-sm px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
          onClick={() => {
            setI(0)
            setSkipped(false)
          }}
        >
          Start again
        </button>
      </div>
    </div>
  )
}
