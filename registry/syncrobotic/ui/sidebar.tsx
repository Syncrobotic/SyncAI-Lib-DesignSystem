// @syncrobotic/sidebar v0.44.0 · update: npx shadcn add @syncrobotic/sidebar --overwrite
"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Sheet, SheetContent, SheetTitle } from "@/registry/syncrobotic/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"
import { isMac, parseCombo, useHotkeys } from "@/registry/syncrobotic/hooks/use-hotkeys"

/** The cookie that keeps the sidebar open or collapsed between visits ("true" or "false"). Read it on the server and pass it as `defaultOpen`. */
export const SIDEBAR_COOKIE_NAME = "sidebar_state"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7
// Below md (768 px) the sidebar is a sheet from the screen's edge; the classes below use the same breakpoint (md:).
const MOBILE_QUERY = "(max-width: 767px)"
// The open column's width, in px: 240 at first, 200 to 320 by dragging its edge. Dragged under 140 it folds to the 72 px rail.
const WIDTH = { min: 200, start: 240, max: 320, fold: 140, rail: 72, step: 16 }
const clampWidth = (w: number) => Math.round(Math.min(WIDTH.max, Math.max(WIDTH.min, w)))

export type SidebarLabels = {
  /** The sidebar's landmark (an aside). */
  sidebar: string
  /** The navigation landmark SidebarContent makes. */
  nav: string
  /** The phone sheet's title, read when it opens. */
  title: string
  /** The trigger while the sidebar is open. */
  collapse: string
  /** The trigger while the sidebar is a rail of icons, or hidden. */
  expand: string
  /** The trigger on phones, where it opens the sheet. */
  open: string
  /** SidebarRail, the handle beside the sidebar (a window splitter). */
  resize: string
  /** The handle's tooltip, under collapse or expand. */
  drag: string
}

const defaultLabels: SidebarLabels = {
  sidebar: "Sidebar",
  nav: "Main",
  title: "Navigation",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  open: "Open navigation",
  resize: "Resize sidebar",
  drag: "Drag to resize",
}

