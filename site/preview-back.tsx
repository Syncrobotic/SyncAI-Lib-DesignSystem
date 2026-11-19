"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"

/** On a preview opened in its own tab (not inside the docs' frame), a way back to the block's docs. */
export function PreviewBack({ href }: { href: string }) {
  // Known only in the browser (false while rendering on the server), and it never changes.
  const alone = React.useSyncExternalStore(
    () => () => {},
    () => window.self === window.top,
    () => false,
  )
  if (!alone) return null
  return (
    <a
      href={href}
      className="press fixed right-4 bottom-4 z-50 inline-flex h-(--h-md) items-center gap-2 rounded-sm bg-popover px-4 text-sm font-medium shadow-overlay ring-1 ring-border hover:bg-accent"
    >
      <ArrowLeft aria-hidden="true" className="size-4" /> Back to the docs
    </a>
  )
}
