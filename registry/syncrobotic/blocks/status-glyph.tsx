import * as React from "react"
import { cn } from "@/lib/utils"

export type Tone = "info" | "success" | "warning" | "danger" | "neutral"

const color: Record<Tone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted-foreground",
}

/**
 * Status is always shape + colour, never colour alone:
 * filled circle = in progress, hollow circle = normal, triangle = attention,
 * square = stopped, slashed circle = offline.
 */
export function StatusGlyph({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn("size-3 shrink-0", color[tone], className)}>
      {tone === "info" && <circle cx="6" cy="6" r="5" fill="currentColor" />}
      {tone === "success" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />}
      {tone === "warning" && <path d="M6 1 11 10.5H1Z" fill="currentColor" />}
      {tone === "danger" && <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="currentColor" />}
      {tone === "neutral" && (
        <>
          <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M2.5 9.5 9.5 2.5" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}

export const toneText = color
