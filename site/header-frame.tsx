"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * At the top of the page the header is part of it: full width, no line. Once the page scrolls, the bar gathers into a
 * floating panel whose edges line up with the content column, 8 px down, in the card surface with a hairline: the same panel
 * as the app shell's top bar. Only colour, edge and a transform change, so nothing below moves (--motion-base).
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
          "pointer-events-auto flex h-(--site-header) items-center gap-6 rounded-md px-3 ring-1",
          "transition-[background-color,box-shadow,translate] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
          scrolled ? "translate-y-2 bg-card ring-border" : "translate-y-0 bg-transparent ring-transparent",
        )}
      >
        {children}
      </div>
    </header>
  )
}
