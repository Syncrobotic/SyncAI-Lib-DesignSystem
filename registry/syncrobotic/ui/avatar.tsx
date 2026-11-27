// @syncrobotic/avatar v0.53.0 · update: npx shadcn add @syncrobotic/avatar --overwrite
"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { type Status, StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"

const sizes = {
  sm: "size-6 text-xs",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-12 text-base",
} as const

/**
 * A person (round) or a robot, site or team (square), by picture, initials or icon, in four sizes, with a status or
 * count badge and overlapping groups that fold into +N. Square tells a thing from a person in a mixed list. Sizes sm
 * 24, md 32 (default), lg 40, xl 48.
 */
export function Avatar({
  className,
  size = "md",
  shape = "circle",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { size?: keyof typeof sizes; shape?: "circle" | "square" }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      // Labelled ("Patrol dog 7F3A, 3 open alarms"), it is one picture to a screen reader, not a bare span.
      role={props["aria-label"] ? "img" : undefined}
      className={cn(
        "group/avatar relative flex shrink-0 select-none",
        sizes[size],
        // Square corners follow the icon tile of the same size, so a robot beside an icon lines up: 4, 8, 12, 12.
        shape === "circle" ? "rounded-full" : { sm: "rounded-2xs", md: "rounded-xs", lg: "rounded-sm", xl: "rounded-sm" }[size],
        className,
      )}
      {...props}
    />
  )
}

// The image and the initials fill the avatar and take its corner; the badge sits outside that clip.
const inner = "size-full overflow-hidden group-data-[shape=circle]/avatar:rounded-full group-data-[shape=square]/avatar:rounded-[inherit]"

export function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn(inner, "aspect-square object-cover", className)} {...props} />
}

/** Initials (or an icon) while the image loads or when there is none: ink on --track, so the circle reads on any surface. */
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(inner, "flex items-center justify-center bg-track font-medium text-foreground [&_svg]:size-1/2", className)}
      {...props}
    />
  )
}

/**
 * A mark on the avatar's lower right: a `status` (kit status shapes; only warning and danger coloured) or a small count or
 * icon. Say the status in words too; the mark alone is not enough.
 */
export function AvatarBadge({ status, className, children, ...props }: React.ComponentProps<"span"> & { status?: Status }) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute -right-0.5 -bottom-0.5 z-10 flex items-center justify-center rounded-full bg-background",
        status ? "p-px" : "min-w-4 px-1 text-xs leading-4 font-medium tabular-nums ring-2 ring-background",
        className,
      )}
      {...props}
    >
      {status ? <StatusGlyph status={status} /> : children}
    </span>
  )
}

/**
 * A row of avatars; past `max` they fold into "+N" (give `label` so screen readers hear everyone). Round ones overlap by
 * 4 px with a 2 px page-colour ring (on a card: `*:data-[slot=avatar]:ring-card`); square ones sit 4 px apart, since an
 * overlap would cut their initials.
 */
export function AvatarGroup({
  max,
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { max?: number; label?: string }) {
  const all = React.Children.toArray(children)
  const shown = max !== undefined && all.length > max ? all.slice(0, max) : all
  const rest = all.length - shown.length
  const first = all[0]
  const size = React.isValidElement<{ size?: keyof typeof sizes }>(first) ? first.props.size : undefined
  const square = React.isValidElement<{ shape?: "circle" | "square" }>(first) && first.props.shape === "square"
  return (
    <div
      data-slot="avatar-group"
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("flex items-center", square ? "gap-1" : "-space-x-1 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background", className)}
      {...props}
    >
      {shown}
      {rest > 0 && (
        <AvatarGroupCount size={size} shape={square ? "square" : "circle"}>
          +{rest}
        </AvatarGroupCount>
      )}
    </div>
  )
}

/** The "+N" at the end of a group: how many more there are, in the group's shape. */
export function AvatarGroupCount({
  size = "md",
  shape = "circle",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { size?: keyof typeof sizes; shape?: "circle" | "square" }) {
  return (
    <span
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-track font-medium text-foreground tabular-nums",
        // Square corners follow the icon tile of the same size, so a robot beside an icon lines up: 4, 8, 12, 12.
        shape === "circle" ? "rounded-full" : { sm: "rounded-2xs", md: "rounded-xs", lg: "rounded-sm", xl: "rounded-sm" }[size],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
