"use client"

import { Moon, Sun } from "lucide-react"

const icon = "absolute size-5 transition-[rotate,scale,opacity] duration-(--motion-base) ease-(--ease-standard)"

export function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark")
    try {
      localStorage.setItem("theme", dark ? "dark" : "light")
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark and light"
      className="press relative inline-flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {/* The theme lives in the html class, so the swap is CSS: one icon turns out as the other turns in, at --motion-base. */}
      <Sun className={`${icon} scale-60 -rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100`} />
      <Moon className={`${icon} scale-100 rotate-0 opacity-100 dark:scale-60 dark:rotate-90 dark:opacity-0`} />
    </button>
  )
}

/** Runs before paint: light is the default (it reads in daylight), dark only when the viewer chose it. */
export const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`
