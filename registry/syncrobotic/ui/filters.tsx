// @syncrobotic/filters v0.40.0 · update: npx shadcn add @syncrobotic/filters --overwrite
"use client"

import * as React from "react"
import { format as formatDate } from "date-fns"
import { ChevronLeft, Plus, Save, Undo2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-count"
import { usePresence, usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Calendar } from "@/registry/syncrobotic/ui/calendar"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { Command, CommandCheck, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/registry/syncrobotic/ui/command"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/registry/syncrobotic/ui/popover"

/* ------------------------------------------------------------------------------------------------------------------ */
/* The query model: plain, serialisable data. Nothing below needs React.                                              */
/* ------------------------------------------------------------------------------------------------------------------ */

export type FilterOption = {
  value: string
  label: string
  /** An icon before the label (a Lucide icon with aria-hidden). */
  icon?: React.ReactNode
  /** How many rows have this value, shown at the end of its row in the picker. */
  count?: number
}

type FieldBase = {
  /** The row property it reads, and its name in the URL. */
  key: string
  label: string
  icon?: React.ReactNode
  /** Reads the value from a row when it is not `row[key]`. */
  accessor?(row: object): unknown
}

/** What a rule can be about. The type decides its operators and how its value is entered. */
export type FilterField =
  | (FieldBase & { type: "text"; placeholder?: string })
  | (FieldBase & { type: "option"; options: FilterOption[]; /** Several values at once: "is any of" / "is none of". */ multiple?: boolean })
  | (FieldBase & { type: "number"; unit?: string; min?: number; max?: number; step?: number })
  | (FieldBase & { type: "date"; /** date-fns pattern for the chip. */ displayFormat?: string })
  | (FieldBase & { type: "boolean" })

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "any_of"
  | "none_of"
  | "eq"
  | "neq"
  | "lt"
  | "gt"
  | "between"
  | "before"
  | "after"
  | "is_true"
  | "is_false"

/**
 * A rule's value: text, one option, several options (`string[]`), a number, a `[low, high]` range, a day as
 * "yyyy-MM-dd", or two days. Boolean rules carry `null`: the operator says it all.
 */
export type FilterValue = string | number | string[] | [number, number] | null

/** One rule of the query. Rules combine with AND. */
export type FilterRule = { id: string; field: string; operator: FilterOperator; value: FilterValue }

/** The operators a field offers, in the order the picker lists them; the first is the default. */
export function operatorsFor(field: FilterField): FilterOperator[] {
  switch (field.type) {
    case "text":
      return ["contains", "not_contains", "is"]
    case "option":
      return field.multiple ? ["any_of", "none_of"] : ["is", "is_not"]
    case "number":
      return ["eq", "neq", "lt", "gt", "between"]
    case "date":
      return ["is", "before", "after", "between"]
    case "boolean":
      return ["is_true", "is_false"]
  }
}

type Shape = "none" | "text" | "one" | "many" | "number" | "numbers" | "day" | "days"

/** What kind of value a field and operator take. Two operators with the same shape can swap without losing the value. */
function shapeOf(field: FilterField, operator: FilterOperator): Shape {
  switch (field.type) {
    case "text":
      return "text"
    case "option":
      return field.multiple ? "many" : "one"
    case "number":
      return operator === "between" ? "numbers" : "number"
    case "date":
      return operator === "between" ? "days" : "day"
    case "boolean":
      return "none"
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n)

/** Whether a rule says enough to filter by. An incomplete rule matches every row. */
export function isComplete(rule: FilterRule, field: FilterField) {
  if (!operatorsFor(field).includes(rule.operator)) return false
  const v = rule.value
  switch (shapeOf(field, rule.operator)) {
    case "none":
      return true
    case "text":
      return typeof v === "string" && v.trim() !== ""
    case "one":
      return typeof v === "string" && v !== ""
    case "many":
      return Array.isArray(v) && v.length > 0
    case "number":
      return finite(v)
    case "numbers":
      return Array.isArray(v) && v.length === 2 && finite(v[0]) && finite(v[1])
    case "day":
      return typeof v === "string" && DAY.test(v)
    case "days":
      return Array.isArray(v) && v.length === 2 && v.every((d) => typeof d === "string" && DAY.test(d))
  }
}

/** A day as "yyyy-MM-dd" in local time, from a Date, a timestamp or an ISO string. */
function toDay(raw: unknown): string | null {
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw) && raw.length <= 10) return raw.slice(0, 10)
  if (raw instanceof Date || typeof raw === "number" || typeof raw === "string") {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : formatDate(d, "yyyy-MM-dd")
  }
  return null
}

const read = (row: object, field: FilterField) => (field.accessor ? field.accessor(row) : (row as Record<string, unknown>)[field.key])

/** Whether one row passes one rule. Text compares without case; ranges include both ends; days compare by calendar day. */
export function matchRule(rule: FilterRule, row: object, field: FilterField): boolean {
  if (!isComplete(rule, field)) return true
  const raw = read(row, field)
  const v = rule.value
  const op = rule.operator
  switch (field.type) {
    case "text": {
      const s = String(raw ?? "").toLowerCase()
      const q = String(v).trim().toLowerCase()
      return op === "contains" ? s.includes(q) : op === "not_contains" ? !s.includes(q) : s === q
    }
    case "option": {
      const have = (Array.isArray(raw) ? raw : raw == null ? [] : [raw]).map(String)
      const hit = (Array.isArray(v) ? v.map(String) : [String(v)]).some((w) => have.includes(w))
      return op === "is" || op === "any_of" ? hit : !hit
    }
    case "number": {
      const n = typeof raw === "number" ? raw : raw == null || raw === "" ? NaN : Number(raw)
      if (!Number.isFinite(n)) return false
      if (op === "between") {
        const [a, b] = v as [number, number]
        return n >= Math.min(a, b) && n <= Math.max(a, b)
      }
      const x = v as number
      return op === "eq" ? n === x : op === "neq" ? n !== x : op === "lt" ? n < x : n > x
    }
    case "date": {
      const d = toDay(raw)
      if (!d) return false
      if (op === "between") {
        // Either end may come first; ISO days compare as strings, so the smaller one is the start.
        const [from, to] = v as [string, string]
        const [a, b] = from <= to ? [from, to] : [to, from]
        return d >= a && d <= b
      }
      const x = v as string
      return op === "is" ? d === x : op === "before" ? d < x : d > x
    }
    case "boolean":
      return Boolean(raw) === (op === "is_true")
  }
}

/** Whether a row passes every rule (AND). Rules about a field that is not in `fields` are ignored. */
export function matchRules(rules: FilterRule[], row: object, fields: FilterField[]) {
  return rules.every((r) => {
    const f = fields.find((x) => x.key === r.field)
    return !f || matchRule(r, row, f)
  })
}

/** The rows that pass every rule, for filtering data already in the browser. */
export function filterRows<T extends object>(rows: T[], rules: FilterRule[], fields: FilterField[]): T[] {
  return rules.length === 0 ? rows : rows.filter((row) => matchRules(rules, row, fields))
}

/**
 * The rules as URL parameters, one per rule: `field=operator:value`. Lists and ranges are comma-separated, each part
 * URI-encoded: `?status=any_of:offline,stopped&battery=between:20,80&charging=is_true`. Incomplete rules are left out.
 * `prefix` keeps them apart from the page's own parameters (`f.status=…`).
 */
export function toSearchParams(rules: FilterRule[], { prefix = "" }: { prefix?: string } = {}) {
  const params = new URLSearchParams()
  for (const r of rules) {
    const v = r.value
    const boolean = r.operator === "is_true" || r.operator === "is_false"
    if (!boolean && (v === null || v === "" || (Array.isArray(v) && v.length === 0))) continue
    const text = boolean || v === null ? "" : Array.isArray(v) ? v.map((x) => encodeURIComponent(String(x))).join(",") : String(v)
    params.append(prefix + r.field, text === "" ? r.operator : `${r.operator}:${text}`)
  }
  return params
}

/**
 * The same as a query string that stays readable in the address bar: the `:` and `,` that separate operator and values
 * are left as they are (`status=any_of:offline,stopped`); everything else is encoded. No leading "?".
 */
export function toQueryString(rules: FilterRule[], options: { prefix?: string } = {}) {
  return toSearchParams(rules, options).toString().replace(/%3A/gi, ":").replace(/%2C/gi, ",")
}

type ParamsLike = URLSearchParams | string | Record<string, string | string[] | undefined>

const entriesOf = (params: ParamsLike): [string, string][] =>
  params instanceof URLSearchParams
    ? [...params.entries()]
    : typeof params === "string"
      ? [...new URLSearchParams(params).entries()]
      : Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [v].flat().map((x): [string, string] => [k, x])))

