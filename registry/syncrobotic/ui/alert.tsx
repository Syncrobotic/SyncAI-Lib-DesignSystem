// @syncrobotic/alert v0.53.0 · update: npx shadcn add @syncrobotic/alert --overwrite
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva("animate-appear grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-1 rounded-md p-4 text-sm [&>svg]:size-5", {
  variants: {
    tone: {
      neutral: "bg-neutral-subtle [&>svg]:text-neutral",
      info: "bg-info-subtle [&>svg]:text-info",
      warning: "bg-warning-subtle [&>svg]:text-warning",
      danger: "bg-danger-subtle [&>svg]:text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
})

/**
 * A message inside the page in a status tone, with icon, title and description, that stays while its condition holds.
 * Transient events (saved, sent) are a toast: there is no success tone. Blue (info) only while a process runs, never for
 * a state.
 */
export function Alert({ className, tone, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role={tone === "danger" ? "alert" : "status"} className={cn(alertVariants({ tone }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="alert-title" className={cn("col-start-2 font-medium", className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 text-pretty text-muted-foreground", className)} {...props} />
}
