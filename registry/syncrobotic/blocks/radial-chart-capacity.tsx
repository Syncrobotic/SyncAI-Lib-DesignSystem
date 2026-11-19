// @syncrobotic/radial-chart-capacity v0.17.2 · update: npx shadcn add @syncrobotic/radial-chart-capacity --overwrite
"use client"

import * as React from "react"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"

// Sample data: three resources of a site server, one concentric ring each, in palette order.
const rings = [
  { label: "Storage", used: 71, detail: "3.6 of 5 TB", color: "var(--chart-1)" },
  { label: "Compute", used: 48, detail: "12 of 24 cores", color: "var(--chart-2)" },
  { label: "Uplink", used: 33, detail: "330 of 1000 Mb/s", color: "var(--chart-3)" },
]

/** Several shares of capacity at once: concentric rings in series colours, each named with its value in the legend beside it. */
export function RadialChartCapacity() {
  const size = 160
  const stroke = 12
  const gap = 4
  return (
    <Card>
      <CardDataHeader title="Site server capacity" />
      <div className="flex flex-wrap items-center gap-6">
        <svg aria-hidden="true" width={size} height={size} className="shrink-0 -rotate-90">
          {rings.map((g, i) => {
            const r = size / 2 - stroke / 2 - i * (stroke + gap)
            const c = 2 * Math.PI * r
            return (
              <g key={g.label}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-track in-data-[contrast=more]:stroke-input" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  stroke={g.color}
                  strokeDasharray={`${(g.used / 100) * c} ${c}`}
                />
              </g>
            )
          })}
        </svg>
        <ul className="flex min-w-48 flex-1 flex-col gap-3 text-sm">
          {rings.map((g) => (
            <li key={g.label} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-xs" style={{ background: g.color }} />
              <span className="flex-1">{g.label}</span>
              <span className="text-muted-foreground tabular-nums">{g.detail}</span>
              <span className="w-12 text-right font-medium tabular-nums">{g.used} %</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