type SidebarContextValue = {
  /** expanded or collapsed, on wide screens. Phones use openMobile. */
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  labels: SidebarLabels
  /** The shortcut as people read it ("⌘B", "Ctrl B"), or null when there is none. */
  shortcut: string | null
  /** The shortcut for aria-keyshortcuts ("Meta+B", "Control+B"). */
  keyshortcuts: string | undefined
  /** true when the provider was told phone or desktop, instead of reading the screen. */
  forced: boolean
  /**
   * Asks for focus to go to whichever trigger shows after the next toggle: a trigger that hides itself on a toggle
   * (SidebarTrigger `show`) calls it when pressed from the keyboard, so focus never falls to the page's start.
   */
  handOffFocus: () => void
  /** The open column's width in px (200 to 320). */
  width: number
  /** Sets the width; `keep` stores it in the cookie (at the end of a drag, not on every move). */
  setWidth: (width: number, keep?: boolean) => void
  /** true while the handle is dragged: the width follows the pointer without easing. */
  resizing: boolean
  setResizing: (resizing: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

/** The sidebar's state and its setters, for any component inside a SidebarProvider. */
export function useSidebar() {
  const context = React.use(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.")
  return context
}

// The cookie, as an external store: a write notifies every provider, and the server (and the hydrating render) reads none,
// so the first paint is defaultOpen and the stored choice follows. Pass the cookie as defaultOpen to avoid that step.
const cookieListeners = new Set<() => void>()
const subscribeCookie = (onChange: () => void) => {
  cookieListeners.add(onChange)
  return () => {
    cookieListeners.delete(onChange)
  }
}
function readCookie(name: string) {
  for (const part of document.cookie.split(";")) {
    const [key, ...value] = part.trim().split("=")
    if (key === name) return value.join("=")
  }
  return null
}
function writeCookie(name: string, value: boolean | number) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  for (const listener of cookieListeners) listener()
}

const subscribeMobile = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
const mobileNow = () => window.matchMedia(MOBILE_QUERY).matches
// The platform never changes while the page is open, so there is nothing to subscribe to.
const subscribeNothing = () => () => {}

/** "mod+b" as people read it on this platform, and as aria-keyshortcuts names it. */
function describeShortcut(combo: string, mac: boolean) {
  const c = parseCombo(combo)
  const key = c.key.length === 1 ? c.key.toUpperCase() : c.key.charAt(0).toUpperCase() + c.key.slice(1)
  const read: string[] = []
  const aria: string[] = []
  if (c.ctrl || (c.mod && !mac)) {
    read.push(mac ? "⌃" : "Ctrl")
    aria.push("Control")
  }
  if (c.meta || (c.mod && mac)) {
    read.push("⌘")
    aria.push("Meta")
  }
  if (c.alt) {
    read.push(mac ? "⌥" : "Alt")
    aria.push("Alt")
  }
  if (c.shift) {
    read.push(mac ? "⇧" : "Shift")
    aria.push("Shift")
  }
  return { read: mac ? [...read, key].join("") : [...read, key].join(" "), aria: [...aria, key].join("+") }
}

type SidebarProviderProps = React.ComponentProps<"div"> & {
  /** Open at first on wide screens, until someone toggles it (uncontrolled). A stored choice (the cookie) wins over it. */
  defaultOpen?: boolean
  /** Open on wide screens, controlled; pair with onOpenChange. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The phone sheet open at first, for previews and tests. */
  defaultOpenMobile?: boolean
  /** The phone (sheet) or desktop (column) form, instead of following the screen's width (768 px): for a preview frame. */
  isMobile?: boolean
  /** The cookie that keeps the choice for a week (and `<name>_width` the width). null keeps them for this page only. */
  cookieName?: string | null
  /** The open column's width at first, in px (200 to 320, default 240). A stored width (the cookie) wins over it. */
  defaultWidth?: number
  /** Toggles the sidebar from anywhere on the page, except while typing. mod is ⌘ on a Mac, Ctrl elsewhere; false for none. */
  keyboardShortcut?: string | false
  labels?: Partial<SidebarLabels>
}

/**
 * Holds the sidebar's state for everything inside it: the Sidebar, its trigger and the page beside it. Lays them out in a
 * row; give it the frame's height (`h-dvh`) or let the page scroll beside a sticky sidebar.
 */
export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  defaultOpenMobile = false,
  isMobile: mobileProp,
  cookieName = SIDEBAR_COOKIE_NAME,
  defaultWidth = WIDTH.start,
  keyboardShortcut = "mod+b",
  labels: given,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const labels = { ...defaultLabels, ...given }
  const screenMobile = React.useSyncExternalStore(subscribeMobile, mobileNow, () => false)
  const isMobile = mobileProp ?? screenMobile
  const stored = React.useSyncExternalStore(subscribeCookie, () => (cookieName ? readCookie(cookieName) : null), () => null)
  // The person's choice on this page; until there is one, the cookie, then defaultOpen (which may follow the screen).
  const [choice, setChoice] = React.useState<boolean | null>(null)
  const open = openProp ?? choice ?? (stored === "true" ? true : stored === "false" ? false : defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(defaultOpenMobile)

  const setOpen = (value: boolean) => {
    if (openProp === undefined) setChoice(value)
    if (cookieName) writeCookie(cookieName, value)
    onOpenChange?.(value)
  }
  const toggleSidebar = () => (isMobile ? setOpenMobile(!openMobile) : setOpen(!open))

  const widthCookie = cookieName ? `${cookieName}_width` : null
  const storedWidth = React.useSyncExternalStore(subscribeCookie, () => (widthCookie ? readCookie(widthCookie) : null), () => null)
  const [widthChoice, setWidthChoice] = React.useState<number | null>(null)
  const width = clampWidth(widthChoice ?? (Number(storedWidth) || defaultWidth))
  const setWidth = (value: number, keep = false) => {
    setWidthChoice(clampWidth(value))
    if (keep && widthCookie) writeCookie(widthCookie, clampWidth(value))
  }
  const [resizing, setResizing] = React.useState(false)

  // The collapse control in the sidebar's header and the expand control in the page's top bar are two buttons, one shown
  // at a time. Pressed from the keyboard, the one that hides hands focus to the one that shows.
  const wrapperId = React.useId()
  const handOff = React.useRef(false)
  const handOffFocus = () => {
    handOff.current = true
  }
  React.useEffect(() => {
    if (!handOff.current) return
    handOff.current = false
    const wrapper = document.querySelector(`[data-sidebar-provider="${CSS.escape(wrapperId)}"]`)
    if (!wrapper) return
    // The trigger that belongs to the new state: collapse while open, expand while a rail.
    const wanted = open ? "expanded" : "collapsed"
    const shown = (el: Element) => (typeof el.checkVisibility === "function" ? el.checkVisibility() : true)
    const next = [...wrapper.querySelectorAll<HTMLElement>(`[data-slot=sidebar-trigger][data-show=${wanted}]`)].find(shown)
    next?.focus({ preventScroll: true })
  }, [open, wrapperId])

  useHotkeys(keyboardShortcut ? { [keyboardShortcut]: toggleSidebar } : {}, { enabled: !!keyboardShortcut })
  // Read on the client only; the server and the hydrating render say "Ctrl B".
  const mac = React.useSyncExternalStore(subscribeNothing, isMac, () => false)
  const shortcut = keyboardShortcut ? describeShortcut(keyboardShortcut, mac) : null

  const value: SidebarContextValue = {
    state: open ? "expanded" : "collapsed",
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
    labels,
    shortcut: shortcut?.read ?? null,
    keyshortcuts: shortcut?.aria,
    forced: mobileProp !== undefined,
    handOffFocus,
    width,
    setWidth,
    resizing,
    setResizing,
  }

  return (
    <SidebarContext value={value}>
      <div
        data-slot="sidebar-wrapper"
        data-sidebar-provider={wrapperId}
        className={cn("flex w-full", className)}
        {...props}
        style={{ "--sidebar-width": `${width}px`, ...props.style } as React.CSSProperties}
      >
        {children}
      </div>
    </SidebarContext>
  )
}

type SidebarProps = React.ComponentProps<"aside"> & {
  side?: "left" | "right"
  /** sidebar (default): a column with a hairline beside the page. floating: a raised panel (give the provider `gap-2 p-2`; SidebarRail sits in the 8 px gap). */
  variant?: "sidebar" | "floating"
  /** icon (default): collapses to a 72 px rail of icons with tooltips. offcanvas: collapses out of view. none: always open. */
  collapsible?: "icon" | "offcanvas" | "none"
}

/**
 * The main navigation of a console: a 240 px column (200 to 320 with SidebarRail) that collapses to a 72 px rail of icons, and a sheet from the screen's
 * edge on phones. Children are SidebarHeader, SidebarContent and SidebarFooter, the same on every screen.
 */
export function Sidebar({ side = "left", variant = "sidebar", collapsible = "icon", className, children, ...props }: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile, labels, forced, resizing } = useSidebar()

  if (isMobile && collapsible !== "none") {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side={side} aria-describedby={undefined} className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">{labels.title}</SheetTitle>
          <aside
            data-slot="sidebar"
            data-mobile="true"
            data-state="expanded"
            data-side={side}
            aria-label={labels.sidebar}
            className="group/sidebar flex min-h-full flex-col text-foreground"
            {...props}
          >
            {children}
          </aside>
        </SheetContent>
      </Sheet>
    )
  }

  const collapsed = collapsible !== "none" && state === "collapsed"
  const hidden = collapsed && collapsible === "offcanvas"
  return (
    <aside
      data-slot="sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      data-collapsible={collapsed ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-resizing={resizing || undefined}
      aria-label={labels.sidebar}
      className={cn(
        // Sticky and as tall as the screen when the page scrolls; as tall as the frame when the provider has a height.
        // Not clipped itself (the frame inside clips the column), so a SidebarRail can reach over its edge.
        "group/sidebar sticky top-0 h-svh max-h-full shrink-0 flex-col bg-card text-foreground",
        // Before hydration a phone cannot be told from the server, so the column hides below md by CSS; the sheet takes over.
        forced ? "flex" : "hidden md:flex",
        // The frame's width is what moves (--motion-sheet); icons stay on the rail's centre line and words fade.
        // While the handle is dragged the width follows the pointer as it is, without easing.
        "transition-[width] duration-(--motion-sheet) ease-(--ease-standard) motion-reduce:transition-none data-resizing:transition-none",
        collapsed ? (hidden ? "w-0" : "w-18") : "w-(--sidebar-width)",
        variant === "floating" ? "rounded-md ring-1 ring-border" : side === "left" ? "border-e border-border" : "border-s border-border",
        hidden && "border-0 ring-0",
        className,
      )}
      {...props}
    >
      {/* The frame clips the column while its width moves. It is not positioned, so a SidebarRail (absolute, placed by the
          aside) is not clipped by it. Off canvas, the column keeps its width while the frame closes over it, and nothing
          in it can be reached. */}
      <div data-slot="sidebar-frame" className="flex h-full min-h-0 w-full overflow-hidden rounded-[inherit]">
        <div inert={hidden} className={cn("flex h-full min-h-0 shrink-0 flex-col", collapsible === "offcanvas" ? "w-(--sidebar-width)" : "w-full")}>
          {children}
        </div>
      </div>
    </aside>
  )
}

