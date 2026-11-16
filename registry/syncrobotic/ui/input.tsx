import * as React from "react"
import { cn } from "@/lib/utils"

/** 16 px text so iOS does not zoom on focus. `aria-invalid` turns the edge danger. */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-(--h-md) w-full min-w-0 rounded-sm bg-card px-3 text-base ring-1 ring-input ring-inset",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:ring-danger",
        className,
      )}
      {...props}
    />
  )
}
