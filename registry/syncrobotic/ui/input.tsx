// @syncrobotic/input v0.10.0 · update: npx shadcn add @syncrobotic/input --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * 16 px text so iOS does not zoom on focus. `aria-invalid` turns the edge danger and 2 px at --motion-fast:
 * the error is a state change, shown in place, never a shake.
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-(--h-md) w-full min-w-0 rounded-sm bg-card px-3 text-base ring-1 ring-input ring-inset",
        "transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:ring-border",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:ring-2 aria-invalid:ring-danger",
        className,
      )}
      {...props}
    />
  )
}
