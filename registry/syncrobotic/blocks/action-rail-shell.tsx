// @syncrobotic/action-rail-shell v0.51.0 · update: npx shadcn add @syncrobotic/action-rail-shell --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, Ellipsis, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuMoreTrigger, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"

/** One action in the rail. Give `href` to navigate (through `linkAs`) or `onSelect` to act. */
export type RailAction = {
  /** Keeps the button the same element while its label changes (Run → Stop), so focus stays on it. Default: its place. */
  id?: string
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

/**
 * One item at the right of the top bar that folds into the ⋯ menu when the bar runs out of room. Give the items in
 * priority order: the last folds first. An item with `onSelect` or `href` is a button in the bar and an item in the menu;
 * one with only `node` (a badge, a status, the engine in use) shows as is in the bar and as its `label` in the menu.
 */
export type ActionRailHeaderItem = {
  /** Keeps the item the same element as it folds and comes back. */
  id: string
  /** Its words: the button's text, the icon's name with `iconOnly`, and the menu's row. */
  label: string
  icon?: LucideIcon
  /** In the bar only the icon, named by `label` (a theme toggle). */
  iconOnly?: boolean
  /** In the bar, your own element instead of a button (a badge, a status). The menu still shows `label`. */
  node?: React.ReactNode
  href?: string
  onSelect?: () => void
  disabled?: boolean
}

/** A side column of the workspace. Its title heads it, in a row as tall as every column's head, and names its landmark. */
export type ActionRailColumn = {
  title: string
  /** Small controls at the right of the column's head row (an icon button, a count). */
  actions?: React.ReactNode
  children: React.ReactNode
}

export type ActionRailShellLabels = {
  /** The back button. */
  back: string
  /** Small words above the step's title. */
  stepLabel: string
  /** The phones' menu of the rail's small actions. */
  moreActions: string
  /** The top bar's ⋯ menu, which holds the header items that do not fit. */
  headerMore: string
}

export const defaultActionRailShellLabels: ActionRailShellLabels = {
  back: "Back",
  stepLabel: "Next step",
  moreActions: "More actions",
  headerMore: "More",
}

type ActionRailShellProps = {
  /** The page's title in the top bar. */
  title: string
  /** Levels above this page (a Breadcrumb's links), shown before the title from 768 px. */
  breadcrumb?: React.ReactNode
  /** Go up a level. Also called by ← and Esc, unless someone is typing or an overlay is open. */
  onBack?: () => void
  backLabel?: string
  /** Buttons at the right end of the top bar. They never fold, so keep them few: the key action. */
  actions?: React.ReactNode
  /** Items before `actions`, in priority order. Those that do not fit fold into a ⋯ menu, last first, instead of wrapping. */
  headerItems?: ActionRailHeaderItem[]
  /**
   * A column left of `main` (a run history), from 1280 px. Below that it is not shown: reach it from a top-bar button
   * that opens a Sheet. `leading` or `panel` makes the page a workspace: from 1024 px it fills the screen, with no page
   * column, and each column scrolls on its own.
   */
  leading?: ActionRailColumn
  /**
   * A column right of `main` (the fields for the next step), from 1024 px, with the rail pinned at its bottom. On phones
   * it follows `main`, and the rail stays the bar at the bottom.
   */
  panel?: ActionRailColumn
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
  /** The words it shows and says, to translate them (actionRailShellLabels in labels-zh-tw). `backLabel`, `stepLabel` and `moreLabel` win over them. */
  labels?: Partial<ActionRailShellLabels>
  children: React.ReactNode
}

const typing = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest("input, textarea, select, [contenteditable='true'], [contenteditable=''], [role=textbox], [role=combobox], [role=spinbutton]")
// Widgets that use ← themselves (tabs, radio groups, sliders, menus, grids, a carousel's tiles) keep it.
const ownsArrows = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest("[role=tablist], [role=radiogroup], [role=slider], [role=listbox], [role=menu], [role=menubar], [role=grid], [role=tree], [role=toolbar]")
const overlayOpen = () => !!document.querySelector("[role=dialog][data-state=open], [role=alertdialog][data-state=open], [role=menu][data-state=open], [role=listbox][data-state=open]")

/** The title keeps at least this much room (or its whole width, if less) before header items stop folding and it truncates. */
const TITLE_MIN_REM = 10
const px = (v: string) => parseFloat(v) || 0

/**
 * A column's head row: --h-row tall with a hairline, so the hairlines of every column run on in one line. The side
 * columns draw theirs; put this first in `main` to give it the same row.
 */
export function ActionRailColumnHeader({ title, id, children, className }: { title: string; id?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="action-rail-column-header"
      className={cn(
        "flex h-(--h-row) shrink-0 items-center gap-2 border-b border-border px-4",
        "in-data-[slot=action-rail-main]:-mx-4 in-data-[slot=action-rail-main]:-mt-4 in-data-[slot=action-rail-main]:mb-4",
        className,
      )}
    >
      <h2 id={id} className="min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </h2>
      {children && <div className="flex shrink-0 items-center gap-1">{children}</div>}
    </div>
  )
}

/**
 * A page that leads to one next step: content on the left, and a rail with that step's title, one line, a large primary
 * button and a few small actions. From 1024 px the rail stays in view; on phones it is a bar fixed to the bottom. With
 * `leading` or `panel` it is a full-screen workspace whose columns scroll on their own. ← and Esc call `onBack`.
 */
export function ActionRailShell({
  title,
  breadcrumb,
  onBack,
  backLabel,
  actions,
  headerItems = [],
  leading,
  panel,
  step,
  stepLabel,
  primary,
  secondary = [],
  moreLabel,
  linkAs: Link = "a",
  labels,
  children,
}: ActionRailShellProps) {
  const l = { ...defaultActionRailShellLabels, ...labels }
  const back = backLabel ?? l.back
  const workspace = !!(leading || panel)
  const rail = React.useRef<HTMLElement>(null)
  const header = React.useRef<HTMLElement>(null)
  const [barHeight, setBarHeight] = React.useState<number | null>(null)
  const [shown, setShown] = React.useState(headerItems.length)
  const titleId = React.useId()
  const reasonId = React.useId()
  const leadingId = React.useId()
  const panelId = React.useId()

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

  // The top bar never wraps. Each header item's width is measured while it shows and remembered while it is folded. The
  // items that fit beside the back button, the breadcrumb, `actions` and the title (down to TITLE_MIN_REM; then it
  // truncates) stay; the rest fold into the ⋯ menu, last first. The bar's own size drives it, so it follows the window.
  const itemKey = headerItems.map((i) => i.id).join("\n")
  // Widths outlive the effect: an item folded before a re-run keeps the width it had. The effect runs again when the ⋯
  // button comes or goes, so its real width replaces the estimate.
  const measured = React.useRef({ widths: new Map<string, number>(), more: 0 })
  const overflowing = shown < headerItems.length
  React.useEffect(() => {
    const bar = header.current
    if (!bar || !itemKey) return
    const m = measured.current
    const ro = new ResizeObserver(() => {
      const row = bar.querySelector<HTMLElement>("[data-slot=action-rail-header-items]")
      if (!row) return
      const items = Array.from(row.querySelectorAll<HTMLElement>("[data-item]"))
      for (const el of items) if (el.offsetWidth > 0) m.widths.set(el.dataset.item ?? "", el.offsetWidth)
      const more = bar.querySelector<HTMLElement>("[data-slot=action-rail-header-more]")
      if (more && more.offsetWidth > 0) m.more = more.offsetWidth
      const style = getComputedStyle(bar)
      const gap = px(style.columnGap)
      const itemGap = px(getComputedStyle(row).columnGap)
      const rem = px(getComputedStyle(document.documentElement).fontSize) || 16
      const titleText = bar.querySelector<HTMLElement>("[data-slot=action-rail-title] > span")
      const titleMin = Math.min(titleText?.getBoundingClientRect().width ?? 0, TITLE_MIN_REM * rem)
      // Everything else in the bar (back, breadcrumb, actions), each with the gap before it.
      let others = 0
      for (const child of Array.from(bar.children) as HTMLElement[]) {
        const slot = child.dataset.slot
        if (slot === "action-rail-title" || slot === "action-rail-header-items" || slot === "action-rail-header-more") continue
        if (child.offsetWidth > 0) others += child.offsetWidth + gap
      }
      const room = bar.clientWidth - px(style.paddingLeft) - px(style.paddingRight) - titleMin - others - gap
      const need = (n: number) => items.slice(0, n).reduce((sum, el, i) => sum + (m.widths.get(el.dataset.item ?? "") ?? 0) + (i > 0 ? itemGap : 0), 0)
      let count = items.length
      if (need(count) > room) {
        // Fold: the ⋯ button takes its place (until it has been measured, a square as tall as the bar).
        const left = room - (m.more || bar.clientHeight) - gap
        count = 0
        while (count < items.length && need(count + 1) <= left) count++
      }
      setShown(count)
    })
    ro.observe(bar)
    return () => ro.disconnect()
  }, [itemKey, title, overflowing])
  const folded = headerItems.slice(shown)

  // Keyed by `id` or by place, never by label: a primary that turns from Run to Stop stays the same element, so a keyboard
  // user who pressed it keeps focus on it.
  const actionButton = (a: RailAction, primaryAction: boolean, key: string, className?: string) => {
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
        <Button key={key} asChild {...props}>
          <Link href={a.href} onClick={a.onSelect}>
            {content}
          </Link>
        </Button>
      )
    return (
      <Button
        key={key}
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

  // A header item in the bar: a ghost button (44 px, 48 in gloves), the product's own node, or its words.
  const headerItem = (item: ActionRailHeaderItem, i: number) => {
    const Icon = item.icon
    let inner = item.node
    if (!inner && (item.href || item.onSelect)) {
      const props = {
        "data-slot": "action-rail-header-action",
        variant: "ghost" as const,
        size: item.iconOnly ? ("icon" as const) : ("md" as const),
        "aria-label": item.iconOnly ? item.label : undefined,
        title: item.iconOnly ? item.label : undefined,
      }
      const content = (
        <>
          {Icon && <Icon aria-hidden="true" />}
          {!item.iconOnly && item.label}
        </>
      )
      inner =
        item.href && !item.disabled ? (
          <Button {...props} asChild>
            <Link href={item.href} onClick={item.onSelect}>
              {content}
            </Link>
          </Button>
        ) : (
          <Button {...props} onClick={item.onSelect} disabled={item.disabled}>
            {content}
          </Button>
        )
    }
    return (
      <div key={item.id} data-item={item.id} data-slot="action-rail-header-item" className={cn("flex shrink-0 items-center", i >= shown && "hidden")}>
        {inner ?? <span className="text-sm whitespace-nowrap text-muted-foreground">{item.label}</span>}
      </div>
    )
  }

  // A side column: a card, its head row and a body that scrolls on its own (from 1024 px).
  const column = (c: ActionRailColumn, id: string) => (
    <>
      <ActionRailColumnHeader id={id} title={c.title}>
        {c.actions}
      </ActionRailColumnHeader>
      <div data-slot="action-rail-column-body" className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
        {c.children}
      </div>
    </>
  )

  // In a panel the rail is a region at its foot; on its own it is the page's complementary column.
  const RailTag = panel ? "section" : "aside"
  const railElement = (
    <RailTag
      ref={rail}
      data-slot="action-rail"
      aria-labelledby={titleId}
      className={cn(
        "z-40 flex flex-col",
        panel
          ? // Wide: pinned at the panel's foot, under a hairline, 16 px inside.
            "lg:shrink-0 lg:gap-4 lg:border-t lg:border-border lg:p-4"
          : // Wide: a panel in the column, kept in view while the content scrolls.
            "lg:sticky lg:top-2 lg:w-80 lg:shrink-0 lg:gap-4 lg:rounded-md lg:bg-card lg:p-4 lg:ring-1 lg:ring-border",
        // Phones: a floating bar 8 px from the edges and above the home indicator. The title and the buttons sit 12 px
        // in on every side; radius 24 = the button's 12 + 12.
        "max-lg:fixed max-lg:inset-x-2 max-lg:bottom-[calc(0.5rem+env(safe-area-inset-bottom))] max-lg:gap-2 max-lg:rounded-xl max-lg:bg-float max-lg:p-3 max-lg:shadow-float max-lg:ring-1 max-lg:ring-edge max-lg:backdrop-blur-xl",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs text-muted-foreground max-lg:hidden">{stepLabel ?? l.stepLabel}</p>
        <h2 id={titleId} className="text-base font-bold max-lg:truncate max-lg:text-sm max-lg:font-medium">
          {step.title}
        </h2>
        {step.description && <p className="text-sm text-muted-foreground max-lg:hidden">{step.description}</p>}
      </div>

      <div className="flex items-center gap-2">
        {secondary.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={moreLabel ?? l.moreActions} className="size-(--h-lg) lg:hidden">
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              {secondary.map((a, i) => (
                <DropdownMenuItem key={a.id ?? `secondary-${i}`} asChild={!!a.href && !a.disabled} disabled={a.disabled} onSelect={a.onSelect}>
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
        {actionButton(primary, true, primary.id ?? "primary", "min-w-0 flex-1")}
      </div>
      {primary.disabled && primary.disabledReason && (
        <p id={reasonId} className="text-xs text-muted-foreground">
          {primary.disabledReason}
        </p>
      )}

      {secondary.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-3 max-lg:hidden">{secondary.map((a, i) => actionButton(a, false, a.id ?? `secondary-${i}`))}</div>
      )}
    </RailTag>
  )

  return (
    <div
      data-slot="action-rail-shell"
      data-workspace={workspace || undefined}
      style={barHeight === null ? undefined : ({ "--action-bar": `${barHeight}px` } as React.CSSProperties)}
      className={cn(
        "flex min-h-[var(--app-shell-height,100dvh)] flex-col gap-2 bg-background p-2 text-foreground",
        // Phones: the bar's height, its 8 px from the bottom, the safe area and an 8 px gap above it.
        "max-lg:pb-[calc(var(--action-bar,8rem)+1rem+env(safe-area-inset-bottom))]",
        // A workspace fills the screen from 1024 px; its columns scroll, the page does not.
        workspace && "lg:h-[var(--app-shell-height,100dvh)]",
      )}
    >
      <header ref={header} className="flex h-(--h-row) shrink-0 items-center gap-3 rounded-md bg-card px-4 ring-1 ring-border">
        {onBack && (
          <button data-slot="action-rail-back"
            type="button"
            aria-label={back}
            aria-keyshortcuts="ArrowLeft Escape"
            title={`${back} (← or Esc)`}
            onClick={onBack}
            className="press -ml-3 flex size-(--h-md) shrink-0 items-center justify-center rounded-sm hover:bg-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
        )}
        {breadcrumb && <div className="hidden min-w-0 shrink items-center gap-1 md:flex">{breadcrumb}</div>}
        <h1 data-slot="action-rail-title" className={cn("min-w-0 truncate text-base font-bold", headerItems.length > 0 && "flex-1")}>
          <span>{title}</span>
        </h1>
        {headerItems.length > 0 && (
          <div data-slot="action-rail-header-items" className={cn("flex shrink-0 items-center gap-2", shown === 0 && "hidden")}>
            {headerItems.map(headerItem)}
          </div>
        )}
        {folded.length > 0 && (
          <DropdownMenu>
            <DropdownMenuMoreTrigger data-slot="action-rail-header-more" aria-label={l.headerMore} title={l.headerMore} className="shrink-0" />
            <DropdownMenuContent align="end" className="min-w-56">
              {folded.map((item) =>
                item.href || item.onSelect ? (
                  <DropdownMenuItem key={item.id} asChild={!!item.href && !item.disabled} disabled={item.disabled} onSelect={item.onSelect}>
                    {item.href && !item.disabled ? (
                      <Link href={item.href}>
                        {item.icon && <item.icon aria-hidden="true" />}
                        {item.label}
                      </Link>
                    ) : (
                      <>
                        {item.icon && <item.icon aria-hidden="true" />}
                        {item.label}
                      </>
                    )}
                  </DropdownMenuItem>
                ) : (
                  // A fact, not an action (the engine in use): read in the menu, never a stop for the arrow keys.
                  <DropdownMenuLabel key={item.id} className="flex items-center gap-2 font-normal text-muted-foreground">
                    {item.icon && <item.icon aria-hidden="true" className="size-4" />}
                    {item.label}
                  </DropdownMenuLabel>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {actions && <div className={cn("flex shrink-0 items-center gap-2", headerItems.length === 0 && "ml-auto")}>{actions}</div>}
      </header>

      <div className={cn("flex flex-1 items-start gap-2", workspace && "max-lg:flex-col max-lg:items-stretch lg:min-h-0 lg:items-stretch")}>
        {leading && (
          <aside data-slot="action-rail-leading" aria-labelledby={leadingId} className="hidden w-72 shrink-0 flex-col rounded-md bg-card ring-1 ring-border xl:flex">
            {column(leading, leadingId)}
          </aside>
        )}

        <main data-slot="action-rail-main" className={cn("min-w-0 flex-1 self-stretch rounded-md bg-card p-4 ring-1 ring-border", workspace && "lg:overflow-y-auto lg:overscroll-contain")}>
          {children}
        </main>

        {panel ? (
          <aside data-slot="action-rail-panel" aria-labelledby={panelId} className="flex flex-col rounded-md bg-card ring-1 ring-border lg:w-90 lg:shrink-0">
            {column(panel, panelId)}
            {railElement}
          </aside>
        ) : (
          railElement
        )}
      </div>
    </div>
  )
}