/**
 * The trigger's icon: a panel whose sidebar column is filled while the sidebar is open and hollow when it is a rail. The
 * fill swaps at --motion-fast (the swap pattern), 2 px stroke like every icon.
 */
function SidebarIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path
        d="M4 4h5v16H4z"
        stroke="none"
        fill="currentColor"
        className={cn("transition-opacity duration-(--motion-fast) ease-(--ease-standard)", open ? "opacity-100" : "opacity-0")}
      />
      <path d="M9 3v18" />
    </svg>
  )
}

type SidebarTriggerProps = React.ComponentProps<"button"> & {
  /**
   * When it shows. always (default): one trigger that collapses and expands, wherever it is. The pair that puts the
   * collapse control on the sidebar: "expanded" in SidebarHeader (shown while the sidebar is open on a wide screen,
   * never on phones, where the sheet has its own close) and "collapsed" in the page's top bar (shown while the sidebar
   * is a rail or hidden, and always on phones, where it is the menu button that opens the sheet). "mobile": only on
   * phones, the menu button that opens the sheet, for a layout whose wide screens collapse and expand at the
   * sidebar's edge (SidebarRail) instead.
   */
  show?: "always" | "expanded" | "collapsed" | "mobile"
}

/**
 * Opens and closes the sidebar: collapse or expand on wide screens, the sheet on phones. Its tooltip names the shortcut.
 * With `show`, two triggers share the job: collapse on the sidebar's header, expand (and the phone's menu) in the top bar.
 */
