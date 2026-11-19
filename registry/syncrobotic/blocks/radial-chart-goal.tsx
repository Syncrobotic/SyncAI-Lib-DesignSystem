// @syncrobotic/radial-chart-goal v0.9.0 · update: npx shadcn add @syncrobotic/radial-chart-goal --overwrite
"use client"

import * as React from "react"
import { Card } from "@/registry/syncrobotic/ui/card"

// A ring: a track and an arc from 12 o'clock, clockwise. The number in the middle is the value; the arc only shows it.
function Ring({
  value,
  max = 100,
  size = 96,
  stroke = 8,
  className,
  children,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(Math.min(value, max) / max) * c} ${c}`}
          className={className}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  )
}

// Sample data: patrol coverage today against the plan, and what makes up the rest.
const covered = 82
const parts = [
  { label: "Patrolled", value: "82 %" },
  { label: "Skipped, door closed", value: "11 %" },
  { label: "Not reached yet", value: "7 %" },
]

/** Progress to a goal: one large ring with the share in the middle, and the breakdown beside it in words. */
export function RadialChartGoal() {
  return (
    <Card>
      <h3 className="text-sm font-medium">Patrol coverage · today</h3>
      <div className="flex flex-wrap items-center gap-6">
        <span role="meter" aria-label="Patrol coverage today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={covered}>
          <Ring value={covered} size={144} stroke={12} className="stroke-foreground">
            <span className="flex flex-col items-center">
              <span className="text-3xl font-bold tabular-nums">{covered}%</span>
              <span className="text-xs text-muted-foreground">of plan</span>
            </span>
          </Ring>
        </span>
        <dl className="flex max-w-sm min-w-48 flex-1 flex-col divide-y divide-border text-sm">
          {parts.map((p) => (
            <div key={p.label} className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{p.label}</dt>
              <dd className="tabular-nums">{p.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}
