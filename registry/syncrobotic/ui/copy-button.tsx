// @syncrobotic/copy-button v0.23.0 · update: npx shadcn add @syncrobotic/copy-button --overwrite
"use client"

import * as React from "react"
import { Check, CircleAlert, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

/**
 * Puts text on the clipboard and reports whether it worked. The Clipboard API exists only on HTTPS and localhost, and
 * internal tools are often served over plain HTTP on a LAN, so it falls back to a hidden textarea and
 * `document.execCommand("copy")`. Returns false when neither works, so the caller can say so instead of pretending.
 */
export async function copyText(value: string): Promise<boolean> {
  if (typeof window !== "undefined" && window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Denied or unavailable: try the fallback below.
    }
  }
  if (typeof document === "undefined") return false
  const active = document.activeElement as HTMLElement | null
  const area = document.createElement("textarea")
  area.value = value
  area.setAttribute("readonly", "")
  // Off-screen and not zoomable, so iOS does not scroll or zoom to it.
  area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px"
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } catch {
    ok = false
  }
  area.remove()
  active?.focus({ preventScroll: true })
  return ok
}

export type CopyButtonLabels = {
  /** The icon button's name before a press. */
  copy: string
  /** Said after a copy, and shown on a text button. */
  copied: string
  /** Said when the browser refused (no clipboard access); it stays until the next press. */
  failed: string
  /** Shown on a text button when the copy failed. */
  notCopied: string
}

export const defaultCopyButtonLabels: CopyButtonLabels = {
  copy: "Copy",
  copied: "Copied",
  failed: "Could not copy: select the text and copy it",
  notCopied: "Not copied",
}

/**
 * Copies a value and says what happened: the icon swaps to a check for 1.5 s (the swap pattern, --motion-fast), or to an
 * alert when the copy did not go through, and the result is announced. With `children` it is a text button; without,
 * an icon button named by `label`.
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  failedLabel,
  labels,
  children,
  variant = "ghost",
  className,
}: {
  value: string
  /** Same as `labels.copy`, and wins over it. */
  label?: string
  /** Same as `labels.copied`, and wins over it. */
  copiedLabel?: string
  /** Same as `labels.failed`, and wins over it. */
  failedLabel?: string
  /** The words it says, to translate them. */
  labels?: Partial<CopyButtonLabels>
  children?: React.ReactNode
  variant?: "ghost" | "outline" | "secondary"
  className?: string
}) {
  const l = { ...defaultCopyButtonLabels, ...labels }
  const copy = label ?? l.copy
  const copied = copiedLabel ?? l.copied
  const failed = failedLabel ?? l.failed
  const [state, setState] = React.useState<"idle" | "done" | "failed">("idle")
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const icon = "absolute transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)"
  const shown = (s: typeof state) => (state === s ? "scale-100 opacity-100" : "scale-60 opacity-0")
  const said = state === "done" ? copied : state === "failed" ? failed : ""
  return (
    <Button
      variant={variant}
      size={children ? "sm" : "icon-sm"}
      aria-label={children ? undefined : state === "idle" ? copy : said}
      onClick={async () => {
        window.clearTimeout(timer.current)
        const ok = await copyText(value)
        setState(ok ? "done" : "failed")
        // A success fades back; a failure stays, so it is not missed.
        if (ok) timer.current = window.setTimeout(() => setState("idle"), 1500)
      }}
      className={className}
    >
      <span className="relative flex size-4 items-center justify-center">
        <Copy aria-hidden="true" className={cn(icon, "size-4", shown("idle"))} />
        <Check aria-hidden="true" className={cn(icon, "size-4", shown("done"))} />
        <CircleAlert aria-hidden="true" className={cn(icon, "size-4 text-warning", shown("failed"))} />
      </span>
      {children && <span>{state === "done" ? copied : state === "failed" ? l.notCopied : children}</span>}
      {/* The result is announced for icon and text buttons alike. */}
      <span aria-live="polite" className="sr-only">
        {said}
      </span>
    </Button>
  )
}
