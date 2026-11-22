"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"

/**
 * The site's top loader: RouteProgress while the next page loads. A navigation starts when someone follows a link to
 * another page of this site in this tab, and ends when the address's path changes. A prefetched page arrives inside the
 * bar's 300 ms delay and shows nothing, which is right; only a slow one shows the bar.
 */
export function PageLoader() {
  const path = usePathname()
  const [loading, setLoading] = React.useState(false)
  const [shownFor, setShownFor] = React.useState(path)
  const current = React.useRef(path)
  React.useEffect(() => {
    current.current = path
  }, [path])
  // The new page is in: stop in the same render the path changes.
  if (shownFor !== path) {
    setShownFor(path)
    setLoading(false)
  }
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[href]")
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return
      const to = new URL(a.href, location.href)
      // Same site, another page: not a jump within this page, and not the page we are on.
      if (to.origin !== location.origin || to.pathname === location.pathname) return
      setLoading(true)
    }
    // Back and forward start a navigation too, when they go to another page; the path change ends it.
    const onPop = () => {
      if (location.pathname !== current.current) setLoading(true)
    }
    // Capture: Next's <Link> cancels the click's default to route it itself, so the bubbling click looks cancelled. A link
    // whose click leads nowhere ends the bar after RouteProgress's own give-up time.
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPop)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPop)
    }
  }, [])
  return <RouteProgress active={loading} />
}
