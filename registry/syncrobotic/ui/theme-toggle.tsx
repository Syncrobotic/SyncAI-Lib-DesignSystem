// @syncrobotic/theme-toggle v0.32.0 · update: npx shadcn add @syncrobotic/theme-toggle --overwrite
"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"

export type ThemeChoice = "light" | "system" | "dark"

const icons = { light: Sun, system: Monitor, dark: Moon } as const

// The menu's button shows the choice: Sun, Moon or Monitor. One icon turns out as the next turns in (--motion-base). Light
// and dark follow the html class, so the right one shows before the stored choice is known.
const swap = "absolute size-5 transition-[rotate,scale,opacity] duration-(--motion-base) ease-(--ease-standard)"
const notSystem = "group-data-[choice=system]:scale-60 group-data-[choice=system]:opacity-0"

/**
 * Light, follow the system, or dark. `segmented` (the default): three icon segments, the current one inverted, each named
 * for screen readers and shown as a tooltip. `menu`: one icon button showing the choice, which opens the three as a menu
 * with their names, for a crowded top bar or a phone. Bring your own theme state (next-themes: `const { theme, setTheme } = useTheme()`). The stored
 * choice is only known in the browser, so pass `undefined` until mounted and nothing is shown as selected.
 */
export function ThemeToggle({
  value,
  onValueChange,
  labels = { light: "Light", system: "Match system", dark: "Dark" },
  label = "Theme",
  variant = "segmented",
  align = "end",
  className,
}: {
  /** The stored choice. Leave it out (or undefined) until it is known in the browser: nothing shows as selected. */
  value?: ThemeChoice
  onValueChange: (value: ThemeChoice) => void
  labels?: Record<ThemeChoice, string>
  /** Names the group, or the menu's button. */
  label?: string
  /** Three segments side by side, or one button that opens them as a menu. */
  variant?: "segmented" | "menu"
  /** The menu's edge that lines up with the button (menu only). */
  align?: "start" | "center" | "end"
  className?: string
}) {
  if (variant === "menu")
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="theme-toggle"
          aria-label={label}
          data-choice={value}
          className={cn(
            "group press relative inline-flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            className,
          )}
        >
          <Sun aria-hidden="true" className={`${swap} scale-100 rotate-0 opacity-100 dark:scale-60 dark:-rotate-90 dark:opacity-0 ${notSystem}`} />
          <Moon aria-hidden="true" className={`${swap} scale-60 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100 ${notSystem}`} />
          <Monitor aria-hidden="true" className={`${swap} scale-60 opacity-0 group-data-[choice=system]:scale-100 group-data-[choice=system]:opacity-100`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuRadioGroup value={value ?? ""} onValueChange={(v) => onValueChange(v as ThemeChoice)}>
            {(Object.keys(icons) as ThemeChoice[]).map((k) => {
              const Icon = icons[k]
              return (
                <DropdownMenuRadioItem key={k} value={k}>
                  <Icon aria-hidden="true" />
                  {labels[k]}
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  return (
    <SegmentedControl
      data-slot="theme-toggle"
      aria-label={label}
      value={value ?? ""}
      onValueChange={(v) => v && onValueChange(v as ThemeChoice)}
      className={cn("w-auto", className)}
    >
      {(Object.keys(icons) as ThemeChoice[]).map((k) => {
        const Icon = icons[k]
        return (
          <SegmentedControlItem key={k} value={k} aria-label={labels[k]} title={labels[k]} className="w-(--h-sm) flex-none px-0">
            <Icon aria-hidden="true" />
          </SegmentedControlItem>
        )
      })}
    </SegmentedControl>
  )
}
