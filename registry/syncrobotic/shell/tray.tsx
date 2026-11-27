// @syncrobotic/tray v0.53.0 · update: npx shadcn add @syncrobotic/tray --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * The floating frame the dynamic island and the dock are built on; build your own floating panel on it so it matches
 * them. Radius 24 (xl) is the children's radius 16 (md) plus padding 8; children are spaced 8 apart.
 */
export function Tray({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--tray-gap) rounded-xl bg-float p-(--tray-pad) shadow-float ring-1 ring-edge backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  )
}
