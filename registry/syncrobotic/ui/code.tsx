// @syncrobotic/code v0.51.0 · update: npx shadcn add @syncrobotic/code --overwrite
import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A path, a key or a command inside a sentence, monospace at the surrounding text's size; it breaks anywhere rather than
 * push a phone sideways. Code on its own lines is a CodeBlock; a key to press is a Kbd.
 */
export function Code({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="code"
      // box-decoration-clone: a token broken over two lines keeps its padding and corners on each.
      className={cn("rounded-2xs bg-muted box-decoration-clone px-1 font-mono text-foreground wrap-anywhere", className)}
      {...props}
    />
  )
}
