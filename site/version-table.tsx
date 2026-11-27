"use client"

import Link from "next/link"
import { Inline } from "./prose"
import { TokenTable } from "./token-table"

// The Current versions table of /docs/upgrading. A client component so the page's React payload carries each of its 200-odd
// rows as four strings, not as the row's elements a second time beside the HTML; the server page still renders it in full.

/** An item's row: its name, the page that documents it (null: none), its version and its latest change ("date · note"). */
export type VersionRow = [name: string, href: string | null, version: string, change: string]

export function VersionTable({ rows }: { rows: VersionRow[] }) {
  return (
    <TokenTable
      head={["Item", "Version", "Latest change"]}
      // Each row's look is set here once, not on every row: the name a mono link, the version mono, the change muted.
      className="[&_td>a]:font-mono [&_td>a]:underline [&_td>a]:decoration-muted-foreground [&_td>a]:underline-offset-4 [&_td>a]:hover:decoration-foreground [&_td:nth-child(2)_span_span]:font-mono [&_td:nth-child(2)_span_span]:tabular-nums [&_td:last-child]:text-muted-foreground"
      rows={rows.map(([name, href, version, change]) => [
        href ? (
          <Link key="n" href={href}>
            {name}
          </Link>
        ) : (
          // No page of its own: the same name, unlinked, with what it is in place of a link.
          <span key="n" className="flex flex-col">
            <span className="font-mono text-sm">{name}</span>
            <span className="text-xs text-muted-foreground">Utility, no page</span>
          </span>
        ),
        // In a span inside the cell's box: mono inline in a sans line, a pixel taller than a mono line of its own.
        <span key="v">{version}</span>,
        change ? <Inline key="c" text={change} /> : "",
      ])}
    />
  )
}
