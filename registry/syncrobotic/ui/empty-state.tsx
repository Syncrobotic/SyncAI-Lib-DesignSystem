// @syncrobotic/empty-state v0.51.0 · update: npx shadcn add @syncrobotic/empty-state --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"

/**
 * Say what is missing, why, and the one action that fixes it. `size="panel"` (default) for a card or dialog body;
 * `size="inline"` inside a table or list; `variant="overlay"` over a canvas or picture, where the viewport overlay places it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size,
  variant = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ElementType
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  /** `panel` (default) for a card or a section; `inline` inside a table, a list or a small panel. An overlay is inline unless set. */
  size?: "panel" | "inline"
  /** `overlay` over a canvas or a picture: no padding of its own, the host's overlay layer places it. */
  variant?: "default" | "overlay"
}) {
  const overlay = variant === "overlay"
  const s = size ?? (overlay ? "inline" : "panel")
  return (
    <div
      data-slot="empty-state"
      data-size={s}
      data-variant={variant}
      className={cn(
        "flex flex-col items-center text-center",
        s === "panel" ? "gap-3" : "gap-2",
        overlay ? "max-w-sm" : s === "panel" ? "px-6 py-8" : "px-4 py-6",
        className,
      )}
      {...props}
    >
      {Icon &&
        (s === "panel" ? (
          <IconTile variant="muted" size="lg">
            <Icon aria-hidden="true" />
          </IconTile>
        ) : (
          <Icon aria-hidden="true" className="size-6 shrink-0 text-muted-foreground" />
        ))}
      <div className="flex flex-col gap-1">
        {/* Centred lines balanced, so a description never ends on one word alone. */}
        <p className={cn("font-medium text-balance text-foreground", s === "inline" && "text-sm")}>{title}</p>
        {description && <p className="text-sm text-balance text-muted-foreground wrap-anywhere">{description}</p>}
      </div>
      {action}
    </div>
  )
}
