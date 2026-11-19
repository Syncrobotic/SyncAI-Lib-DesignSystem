// @syncrobotic/avatar v0.15.0 · update: npx shadcn add @syncrobotic/avatar --overwrite
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
 * A person, or a thing that acts like one: a robot, a site, a team. People are round; things are square (`shape="square"`),
 * so a list that mixes them tells who from what before reading a name. Sizes: sm 24, md 32 (default), lg 40, xl 48;
 * the initials and any badge scale with it.
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
        shape === "circle" ? "rounded-full" : size === "sm" ? "rounded-2xs" : "rounded-xs",
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

/** Initials (or an icon) while the image loads or when there is none. */
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(inner, "flex items-center justify-center bg-muted font-medium text-muted-foreground [&_svg]:size-1/2", className)}
      {...props}
    />
  )
}

/**
 * A mark on the avatar's lower right: a `status` (the same shapes and colours as every status in the kit, so only
 * warning and danger are coloured), or a small count or icon as children. Ringed in the page colour so it reads on top.
 * Say the status in words nearby or in the avatar's label; the mark alone is not enough.
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
 * A row of overlapping avatars. With `max`, the ones past it fold into a "+N" avatar; give `label` (who they are, in
 * words) so a screen reader hears everyone, not just the faces shown.
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
  return (
    <div
      data-slot="avatar-group"
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("flex items-center -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background", className)}
      {...props}
    >
      {shown}
      {rest > 0 && <AvatarGroupCount size={size}>+{rest}</AvatarGroupCount>}
    </div>
  )
}

/** The "+N" at the end of a group: how many more there are. */
export function AvatarGroupCount({ size = "md", className, children, ...props }: React.ComponentProps<"span"> & { size?: keyof typeof sizes }) {
  return (
    <span
      data-slot="avatar"
      data-size={size}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-foreground tabular-nums",
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
