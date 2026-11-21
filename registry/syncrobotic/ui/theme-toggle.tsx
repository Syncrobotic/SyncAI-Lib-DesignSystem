// @syncrobotic/theme-toggle v0.10.1 · update: npx shadcn add @syncrobotic/theme-toggle --overwrite
"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type ThemeChoice = "light" | "system" | "dark"

const icons = { light: Sun, system: Monitor, dark: Moon } as const

/**
 * Light, follow the system, or dark: three icon segments, the current one inverted, each named for screen readers and
 * shown as a tooltip. Bring your own theme state (next-themes: `const { theme, setTheme } = useTheme()`). The stored
 * choice is only known in the browser, so pass `undefined` until mounted and nothing is shown as selected.
 */
export function ThemeToggle({
  value,
  onValueChange,
  labels = { light: "Light", system: "Match system", dark: "Dark" },
  label = "Theme",
  className,
}: {
  value: ThemeChoice | undefined
  onValueChange: (value: ThemeChoice) => void
  labels?: Record<ThemeChoice, string>
  /** Names the group. */
  label?: string
  className?: string
}) {
  return (
    <SegmentedControl
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
