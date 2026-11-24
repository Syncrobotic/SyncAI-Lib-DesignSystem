// @syncrobotic/code v0.32.0 · update: npx shadcn add @syncrobotic/code --overwrite
import type * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A path, a key, a version tag or a command inside a sentence: "set `max_items` in the config". Monospace on a muted
 * tile, at the size of the text around it (in body text, a table cell or a caption alike), and it breaks anywhere rather
 * than push a phone sideways. No copy button: for a reference people paste, put a CopyButton beside it. Code on its own
 * lines is a CodeBlock; a key to press is a Kbd.
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
