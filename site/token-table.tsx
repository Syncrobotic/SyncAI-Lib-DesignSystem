import * as React from "react"
import { cn } from "@/lib/utils"

// Not a client module and no server imports, so a client component can draw it too.

/**
 * A table on wide screens; on a phone each row is a card, its first cell on top and every other cell under its column's
 * name. Rendered once: the layout is CSS (.token-table in app/globals.css), and the rows carry no classes, since a long
 * table paid for each class string twice per cell (the markup and the React payload). The phone's column names are the
 * table's --c1… variables, drawn by CSS and silent to screen readers, which hear the table's own headers. On the phone a
 * cell after the first is a box beside its name, so an element in it is wrapped: inline in a text-sm box, as it was in the
 * phone list's <dd>, not a box of its own at its own line height.
 */
export function TokenTable({ head, rows, className }: { head: string[]; rows: React.ReactNode[][]; /** Styles for the cells, set once (`[&_td:nth-child(2)]:font-mono`) instead of on every row. */ className?: string }) {
  const names = Object.fromEntries(head.slice(1).map((h, j) => [`--c${j + 1}`, JSON.stringify(h)])) as React.CSSProperties
  return (
    <div className={cn("token-table", className)}>
      <table style={names}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{j === 0 || typeof c === "string" || typeof c === "number" ? c : <span>{c}</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