export function SidebarTrigger({ show = "always", className, onClick, ...props }: SidebarTriggerProps) {
  const { isMobile, open, toggleSidebar, labels, shortcut, keyshortcuts, forced, handOffFocus } = useSidebar()
  const label = isMobile ? labels.open : open ? labels.collapse : labels.expand
  // "expanded" lives in the sidebar, which phones never show as a column. "collapsed" hides while the column is open on a
  // wide screen; until hydration a phone cannot be told from the server, so that is CSS (md:hidden), never a missing button.
  if (show === "expanded" && (isMobile || !open)) return null
  if (show === "collapsed" && open && !isMobile && forced) return null
  if (show === "mobile" && !isMobile && forced) return null
  const hideWide = (show === "collapsed" && open && !isMobile) || show === "mobile"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-slot="sidebar-trigger"
          data-show={show}
          aria-label={label}
          aria-keyshortcuts={keyshortcuts}
          className={cn(
            "press flex size-(--h-md) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:-outline-offset-2",
            "transition-colors duration-(--motion-fast) ease-(--ease-standard)",
            hideWide && "md:hidden",
            className,
          )}
          onClick={(e) => {
            onClick?.(e)
            if (e.defaultPrevented) return
            // A press from the keyboard (detail 0) on a trigger that is about to hide: focus goes to the one that shows.
            if (show !== "always" && e.detail === 0 && !isMobile) handOffFocus()
            toggleSidebar()
          }}
          {...props}
        >
          {isMobile ? <Menu aria-hidden="true" className="size-5" /> : <SidebarIcon open={open} />}
        </button>
      </TooltipTrigger>
      {/* Touch screens never show a tooltip; the button's name says the same. */}
      <TooltipContent side={show === "expanded" ? "right" : undefined}>
        <span className="flex items-center gap-2">
          {label}
          {shortcut && !isMobile && <kbd className="font-sans">{shortcut}</kbd>}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The handle beside the sidebar, a window splitter: drag it to make the column wider or narrower (200 to 320 px; under
 * 140 it folds to the rail, and dragged out of the rail it opens), click it to collapse or expand. A short pill in the
 * middle of the edge, quiet until hover, focus or a drag; beside a floating sidebar it sits in the 8 px gap, over nothing,
 * and beside a column it straddles the hairline. From the keyboard it is a Tab stop: ← and → resize by 16 px, Enter
 * collapses or expands, as does ⌘B / Ctrl+B anywhere. Put it last inside Sidebar. Absent on phones (the sheet).
 */
export function SidebarRail({ className, ...props }: React.ComponentProps<"div">) {
  const { isMobile, open, setOpen, toggleSidebar, labels, shortcut, keyshortcuts, width, setWidth, resizing, setResizing } = useSidebar()
  const drag = React.useRef<{ x: number; from: number; sign: number; moved: boolean } | null>(null)
  if (isMobile) return null
  const label = open ? labels.collapse : labels.expand
  // Towards the page widens: right for a sidebar on the left, left for one on the right.
  const sign = (el: Element) => ((el.closest("[data-slot=sidebar]") as HTMLElement | null)?.dataset.side === "right" ? -1 : 1)

  const follow = (next: number) => {
    if (next < WIDTH.fold) {
      if (open) setOpen(false)
    } else {
      if (!open) setOpen(true)
      setWidth(next)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={labels.resize}
          aria-valuemin={WIDTH.rail}
          aria-valuemax={WIDTH.max}
          aria-valuenow={open ? width : WIDTH.rail}
          aria-expanded={open}
          aria-keyshortcuts={keyshortcuts}
          tabIndex={0}
          data-slot="sidebar-rail"
          data-dragging={resizing || undefined}
          className={cn(
            // focus-ring: on the pill inside (group-focus-visible/rail), the shape you see.
            "group/rail absolute inset-y-0 z-10 flex w-2 cursor-ew-resize touch-none items-center justify-center outline-none select-none",
            // Floating: the 8 px gap beside the panel. A column: over its hairline, half each side.
            "group-data-[side=left]/sidebar:-right-2 group-data-[side=right]/sidebar:-left-2",
            "group-data-[variant=sidebar]/sidebar:group-data-[side=left]/sidebar:-right-1 group-data-[variant=sidebar]/sidebar:group-data-[side=right]/sidebar:-left-1",
            // On a touch screen the strip a finger can take grows to 24 px without changing what shows.
            "pointer-coarse:after:absolute pointer-coarse:after:inset-y-0 pointer-coarse:after:-inset-x-2",
            "group-data-[collapsible=offcanvas]/sidebar:hidden",
            className,
          )}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { x: e.clientX, from: open ? width : WIDTH.rail, sign: sign(e.currentTarget), moved: false }
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            const dx = (e.clientX - d.x) * d.sign
            // A few px of wobble in a click is not a drag.
            if (!d.moved && Math.abs(dx) < 4) return
            if (!d.moved) setResizing(true)
            d.moved = true
            follow(d.from + dx)
          }}
          onPointerUp={(e) => {
            const d = drag.current
            drag.current = null
            if (!d) return
            if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
            setResizing(false)
            if (d.moved) setWidth(width, true)
            else toggleSidebar()
          }}
          onPointerCancel={() => {
            drag.current = null
            setResizing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              toggleSidebar()
              return
            }
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
            e.preventDefault()
            const grow = (e.key === "ArrowRight" ? 1 : -1) * sign(e.currentTarget)
            if (!open) {
              if (grow > 0) setOpen(true)
              return
            }
            if (grow < 0 && width <= WIDTH.min) setOpen(false)
            else setWidth(width + grow * WIDTH.step, true)
          }}
          {...props}
        >
          {/* A short pill in the middle of the edge. Hidden until the pointer is over the sidebar, then a quiet line;
              on the handle itself taller and in the text's colour, and while dragged in the foreground's. Always there
              on a touch screen (no hover) and from the keyboard, with the focus ring on it. */}
          <span
            aria-hidden="true"
            className={cn(
              "h-8 w-1 scale-y-50 rounded-full bg-border opacity-0",
              "transition-[height,background-color,opacity,scale] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
              "group-hover/sidebar:scale-y-100 group-hover/sidebar:opacity-100 pointer-coarse:scale-y-100 pointer-coarse:opacity-100",
              "group-hover/rail:h-12 group-hover/rail:bg-muted-foreground group-data-dragging/rail:h-12 group-data-dragging/rail:scale-y-100 group-data-dragging/rail:bg-foreground group-data-dragging/rail:opacity-100",
              "group-focus-visible/rail:scale-y-100 group-focus-visible/rail:opacity-100",
              "group-focus-visible/rail:h-12 group-focus-visible/rail:bg-foreground group-focus-visible/rail:outline-2 group-focus-visible/rail:outline-offset-2 group-focus-visible/rail:outline-ring",
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            {label}
            {shortcut && <kbd className="font-sans">{shortcut}</kbd>}
          </span>
          <span className="text-muted-foreground">{labels.drag}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

/** The page beside the sidebar: a column that takes the rest of the row. A div, so the page keeps its own header and main. */
export function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)} {...props} />
}

