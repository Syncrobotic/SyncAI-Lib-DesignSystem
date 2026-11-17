// @syncrobotic/tray v0.5.0 · update: npx shadcn add @syncrobotic/tray --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * The shared assembly for the dynamic island and the dock:
 * radius 24 (xl) = child radius 16 (md) + padding 8. Children are spaced 8 apart.
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