const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return null
  }
}

function parseValue(field: FilterField, operator: FilterOperator, text: string): FilterValue | undefined {
  const parts = text === "" ? [] : text.split(",").map(decode)
  if (parts.some((p) => p === null)) return undefined
  const list = parts as string[]
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s))
  switch (shapeOf(field, operator)) {
    case "none":
      return null
    case "text":
      return text.trim() === "" ? undefined : text
    case "one":
      return field.type === "option" && field.options.some((o) => o.value === text) ? text : undefined
    case "many": {
      const known = field.type === "option" ? list.filter((p) => field.options.some((o) => o.value === p)) : []
      return known.length ? [...new Set(known)] : undefined
    }
    case "number":
      return Number.isFinite(num(text)) ? num(text) : undefined
    case "numbers":
      return list.length === 2 && list.every((p) => Number.isFinite(num(p))) ? [num(list[0]!), num(list[1]!)] : undefined
    case "day":
      return DAY.test(text) ? text : undefined
    case "days":
      return list.length === 2 && list.every((p) => DAY.test(p)) ? list : undefined
  }
}

/**
 * Rules back from URL parameters (a URLSearchParams, a query string, or Next.js `searchParams`), in the order they
 * appear. Parameters that are not a field, operators the field does not offer and values it cannot take are skipped,
 * so a hand-edited or stale link never breaks the page. Ids are stable: the field and its count, `status-0`.
 */
