"use client"

import * as React from "react"
import { Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyText } from "@/registry/syncrobotic/ui/copy-button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

/** One icon, already rendered on the server, so the client never ships the set's components. */
export type BrowserIcon = { name: string; means: string; glyph: React.ReactNode }

const sizes = [
  { value: "16", cls: "[&_svg]:size-4" },
  { value: "20", cls: "[&_svg]:size-5" },
  { value: "24", cls: "[&_svg]:size-6" },
] as const

/**
 * The icon set as ruled rows: glyph, name and the one thing it means. Search matches name and meaning, so "dock" finds
 * ChargingDock. A row copies the icon's name.
 */
export function IconBrowser({ groups, total }: { groups: { title: string; icons: BrowserIcon[]; note?: React.ReactNode }[]; total: number }) {
  const [query, setQuery] = React.useState("")
  const [size, setSize] = React.useState<(typeof sizes)[number]["value"]>("20")
  const [copied, setCopied] = React.useState<{ name: string; ok: boolean } | null>(null)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const q = query.trim().toLowerCase()
  const shown = groups
    .map((g) => ({ ...g, icons: q ? g.icons.filter((i) => i.name.toLowerCase().includes(q) || i.means.toLowerCase().includes(q)) : g.icons }))
    .filter((g) => g.icons.length > 0)
  const glyphSize = sizes.find((s) => s.value === size)!.cls
  const count = shown.reduce((n, g) => n + g.icons.length, 0)

  const copy = async (name: string) => {
    const ok = await copyText(name)
    setCopied({ name, ok })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <Input type="search" aria-label="Search icons" placeholder="Search by name or meaning" value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>
        <SegmentedControl
          aria-label="Icon size"
          value={size}
          onValueChange={(v) => v && setSize(v as typeof size)}
          className="sm:w-auto"
        >
          {sizes.map((s) => (
            <SegmentedControlItem key={s.value} value={s.value} className="tabular-nums">
              {s.value} px
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        {q ? `${count} of ${total} icons` : `${total} icons`}
        <span className="sr-only">
          {copied ? (copied.ok ? `Copied ${copied.name}` : `Could not copy ${copied.name}`) : ""}
        </span>
      </p>

      {shown.length === 0 && (
        <p className="border-y border-border py-8 text-sm text-muted-foreground">
          No icon means “{query.trim()}”. A new meaning is a new entry in <code className="font-mono text-xs">site/icons.ts</code>, reviewed like any other
          change.
        </p>
      )}

      {shown.map((g) => (
        <section key={g.title} aria-labelledby={`icons-${g.title}`} className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h3 id={`icons-${g.title}`} className="text-sm font-bold">
              {g.title}
            </h3>
            {g.note && <p className="text-sm text-muted-foreground">{g.note}</p>}
          </div>
          <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
            {g.icons.map((i) => {
              const done = copied?.name === i.name && copied.ok
              return (
                <li key={i.name} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => copy(i.name)}
                    aria-label={`Copy ${i.name}: ${i.means}`}
                    className="press group flex min-h-12 w-full items-center gap-3 px-2 py-2 text-left transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent"
                  >
                    <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center", glyphSize)}>
                      {i.glyph}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 font-mono text-sm">
                        {i.name}
                        {done && (
                          <span className="flex items-center gap-2 font-sans text-xs text-muted-foreground [&_svg]:size-4">
                            <Check aria-hidden="true" /> Copied
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">{i.means}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
