// @syncrobotic/permission-gate v0.55.0 · update: npx shadcn add @syncrobotic/permission-gate --overwrite
"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

export type PermissionGateMode = "hidden" | "disabled" | "read-only" | "forbidden"

export type PermissionGateLabels = {
  /** The line above read-only content. */
  readOnly: string
  forbidden: string
  forbiddenBody: string
}

export const defaultPermissionGateLabels: PermissionGateLabels = {
  readOnly: "View only: you can see this but not change it.",
  forbidden: "You do not have access to this",
  forbiddenBody: "Your permissions do not include it. An admin of this project can change them.",
}

/** A predicate for permission strings ("devices:write"), from the list a session carries. Never from a role's name. */
export function permissionsFrom(granted: Iterable<string>) {
  const set = new Set(granted)
  return (permission: string) => set.has(permission)
}

/** Whether `permission` (one, or all of a list; any of it with `match="any"`) is allowed. Missing both: denied. */
export function isAllowed({
  allowed,
  can,
  permission,
  match = "all",
}: {
  allowed?: boolean
  can?: (permission: string) => boolean
  permission?: string | readonly string[]
  match?: "all" | "any"
}) {
  if (allowed !== undefined) return allowed
  if (!can || permission === undefined) return false
  const list = typeof permission === "string" ? [permission] : permission
  if (!list.length) return false
  return match === "any" ? list.some(can) : list.every(can)
}

type ChildProps = {
  onClick?: (e: React.MouseEvent) => void
  className?: string
  "aria-describedby"?: string
}

/**
 * Shows, disables with a reason, makes read-only or replaces what a permission string guards. Decided by permissions
 * (`can` and `permission`, or `allowed`), never by a role's name. `hidden` for an action the viewer will never have,
 * `disabled` with a reason for one they could be given, `read-only` for a form they may read, `forbidden` for a region.
 */
export function PermissionGate({
  allowed,
  can,
  permission,
  match,
  mode = "hidden",
  reason,
  fallback = null,
  labels,
  className,
  children,
}: {
  /** The decision, when you already have it. Wins over `can`. */
  allowed?: boolean
  /** Your permission check, e.g. CASL's `(p) => ability.can(...)` or `permissionsFrom(session.permissions)`. */
  can?: (permission: string) => boolean
  /** The permission string, or several (all needed; any with `match="any"`). */
  permission?: string | readonly string[]
  match?: "all" | "any"
  mode?: PermissionGateMode
  /** Why it is not allowed, and who can change it: the tooltip and description of `disabled`, the line of `read-only`, the body of `forbidden`. */
  reason?: React.ReactNode
  /** Shown instead when `hidden`; nothing by default. */
  fallback?: React.ReactNode
  labels?: Partial<PermissionGateLabels>
  className?: string
  /** For `disabled`: one control (a button, a link, a menu item). A function gets `readOnly` and renders the values itself. */
  children: React.ReactNode | ((state: { readOnly: boolean }) => React.ReactNode)
}) {
  const ok = isAllowed({ allowed, can, permission, match })
  const l = { ...defaultPermissionGateLabels, ...labels }
  const reasonId = React.useId()
  const [open, setOpen] = React.useState(false)
  const content = (readOnly: boolean) => (typeof children === "function" ? children({ readOnly }) : children)

  if (ok) return <>{content(false)}</>
  if (mode === "hidden") return <>{fallback}</>

  if (mode === "forbidden")
    return (
      <EmptyState
        data-slot="permission-gate-forbidden"
        className={className}
        icon={Lock}
        title={l.forbidden}
        description={reason ?? l.forbiddenBody}
      />
    )

  if (mode === "read-only") {
    const shown = content(true)
    return (
      <div data-slot="permission-gate" data-mode="read-only" className={cn("flex min-w-0 flex-col gap-3", className)}>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {l.readOnly}
            {reason && <> {reason}</>}
          </span>
        </p>
        {/* A plain node gets a disabled fieldset, so nothing in it can change: fail closed. A function renders values itself. */}
        {typeof children === "function" ? (
          shown
        ) : (
          <fieldset disabled className="m-0 min-w-0 border-0 p-0">
            {shown}
          </fieldset>
        )}
      </div>
    )
  }

  // disabled: the control stays focusable (aria-disabled), so a keyboard and a screen reader reach it and hear why.
  const child = React.Children.only(children as React.ReactElement<ChildProps>)
  // While the tooltip is open it describes the control itself; closed, the hidden copy does, so the reason is read once.
  const describedBy = [child.props["aria-describedby"], reason && !open ? reasonId : undefined].filter(Boolean).join(" ") || undefined
  const control = React.cloneElement(child, {
    "aria-disabled": true,
    "aria-describedby": describedBy,
    className: cn(child.props.className, className),
    onClick: (e: React.MouseEvent) => {
      // Blocks the action, a link's navigation and a form's submit; a tap shows the reason, as touch has no hover.
      e.preventDefault()
      e.stopPropagation()
      if (reason) setOpen(true)
    },
  } as ChildProps & Record<string, unknown>)
  if (!reason) return control
  return (
    <>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-pretty">{reason}</TooltipContent>
      </Tooltip>
      <span id={reasonId} data-slot="permission-gate-reason" className="sr-only">
        {reason}
      </span>
    </>
  )
}
