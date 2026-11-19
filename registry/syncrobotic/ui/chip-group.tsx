// @syncrobotic/chip-group v0.10.0 · update: npx shadcn add @syncrobotic/chip-group --overwrite
"use client"

import * as React from "react"
import { ToggleGroup } from "radix-ui"
import { cn } from "@/lib/utils"

export type Chip = {
  value: string
  label: React.ReactNode
  /** How many results this choice gives, shown after the label. */
  count?: number
  /** A link instead of a button: saved views, or filters that live in the URL as plain links. */
  href?: string
}

const chip = cn(
  "press inline-flex h-(--h-sm) shrink-0 items-center gap-2 whitespace-nowrap rounded-xs px-3 text-sm ring-1 ring-border ring-inset",
  "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // Selected is inverted, like every selected control in the system.
  "data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground data-[state=on]:ring-primary",
  "aria-[current=page]:bg-primary aria-[current=page]:font-medium aria-[current=page]:text-primary-foreground aria-[current=page]:ring-primary",
)
const countCls =
  "tabular-nums text-muted-foreground [[data-state=on]_&]:text-primary-foreground [[aria-current=page]_&]:text-primary-foreground"

/**
 * One choice among several, as a row of chips with how many results each gives: a facet, a level, a saved view. Long
 * rows fold after `max` chips behind "N more"; the selected chip always stays visible. Chips with `href` are links
 * (the current one is marked with aria-current), so a filter can live in the URL and work without JavaScript.
 */
export function ChipGroup({
  items,
  value,
  onValueChange,
  label,
  max,
  allowNone = true,
  moreLabel = (n) => `${n} more`,
  lessLabel = "Show fewer",
  linkAs: Link = "a",
  className,
}: {
  items: Chip[]
  value?: string
  onValueChange?: (value: string | undefined) => void
  /** Names the group: "Task", "Saved views". */
  label: string
  /** Show this many chips, then "N more". */
  max?: number
  /** Pressing the selected chip clears the choice. */
  allowNone?: boolean
  moreLabel?: (hidden: number) => string
  lessLabel?: string
  /** Your router's link (e.g. next/link), for chips with href. */
  linkAs?: React.ElementType
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Folding again: the extra chips fade out where they are (disappear), then the row closes up. If animations never
  // run, the safety delay folds it anyway.
  const [closing, setClosing] = React.useState(false)
  React.useEffect(() => {
    if (!closing) return
    const t = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 400)
    return () => window.clearTimeout(t)
  }, [closing])
  const extra = (c: Chip, i: number) => max !== undefined && i >= max && c.value !== value
  const folded = max !== undefined && !open && items.length > max
  const shown = items.map((c, i) => ({ c, i })).filter(({ c, i }) => !folded || !extra(c, i))
  const hidden = items.filter(extra).length
  const lastExtra = [...shown].reverse().find(({ c, i }) => extra(c, i))?.c.value
  // Chips that unfold arrive (appear) instead of popping into the row.
  const motion = (c: Chip, i: number) =>
    open && extra(c, i)
      ? {
          className: closing ? "animate-disappear" : "animate-appear",
          inert: closing || undefined,
          onAnimationEnd: (e: React.AnimationEvent) => {
            if (!closing || c.value !== lastExtra || e.target !== e.currentTarget) return
            setOpen(false)
            setClosing(false)
          },
        }
      : undefined
  const expanded = open && !closing
  const more =
    max !== undefined && items.length > max ? (
      <button
        type="button"
        onClick={() => (expanded ? setClosing(true) : (setOpen(true), setClosing(false)))}
        aria-expanded={expanded}
        className={cn(chip, "press text-muted-foreground ring-transparent")}
      >
        {expanded ? lessLabel : moreLabel(hidden)}
      </button>
    ) : null
  const inner = (c: Chip) => (
    <>
      {c.label}
      {c.count !== undefined && <span className={countCls}>{c.count.toLocaleString()}</span>}
    </>
  )

  if (items.some((c) => c.href)) {
    return (
      <nav aria-label={label} data-slot="chip-group" className={className}>
        <ul className="flex flex-wrap items-center gap-2">
          {shown.map(({ c, i }) => (
            <li key={c.value} {...motion(c, i)}>
              <Link href={c.href} aria-current={c.value === value ? "page" : undefined} className={chip}>
                {inner(c)}
              </Link>
            </li>
          ))}
          {more && <li>{more}</li>}
        </ul>
      </nav>
    )
  }

  return (
    <ToggleGroup.Root
      type="single"
      data-slot="chip-group"
      aria-label={label}
      value={value ?? ""}
      onValueChange={(v) => (v || allowNone ? onValueChange?.(v || undefined) : undefined)}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {shown.map(({ c, i }) => (
        <ToggleGroup.Item key={c.value} value={c.value} {...motion(c, i)} className={cn(chip, motion(c, i)?.className)}>
          {inner(c)}
        </ToggleGroup.Item>
      ))}
      {more}
    </ToggleGroup.Root>
  )
}
