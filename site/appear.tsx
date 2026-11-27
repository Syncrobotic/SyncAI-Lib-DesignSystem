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
 * A section below the screen arrives once (8 px, --motion-base) as it scrolls into view, never runs back, and is never
 * hidden without JavaScript. `showcase` is the home page's exception (Motion foundation, "The docs home"): hidden before
 * the first paint, it also plays when already on screen at load (a reload keeps the scroll position), with a 24 px rise
 * over --motion-sheet, items 60 ms apart. A section already scrolled past (a fast scroll, a screenshot tool stepping down)
 * shows at once, as does every section in an automated browser and in print.
 */
export function Reveal({
  children,
  className,
  stagger: s,
  showcase = false,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  showcase?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  // A showcase section starts "pending": hidden by CSS before the first paint (only when scripts run), so one already on
  // screen at load (a reload keeps the scroll position) plays its entrance too, instead of sitting there still while only
  // the hero moves. Any other section starts shown and never hides what is on screen.
  const [state, setState] = React.useState<"shown" | "pending" | "waiting" | "playing">(showcase ? "pending" : "shown")
  React.useEffect(() => {
    const el = ref.current
    // On screen at load (or captured by an automated browser): decided on the next frame, the section hidden till then.
    if (!el || navigator.webdriver || el.getBoundingClientRect().top < window.innerHeight) {
      const now = !el || navigator.webdriver ? "shown" : "playing"
      const id = requestAnimationFrame(() => setState((s) => (s === "pending" ? now : s)))
      return () => cancelAnimationFrame(id)
    }
    setState("waiting")
    let frame = 0
    // Scrolled past without ever being in view: shown as it is, with no movement nobody would see.
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (el.getBoundingClientRect().bottom > 0) return
        setState("shown")
        stop()
      })
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setState("playing")
        stop()
      },
      // Any part in view, once its top is past the bottom tenth of the screen. Not a share of the section: a tall grid on a
      // phone (26 cards, ten screens high) never shows 15 % of itself at once, and stayed hidden.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    )
    const stop = () => {
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
    io.observe(el)
    window.addEventListener("scroll", onScroll, { passive: true })
    return stop
  }, [showcase])
  return (
    <div
      ref={ref}
      data-reveal={state}
      data-showcase={showcase || undefined}
      className={className}
      style={stagger(s ?? (showcase ? 0.06 : 0.04))}
    >
      {children}
    </div>
  )
}
