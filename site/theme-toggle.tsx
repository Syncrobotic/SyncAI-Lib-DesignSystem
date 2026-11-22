"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"

type Choice = "light" | "system" | "dark"
const choices: { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "Match system", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
]
const icon = "absolute size-5 transition-[rotate,scale,opacity] duration-(--motion-base) ease-(--ease-standard)"
const media = "(prefers-color-scheme: dark)"
// While the choice is to match the system, the Monitor shows instead of the Sun or the Moon.
const notSystem = "group-data-[choice=system]:scale-60 group-data-[choice=system]:opacity-0"

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
 * Three choices, like the registry's ThemeToggle: light, match the system, dark. Products default to light (:root); this
 * docs site's own menu alone defaults to match the system. In the header it is one button that opens them, so it fits
 * beside search on a phone; its icon shows the choice.
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Theme"
        data-choice={choice}
        className="group press relative inline-flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {/* The icon is the choice, as in the menu: Sun for light, Moon for dark, Monitor for match the system. Light and dark
            follow the html class, so they are right before the stored choice is read; the swap is CSS, one icon turning
            out as the other turns in, at --motion-base. */}
        <Sun aria-hidden="true" className={`${icon} scale-100 rotate-0 opacity-100 dark:scale-60 dark:-rotate-90 dark:opacity-0 ${notSystem}`} />
        <Moon aria-hidden="true" className={`${icon} scale-60 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100 ${notSystem}`} />
        <Monitor aria-hidden="true" className={`${icon} scale-60 opacity-0 group-data-[choice=system]:scale-100 group-data-[choice=system]:opacity-100`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {choices.map(({ value, label, Icon }) => (
          <DropdownMenuCheckboxItem key={value} checked={choice === value} onCheckedChange={() => choose(value)}>
            <Icon aria-hidden="true" />
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Runs before paint: the stored choice, or the system's setting when there is none (match the system is the default). */
export const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("${media}").matches))document.documentElement.classList.add("dark")}catch(e){}`