/** The top of the sidebar: the product's mark and name, or a workspace or robot switcher (a size="lg" SidebarMenuButton). */
export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex shrink-0 flex-col gap-2 px-3 py-2", className)} {...props} />
}

/** The foot of the sidebar: who is signed in, with the account menu. */
export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex shrink-0 flex-col gap-2 px-3 py-2", className)} {...props} />
}

/** A hairline between parts of the sidebar, inset to the rail's edges. */
export function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="sidebar-separator" className={cn("mx-3 border-border", className)} {...props} />
}

/** The scrolling middle: the groups of links, in a navigation landmark ("Main"; pass aria-label to rename it). */
export function SidebarContent({ className, ...props }: React.ComponentProps<"nav">) {
  const { labels } = useSidebar()
  return (
    <nav
      data-slot="sidebar-content"
      aria-label={labels.nav}
      className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-3 py-2", className)}
      {...props}
    />
  )
}

/** One group of links, under an optional SidebarGroupLabel. Groups are 16 px apart. */
export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />
}

// Words beside the rail's icons are always rendered, so opening the rail never moves the icons: the column of icons stays on
// its centre line and the words fade (--motion-base) while the frame's width moves.
const fade = "whitespace-nowrap transition-opacity duration-(--motion-base) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:opacity-0"

