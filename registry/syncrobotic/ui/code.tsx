// @syncrobotic/code v0.58.0 · update: npx shadcn add @syncrobotic/code --overwrite
import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Inline code in a sentence (a path, a key, a version or a command) in mono on a muted tile at the text's size,
 * breaking anywhere on a phone, with no copy button of its own. Code on its own lines is a CodeBlock; a key to press is
 * a Kbd.
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
