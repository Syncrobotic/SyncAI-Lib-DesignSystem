// @syncrobotic/copy-button v0.8.0 · update: npx shadcn add @syncrobotic/copy-button --overwrite
"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

/**
 * Copies a value and says so: the icon swaps to a check for 1.5 s (the swap pattern, --motion-fast) and the label
 * becomes "Copied" for screen readers. With `children` it is a text button; without, an icon button named by `label`.
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  children,
  variant = "ghost",
  className,
}: {
  value: string
  label?: string
  copiedLabel?: string
  children?: React.ReactNode
  variant?: "ghost" | "outline" | "secondary"
  className?: string
}) {
  const [done, setDone] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const icon = "absolute transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)"
  return (
    <Button
      variant={variant}
      size={children ? "sm" : "icon-sm"}
      aria-label={children ? undefined : done ? copiedLabel : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setDone(false), 1500)
        } catch {}
      }}
      className={className}
    >
      <span className="relative flex size-4 items-center justify-center">
        <Copy aria-hidden="true" className={cn(icon, "size-4", done ? "scale-60 opacity-0" : "scale-100 opacity-100")} />
        <Check aria-hidden="true" className={cn(icon, "size-4", done ? "scale-100 opacity-100" : "scale-60 opacity-0")} />
      </span>
      {children && <span aria-live="polite">{done ? copiedLabel : children}</span>}
    </Button>
  )
}
