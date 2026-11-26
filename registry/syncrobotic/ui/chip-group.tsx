// @syncrobotic/chip-group v0.40.0 · update: npx shadcn add @syncrobotic/chip-group --overwrite
"use client"

import * as React from "react"
import { ToggleGroup } from "radix-ui"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"

/**
 * Attributes spread on one chip's button or link: `data-*` hooks for tests and analytics, `title`, `aria-describedby`.
 * The group's own (`href`, the chosen state, `aria-current`, `aria-pressed`) win over them; `className` is added to the
 * chip's.
 */
export type ChipProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  [data: `data-${string}`]: string | number | boolean | undefined
}

export type Chip = {
  value: string
  label: React.ReactNode
  /** How many results this choice gives, shown after the label. */
  count?: number
  /** A link instead of a button: saved views, or filters that live in the URL as plain links. */
  href?: string
  /** More attributes for this chip's button or link. */
  props?: ChipProps
}

const chip = cn(
  "press inline-flex h-(--h-sm) shrink-0 items-center gap-2 whitespace-nowrap rounded-xs px-3 text-sm ring-1 ring-border ring-inset",
  "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // Selected is inverted, like every selected control in the system. Chosen links carry the same data-state as the toggles.
  "data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground data-[state=on]:ring-primary",
)
const countCls = "tabular-nums text-muted-foreground [[data-state=on]_&]:text-primary-foreground"

export type ChipGroupLabels = {
  /** The button that unfolds the chips past `max`: "4 more". */
  more: (hidden: number) => string
  /** The same button once unfolded. */
  less: string
  /** Read after each chosen link when several can be chosen (`type="multiple"` with `href`), where aria-current does not fit. */
  selected: string
}

export const defaultChipGroupLabels: ChipGroupLabels = {
  more: (n) => `${n} more`,
  less: "Show fewer",
  selected: "selected",
}

type ChipGroupBase = {
  items: Chip[]
  /** Names the group: "Task", "Saved views". */
  label: string
  /** Show this many chips, then "N more". */
  max?: number
  /** Pressing the last chosen chip clears the choice. With `false`, one chip always stays chosen. */
  allowNone?: boolean
  /** Same as `labels.more`, and wins over it. */
  moreLabel?: (hidden: number) => string
  /** Same as `labels.less`, and wins over it. */
  lessLabel?: string
  /** The words it says, to translate them. */
  labels?: Partial<ChipGroupLabels>
  /** Formats the counts (a BCP 47 tag such as "zh-TW"). Left out, English, so the server and the browser write the same. */
  locale?: string
  /** Your router's link (e.g. next/link), for chips with href. */
  linkAs?: React.ElementType
  /**
   * The aria-current of the chosen link (one choice, chips with href): "page" (the default) for views that are pages;
   * "true" for a row of filter links on a page whose navigation already marks the page.
   */
  current?: "page" | "true" | "location"
  className?: string
}

type ChipGroupSingle = {
  /** "single" (the default): one choice, `value` is a string. "multiple": any number, `value` is a list. */
  type?: "single"
  /** The chosen chip's value; with type="multiple", the chosen chips' values. */
  value?: string
  /** Called with the new choice: the value, or undefined once cleared; with type="multiple", the list. */
  onValueChange?: (value: string | undefined) => void
}

type ChipGroupMultiple = {
  /** "single" (the default): one choice, `value` is a string. "multiple": any number, `value` is a list. */
  type: "multiple"
  /** The chosen chip's value; with type="multiple", the chosen chips' values. */
  value?: string[]
  /** Called with the new choice: the value, or undefined once cleared; with type="multiple", the list. */
  onValueChange?: (value: string[]) => void
}

export type ChipGroupProps = ChipGroupBase & (ChipGroupSingle | ChipGroupMultiple)

/**
 * One choice among several, or any number with `type="multiple"`, as a row of chips with how many results each gives: a
 * facet, a level, a saved view. Long rows fold after `max` chips behind "N more"; chosen chips always stay visible.
 * Chips with `href` are links (the chosen one is marked with aria-current; with several chosen, each says "selected"),
 * so a filter can live in the URL and work without JavaScript.
 */
export function ChipGroup({
  items,
  label,
  max,
  allowNone = true,
  moreLabel,
  lessLabel,
  labels,
  locale,
  linkAs: Link = "a",
  current = "page",
  className,
  ...choice
}: ChipGroupProps) {
  const multiple = choice.type === "multiple"
  const chosen = choice.type === "multiple" ? (choice.value ?? []) : choice.value === undefined ? [] : [choice.value]
  const isOn = (c: Chip) => chosen.includes(c.value)
  const l = { ...defaultChipGroupLabels, ...labels }
  const moreText = moreLabel ?? l.more
  const less = lessLabel ?? l.less
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
  const extra = (c: Chip, i: number) => max !== undefined && i >= max && !isOn(c)
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
      <button data-slot="chip-group-more"
        type="button"
        onClick={() => (expanded ? setClosing(true) : (setOpen(true), setClosing(false)))}
        aria-expanded={expanded}
        className={cn(chip, "press text-muted-foreground ring-transparent")}
      >
        {expanded ? less : moreText(hidden)}
      </button>
    ) : null
  const inner = (c: Chip) => (
    <>
      {c.label}
      {c.count !== undefined && <span className={countCls}>{formatCount(c.count, { locale })}</span>}
      {multiple && c.href && isOn(c) && <span className="sr-only">, {l.selected}</span>}
    </>
  )

  if (items.some((c) => c.href)) {
    return (
      <nav aria-label={label} data-slot="chip-group" className={className}>
        <ul className="flex flex-wrap items-center gap-2">
          {shown.map(({ c, i }) => (
            <li key={c.value} {...motion(c, i)}>
              <Link data-slot="chip-group-link"
                {...c.props}
                href={c.href}
                // One chosen link is the current one. Several chosen are links that look pressed and say "selected":
                // aria-current marks one item in a set, and links take no aria-pressed.
                aria-current={!multiple && isOn(c) ? current : undefined}
                data-state={isOn(c) ? "on" : undefined}
                className={cn(chip, c.props?.className)}
              >
                {inner(c)}
              </Link>
            </li>
          ))}
          {more && <li>{more}</li>}
        </ul>
      </nav>
    )
  }

  const chips = shown.map(({ c, i }) => (
    <ToggleGroup.Item {...c.props} key={c.value} value={c.value} {...motion(c, i)} className={cn(chip, c.props?.className, motion(c, i)?.className)}>
      {inner(c)}
    </ToggleGroup.Item>
  ))
  const rootCls = cn("flex flex-wrap items-center gap-2", className)
  if (choice.type === "multiple") {
    const onChange = choice.onValueChange
    return (
      <ToggleGroup.Root
        type="multiple"
        data-slot="chip-group"
        aria-label={label}
        value={chosen}
        onValueChange={(v) => (v.length || allowNone ? onChange?.(v) : undefined)}
        className={rootCls}
      >
        {chips}
        {more}
      </ToggleGroup.Root>
    )
  }
  const onChange = choice.onValueChange
  return (
    <ToggleGroup.Root
      type="single"
      data-slot="chip-group"
      aria-label={label}
      value={chosen[0] ?? ""}
      onValueChange={(v) => (v || allowNone ? onChange?.(v || undefined) : undefined)}
      className={rootCls}
    >
      {chips}
      {more}
    </ToggleGroup.Root>
  )
}
