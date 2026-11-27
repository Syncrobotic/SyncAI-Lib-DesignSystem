// @syncrobotic/badge v0.53.0 · update: npx shadcn add @syncrobotic/badge --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

export const badgeVariants = cva("inline-flex h-(--h-tag) shrink-0 items-center gap-1 whitespace-nowrap rounded-xs px-2 text-xs font-medium [&_svg]:size-4", {
  variants: {
    tone: {
      neutral: "bg-neutral-subtle text-neutral",
      outline: "text-foreground ring-1 ring-border ring-inset",
    },
  },
  defaultVariants: { tone: "neutral" },
})

/**
 * A small neutral or outline tag for a fixed attribute (Beta, a version, Production, a tier), with CountBadge for a count
 * and ResultBadge for a pass, a fail or too few samples. A changing state is an InlineStatus, so a badge has no status
 * tones.
 */
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
 * The verdict of a test or an evaluation: passing is grey with a check (never green), failing a danger outline (never
 * solid red), too few samples grey with a dashed circle. Fill, edge and icon differ, so it reads without colour.
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
