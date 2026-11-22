"use client"

import * as React from "react"
import { ThemeToggle as Kit } from "@/registry/syncrobotic/ui/theme-toggle"

type Choice = "light" | "system" | "dark"
const media = "(prefers-color-scheme: dark)"
function read(): Choice {
  try {
    const t = localStorage.getItem("theme")
    return t === "light" || t === "dark" ? t : "system"
  } catch {
    return "system"
  }
}

// The stored choice changes only through this menu, which keeps its own state, so there is nothing to subscribe to.
const subscribeNothing = () => () => {}

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia(media).matches)
  document.documentElement.classList.toggle("dark", dark)
}

/**
 * The registry's ThemeToggle as a menu (one button that fits beside search on a phone), with the docs site's own state:
 * products default to light (:root); this site alone defaults to match the system, kept in localStorage.
 */
export function ThemeToggle() {
  // Known only in the browser; undefined while rendering on the server (and hydrating), so nothing shows as chosen until
  // then. The stored choice is read as an external value; a choice made here wins over it.
  const stored = React.useSyncExternalStore(subscribeNothing, read, () => undefined)
  const [picked, setChoice] = React.useState<Choice | undefined>(undefined)
  const choice = picked ?? stored
  // Matching the system follows it live: the page turns when the system does.
  React.useEffect(() => {
    if (choice !== "system") return
    const mq = window.matchMedia(media)
    const on = () => apply("system")
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [choice])
  const choose = (c: Choice) => {
    setChoice(c)
    apply(c)
    try {
      if (c === "system") localStorage.removeItem("theme")
      else localStorage.setItem("theme", c)
    } catch {}
  }
  return <Kit variant="menu" value={choice} onValueChange={choose} />
}

/** Runs before paint: the stored choice, or the system's setting when there is none (match the system is the default). */
export const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("${media}").matches))document.documentElement.classList.add("dark")}catch(e){}`
