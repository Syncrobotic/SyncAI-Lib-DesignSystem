// @syncrobotic/description-list v0.56.0 · update: npx shadcn add @syncrobotic/description-list --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { CopyButton, type CopyButtonLabels } from "@/registry/syncrobotic/ui/copy-button"

export type DescriptionListItem = {
  label: React.ReactNode
  /** The value. null, undefined or "" is not set: a dash, read as `labels.notSet`. */
  value?: React.ReactNode
  /** Small print under the value: a caveat about it ("Sent by the device, not checked"), never a second value. */
  hint?: React.ReactNode
  /** Monospace, for what is compared character by character: ids, fingerprints, versions. */
  mono?: boolean
  /** A copy button after the value: true copies a string or number value, a string copies that text. */
  copy?: boolean | string
  /** A 16 px icon before the label, from the icon set. */
  icon?: React.ElementType
}

export type DescriptionListLabels = {
  /** Read for a value that is not set; the eye sees a dash. */
  notSet: string
  /** The copy button's name, from the item's label when it is text. */
  copy: (label: string) => string
  copyButton: Partial<CopyButtonLabels>
}

export const defaultDescriptionListLabels: DescriptionListLabels = {
  notSet: "Not set",
  copy: (label) => `Copy ${label}`,
  copyButton: {},
}

const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const

const isEmpty = (v: React.ReactNode) => v === null || v === undefined || v === ""

/**
 * Label and value pairs about one thing, plain or as tiles. `plain` in a card; `tiles` gives each its own tile; `bare`
 * has no surface, for a place that already is one, so cards never nest. An item can carry a hint, a monospace value, a
 * copy button and an icon; an empty value is a dash that screen readers hear as "Not set".
 */
export function DescriptionList({
  items,
  columns = 3,
  variant = "plain",
  labels,
  className,
}: {
  items: DescriptionListItem[]
  columns?: keyof typeof cols
  variant?: "plain" | "tiles" | "bare"
  labels?: Partial<DescriptionListLabels>
  className?: string
}) {
  const l = { ...defaultDescriptionListLabels, ...labels }
  return (
    <dl
      data-slot="description-list"
      className={cn("grid gap-4", cols[columns], variant === "plain" && "rounded-md bg-card p-4 ring-1 ring-border", variant === "tiles" && "gap-2", className)}
    >
      {items.map((it, i) => {
        const empty = isEmpty(it.value)
        const copyValue = empty ? undefined : typeof it.copy === "string" ? it.copy : it.copy && (typeof it.value === "string" || typeof it.value === "number") ? String(it.value) : undefined
        const Icon = it.icon
        return (
          <div key={i} className={cn("flex min-w-0 flex-col gap-1", variant === "tiles" && "rounded-sm bg-muted p-3")}>
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
              {it.label}
            </dt>
            <dd className={cn("flex min-w-0 items-center gap-2", it.mono ? "font-mono text-xs break-all" : "text-sm font-medium tabular-nums")}>
              {empty ? (
                <span data-slot="description-list-empty" className="text-muted-foreground">
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">{l.notSet}</span>
                </span>
              ) : (
                <span className="min-w-0">{it.value}</span>
              )}
              {copyValue !== undefined && (
                <CopyButton
                  value={copyValue}
                  label={typeof it.label === "string" ? l.copy(it.label) : undefined}
                  labels={l.copyButton}
                  className="-my-2 shrink-0"
                />
              )}
            </dd>
            {it.hint && <dd className="text-xs text-muted-foreground">{it.hint}</dd>}
          </div>
        )
      })}
    </dl>
  )
}
