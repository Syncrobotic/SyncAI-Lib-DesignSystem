// @syncrobotic/dock v0.8.0 · update: npx shadcn add @syncrobotic/dock --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Tray } from "@/registry/syncrobotic/shell/tray"

/**
 * Three tiers, top to bottom:
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
 * Two actions under the stop. The primary is a raised muted block, never solid white,
 * so it does not compete with the red stop right above it.
 */
export function DockActions({ secondary, primary, destructive }: { secondary: Act; primary: Act; destructive?: boolean }) {
  const base = "press flex h-(--h-lg) flex-1 items-center justify-center gap-2 rounded-md text-sm whitespace-nowrap"
  const S = secondary.icon
  return (
    <div className="flex gap-(--tray-gap)">
      <button type="button" onClick={secondary.onClick} className={cn(base, "text-muted-foreground")}>
        {S && <S aria-hidden="true" className="size-5" />}
        {secondary.label}
      </button>
      <button
        type="button"
        onClick={primary.onClick}
        className={cn(base, "font-bold", destructive ? "text-danger ring-1 ring-danger" : "bg-muted text-foreground ring-1 ring-edge")}
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
    <nav aria-label={label} className="flex gap-1">
      {items.map(({ key, label, icon: Icon, badge }) => (
        <button
          key={key}
          type="button"
          aria-current={key === active ? "page" : undefined}
          onClick={() => onSelect(key)}
          className={cn(
            "press flex h-(--h-lg) flex-1 items-center justify-center gap-2 rounded-md text-sm",
            key === active ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
          {label}
          {badge ? <CountBadge count={badge} /> : null}
        </button>
      ))}
    </nav>
  )
}
