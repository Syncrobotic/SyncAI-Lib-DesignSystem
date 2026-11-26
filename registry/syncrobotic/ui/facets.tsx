// @syncrobotic/facets v0.40.0 · update: npx shadcn add @syncrobotic/facets --overwrite
"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { Sheet, SheetContent, SheetFooter, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type FacetOption = {
  value: string
  label: React.ReactNode
  /** How many rows have this value, at the end of its row. */
  count?: number
}

/** One question to narrow by ("Tier", "Task"): its options are checkboxes, any of which can be on. */
export type Facet = {
  /** Its key in the value: `value[key]` holds the picked options. */
  key: string
  label: string
  options: FacetOption[]
  /** Show this many options, then "Show all N"; picked ones always show. Overrides the `max` of the whole list. */
  max?: number
}

/** The picked options of each facet, by its key. A facet with nothing picked may be missing or `[]`. */
export type FacetValue = Record<string, string[]>

export type FacetsLabels = {
  /** Names the column, the drawer and its button: "Filters". */
  title: string
  /** The button under a folded facet: "Show all 12". The count comes formatted. */
  showAll: (count: string) => string
  /** The same button once unfolded. */
  showFewer: string
  /** Read after the count on the drawer's button: "Filters 3 active". */
  active: string
  /** Clears every pick, in the drawer's footer. */
  clear: string
  /** Closes the drawer; the picks already apply. */
  done: string
}

export const defaultFacetsLabels: FacetsLabels = {
  title: "Filters",
  showAll: (count) => `Show all ${count}`,
  showFewer: "Show fewer",
  active: "active",
  clear: "Clear all",
  done: "Done",
}

type FacetsBase = {
  /** The facets, in the order to show them, each option with its count. */
  facets: Facet[]
  /** The picks, when you hold them (the URL, a query): pass the same value to `Facets` and `FacetsDrawer`. */
  value?: FacetValue
  /** The picks it starts with, when it holds them itself. */
  defaultValue?: FacetValue
  /** Called with the whole value after each pick: every facet's picks by its key. */
  onValueChange?: (value: FacetValue) => void
  /** Show this many options per facet, then "Show all N". All of them when left out. */
  max?: number
  /** Formats the counts (a BCP 47 tag such as "zh-TW"): "48,210". Left out, English (formatCount), so the server and the browser agree. */
  locale?: string
  /** The words it says, to translate them (`facetsLabels` in labels-zh-tw). */
  labels?: Partial<FacetsLabels>
}

function useFacetValue({ value, defaultValue, onValueChange }: Pick<FacetsBase, "value" | "defaultValue" | "onValueChange">) {
  const [own, setOwn] = React.useState<FacetValue>(defaultValue ?? {})
  const current = value ?? own
  const set = (next: FacetValue) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  return [current, set] as const
}

const picked = (value: FacetValue) => Object.values(value).reduce((n, v) => n + v.length, 0)

/** One facet: its legend, its options with their counts, and "Show all N" past `max`. */
function FacetGroup({
  facet,
  picks,
  onPick,
  max,
  num,
  labels: l,
}: {
  facet: Facet
  picks: string[]
  onPick: (value: string, on: boolean) => void
  max: number | undefined
  num: (n: number) => string
  labels: FacetsLabels
}) {
  const id = React.useId()
  const listRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  // Folding again: the extra options fade out where they are, then the list closes up. If animations never run, the
  // safety delay folds it anyway.
  const [closing, setClosing] = React.useState(false)
  // Unfolding moves focus to the first option it shows, which comes before the button.
  const reveal = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (!closing) return
    const t = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 400)
    return () => window.clearTimeout(t)
  }, [closing])
  React.useEffect(() => {
    if (!open || reveal.current === null) return
    listRef.current?.querySelector<HTMLElement>(`[data-facet-index="${reveal.current}"] [role=checkbox]`)?.focus()
    reveal.current = null
  }, [open])

  const limit = facet.max ?? max
  const extra = (o: FacetOption, i: number) => limit !== undefined && i >= limit && !picks.includes(o.value)
  const folds = limit !== undefined && facet.options.length > limit
  const shown = facet.options.map((o, i) => ({ o, i })).filter(({ o, i }) => open || !extra(o, i))
  const lastExtra = [...shown].reverse().find(({ o, i }) => extra(o, i))?.o.value
  const expanded = open && !closing

  return (
    <FieldSet legend={facet.label}>
      <div ref={listRef} id={`${id}-options`} className="flex flex-col">
        {shown.map(({ o, i }) => {
          const arriving = open && extra(o, i)
          return (
            <div
              key={o.value}
              data-slot="facets-option"
              data-facet-index={i}
              inert={(arriving && closing) || undefined}
              className={arriving ? (closing ? "animate-disappear" : "animate-appear") : undefined}
              onAnimationEnd={(e) => {
                if (!closing || o.value !== lastExtra || e.target !== e.currentTarget) return
                setOpen(false)
                setClosing(false)
              }}
            >
              <ChoiceField
                label={o.label}
                trailing={o.count === undefined ? undefined : num(o.count)}
                control={<Checkbox checked={picks.includes(o.value)} onCheckedChange={(c) => onPick(o.value, c === true)} />}
              />
            </div>
          )
        })}
      </div>
      {folds && (
        // Under the checkboxes, its words on their column: the ghost button leans out by its own padding.
        <Button
          data-slot="facets-show-all"
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={`${id}-options`}
          onClick={() => {
            if (expanded) return setClosing(true)
            const first = facet.options.findIndex((o, i) => extra(o, i))
            reveal.current = !open && first >= 0 ? first : null
            setOpen(true)
            setClosing(false)
          }}
          className="-ml-3 self-start text-muted-foreground hover:text-foreground"
        >
          {expanded ? l.showFewer : l.showAll(num(facet.options.length))}
        </Button>
      )}
    </FieldSet>
  )
}

