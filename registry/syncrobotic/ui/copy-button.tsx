// @syncrobotic/copy-button v0.53.0 · update: npx shadcn add @syncrobotic/copy-button --overwrite
"use client"

import * as React from "react"
import { Check, CircleAlert, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

/**
 * Puts text on the clipboard. The Clipboard API needs HTTPS or localhost, and internal tools often run on plain HTTP, so
 * it falls back to `document.execCommand("copy")`. Returns false when neither works, so the caller can say so.
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
 * Copies a value and says what happened: a check for 1.5 s, an alert icon when it fails, and an announcement. With
 * `children` a text button; without, an icon button named by `label`.
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
    <>
      <Button
        variant={variant}
        size={children ? "sm" : "icon-sm"}
        aria-label={children ? undefined : state === "idle" ? copy : said}
        onClick={() => {
          window.clearTimeout(timer.current)
          // copyText never rejects: it says whether it worked.
          void copyText(value).then((ok) => {
            setState(ok ? "done" : "failed")
            // A success fades back; a failure stays, so it is not missed.
            if (ok) timer.current = window.setTimeout(() => setState("idle"), 1500)
          })
        }}
        className={className}
      >
        <span className="relative flex size-4 items-center justify-center">
          <Copy aria-hidden="true" className={cn(icon, "size-4", shown("idle"))} />
          <Check aria-hidden="true" className={cn(icon, "size-4", shown("done"))} />
          <CircleAlert aria-hidden="true" className={cn(icon, "size-4 text-warning", shown("failed"))} />
        </span>
        {/* The three words share one cell, so the button is as wide as the longest and keeps its width when the word
            changes; the ones not shown are hidden from sight and from its name. Each starts at the cell's start, so the
            icon is always 8 px from the word shown (gap-2) and the reserved width falls after it, never between. */}
        {children && (
          <span className="grid">
            {(
              [
                ["idle", children],
                ["done", copied],
                ["failed", l.notCopied],
              ] as const
            ).map(([s, text]) => (
              <span key={s} aria-hidden={state !== s || undefined} className={cn("col-start-1 row-start-1 text-start", state !== s && "invisible")}>
                {text}
              </span>
            ))}
          </span>
        )}
      </Button>
      {/* The result is announced for icon and text buttons alike. It sits beside the button, not in it: inside, a text
          button's name would become "Copied Copied". */}
      <span aria-live="polite" className="sr-only">
        {said}
      </span>
    </>
  )
}
