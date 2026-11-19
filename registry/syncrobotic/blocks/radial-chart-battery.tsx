// @syncrobotic/radial-chart-battery v0.17.2 · update: npx shadcn add @syncrobotic/radial-chart-battery --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted in-data-[contrast=more]:stroke-input" />
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

// Sample data. Like a battery Meter: neutral until low, then warning. A low battery needs attention; it is not a failure.
const robots = [
  { id: "7F3A", battery: 64 },
  { id: "DAA6", battery: 100 },
  { id: "9E37", battery: 12 },
  { id: "1715", battery: 27 },
]
const tone = (v: number) => (v < 15 ? "stroke-warning" : "stroke-foreground")

/** Battery per robot as rings: neutral when fine, warning below 15 % (never danger), with the number always in the middle. */
export function RadialChartBattery() {
  return (
    <Card>
      <h3 className="text-sm font-medium">Battery</h3>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {robots.map((r) => (
          <li key={r.id} className="flex flex-col items-center gap-2">
            <span role="meter" aria-label={`Battery of ${r.id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.battery}>
              <Ring value={r.battery} className={tone(r.battery)}>
                <span className={cn("text-lg font-bold tabular-nums", r.battery < 15 && "text-warning")}>{r.battery}%</span>
              </Ring>
            </span>
            <span className="text-xs text-muted-foreground">{r.id}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
