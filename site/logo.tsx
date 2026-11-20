import { cn } from "@/lib/utils"
import { LOGOMARK_PATHS, LOGOMARK_VIEWBOX, LOGOTYPE_PATHS, LOGOTYPE_VIEWBOX, MARK_DISC, MARK_STROKES, MARK_VIEWBOX } from "./brand-paths"

// The official SYNCROBOTIC mark (public/brand/syncrobotic-mark.svg), geometry unchanged.
// Light surfaces: black disc, white S, as in the brand file. Dark surfaces: reversed, so the disc stays visible.
export function LogoMark({ className, title = "SYNCROBOTIC" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })} className={cn("size-7 shrink-0", className)}>
      <path d={MARK_DISC.d} transform={MARK_DISC.transform} className="fill-foreground" />
      {MARK_STROKES.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} className="fill-background" />
      ))}
    </svg>
  )
}

/** The official logomark (the S on its own), in the text colour, so it is black on light and white on dark. */
export function BrandMark({ className, title = "SYNCROBOTIC" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={LOGOMARK_VIEWBOX} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })} className={cn("h-6 w-auto shrink-0 fill-foreground", className)}>
      {LOGOMARK_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  )
}

/** The official logotype (the name as drawn in the brand kit), filled with the current text colour. */
export function BrandLogotype({ className, title = "SYNCROBOTIC" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={LOGOTYPE_VIEWBOX} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })} className={cn("h-6 w-auto fill-current", className)}>
      {LOGOTYPE_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark title="SYNCROBOTIC" className="h-6" />
      {/* The mark says SYNCROBOTIC; the words say what this site is. */}
      <span className="text-sm font-bold whitespace-nowrap">Design System</span>
    </span>
  )
}
