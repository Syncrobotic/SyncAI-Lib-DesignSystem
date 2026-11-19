// @syncrobotic/scrollspy v0.15.0 · update: npx shadcn add @syncrobotic/scrollspy --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Which of several sections is being read. A section counts once its top passes `offset` px below the
 * top of the scroll container (or the window); near the end of the page the last section wins, so a
 * short final section can still be reached.
 */
export function useScrollspy(ids: string[], { offset = 96, root }: { offset?: number; root?: React.RefObject<HTMLElement | null> } = {}) {
  const [active, setActive] = React.useState<string | undefined>(ids[0])
  const key = ids.join("|")
  React.useEffect(() => {
    const container = root?.current ?? null
    const target: HTMLElement | Window = container ?? window
    let frame = 0
    const measure = () => {
      frame = 0
      const top = container ? container.getBoundingClientRect().top : 0
      const scrolled = container ? container.scrollTop + container.clientHeight : window.scrollY + window.innerHeight
      const height = container ? container.scrollHeight : document.documentElement.scrollHeight
      const list = key.split("|")
      if (height - scrolled < 2) return setActive(list[list.length - 1])
      let current = list[0]
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - top <= offset) current = id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [key, offset, root])
  return active
}

export type ScrollspyItem = { id: string; label: React.ReactNode; level?: 1 | 2 }

/**
 * An "On this page" list that follows the reader. The current link gets aria-current and a bar beside it;
 * links scroll smoothly (instantly under reduced motion) and move focus to the section.
 */
export function Scrollspy({
  items,
  offset,
  root,
  title = "On this page",
  variant = "rail",
  className,
  ...props
}: Omit<React.ComponentProps<"nav">, "title"> & {
  items: ScrollspyItem[]
  offset?: number
  /** The scrolling element, when it is not the window. */
  root?: React.RefObject<HTMLElement | null>
  title?: React.ReactNode
  /** rail: a line with the current section marked. pills: horizontal chips for a top bar. */
  variant?: "rail" | "pills"
}) {
  const active = useScrollspy(
    items.map((i) => i.id),
    { offset, root },
  )
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1")
    el.focus({ preventScroll: true })
    history.replaceState(null, "", `#${id}`)
  }
  const pills = variant === "pills"
  return (
    <nav aria-label={typeof title === "string" ? title : "On this page"} data-slot="scrollspy" className={cn("flex flex-col gap-2", className)} {...props}>
      {title && !pills && <span className="text-xs font-medium text-muted-foreground">{title}</span>}
      <ul className={cn(pills ? "flex gap-2 overflow-x-auto" : "flex flex-col border-l border-border")}>
        {items.map((item) => {
          const current = item.id === active
          return (
            <li key={item.id} className={cn(pills && "shrink-0")}>
              <a
                href={`#${item.id}`}
                onClick={(e) => go(e, item.id)}
                aria-current={current ? "location" : undefined}
                data-current={current || undefined}
                className={cn(
                  "flex items-center text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                  pills
                    ? "h-(--h-sm) rounded-xs px-3 text-muted-foreground ring-1 ring-border ring-inset hover:text-foreground data-current:bg-foreground data-current:text-background data-current:ring-foreground"
                    : cn(
                        "-ml-px min-h-(--h-sm) border-l-2 border-transparent py-1 text-muted-foreground hover:text-foreground",
                        "data-current:border-foreground data-current:font-medium data-current:text-foreground",
                        item.level === 2 ? "pl-6" : "pl-3",
                      ),
                )}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