/**
 * A group's name. As a rail, it gives way to a short centred line, so groups stay apart without a clipped word; the two
 * cross-fade. The line sits 4 px into the 20 px row, 20 px from the icon above and below.
 */
export function SidebarGroupLabel({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group-label" className={cn("relative flex h-5 shrink-0 items-center px-3 text-xs font-medium text-muted-foreground", className)} {...props}>
      <span className={cn("min-w-0 truncate", fade)}>{children}</span>
      <span
        aria-hidden="true"
        className="absolute top-1 left-3 h-px w-6 bg-border opacity-0 transition-opacity duration-(--motion-base) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:opacity-100"
      />
    </div>
  )
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("min-w-0", className)} {...props} />
}

/** A list of links. */
export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("relative min-w-0", className)} {...props} />
}

/** On phones, following a link closes the sheet, so the page it opens is not under it. */
function useCloseOnNavigate(onClick?: React.MouseEventHandler<HTMLElement>) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e)
    if (isMobile && !e.defaultPrevented && e.currentTarget.matches("a[href]")) setOpenMobile(false)
  }
}

const buttonSizes = {
  /** 36 px with a mouse, 44 on touch. */
  sm: "h-(--h-sm)",
  /** 44 px: the main links. */
  md: "h-(--h-md)",
  /** 56 px: a switcher in the header, the account in the footer. Leads with a 32 px mark or avatar, on the rail's centre line. */
  lg: "h-(--h-row) px-2",
} as const

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  /** Render your link (a, next/link) instead of a button, with the button's look. */
  asChild?: boolean
  /** The current page: the kit's current look (muted fill and weight) and aria-current="page". */
  isActive?: boolean
  size?: keyof typeof buttonSizes
  /** Shown beside the rail when the sidebar is collapsed: the link's name, or TooltipContent props. */
  tooltip?: React.ReactNode | React.ComponentProps<typeof TooltipContent>
}

/**
 * A link or button in the sidebar. Its first child is the icon (20 px) or, at size="lg", a 32 px mark; the next is the
 * name, then an optional SidebarMenuBadge or SidebarMenuTag. As a rail, only the first child shows, with the tooltip.
 */