/** The facets one under another, without a frame: what `Facets` and `FacetsDrawer` both hold. */
export function FacetList({
  facets,
  value: valueProp,
  defaultValue,
  onValueChange,
  max,
  locale,
  labels,
  className,
}: FacetsBase & { className?: string }) {
  const l = { ...defaultFacetsLabels, ...labels }
  const [value, setValue] = useFacetValue({ value: valueProp, defaultValue, onValueChange })
  // A count in full with grouping, in English unless a locale is asked for, so it never changes between server and browser.
  const num = (n: number) => formatCount(n, { locale })
  return (
    <div data-slot="facets-list" className={cn("flex flex-col gap-6", className)}>
      {facets.map((f) => {
        const picks = value[f.key] ?? []
        return (
          <FacetGroup
            key={f.key}
            facet={f}
            picks={picks}
            onPick={(v, on) => setValue({ ...value, [f.key]: on ? [...picks.filter((p) => p !== v), v] : picks.filter((p) => p !== v) })}
            max={max}
            num={num}
            labels={l}
          />
        )
      })}
    </div>
  )
}

/** The nearest ancestor that scrolls, or null for the page itself. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === "auto" || o === "scroll" || o === "hidden") return p
  }
  return null
}

/**
 * The facet column beside a list or a table, from 1024 px: it pins under the shell's bar (`--shell-top`) while the page
 * scrolls, and scrolls on its own when it is taller than the space under the bar. Below 1024 px it is not shown; put
 * `FacetsDrawer` in the toolbar instead, with the same value.
 */
export function Facets({ className, labels, ...props }: FacetsBase & { className?: string }) {
  const l = { ...defaultFacetsLabels, ...labels }
  const ref = React.useRef<HTMLElement>(null)
  // Its height is the visible part of whatever scrolls (the page, or app-shell's <main>) below where it pins. CSS alone
  // cannot know it inside a scrolling panel, so it is measured; the class gives the page's height until then.
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const scroller = scrollParent(el)
    const fit = () => {
      const top = parseFloat(getComputedStyle(el).top) || 0
      let height = window.innerHeight
      if (scroller) {
        // A sticky box pins inside the scroller's padding, so the padding is not part of the space.
        const s = getComputedStyle(scroller)
        height = scroller.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)
      }
      el.style.maxHeight = `${Math.max(0, height - top)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(scroller ?? document.documentElement)
    window.addEventListener("resize", fit)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", fit)
    }
  }, [])
  return (
    // Outside a shell --shell-top is unset: it pins at the top, and the fallback is a zero with a unit, as calc() needs.
    <aside
      ref={ref}
      data-slot="facets"
      aria-label={l.title}
      className={cn(
        "sticky top-[var(--shell-top,0)] hidden max-h-[calc(var(--app-shell-height,100dvh)-var(--shell-top,0dvh))] w-56 shrink-0 self-start overflow-y-auto overscroll-contain lg:block",
        // Room for the checkboxes' focus ring, which the scrolling box would otherwise cut.
        "-mx-1 px-1 pb-4",
        className,
      )}
    >
      <FacetList labels={labels} {...props} />
    </aside>
  )
}

/**
 * The facets on phones and tablets: a button that says how many options are on, opening a bottom sheet with the same
 * list. Picks apply at once, as in the column; Done closes the sheet and Clear all empties it. Hidden from 1024 px,
 * where `Facets` shows the column.
 */
export function FacetsDrawer({
  className,
  labels,
  defaultOpen,
  open: openProp,
  onOpenChange,
  ...props
}: FacetsBase & {
  /** On the button; its `lg:hidden` hides it where `Facets` shows the column. */
  className?: string
  /** Starts with the sheet open. */
  defaultOpen?: boolean
  /** Whether the sheet is open, when you hold it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const l = { ...defaultFacetsLabels, ...labels }
  const [value, setValue] = useFacetValue(props)
  const [ownOpen, setOwnOpen] = React.useState(!!defaultOpen)
  const open = openProp ?? ownOpen
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOwnOpen(o)
    onOpenChange?.(o)
  }
  const active = picked(value)
  const doneRef = React.useRef<HTMLButtonElement>(null)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button data-slot="facets-trigger" variant="secondary" className={cn("lg:hidden", className)}>
          <SlidersHorizontal aria-hidden="true" />
          {l.title}
          {active > 0 && (
            <>
              <CountBadge count={active} tone="neutral" />
              <span className="sr-only">{l.active}</span>
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="sm:mx-auto sm:w-full sm:max-w-md">
        <SheetTitle>{l.title}</SheetTitle>
        <FacetList {...props} labels={labels} value={value} onValueChange={setValue} />
        <SheetFooter className="flex-row">
          {/* Disabled with nothing on, rather than gone, so the footer does not jump; once pressed, focus moves to Done. */}
          <Button
            data-slot="facets-clear"
            variant="ghost"
            disabled={active === 0}
            onClick={() => {
              setValue({})
              doneRef.current?.focus()
            }}
          >
            {l.clear}
          </Button>
          <Button ref={doneRef} data-slot="facets-done" className="flex-1" onClick={() => setOpen(false)}>
            {l.done}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
