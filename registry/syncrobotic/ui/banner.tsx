// @syncrobotic/banner v0.58.0 · update: npx shadcn add @syncrobotic/banner --overwrite
"use client"

import * as React from "react"
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"

const tabbable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Where focus goes when the banner holding it closes: the first Tab stop after it that takes focus, else the last before it.
function moveFocusOn(banner: HTMLElement) {
  const stops = [...document.querySelectorAll<HTMLElement>(tabbable)].filter((el) => !banner.contains(el) && !el.closest("[inert], [aria-hidden=true], [hidden]"))
  const after = stops.filter((el) => banner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
  const before = stops.filter((el) => banner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING).reverse()
  // One that is not drawn (display: none) refuses focus; try the next.
  for (const el of [...after, ...before]) {
    el.focus()
    if (document.activeElement === el) return
  }
}

export type BannerTone = "neutral" | "info" | "warning" | "danger"

const tones: Record<BannerTone, { band: string; icon: string; glyph: React.ElementType }> = {
  neutral: { band: "bg-neutral-subtle", icon: "text-neutral", glyph: Info },
  // Blue is for a process someone is waiting on: a maintenance window under way, data syncing back. Not for news.
  info: { band: "bg-info-subtle", icon: "text-info", glyph: Info },
  warning: { band: "bg-warning-subtle", icon: "text-warning", glyph: TriangleAlert },
  danger: { band: "bg-danger-subtle", icon: "text-danger", glyph: CircleAlert },
}

export type BannerProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** neutral (default) for news and calm conditions; info only while a process runs; warning before something is lost; danger when the app cannot work. */
  tone?: BannerTone
  /** Replaces the tone's icon with one that says what it is about: Wrench for maintenance, Lock for read-only, CloudOff for offline. */
  icon?: React.ElementType
  /** The condition in a few words, set in medium weight like an Alert's title: "Read-only mode". The children say what it means and until when. */
  title?: React.ReactNode
  /** One next step: a Button (size md, variant outline) or a link through `<Button asChild>`. Named by its result: "Upgrade plan", not "Learn more". */
  action?: React.ReactNode
  /**
   * Shows a close button. Remembering that it was closed (and for how long) is yours: set `open` false and store it. Leave
   * it out for a condition that ends by itself (offline, read-only). Closed with focus on its close button, focus moves on to what comes
   * after the banner on the page (or before it, at the end), never back to the top of the page.
   */
  onDismiss?: () => void
  /** The close button's name for screen readers. */
  dismissLabel?: string
  /** false hides it: it fades and closes its height. Default true. */
  open?: boolean
}

/**
 * A full-width notice at the top of the page or app about the app itself (maintenance, read-only mode, a trial ending,
 * no connection), with tones, one action and optional dismiss. Not about one record; it stays while its condition
 * holds. role="status" for neutral, info and warning; role="alert" only for danger.
 */
export function Banner({ tone = "neutral", icon, title, action, onDismiss, dismissLabel = "Dismiss", open = true, className, children, ...props }: BannerProps) {
  const { mounted, leaving, done } = usePresence(open)
  const close = React.useRef<HTMLButtonElement>(null)
  // Once it is closed (after the app has drawn whatever replaces it), focus left on its close button moves on.
  React.useEffect(() => {
    const button = close.current
    const banner = button?.closest<HTMLElement>("[data-slot=banner]")
    if (open || !button || !banner || document.activeElement !== button) return
    moveFocusOn(banner)
  }, [open])
  if (!mounted) return null
  const t = tones[tone]
  const Icon = icon ?? t.glyph
  return (
    <div
      data-slot="banner"
      data-tone={tone}
      role={tone === "danger" ? "alert" : "status"}
      aria-hidden={leaving || undefined}
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget && e.propertyName === "grid-template-rows") done()
      }}
      // It opens and closes its own height, so what sits under it (the whole app, at the top of the page) slides with it
      // instead of jumping when it comes or goes.
      className={cn(
        "grid w-full border-b border-border transition-[grid-template-rows,opacity] duration-(--motion-base) ease-(--ease-standard) starting:grid-rows-[0fr] starting:opacity-0",
        leaving ? "grid-rows-[0fr] opacity-0 duration-(--motion-fast) ease-(--ease-exit)" : "grid-rows-[1fr]",
        t.band,
        className,
      )}
      {...props}
    >
      <div className="flex min-h-0 items-start gap-2 overflow-hidden px-4 py-1">
        {/* The icon sits on the first line of words: each line of the row is a 44 px target, the words 20 px in its middle. */}
        <Icon aria-hidden="true" className={cn("mt-3 size-5 shrink-0", t.icon)} />
        {/* The words wrap rather than being cut; when the action would squeeze them under 240 px it moves under them. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4">
          <p className="min-w-0 flex-1 basis-60 py-3 text-sm text-pretty break-words">
            {title && <span className="font-medium">{title} </span>}
            {children && <span className={cn(title && "text-muted-foreground")}>{children}</span>}
          </p>
          {action && <div className="flex shrink-0 items-center">{action}</div>}
        </div>
        {onDismiss && (
          <button data-slot="banner-close"
            ref={close}
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
            className="press -mr-3 flex size-(--h-md) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
    </div>
  )
}