export function fromSearchParams(params: ParamsLike, fields: FilterField[], { prefix = "" }: { prefix?: string } = {}): FilterRule[] {
  const rules: FilterRule[] = []
  const seen = new Map<string, number>()
  for (const [k, raw] of entriesOf(params)) {
    if (!k.startsWith(prefix)) continue
    const field = fields.find((f) => f.key === k.slice(prefix.length))
    if (!field) continue
    const at = raw.indexOf(":")
    const operator = (at < 0 ? raw : raw.slice(0, at)) as FilterOperator
    if (!operatorsFor(field).includes(operator)) continue
    const value = parseValue(field, operator, at < 0 ? "" : raw.slice(at + 1))
    if (value === undefined) continue
    const n = seen.get(field.key) ?? 0
    seen.set(field.key, n + 1)
    rules.push({ id: `${field.key}-${n}`, field: field.key, operator, value })
  }
  return rules
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Words. Every string is a prop; these are the English defaults.                                                     */
/* ------------------------------------------------------------------------------------------------------------------ */

export const defaultFilterLabels = {
  /** Names the whole bar. */
  label: "Filters",
  add: "Filter",
  clear: "Clear all",
  /** Between chips: rules combine with AND. */
  and: "and",
  /** Names the list of chips, so a screen reader hears how they combine. */
  matchAll: "Active filters, all must match",
  chooseField: "Choose a field",
  chooseOperator: (field: string) => `${field}: choose an operator`,
  enterValue: (field: string, operator: string) => `${field} ${operator}: enter a value`,
  chooseValue: (field: string, operator: string) => `${field} ${operator}: choose a value`,
  searchFields: "Search fields",
  searchOperators: "Search operators",
  searchOptions: "Search values",
  noMatches: "No matches. Try another word.",
  apply: "Apply",
  back: "Back",
  from: "From",
  to: "To",
  /** Accessible names of the chip's parts. They start with the words shown (WCAG 2.5.3). */
  editField: (text: string) => `${text}, change field`,
  editOperator: (text: string) => `${text}, change operator`,
  editValue: (text: string) => `${text}, change value`,
  remove: (rule: string) => `Remove filter: ${rule}`,
  /** Several values on a chip: the first and how many more. */
  more: (first: string, more: number) => `${first} +${more}`,
  operators: {
    contains: "contains",
    not_contains: "does not contain",
    is: "is",
    is_not: "is not",
    any_of: "is any of",
    none_of: "is none of",
    eq: "=",
    neq: "≠",
    lt: "<",
    gt: ">",
    between: "between",
    before: "before",
    after: "after",
    is_true: "is true",
    is_false: "is false",
  } as Record<FilterOperator, string>,
}

export type FilterLabels = Omit<typeof defaultFilterLabels, "operators"> & { operators: Record<FilterOperator, string> }

// Angles sit on the number ("-2.5°"); every other unit is one space away, as in NumberField.
const withUnit = (n: number, unit?: string) => (unit ? `${n}${unit === "°" ? "" : " "}${unit}` : String(n))
// Callers check the day's shape (DAY) first. A part that is missing anyway gives an invalid date, as it always has.
const fromDay = (d: string) => {
  const [y = NaN, m = NaN, day = NaN] = d.split("-").map(Number)
  return new Date(y, m - 1, day)
}

/** The value as the chip shows it: "Offline", "20 – 80 %", "3 Nov 2026". */
export function describeValue(rule: FilterRule, field: FilterField, labels: Pick<FilterLabels, "more"> = defaultFilterLabels): string {
  const v = rule.value
  if (v === null || field.type === "boolean") return ""
  switch (field.type) {
    case "text":
      return String(v)
    case "option": {
      const names = [v].flat().map((x) => field.options.find((o) => o.value === x)?.label ?? String(x))
      return names.length > 1 ? labels.more(names[0]!, names.length - 1) : (names[0] ?? "")
    }
    case "number":
      return Array.isArray(v) ? `${v[0]} – ${withUnit(Number(v[1]), field.unit)}` : withUnit(Number(v), field.unit)
    case "date": {
      const f = (d: string) => (DAY.test(d) ? formatDate(fromDay(d), field.displayFormat ?? "d MMM yyyy") : d)
      if (!Array.isArray(v)) return f(String(v))
      const [a, b] = [String(v[0]), String(v[1])]
      // A range within one year says the year once: "1 Feb – 31 Oct 2026".
      if (!field.displayFormat && DAY.test(a) && DAY.test(b) && a.slice(0, 4) === b.slice(0, 4)) return `${formatDate(fromDay(a), "d MMM")} – ${f(b)}`
      return `${f(a)} – ${f(b)}`
    }
  }
}

let counter = 0
const newId = () => `rule-${Date.now().toString(36)}-${(counter++).toString(36)}`
const keyOf = (r: FilterRule) => r.id

/* ------------------------------------------------------------------------------------------------------------------ */
/* The bar                                                                                                            */
/* ------------------------------------------------------------------------------------------------------------------ */

type Step = "field" | "operator" | "value"
type Editing = { id: string | null; step: Step }

// One part of a chip. The inset ring keeps a focused part's outline inside the chip, clear of its neighbours.
// Several values: the first name truncates, the count after it ("+1") always stays in view.
// The text is already built with labels.more (describeValue), so a translation is applied there; this only splits it.
function ValueText({ rule, field, text }: { rule: FilterRule; field: FilterField; text: string }) {
  const v = rule.value
  if (field.type === "option" && Array.isArray(v) && v.length > 1) {
    const first = field.options.find((o) => o.value === v[0])?.label ?? String(v[0])
    if (text.startsWith(first) && text.length > first.length) {
      return (
        <span className="flex min-w-0 items-baseline">
          <span className="truncate">{first}</span>
          <span className="shrink-0 whitespace-pre">{text.slice(first.length)}</span>
        </span>
      )
    }
  }
  return <span className="truncate">{text}</span>
}

const segment = cn("press inline-flex h-full min-w-(--h-sm) items-center justify-center gap-2 px-3 text-sm whitespace-nowrap hover:bg-accent",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
  "data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0",
)

/**
 * A row of filter rules the user builds: "+ Filter" opens a picker (field, then operator, then value) and each rule
 * becomes a chip, "Status | is | Offline", whose parts reopen that step to amend it. Rules combine with AND, said
 * between the chips. The value is a plain array of rules: keep it in the URL with `toSearchParams` /
 * `fromSearchParams`, and filter rows in the browser with `filterRows` (or `matchRule` per rule).
 * Every step works from the keyboard: Enter opens, arrows and Enter choose, Escape backs out one step.
 */
export function Filters({
  fields,
  value,
  defaultValue,
  onValueChange,
  labels: given,
  locale,
  className,
}: {
  fields: FilterField[]
  value?: FilterRule[]
  defaultValue?: FilterRule[]
  onValueChange?: (rules: FilterRule[]) => void
  labels?: Partial<Omit<FilterLabels, "operators">> & { operators?: Partial<Record<FilterOperator, string>> }
  /** Formats the options' counts (a BCP 47 tag such as "zh-TW"). Left out, English, so the server and the browser write the same. */
  locale?: string
  className?: string
}) {
  const labels: FilterLabels = { ...defaultFilterLabels, ...given, operators: { ...defaultFilterLabels.operators, ...given?.operators } }
  const [inner, setInner] = React.useState<FilterRule[]>(defaultValue ?? [])
  const rules = value ?? inner
  const set = (next: FilterRule[]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const fieldOf = (key: string) => fields.find((f) => f.key === key)
  const shown = rules.filter((r) => fieldOf(r.field))
  const { rendered, done } = usePresenceList(shown, keyOf)
  // Chips there from the start are simply there; only the ones added later appear.
  const [initial] = React.useState(() => new Set(rules.map(keyOf)))
  const clear = usePresence(shown.length > 0)

  const [editing, setEditing] = React.useState<Editing | null>(null)
  // Each opening starts the picker afresh; the last one stays drawn while the popover leaves.
  const [session, setSession] = React.useState(0)
  const [last, setLast] = React.useState<Editing>({ id: null, step: "field" })
  const addRef = React.useRef<HTMLButtonElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const removeRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const focusNext = React.useRef<string | null>(null)

  // After a removal, focus the next chip's remove button (or the previous one, or "+ Filter"), so pressing it again
  // keeps clearing and focus never falls to the page.
  React.useEffect(() => {
    const id = focusNext.current
    if (id === null) return
    focusNext.current = null
    const target = id ? removeRefs.current.get(id) : undefined
    ;(target ?? addRef.current)?.focus()
  }, [rules])

  const open = (id: string | null, step: Step, from: HTMLElement) => {
    returnTo.current = from
    setEditing({ id, step })
    setLast({ id, step })
    setSession((n) => n + 1)
  }
  const commit = (rule: FilterRule) => {
    set(rules.some((r) => r.id === rule.id) ? rules.map((r) => (r.id === rule.id ? rule : r)) : [...rules, rule])
    setEditing(null)
  }
  const remove = (id: string) => {
    const i = shown.findIndex((r) => r.id === id)
    focusNext.current = (shown[i + 1] ?? shown[i - 1])?.id ?? ""
    set(rules.filter((r) => r.id !== id))
  }
  const restoreFocus = (e: Event) => {
    e.preventDefault()
    const el = returnTo.current
    ;(el?.isConnected ? el : addRef.current)?.focus()
  }

  const picker = (rule: FilterRule | null) =>
    last.id === (rule?.id ?? null) && (
      <Picker
        key={session}
        fields={fields}
        rule={rule}
        start={last.step}
        labels={labels}
        locale={locale}
        onCommit={commit}
        onCancel={() => setEditing(null)}
        onCloseAutoFocus={restoreFocus}
        // A press on another part of the same chip is not "outside": it moves the picker to that part's step instead of
        // closing it and leaving the person to click again.
        onInteractOutside={(e) => {
          const chip = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-slot=filters-chip]") : null
          if (rule && chip?.dataset.rule === rule.id) e.preventDefault()
        }}
      />
    )

  return (
    // min-w-0: in a toolbar row the bar may be narrower than its longest chip, so a long chip shrinks (its value
    // truncates) and its × stays on screen instead of the row running off a phone.
    <div role="group" aria-label={labels.label} data-slot="filters" className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {rendered.length > 0 && (
        <ul aria-label={labels.matchAll} className="contents">
          {rendered.map(({ item: r, leaving }, i) => {
            const field = fieldOf(r.field)!
            const op = labels.operators[r.operator]
            const val = describeValue(r, field, labels)
            const desc = [field.label, op, val].filter(Boolean).join(" ")
            const isOpen = editing?.id === r.id
            const part = (step: Step) => ({
              type: "button" as const,
              "aria-haspopup": "dialog" as const,
              "aria-expanded": isOpen && editing?.step === step,
              "data-state": isOpen && editing?.step === step ? "open" : "closed",
            })
            // Another part of the open chip switches the picker to that step in place; the part already open closes it.
            // The handler is written on each button rather than returned by part(), which runs during render, so the
            // React Compiler can tell that the refs open() writes are only touched on a click.
            const toggle = (step: Step, el: HTMLElement) => (isOpen && editing?.step === step ? setEditing(null) : open(r.id, step, el))
            return (
              <li
                key={r.id}
                data-slot="filters-rule"
                inert={leaving || undefined}
                onAnimationEnd={(e) => leaving && e.target === e.currentTarget && done(r.id)}
                className={cn("flex max-w-full min-w-0 items-center gap-2", leaving ? "animate-disappear" : !initial.has(r.id) && "animate-appear")}
              >
                {i > 0 && (
                  <span aria-hidden="true" className="text-xs text-muted-foreground">
                    {labels.and}
                  </span>
                )}
                <Popover open={isOpen} onOpenChange={(o) => !o && setEditing(null)}>
                  <PopoverAnchor asChild>
                    <div
                      role="group"
                      aria-label={desc}
                      data-slot="filters-chip"
                      data-rule={r.id}
                      className="flex h-(--h-sm) max-w-full min-w-0 items-stretch overflow-hidden rounded-xs bg-card ring-1 ring-border ring-inset [&>*+*]:border-l [&>*+*]:border-border"
                    >
                      <button data-slot="filters-field" {...part("field")} onClick={(e) => toggle("field", e.currentTarget)} aria-label={labels.editField(field.label)} className={cn(segment, "shrink-0")}>
                        {field.icon}
                        {field.label}
                      </button>
                      <button data-slot="filters-operator" {...part("operator")} onClick={(e) => toggle("operator", e.currentTarget)} aria-label={labels.editOperator(op)} className={cn(segment, "shrink-0 text-muted-foreground")}>
                        {op}
                      </button>
                      {val && (
                        <button data-slot="filters-value" {...part("value")} onClick={(e) => toggle("value", e.currentTarget)} aria-label={labels.editValue(val)} className={cn(segment, "font-medium")}>
                          {field.type === "option" && !field.multiple && field.options.find((o) => o.value === r.value)?.icon}
                          <ValueText rule={r} field={field} text={val} />
                        </button>
                      )}
                      <button data-slot="filters-remove"
                        type="button"
                        ref={(el) => {
                          if (el) removeRefs.current.set(r.id, el)
                          else removeRefs.current.delete(r.id)
                        }}
                        aria-label={labels.remove(desc)}
                        onClick={() => remove(r.id)}
                        className={cn(segment, "w-(--h-sm) shrink-0 justify-center px-0 text-muted-foreground hover:text-foreground")}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  {picker(r)}
                </Popover>
              </li>
            )
          })}
        </ul>
      )}
      {/* + Filter and Clear all wrap as one, so Clear all is never left alone on a line of its own. */}
      <div className="flex items-center gap-2">
        <Popover open={editing?.id === null} onOpenChange={(o) => !o && setEditing(null)}>
          <PopoverAnchor asChild>
            <Button
              ref={addRef}
              variant="outline"
              size="sm"
              aria-haspopup="dialog"
              aria-expanded={editing?.id === null}
              onClick={(e) => open(null, "field", e.currentTarget)}
            >
              <Plus aria-hidden="true" />
              {labels.add}
            </Button>
          </PopoverAnchor>
          {picker(null)}
        </Popover>
        {clear.mounted && (
          <Button
            variant="ghost"
            size="sm"
            inert={clear.leaving || undefined}
            onAnimationEnd={(e) => e.target === e.currentTarget && clear.done()}
            className={clear.leaving ? "animate-disappear" : "animate-appear"}
            onClick={() => {
              focusNext.current = ""
              set([])
            }}
          >
            {labels.clear}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* The picker: one popover, three steps                                                                               */
/* ------------------------------------------------------------------------------------------------------------------ */

function Picker({
  fields,
  rule,
  start,
  labels,
  locale,
  onCommit,
  onCancel,
  onCloseAutoFocus,
  onInteractOutside,
}: {
  fields: FilterField[]
  /** The rule being amended; null for a new one. */
  rule: FilterRule | null
  start: Step
  labels: FilterLabels
  locale?: string
  onCommit: (rule: FilterRule) => void
  onCancel: () => void
  onCloseAutoFocus: (e: Event) => void
  onInteractOutside?: (e: Event) => void
}) {
  const [draft, setDraft] = React.useState<{ field?: string; operator?: FilterOperator; value: FilterValue }>(
    rule ? { field: rule.field, operator: rule.operator, value: rule.value } : { value: null },
  )
  // The steps taken in this visit; Escape and Back walk them back, then close.
  const [steps, setSteps] = React.useState<Step[]>([start])
  const step = steps[steps.length - 1]
  const field = fields.find((f) => f.key === draft.field)
  const opLabel = draft.operator ? labels.operators[draft.operator] : ""
  const back = () => (steps.length > 1 ? setSteps(steps.slice(0, -1)) : onCancel())
  const finish = (operator: FilterOperator, value: FilterValue) => onCommit({ id: rule?.id ?? newId(), field: field!.key, operator, value })

  const pickField = (f: FilterField) => {
    // The same field keeps its operator and value; another starts over.
    if (f.key !== draft.field) setDraft({ field: f.key, operator: operatorsFor(f)[0], value: null })
    setSteps([...steps, "operator"])
  }
  const pickOperator = (op: FilterOperator) => {
    if (!field) return
    const shape = shapeOf(field, op)
    if (shape === "none") return finish(op, null)
    const keeps = draft.operator !== undefined && shapeOf(field, draft.operator) === shape
    const value = keeps ? draft.value : null
    // Amending only the operator: a value that still fits is kept, and the rule is done.
    if (rule && keeps && isComplete({ id: "", field: field.key, operator: op, value }, field)) return finish(op, value)
    setDraft({ ...draft, operator: op, value })
    setSteps([...steps, "value"])
  }

  const title =
    step === "field" || !field
      ? labels.chooseField
      : step === "operator"
        ? labels.chooseOperator(field.label)
        : field.type === "option" || field.type === "date"
          ? labels.chooseValue(field.label, opLabel)
          : labels.enterValue(field.label, opLabel)

  return (
    <PopoverContent
      align="start"
      collisionPadding={16}
      aria-label={title}
      data-slot="filters-picker"
      // Focus goes to the step's own control (its search box, field or day), never the Back button.
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={onCloseAutoFocus}
      onInteractOutside={onInteractOutside}
      onEscapeKeyDown={(e) => {
        if (steps.length > 1) {
          e.preventDefault()
          back()
        }
      }}
      // Never taller or wider than the room beside the trigger: on a phone the calendar and its Apply button scroll.
      className={cn("max-h-(--radix-popover-content-available-height) max-w-(--radix-popover-content-available-width) overflow-x-hidden overflow-y-auto overscroll-contain p-0", step === "value" && field?.type === "date" ? "w-auto" : "w-72")}
    >
      <p role="status" className="sr-only">
        {title}
      </p>
      {step !== "field" && field && (
        <div className="flex items-center gap-2 border-b border-border p-1 pr-3">
          <button data-slot="filters-back"
            type="button"
            aria-label={labels.back}
            onClick={back}
            className="press flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <span className="min-w-0 truncate text-sm font-medium">{step === "operator" ? field.label : `${field.label} ${opLabel}`}</span>
        </div>
      )}
      {step === "field" && (
        <Command label={title} loop defaultValue={draft.field}>
          <CommandInput autoFocus placeholder={labels.searchFields} />
          <CommandList className="max-h-72">
            <CommandEmpty>{labels.noMatches}</CommandEmpty>
            {fields.map((f) => (
              <CommandItem key={f.key} value={f.key} keywords={[f.label]} onSelect={() => pickField(f)}>
                {/* When some fields have an icon, the others keep its space so every name starts on one line. */}
                {f.icon ?? (fields.some((x) => x.icon) && <span aria-hidden="true" className="size-4 shrink-0" />)}
                <span className="truncate">{f.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      )}
      {step === "operator" && field && (
        <Command label={title} loop defaultValue={draft.operator}>
          <CommandInput autoFocus placeholder={labels.searchOperators} />
          <CommandList className="max-h-72">
            <CommandEmpty>{labels.noMatches}</CommandEmpty>
            {operatorsFor(field).map((op) => (
              <CommandItem key={op} value={op} keywords={[labels.operators[op]]} onSelect={() => pickOperator(op)}>
                {labels.operators[op]}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      )}
      {step === "value" && field && draft.operator && (
        <ValueStep field={field} operator={draft.operator} value={draft.value} title={title} labels={labels} locale={locale} onApply={(v) => finish(draft.operator!, v)} />
      )}
    </PopoverContent>
  )
}

function ValueStep({
  field,
  operator,
  value,
  title,
  labels,
  locale,
  onApply,
}: {
  field: FilterField
  operator: FilterOperator
  value: FilterValue
  title: string
  labels: FilterLabels
  locale?: string
  onApply: (value: FilterValue) => void
}) {
  const id = React.useId()
  const [text, setText] = React.useState(typeof value === "string" ? value : "")
  const [picked, setPicked] = React.useState<string[]>(Array.isArray(value) ? value.map(String) : [])
  const [range, setRange] = React.useState<[number | null, number | null]>(
    Array.isArray(value) && value.length === 2 ? [Number(value[0]), Number(value[1])] : [null, null],
  )
  const [num, setNum] = React.useState<number | null>(typeof value === "number" ? value : null)
  const [days, setDays] = React.useState<{ from?: Date; to?: Date } | undefined>(
    Array.isArray(value) && value.length === 2 && DAY.test(String(value[0])) ? { from: fromDay(String(value[0])), to: fromDay(String(value[1])) } : undefined,
  )
  if (field.type === "text")
    return (
      <form
        className="flex flex-col gap-3 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) onApply(text.trim())
        }}
      >
        <Input autoFocus aria-label={title} placeholder={field.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" size="sm" disabled={!text.trim()}>
          {labels.apply}
        </Button>
      </form>
    )

  if (field.type === "option") {
    const multiple = !!field.multiple
    // Apply sits outside the list: cmdk takes Enter anywhere inside it to pick the highlighted row.
    return (
      <>
        <Command label={title} loop defaultValue={multiple ? undefined : typeof value === "string" ? value : undefined}>
          <CommandInput autoFocus placeholder={labels.searchOptions} />
          <CommandList className="max-h-72">
            <CommandEmpty>{labels.noMatches}</CommandEmpty>
            {field.options.map((o) => {
              const on = picked.includes(o.value)
              return (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={[o.label]}
                  aria-checked={multiple ? on : undefined}
                  onSelect={() => (multiple ? setPicked(on ? picked.filter((p) => p !== o.value) : [...picked, o.value]) : onApply(o.value))}
                >
                  {multiple && <CommandCheck checked={on} />}
                  {o.icon}
                  <span className="truncate">{o.label}</span>
                  {o.count !== undefined && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatCount(o.count, { locale })}</span>}
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
        {multiple && (
          <div className="border-t border-border p-2">
            <Button size="sm" className="w-full" disabled={picked.length === 0} onClick={() => onApply(picked)}>
              {labels.apply}
            </Button>
          </div>
        )}
      </>
    )
  }

  if (field.type === "number") {
    const clamp = (n: number) => Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, n))
    // NumberField keeps what is typed until Enter or blur; read the box itself so one Enter both commits and applies.
    const typed = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const t = e.currentTarget.value.trim().replace(",", ".")
      return t === "" || !Number.isFinite(Number(t)) ? null : clamp(Number(t))
    }
    const common = { min: field.min, max: field.max, step: field.step, unit: field.unit, className: "w-full" }
    if (operator === "between") {
      const done = (r: [number | null, number | null]) => r[0] !== null && r[1] !== null
      const go = (r: [number | null, number | null]) => {
        const [a, b] = [r[0]!, r[1]!]
        onApply([Math.min(a, b), Math.max(a, b)])
      }
      const enter = (i: 0 | 1) => (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return
        const next: [number | null, number | null] = [...range]
        next[i] = typed(e)
        setRange(next)
        if (done(next)) go(next)
        else document.getElementById(`${id}-${next[0] === null ? 0 : 1}`)?.focus()
      }
      return (
        <div role="group" aria-label={title} className="flex flex-col gap-3 p-3">
          {([0, 1] as const).map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <label htmlFor={`${id}-${i}`} className="text-xs text-muted-foreground">
                {i === 0 ? labels.from : labels.to}
              </label>
              <NumberField
                {...common}
                id={`${id}-${i}`}
                autoFocus={i === 0}
                value={range[i]}
                onValueChange={(n) => setRange((r) => (i === 0 ? [n, r[1]] : [r[0], n]))}
                onKeyDown={enter(i)}
              />
            </div>
          ))}
          <Button size="sm" disabled={!done(range)} onClick={() => go(range)}>
            {labels.apply}
          </Button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-3 p-3">
        <NumberField
          {...common}
          autoFocus
          aria-label={title}
          value={num}
          onValueChange={setNum}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            const n = typed(e)
            if (n !== null) onApply(n)
          }}
        />
        <Button size="sm" disabled={num === null} onClick={() => num !== null && onApply(num)}>
          {labels.apply}
        </Button>
      </div>
    )
  }

  if (field.type === "date") {
    const iso = (d: Date) => formatDate(d, "yyyy-MM-dd")
    if (operator === "between")
      return (
        <div role="group" aria-label={title} className="flex flex-col gap-3 p-3">
          <Calendar mode="range" selected={days?.from ? { from: days.from, to: days.to } : undefined} onSelect={(r) => setDays(r ?? undefined)} defaultMonth={days?.from} autoFocus />
          <Button size="sm" disabled={!days?.from || !days.to} onClick={() => days?.from && days.to && onApply([iso(days.from), iso(days.to)])}>
            {labels.apply}
          </Button>
        </div>
      )
    const day = typeof value === "string" && DAY.test(value) ? fromDay(value) : undefined
    return (
      <div role="group" aria-label={title} className="p-3">
        <Calendar mode="single" selected={day} onSelect={(d) => d && onApply(iso(d))} defaultMonth={day} autoFocus />
      </div>
    )
  }

  return null
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Saved views                                                                                                        */
/* ------------------------------------------------------------------------------------------------------------------ */

/** A named set of rules people come back to: "Needs attention", "Low battery at Hall B". Kept by the app, not the kit. */
export type FilterView = {
  id: string
  label: string
  rules: FilterRule[]
  /** How many rows the view gives, shown after its name. */
  count?: number
}

// One rule as text that ignores its id and the order of its values ("offline,stopped" = "stopped,offline"; a range
// [80, 20] = [20, 80], as matchRule reads it either way).
const ruleKey = (r: FilterRule) => {
  const v = Array.isArray(r.value) ? [...r.value].map((x) => JSON.stringify(x)).sort() : [JSON.stringify(r.value)]
  return `${r.field}\u0000${r.operator}\u0000${v.join(",")}`
}

/**
 * Whether two lists of rules say the same thing: the same rules in any order, each rule's values in any order. Ids
 * are not compared, so rules read back from the URL (`status-0`) still equal the view they came from.
 */
export function rulesEqual(a: FilterRule[], b: FilterRule[]) {
  if (a.length !== b.length) return false
  const x = a.map(ruleKey).sort()
  const y = b.map(ruleKey).sort()
  return x.every((k, i) => k === y[i])
}

export type FilterViewsLabels = {
  /** Names the row of views. */
  label: string
  /** Said when the rules no longer equal the view last chosen. */
  modified: string
  /** The action that puts the view's rules back. */
  reset: string
  /** Its accessible name, starting with the words shown (WCAG 2.5.3). */
  resetTo: (view: string) => string
  /** Opens the box that names a new view. */
  save: string
  /** The name field's label. */
  name: string
  /** Saves it. */
  confirm: string
}

export const defaultFilterViewsLabels: FilterViewsLabels = {
  label: "Saved views",
  modified: "Modified",
  reset: "Reset",
  resetTo: (view) => `Reset to ${view}`,
  save: "Save view",
  name: "View name",
  confirm: "Save",
}

/**
 * Saved views above a Filters bar: one chip per view, and the view whose rules equal the current rules is chosen.
 * Change a rule and the chip lets go, "Modified" shows beside the row with Reset, which puts that view's rules back.
 * With `onSave`, "Save view" asks for a name and hands you the name and the rules; storing views is the app's job.
 */
export function FilterViews({
  views,
  rules,
  onSelect,
  onSave,
  labels: given,
  locale,
  className,
}: {
  views: FilterView[]
  /** The rules in force now, the same array the Filters bar shows. */
  rules: FilterRule[]
  /** A view was chosen, or Reset pressed: set the rules to `view.rules`. */
  onSelect: (view: FilterView) => void
  /** Shows "Save view". Called with the name typed and the current rules; add the view to `views` yourself. */
  onSave?: (label: string, rules: FilterRule[]) => void
  labels?: Partial<FilterViewsLabels>
  /** Formats the views' counts (a BCP 47 tag such as "zh-TW"). Left out, English, so the server and the browser write the same. */
  locale?: string
  className?: string
}) {
  const labels = { ...defaultFilterViewsLabels, ...given }
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const same = (v: FilterView) => rulesEqual(v.rules, rules)
  // Two views with the same rules: the one chosen last stays chosen.
  const matched = views.find((v) => v.id === lastId && same(v)) ?? views.find(same)
  // Rules that come to equal a view (a link, Back, a rule removed by hand) make it the one Reset returns to.
  // State set during render, not in an effect, so the row never draws a frame with the old view.
  if (matched && matched.id !== lastId) setLastId(matched.id)
  const base = matched ? undefined : views.find((v) => v.id === lastId)
  const modified = usePresence(base !== undefined)
  // The view the leaving "Modified" still names while it fades.
  const [shownBase, setShownBase] = React.useState(base)
  if (base && (base.id !== shownBase?.id || base.label !== shownBase.label)) setShownBase(base)

  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")

  const choose = (view: FilterView) => {
    setLastId(view.id)
    onSelect(view)
  }
  const reset = () => {
    if (!base) return
    choose(base)
    // Reset leaves with "Modified"; focus goes to the chip it chose, never to the page.
    const chip = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-view]") ?? [])].find((el) => el.dataset.view === base.id)
    chip?.focus()
  }

  return (
    <div ref={rootRef} data-slot="filter-views" className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <ChipGroup
        label={labels.label}
        items={views.map((v) => ({ value: v.id, label: v.label, count: v.count, props: { "data-view": v.id } }))}
        value={matched?.id}
        allowNone={false}
        locale={locale}
        onValueChange={(id) => {
          const view = views.find((v) => v.id === id)
          if (view) choose(view)
        }}
      />
      {/* Announced once when the rules part from the view; the words on screen are the same, hidden from the reader. */}
      <span role="status" className="sr-only">
        {base ? labels.modified : ""}
      </span>
      {modified.mounted && shownBase && (
        <div
          inert={modified.leaving || undefined}
          onAnimationEnd={(e) => e.target === e.currentTarget && modified.done()}
          className={cn("flex items-center gap-2", modified.leaving ? "animate-disappear" : "animate-appear")}
        >
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            {labels.modified}
          </span>
          <Button data-slot="filter-views-reset" variant="ghost" size="sm" aria-label={labels.resetTo(shownBase.label)} onClick={reset}>
            <Undo2 aria-hidden="true" />
            {labels.reset}
          </Button>
        </div>
      )}
      {onSave && (
        <Popover
          open={saving}
          onOpenChange={(o) => {
            setSaving(o)
            if (!o) setName("")
          }}
        >
          <PopoverTrigger asChild>
            <Button data-slot="filter-views-save" variant="ghost" size="sm">
              <Save aria-hidden="true" />
              {labels.save}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" collisionPadding={16} aria-label={labels.save} data-slot="filter-views-dialog">
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                const label = name.trim()
                if (!label) return
                onSave(label, rules)
                setSaving(false)
                setName("")
              }}
            >
              <Field label={labels.name}>
                <Input data-slot="filter-views-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Button data-slot="filter-views-confirm" type="submit" size="sm" disabled={!name.trim()}>
                {labels.confirm}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
