// @syncrobotic/sparkline-table v0.17.3 · update: npx shadcn add @syncrobotic/sparkline-table --overwrite
"use client"

import { formatCount } from "@/registry/syncrobotic/lib/format-count"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ResponsiveTable } from "@/registry/syncrobotic/ui/responsive-table"

// Mini bars: one per day, the same height scale for every row so rows compare. Opaque grey, 3:1 on the card and on a
// hovered row (--input), never a translucent one that drops below it.
function MiniBars({ values, max }: { values: number[]; max: number }) {
  return (
    <span aria-hidden="true" className="flex h-6 items-end gap-0.5">
      {values.map((v, i) => (
        <span key={i} className="w-1.5 rounded-t-xs bg-input" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </span>
  )
}

// Sample data: events per day for the last 14 days, oldest first.
const sites = [
  { name: "North gate", robots: 3, events: [2, 1, 3, 2, 4, 2, 1, 2, 3, 5, 4, 3, 2, 3] },
  { name: "Hall B", robots: 2, events: [1, 0, 1, 1, 2, 1, 0, 1, 1, 0, 1, 2, 1, 1] },
  { name: "Warehouse 3", robots: 4, events: [5, 6, 4, 7, 6, 8, 9, 7, 6, 8, 9, 10, 8, 9] },
  { name: "Parking lot", robots: 1, events: [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
]

type Site = (typeof sites)[number]
const total = (s: Site) => s.events.reduce((a, b) => a + b, 0)

/**
 * A table with a trend column: each site's events over 14 days as mini bars on one shared scale, with the total beside it.
 * Where it is narrow (a phone, a dashboard column) the rows are a list: the site, its robots under it, the bars and the total
 * at the end.
 */
export function SparklineTable() {
  const max = Math.max(...sites.flatMap((s) => s.events))
  return (
    // The rows run edge to edge under the title: square at the top, where the table's header band meets the title's divider
    // (no notches), the card's radius at the bottom (no corners poking out), and no ring of their own, as a table or a list.
    <Card className="gap-0 p-0 [&_[data-slot=table-container]]:rounded-t-none [&_[data-slot=table-container]]:ring-0 [&_[role=list]]:rounded-t-none [&_[role=list]]:ring-0">
      <CardDataHeader title="Events by site · last 14 days" className="border-b border-border px-4 py-3" />
      <ResponsiveTable
        label="Events by site"
        rows={sites}
        rowKey={(s) => s.name}
        columns={[
          { id: "site", header: "Site", cell: (s) => <span className="font-medium">{s.name}</span>, phoneCell: (s) => s.name },
          {
            id: "robots",
            header: "Robots",
            align: "end",
            cell: (s) => formatCount(s.robots),
            phoneCell: (s) => `${formatCount(s.robots)} ${s.robots === 1 ? "robot" : "robots"}`,
            className: "tabular-nums",
          },
          { id: "trend", header: "Trend", cell: (s) => <MiniBars values={s.events} max={max} />, phone: "hidden" },
          {
            id: "events",
            header: "Events",
            align: "end",
            phone: "trailing",
            cell: (s) => formatCount(total(s)),
            // On a phone the bars lead the total at the row's end, so each row still shows its shape.
            phoneCell: (s) => (
              <span className="flex shrink-0 items-center gap-3 text-sm tabular-nums">
                <MiniBars values={s.events} max={max} />
                {formatCount(total(s))}
              </span>
            ),
            className: "tabular-nums",
          },
        ]}
      />
    </Card>
  )
}
