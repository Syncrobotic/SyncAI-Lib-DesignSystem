// @syncrobotic/action-rail-shell v0.17.2 · update: npx shadcn add @syncrobotic/action-rail-shell --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, Ellipsis, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"

/** One action in the rail. Give `href` to navigate (through `linkAs`) or `onSelect` to act. */
export type RailAction = {
  label: string
  icon?: LucideIcon
  href?: string
  onSelect?: () => void
  /** The primary only: busy after it was pressed, e.g. while the next step starts. */
  loading?: boolean
  disabled?: boolean
  /** Why it is disabled, said under the button. Say it whenever `disabled` is set. */
  disabledReason?: string
}

export type ActionRailStep = {
  /** What the next step is, e.g. "Review 24 new labels". */
  title: string
  /** One short line of what it does. */
  description?: string
}

type ActionRailShellProps = {
  /** The page's title in the top bar. */
  title: string
  /** Levels above this page (a Breadcrumb's links), shown before the title from 768 px. */
  breadcrumb?: React.ReactNode
  /** Go up a level. Also called by ← and Esc, unless someone is typing or an overlay is open. */
  onBack?: () => void
  backLabel?: string
  /** Buttons at the right of the top bar. */
  actions?: React.ReactNode
  /** The step the rail is for. */
  step: ActionRailStep
  /** Small words above the step's title. Default "Next step". */
  stepLabel?: string
  /** The one large button: what this page is for. */
  primary: RailAction
  /** A few related small actions. On phones they move into a menu beside the primary. */
  secondary?: RailAction[]
  /** Name of the phones' menu button. Default "More actions". */
  moreLabel?: string
  /** Swap in your router's link (e.g. next/link). */
  linkAs?: React.ElementType
  children: React.ReactNode
}

const typing = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest("input, textarea, select, [contenteditable='true'], [contenteditable=''], [role=textbox], [role=combobox], [role=spinbutton]")
// Widgets that use ← themselves (tabs, radio groups, sliders, menus, grids, a carousel's tiles) keep it.
const ownsArrows = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest("[role=tablist], [role=radiogroup], [role=slider], [role=listbox], [role=menu], [role=menubar], [role=grid], [role=tree], [role=toolbar]")
const overlayOpen = () => !!document.querySelector("[role=dialog][data-state=open], [role=alertdialog][data-state=open], [role=menu][data-state=open], [role=listbox][data-state=open]")

/**
 * A page that leads to one next step. The content sits on the left; the right column holds only that step: its title, one
 * line of what it does, one large primary button (--h-lg) and a few small related actions. On wide screens (1024 px and
 * up) the rail is a panel that stays in view as the content scrolls; on phones it becomes a bar fixed to the bottom with
 * the primary action, above the safe area, and the page is padded by the bar's measured height so nothing hides under it.
 * Panels follow the app shell: 8 px apart and from the edge, 16 px inside. ← and Esc go back up a level (`onBack`).
 */
