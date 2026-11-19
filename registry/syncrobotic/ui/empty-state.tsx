// @syncrobotic/empty-state v0.17.3 · update: npx shadcn add @syncrobotic/empty-state --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/** Say what is missing, why, and the one action that fixes it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div data-slot="empty-state" className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", className)}>
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        {/* Centred lines balanced, so a description never ends on one word alone. */}
        <p className="font-medium text-balance">{title}</p>
        {description && <p className="text-sm text-balance text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
