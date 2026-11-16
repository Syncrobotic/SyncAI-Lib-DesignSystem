import { cn } from "@/lib/utils"
import { MARK_DISC, MARK_STROKES, MARK_VIEWBOX } from "./brand-paths"

// The official SYNCROBOTIC mark (public/brand/syncrobotic-mark.svg), geometry unchanged.
// Light surfaces: black disc, white S, as in the brand file. Dark surfaces: reversed, so the disc stays visible.
export function LogoMark({ className, title = "SYNCROBOTIC" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={cn("size-7 shrink-0", className)}
    >
      <path d={MARK_DISC.d} transform={MARK_DISC.transform} className="fill-foreground" />
      {MARK_STROKES.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} className="fill-background" />
      ))}
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark title="" className="size-7" />
      <span className="text-sm font-bold tracking-wide">SYNCROBOTIC</span>
      <span className="hidden text-sm text-muted-foreground sm:inline">Design System</span>
    </span>
  )
}
