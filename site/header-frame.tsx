"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * At the top the header is part of the page: full width, no line. On scroll it gathers into a floating panel 8 px down,
 * its edges on the content column, in the card surface with a hairline (as the app shell's top bar). Only colour, edge
 * and a transform change, so nothing below moves (--motion-base).
 * Below 1024 px the bar at the top is invisible and 12 px wider each side, so the icons (12 px inside their 44 px
 * buttons) sit on the 16 px text edge; gathered, its edges come in to 16 px and the icons to 28. On a desktop the logo
 * and theme icon stand in by --start-inset and --end-inset, equal by default, so both ends line up with the column.
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
