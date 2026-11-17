// @syncrobotic/badge v0.7.0 · update: npx shadcn add @syncrobotic/badge --overwrite
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
      success: "bg-success-subtle text-success",
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
