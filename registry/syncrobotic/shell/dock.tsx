// @syncrobotic/dock v0.53.0 · update: npx shadcn add @syncrobotic/dock --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Tray } from "@/registry/syncrobotic/shell/tray"

/**
 * The robot shell's action bar in three tiers, top to bottom: state action, this page's primary action, navigation.
 *   1. state action — StopButton while the dog stands, WakeButton while it lies down,
 *      SlideToRelease while it is stopped. Always present, always the same height.
 *   2. this page's one primary action — optional, only while needed.
 *   3. navigation — only on tab roots. Pushed pages put their actions here instead.
 */
export function Dock({ state, action, nav, className }: { state: React.ReactNode; action?: React.ReactNode; nav?: React.ReactNode; className?: string }) {
  return (
    <Tray className={cn("fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))]", className)}>
      {state}
      {action}
      {nav}
    </Tray>
  )
}

type Act = { label: string; onClick: () => void; icon?: React.ElementType }

/**
 * Two actions under the stop. The primary is a raised muted block, never solid white, so it does not compete with the
 * red stop right above it; the secondary is a ghost. Both are medium (500), as every button: the block, not a heavier
 * weight, says which one is primary, and bold belongs to the stop.
 */
export function DockActions({ secondary, primary, destructive }: { secondary: Act; primary: Act; destructive?: boolean }) {
  // Labels wrap to a second line rather than run past the edge on a narrow phone: a consequence ("Delete 38 GB") must stay readable.
  const base = "press flex min-h-(--h-lg) min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2 py-1 text-center text-sm font-medium leading-tight"
  const S = secondary.icon
  return (
    <div className="flex gap-(--tray-gap)">
      <button type="button" onClick={secondary.onClick} className={cn(base, "text-foreground")}>
        {S && <S aria-hidden="true" className="size-5" />}
        {secondary.label}
      </button>
      <button
        type="button"
        onClick={primary.onClick}
        className={cn(base, destructive ? "text-danger ring-1 ring-danger" : "bg-muted text-foreground ring-1 ring-edge")}
      >
        {primary.label}
      </button>
    </div>
  )
}

export type NavItem = { key: string; label: string; icon: React.ElementType; badge?: number }

/** Tab bar inside the dock. The event badge is a danger tint, not solid red. */
export function DockNav({ items, active, onSelect, label = "Primary" }: { items: NavItem[]; active: string; onSelect: (key: string) => void; label?: string }) {
  return (
    <nav aria-label={label} className="@container flex gap-1">
      {items.map(({ key, label, icon: Icon, badge }) => (
        <button
          key={key}
          type="button"
          aria-current={key === active ? "page" : undefined}
          onClick={() => onSelect(key)}
          className={cn(
            // Below 384 px of dock the label goes under the icon, the usual phone tab bar, so four tabs fit a 360 px phone.
            "press flex h-(--h-lg) min-w-0 flex-1 items-center justify-center gap-2 rounded-md text-sm @max-sm:flex-col @max-sm:gap-1 @max-sm:text-xs",
            key === active ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{label}</span>
            {badge ? <CountBadge count={badge} /> : null}
          </span>
        </button>
      ))}
    </nav>
  )
}
