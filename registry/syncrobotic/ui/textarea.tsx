// @syncrobotic/textarea v0.17.3 · update: npx shadcn add @syncrobotic/textarea --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-sm bg-card px-3 py-2 text-base ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:ring-border aria-invalid:ring-2 aria-invalid:ring-danger",
        className,
      )}
      {...props}
    />
  )
}
