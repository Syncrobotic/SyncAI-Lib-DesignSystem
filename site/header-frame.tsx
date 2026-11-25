"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * At the top of the page the header is part of it: full width, no line. Once the page scrolls, the bar gathers into a
 * floating panel whose edges line up with the content column, 8 px down, in the card surface with a hairline: the same panel
 * as the app shell's top bar. Only colour, edge and a transform change, so nothing below moves (--motion-base).
 * On phones and tablets (below 1024 px, where the areas move into the drawer) the page is text on a 16 px edge, so the bar's two lines meet it one at a time. At the top the bar is
 * invisible and 12 px wider on each side, which puts the icons (12 px inside their 44 px buttons) on the 16 px edge, in
 * line with the headline. On scroll it gathers: the panel's edges come in to the content column's 16 px, like every
 * floating bar, and the icons with them to 28. One state change, one movement (--motion-base).
 * On a desktop the logo and the theme icon stand in from the bar's padding by --start-inset and --end-inset, equal by
 * default: the floating panel's two ends are then equally far from its edges, and at the top both line up with the
 * content column.
 */
export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  return (
    // Once it floats, the strip above the panel takes the page colour, so content never peeks out above the header.
    <header
      className={cn(
        "pointer-events-none sticky top-0 z-20 mx-auto h-(--site-header) max-w-6xl px-4 transition-colors duration-(--motion-base) ease-(--ease-standard)",
        scrolled && "bg-background",
      )}
    >
      <div
        data-scrolled={scrolled || undefined}
        className={cn(
          // The two ends, on a desktop: --start-inset is how far the logo stands in from the bar's padding, --end-inset how
          // far the theme icon does (both 12 px, an icon inside its 44 px button), so the floating panel's ends are equally
          // far from its edges; change either and the other end stays put. --end-shift moves the right-hand group to put
          // the icon there. At the top the bar reaches out by its padding and each inset, so both sit on the content's edges.
          "pointer-events-auto flex h-(--site-header) items-center gap-2 rounded-md ring-1 lg:gap-6 lg:px-3",
          "[--end-mark:calc((var(--h-md)-1.25rem)/2)] [--start-inset:var(--end-mark)] [--end-inset:var(--end-mark)]",
          "[--end-shift:calc(var(--end-inset)-var(--end-mark))] [--reach-start:calc(0.75rem+var(--start-inset))] [--reach-end:calc(0.75rem+var(--end-inset))]",
          "transition-[background-color,box-shadow,translate,margin] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
          scrolled ? "mx-0 translate-y-2 bg-card ring-border" : "-mx-3 translate-y-0 bg-transparent ring-transparent lg:-ml-(--reach-start) lg:-mr-(--reach-end)",
        )}
      >
        {children}
      </div>
    </header>
  )
}
