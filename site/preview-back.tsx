"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"

/**
 * On a preview opened in its own tab (not inside the docs' frame), a way back to the block's docs: a strip above the block,
 * not a button floating over it, so it never covers the block's own controls (the stop, a form's Cancel).
 */
export function PreviewBack({ href }: { href: string }) {
  // Known only in the browser (false while rendering on the server), and it never changes.
  const alone = React.useSyncExternalStore(
    () => () => {},
    () => window.self === window.top,
    () => false,
  )
  if (!alone) return null
  return (
    <>
      {/*
        A shell that fills the screen fills what is left under the strip, so its bottom (the stop, the user menu) stays on
        screen. A full-screen block (a dialog or sheet over its page, a sign-in screen) is held to the same height, so the
        page never scrolls 44 px for nothing and no band under it is left outside a dialog's scrim.
      */}
      <style>{":root{--app-shell-height:calc(100dvh - var(--h-md))}#block-root .min-h-dvh{min-height:var(--app-shell-height)}"}</style>
      <a
      href={href}
      className="press flex h-(--h-md) items-center gap-2 border-b border-border bg-card px-4 text-sm font-medium hover:bg-accent"
    >
      <ArrowLeft aria-hidden="true" className="size-4" /> Back to the docs
      </a>
    </>
  )
}
