// @syncrobotic/badge v0.10.0 · update: npx shadcn add @syncrobotic/badge --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** Status colours always come in pairs: the tone's foreground on its subtle tint. */
export const badgeVariants = cva("inline-flex h-(--h-tag) shrink-0 items-center gap-1 whitespace-nowrap rounded-xs px-2 text-xs font-medium [&_svg]:size-4", {
  variants: {
    tone: {
      neutral: "bg-neutral-subtle text-neutral",
      info: "bg-info-subtle text-info",
      // A calm state is grey: success reads as neutral. Green is for a confirmation that just happened (Toast, Alert).
      success: "bg-neutral-subtle text-neutral",
      warning: "bg-warning-subtle text-warning",
      danger: "bg-danger-subtle text-danger",
      outline: "text-foreground ring-1 ring-border ring-inset",
    },
  },
  defaultVariants: { tone: "neutral" },
})

export function Badge({ className, tone, asChild, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
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
