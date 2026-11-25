"use client"

import * as React from "react"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { EPOCH, minuteOf, timeOf, useLive } from "./live"

// Alarms for the home page, one step every 3 s: a critical alarm arrives, an operator acknowledges it, its condition
// clears and it leaves; then the floor is calm for a while. The list is read-only (a viewer's list), so the script, not
// the visitor, acknowledges.
const EVERY = 3000
const CYCLE = 6
// The still frame is the moment that matters: a critical alarm, just raised, waiting for someone.
const STILL_AT = 1

const standing: AlarmData[] = [
  { id: "battery-9c44", priority: "high", title: "Battery 14 % · Parking lot", source: "Patrol dog 9C44", time: "14:01:12", active: true, acknowledged: true, acknowledgedAt: "14:01" },
  { id: "lens-7f3a", priority: "low", title: "Camera lens dirty · North gate", source: "Patrol dog 7F3A", time: "13:58:40", active: true, acknowledged: false },
]

function alarmsAt(step: number): AlarmData[] {
  const cycle = Math.floor(step / CYCLE)
  const phase = step % CYCLE
  // Raised at the cycle's first step after the calm one, on the simulation's clock.
  const raised = EPOCH + (cycle * CYCLE + 1) * EVERY
  const person: AlarmData = {
    id: `person-${cycle}`,
    priority: "critical",
    title: "Person in path · Loading bay",
    source: "Patrol dog 1A08",
    time: timeOf(raised),
    active: phase <= 2,
    acknowledged: phase >= 2,
    acknowledgedAt: minuteOf(raised + EVERY),
  }
  // 1: raised · 2: acknowledged · 3: cleared, so it leaves · 4, 5, 0: calm
  return phase >= 1 && phase <= 2 ? [person, ...standing] : standing
}

export default function LiveAlarms() {
  const [step, setStep] = React.useState(0)
  const { ref, still } = useLive<HTMLDivElement>(EVERY, () => setStep((s) => s + 1))
  const at = still ? STILL_AT : step
  return (
    <div ref={ref} className="h-full">
      <AlarmList alarms={alarmsAt(at)} feedback={false} now={EPOCH + at * EVERY} className="h-full" />
    </div>
  )
}
