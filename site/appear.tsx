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
 * A section further down arrives once, with the theme's appear movement (8 px, --motion-base), when it scrolls into view.
 * Only a section that starts below the screen waits, so nothing is hidden without JavaScript and nothing already on screen
 * flashes. It never runs back when scrolled away: nothing moves to decorate.
 *
 * `showcase` is the home page's exception to the motion rule (Motion foundation, "The docs home"): a longer entrance, a
 * 24 px rise over --motion-sheet, items 60 ms apart. Nowhere else.
 *
 * A section is never left waiting where it cannot be seen arriving: one already scrolled past (a fast scroll, or a
 * screenshot tool stepping down the page, jumps over it between two frames) shows at once, and so does every section in an
 * automated browser (a full-page capture never scrolls). In print the stylesheet shows them all.
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
  const [state, setState] = React.useState<"shown" | "waiting" | "playing">("shown")
  React.useEffect(() => {
    const el = ref.current
    if (!el || navigator.webdriver || el.getBoundingClientRect().top < window.innerHeight) return
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
  }, [])
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
