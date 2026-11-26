// @syncrobotic/badge v0.40.0 · update: npx shadcn add @syncrobotic/badge --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A label for a fixed attribute or category: Beta, a version, a tier, a data use (`neutral`, the default), or the
 * environment, Production or Staging (`outline`). A state that changes (Offline, Low battery, Updating) is not a badge:
 * it is an InlineStatus, its shape and its word with no box, so a badge has no status tones. A count is a CountBadge and
 * a test result a ResultBadge.
 */
export const badgeVariants = cva("inline-flex h-(--h-tag) shrink-0 items-center gap-1 whitespace-nowrap rounded-xs px-2 text-xs font-medium [&_svg]:size-4", {
  variants: {
    tone: {
      neutral: "bg-neutral-subtle text-neutral",
      outline: "text-foreground ring-1 ring-border ring-inset",
    },
  },
  defaultVariants: { tone: "neutral" },
})

export function Badge({ className, tone, asChild, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

const results = {
  passed: { icon: CircleCheck, label: "Passed", className: "bg-neutral-subtle text-neutral" },
  failed: { icon: CircleAlert, label: "Failed", className: "text-danger ring-1 ring-danger ring-inset" },
  insufficient: { icon: CircleDashed, label: "Not enough samples", className: "text-muted-foreground ring-1 ring-border ring-inset" },
} as const

/**
 * The verdict of a test, an evaluation or an audit. Passing is a calm, lasting state, so it is grey with a check, never
 * green; a failure is a danger outline with danger text, never a solid red; too few samples to judge is grey with a
 * dashed circle. Fill, edge and icon differ, so the three read without colour. Pass `children` to change the word.
 */
export function ResultBadge({
  result,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { result: keyof typeof results }) {
  const r = results[result]
  const Icon = r.icon
  return (
    <span data-slot="result-badge" data-result={result} className={cn(badgeVariants({ tone: null }), r.className, className)} {...props}>
      <Icon aria-hidden="true" />
      {children ?? r.label}
    </span>
  )
}

/**
 * A count next to a label: unread events, alarms, items. Danger text on its tint when the count needs attention, neutral
 * otherwise; never solid red, which belongs to the emergency stop. Over `max` it shows "99+".
 */
export function CountBadge({
  count,
  max = 99,
  tone = "danger",
  className,
  ...props
}: React.ComponentProps<"span"> & { count: number; max?: number; tone?: "danger" | "neutral" }) {
  if (count <= 0) return null
  return (
    <span
      data-slot="count-badge"
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums",
        tone === "danger" ? "bg-danger-subtle text-danger" : "bg-muted text-foreground",
        className,
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
}
