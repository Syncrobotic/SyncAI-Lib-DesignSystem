"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// The site's arrival movement is CSS (the theme's appear: rise 8 px and fade, --motion-base), not JavaScript, so the page
// is never blank before or without scripts. Items stagger by their order (globals.css, [data-reveal]).

const stagger = (s: number) => ({ "--stagger": `${s}s` }) as React.CSSProperties

/** Arrival of a page or section: the one state change every navigation has. Children with `AppearItem` stagger in order. */
export function Appear({ children, className, stagger: s = 0 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  return (
    <div data-reveal="playing" className={className} style={stagger(s)}>
      {children}
    </div>
  )
}

/** One staggered child of Appear or Reveal. */
export function AppearItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("appear-item", className)}>{children}</div>
}

/**
 * A section further down arrives when it scrolls into view: the same movement and stagger as the hero, once.
 * It renders visible; only a section that starts below the screen waits, so nothing is hidden without JavaScript
 * and nothing already on screen flashes.
 */
export function Reveal({ children, className, stagger: s = 0.04 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<"shown" | "waiting" | "playing">("shown")
  React.useEffect(() => {
    const el = ref.current
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return
    setState("waiting")
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setState("playing")
        io.disconnect()
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} data-reveal={state} className={className} style={stagger(s)}>
      {children}
    </div>
  )
}