export function SidebarMenuButton({ asChild = false, isActive = false, size = "md", tooltip, className, onClick, ...props }: SidebarMenuButtonProps) {
  const { state, isMobile } = useSidebar()
  const handleClick = useCloseOnNavigate(onClick)
  const Comp = asChild ? Slot.Root : "button"
  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-size={size}
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      type={asChild ? undefined : "button"}
      onClick={handleClick}
      className={cn(
        "press relative flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-sm px-3 text-start text-sm text-muted-foreground",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground data-[state=open]:bg-accent",
        // Current page: muted fill and weight, and it stays put on hover. Hover elsewhere is the lighter accent.
        "data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground data-[active=true]:hover:bg-muted",
        // Focus rings sit inside the item (-outline-offset-2), so they never stick out of the column or get clipped by it.
        "focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:text-disabled aria-disabled:pointer-events-none aria-disabled:text-disabled",
        // The icon is a 24 px box 12 px in: its centre is the rail's centre line (36 px). Other icons are 16 px.
        "[&>svg]:shrink-0 [&>svg:first-child]:mx-0.5 [&>svg:first-child]:size-5 [&>svg:not(:first-child)]:size-4",
        "[&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&>span:nth-child(2)]:truncate",
        // Everything after the icon fades on the rail, except what is marked to stay (a count's dot).
        "[&>:not(:first-child)]:whitespace-nowrap [&>:not(:first-child)]:transition-opacity [&>:not(:first-child)]:duration-(--motion-base) [&>:not(:first-child)]:ease-(--ease-standard)",
        "group-data-[collapsible=icon]/sidebar:[&>:not(:first-child):not([data-sidebar-keep])]:opacity-0",
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
  if (!tooltip) return button
  const content = typeof tooltip === "object" && tooltip !== null && !Array.isArray(tooltip) && !React.isValidElement(tooltip) ? (tooltip as React.ComponentProps<typeof TooltipContent>) : { children: tooltip }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      {/* Only the rail needs names beside its icons; open, the words are on screen. */}
      {state === "collapsed" && !isMobile && <TooltipContent side="right" align="center" {...content} />}
    </Tooltip>
  )
}

/**
 * A count on a link: unacknowledged alarms, unread events. A CountBadge at the end of the row (danger tint, or neutral);
 * on the rail, a dot on the icon's corner instead. Put it inside the SidebarMenuButton, so the count is part of the link's
 * name ("Alarms 2").
 */
export function SidebarMenuBadge({ count, max, tone = "danger", className }: { count: number; max?: number; tone?: "danger" | "neutral"; className?: string }) {
  if (count <= 0) return null
  return (
    <>
      <CountBadge count={count} max={max} tone={tone} className={className} />
      <span
        aria-hidden="true"
        data-sidebar-keep=""
        data-slot="sidebar-menu-dot"
        className={cn(
          "pointer-events-none absolute top-2 left-8 size-2 rounded-full opacity-0 ring-1 transition-opacity duration-(--motion-base) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:opacity-100",
          tone === "danger" ? "bg-danger-subtle ring-danger" : "bg-muted ring-muted-foreground",
        )}
      />
    </>
  )
}

/** A quiet word at the end of a link ("Beta", "New"): small grey text, no outline, there to find rather than to catch the eye. */
export function SidebarMenuTag({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="sidebar-menu-tag" className={cn("shrink-0 text-xs font-normal text-muted-foreground", className)} {...props} />
}

/**
 * The links under a link: the pages of a section. They hang from a guide line under the parent's icon, as in a Tree, and
 * are hidden on the rail (the parent is the way in). Show them while their section is current.
 */
export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn("ms-6 mt-1 flex min-w-0 flex-col gap-1 border-s border-border ps-2 group-data-[collapsible=icon]/sidebar:hidden", className)}
      {...props}
    />
  )
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("min-w-0", className)} {...props} />
}

/** A link under a link: 36 px with a mouse, 44 on touch. First child is the name; a SidebarMenuBadge or SidebarMenuTag may follow. */
export function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  onClick,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean; isActive?: boolean }) {
  const handleClick = useCloseOnNavigate(onClick)
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className={cn(
        "press flex h-(--h-sm) min-w-0 items-center gap-2 rounded-xs px-3 text-sm text-muted-foreground",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground focus-visible:-outline-offset-2",
        "data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground data-[active=true]:hover:bg-muted",
        "[&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        // A count's dot is for the rail, where sub-links are hidden.
        "[&>[data-sidebar-keep]]:hidden",
        className,
      )}
      {...props}
    />
  )
}
