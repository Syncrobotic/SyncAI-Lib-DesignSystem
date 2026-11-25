"use client"

import * as React from "react"
import { StreamingChart, type StreamingChartConfig, type StreamingChartHandle, type StreamingChartPush } from "@/registry/syncrobotic/ui/streaming-chart"
import { EPOCH, noise, useLive } from "./live"

// Telemetry for the home page: a patrol robot's two drive motors, one reading every 2 s (a slow radio link), in a one-minute
// window. Every reading is a function of its index, stamped on the fixed clock, so the picture is the same on every machine.
const EVERY = 2000
const HISTORY = 30
const config = {
  left: { label: "Left wheel", color: 1, unit: "A" },
  right: { label: "Right wheel", color: 2, unit: "A" },
} satisfies StreamingChartConfig
const limits = [{ value: 16, label: "Limit 16 A" }]
// One lap of the patrol takes 90 s.
const LAP = (2 * Math.PI) / 90
const reading = (i: number) => {
  const t = i * 2
  // Each lap the robot climbs the ramp to the loading bay, and the left wheel briefly works past its limit.
  const ramp = 6.8 * Math.exp(-(((((t % 90) + 90) % 90) - 24) ** 2) / 16)
  return {
    left: 8 + 2.4 * Math.sin(t * LAP) + 0.6 * Math.sin(t * LAP * 3) + 0.2 * noise(i) + ramp,
    right: 6.5 + 2 * Math.sin(t * LAP + 0.6) + 0.5 * Math.sin(t * LAP * 5) + 0.2 * noise(i + 7919),
  }
}
// The still frame ends on the climb, so it shows the limit crossed and said in words.
const STILL_AT = 12

export default function LiveTelemetry() {
  const chart = React.useRef<StreamingChartHandle>(null)
  const pushed = React.useRef(0)
  const started = React.useRef(0)
  const { ref, still } = useLive<HTMLDivElement>(
    EVERY,
    () => {
      // Catch up on what arrived while the chart was off screen, so the line never has a gap it did not have.
      const upTo = Math.floor((performance.now() - started.current) / EVERY)
      for (let i = pushed.current + 1; i <= upTo; i++) chart.current?.push(reading(i), EPOCH + i * EVERY)
      pushed.current = Math.max(pushed.current, upTo)
    },
    { tickOnResume: true },
  )
  const subscribe = (push: StreamingChartPush) => {
    const end = still ? STILL_AT : 0
    for (let i = end - HISTORY; i <= end; i++) push(reading(i), EPOCH + i * EVERY)
    pushed.current = end
    started.current = performance.now()
  }
  return (
    <div ref={ref} className="h-full rounded-md bg-card p-4 ring-1 ring-border">
      <StreamingChart
        ref={chart}
        config={config}
        label="Drive motor currents, Patrol dog 7F3A"
        subscribe={subscribe}
        limits={limits}
        domain={[0, 20]}
        windows={[60_000]}
        controls={false}
        staleAfterMs={3 * EVERY}
        paused={still || undefined}
        locale="en"
        plotClassName="h-48"
      />
    </div>
  )
}