export function ActionRailShell({
  title,
  breadcrumb,
  onBack,
  backLabel = "Back",
  actions,
  step,
  stepLabel = "Next step",
  primary,
  secondary = [],
  moreLabel = "More actions",
  linkAs: Link = "a",
  children,
}: ActionRailShellProps) {
  const rail = React.useRef<HTMLElement>(null)
  const [barHeight, setBarHeight] = React.useState<number | null>(null)
  const titleId = React.useId()
  const reasonId = React.useId()

  // ← and Esc go back. Not while typing, not with a modifier (Alt+← is the browser's own back), not when an overlay is
  // open (its Esc closes it) and not for ← inside a widget that moves with arrows.
  React.useEffect(() => {
    if (!onBack) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing) return
      if (e.key !== "Escape" && e.key !== "ArrowLeft") return
      if (typing(e.target) || overlayOpen()) return
      if (e.key === "ArrowLeft" && ownsArrows(e.target)) return
      e.preventDefault()
      onBack()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onBack])

  // On phones the rail is fixed over the page; pad the page by its real height, which grows with a long title or density.
  // The page scrolls, so its scroll padding takes the same height: a field or thumbnail that gets focus near the bottom
  // scrolls clear of the bar instead of stopping under it (WCAG 2.4.11).
  React.useEffect(() => {
    const el = rail.current
    if (!el) return
    const root = document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null
    const before = root?.style.scrollPaddingBottom ?? ""
    const ro = new ResizeObserver(() => {
      setBarHeight(el.offsetHeight)
      if (root)
        root.style.scrollPaddingBottom =
          getComputedStyle(el).position === "fixed" ? `calc(${el.offsetHeight}px + 1rem + env(safe-area-inset-bottom))` : before
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (root) root.style.scrollPaddingBottom = before
    }
  }, [])

  const actionButton = (a: RailAction, primaryAction: boolean, className?: string) => {
    const Icon = a.icon
    const content = (
      <>
        {Icon && <Icon aria-hidden="true" />}
        {a.label}
      </>
    )
    const props = {
      variant: primaryAction ? ("primary" as const) : ("ghost" as const),
      size: primaryAction ? ("lg" as const) : ("md" as const),
      className: cn(primaryAction ? "w-full" : "w-full justify-start", className),
    }
    if (a.href && !a.disabled)
      return (
        <Button key={a.label} asChild {...props}>
          <Link href={a.href} onClick={a.onSelect}>
            {content}
          </Link>
        </Button>
      )
    return (
      <Button
        key={a.label}
        {...props}
        onClick={a.onSelect}
        disabled={a.disabled}
        loading={a.loading}
        aria-describedby={primaryAction && a.disabled && a.disabledReason ? reasonId : undefined}
      >
        {content}
      </Button>
    )
  }

  return (
    <div
      data-slot="action-rail-shell"
      style={barHeight === null ? undefined : ({ "--action-bar": `${barHeight}px` } as React.CSSProperties)}
      className={cn(
        "flex min-h-dvh flex-col gap-2 bg-background p-2 text-foreground",
        // Phones: the bar's height, its 8 px from the bottom, the safe area and an 8 px gap above it.
        "max-lg:pb-[calc(var(--action-bar,8rem)+1rem+env(safe-area-inset-bottom))]",
      )}
    >
      <header className="flex h-(--h-row) shrink-0 items-center gap-3 rounded-md bg-card px-4 ring-1 ring-border">
        {onBack && (
          <button
            type="button"
            aria-label={backLabel}
            aria-keyshortcuts="ArrowLeft Escape"
            title={`${backLabel} (← or Esc)`}
            onClick={onBack}
            className="press -ml-3 flex size-(--h-md) shrink-0 items-center justify-center rounded-sm hover:bg-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
        )}
        {breadcrumb && <div className="hidden min-w-0 shrink items-center gap-1 md:flex">{breadcrumb}</div>}
        <h1 className="min-w-0 truncate text-lg font-bold">{title}</h1>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>

      <div className="flex flex-1 items-start gap-2">
        <main className="min-w-0 flex-1 self-stretch rounded-md bg-card p-4 ring-1 ring-border">{children}</main>

        <aside
          ref={rail}
          aria-labelledby={titleId}
          className={cn(
            "z-40 flex flex-col",
            // Wide: a panel in the column, kept in view while the content scrolls.
            "lg:sticky lg:top-2 lg:w-80 lg:shrink-0 lg:gap-4 lg:rounded-md lg:bg-card lg:p-4 lg:ring-1 lg:ring-border",
            // Phones: a floating bar 8 px from the edges and above the home indicator. Radius 20 = the button's 12 + 8.
            "max-lg:fixed max-lg:inset-x-2 max-lg:bottom-[calc(0.5rem+env(safe-area-inset-bottom))] max-lg:gap-2 max-lg:rounded-lg max-lg:bg-float max-lg:p-2 max-lg:shadow-float max-lg:ring-1 max-lg:ring-edge max-lg:backdrop-blur-xl",
          )}
        >
          <div className="flex min-w-0 flex-col gap-1 max-lg:px-2">
            <p className="text-xs text-muted-foreground max-lg:hidden">{stepLabel}</p>
            <h2 id={titleId} className="text-lg font-bold max-lg:truncate max-lg:text-sm max-lg:font-medium">
              {step.title}
            </h2>
            {step.description && <p className="text-sm text-muted-foreground max-lg:hidden">{step.description}</p>}
          </div>

          <div className="flex items-center gap-2">
            {secondary.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={moreLabel} className="size-(--h-lg) lg:hidden">
                    <Ellipsis aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  {secondary.map((a) => (
                    <DropdownMenuItem key={a.label} asChild={!!a.href && !a.disabled} disabled={a.disabled} onSelect={a.onSelect}>
                      {a.href && !a.disabled ? (
                        <Link href={a.href}>
                          {a.icon && <a.icon aria-hidden="true" />}
                          {a.label}
                        </Link>
                      ) : (
                        <>
                          {a.icon && <a.icon aria-hidden="true" />}
                          {a.label}
                        </>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {actionButton(primary, true, "min-w-0 flex-1")}
          </div>
          {primary.disabled && primary.disabledReason && (
            <p id={reasonId} className="text-xs text-muted-foreground max-lg:px-2">
              {primary.disabledReason}
            </p>
          )}

          {secondary.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-border pt-3 max-lg:hidden">{secondary.map((a) => actionButton(a, false))}</div>
          )}
        </aside>
      </div>
    </div>
  )
}
