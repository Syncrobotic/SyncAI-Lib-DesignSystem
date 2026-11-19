"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Inline } from "./prose"

type Entry = { version: string; date: string; note: string }

const Row = ({ c }: { c: Entry }) => (
  <li className="flex gap-3">
    <span className="w-16 shrink-0 font-mono tabular-nums">{c.version}</span>
    <span className="w-24 shrink-0 text-muted-foreground tabular-nums">{c.date}</span>
    <span>
      <Inline text={c.note} />
    </span>
  </li>
)

/** The latest three versions; older ones grow open below them (the expand pattern), so the page stays short. */
export function ChangelogList({ entries, shown = 3 }: { entries: Entry[]; shown?: number }) {
  const [open, setOpen] = React.useState(false)
  const rest = entries.slice(shown)
  return (
    <div className="flex flex-col gap-2 text-sm">
      <ul className="flex flex-col gap-2">
        {entries.slice(0, shown).map((c) => (
          <Row key={c.version} c={c} />
        ))}
      </ul>
      {rest.length > 0 && (
        <>
          <div
            id="changelog-older"
            className={cn(
              "grid transition-[grid-template-rows] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <ul className="flex min-h-0 flex-col gap-2 overflow-hidden" inert={!open} aria-hidden={!open}>
              {rest.map((c) => (
                <Row key={c.version} c={c} />
              ))}
            </ul>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="changelog-older"
            onClick={() => setOpen((o) => !o)}
            className="press -ml-3 inline-flex h-(--h-sm) w-fit items-center rounded-xs px-3 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {open ? "Show fewer" : `Show all ${entries.length}`}
          </button>
        </>
      )}
    </div>
  )
}
