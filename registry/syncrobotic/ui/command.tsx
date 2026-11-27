// @syncrobotic/command v0.52.0 · update: npx shadcn add @syncrobotic/command --overwrite
"use client"

import * as React from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLastInput, trackInputModality } from "@/registry/syncrobotic/lib/input-modality"

/**
 * A filterable list driven from the keyboard (cmdk): type to narrow, ↑↓ to move, Enter to run. The highlighted row is
 * ringed only when the keyboard moved last (data-nav), and no row is ringed before anyone uses it.
 */
// The last input modality on the page: a palette opened with ⌘K rings its row at once; one opened with a click does not.
trackInputModality()

/** Scroll an item into view inside its own list only, never the page around it. */
function scrollWithinList(el: HTMLElement) {
  const list = el.closest<HTMLElement>("[cmdk-list]")
  if (!list) return
  const l = list.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (r.top < l.top) list.scrollTop -= l.top - r.top
  else if (r.bottom > l.bottom) list.scrollTop += r.bottom - l.bottom
}

/** The words a list says to screen readers. */
export type CommandLabels = {
  /** Said politely once typing settles: "3 results". */
  results: (count: number) => string
  /** Said politely when a query matches nothing. */
  empty: string
}

export const defaultCommandLabels: CommandLabels = {
  results: (n) => `${n} result${n === 1 ? "" : "s"}`,
  empty: "Nothing matches",
}

/** Keeps the text box's active descendant on the highlighted row, which cmdk can leave stale or unset. */
function syncActiveDescendant(el: HTMLElement) {
  const id = el.querySelector('[cmdk-item][aria-selected="true"]:not([aria-disabled="true"])')?.id
  el.querySelectorAll("[cmdk-input], [cmdk-list]").forEach((n) => {
    if (n.getAttribute("aria-activedescendant") === (id ?? null)) return
    if (id) n.setAttribute("aria-activedescendant", id)
    else n.removeAttribute("aria-activedescendant")
  })
}

/** Says how many results a query has, once typing pauses, so each key press is not read out. */
function CommandStatus({ labels }: { labels: CommandLabels }) {
  const search = useCommandState((state) => state.search)
  const count = useCommandState((state) => state.filtered.count)
  const [text, setText] = React.useState("")
  const say = React.useEffectEvent(() => setText(search ? (count ? labels.results(count) : labels.empty) : ""))
  React.useEffect(() => {
    const t = setTimeout(say, 500)
    return () => clearTimeout(t)
  }, [search, count])
  return (
    <div role="status" data-slot="command-status" className="sr-only">
      {text}
    </div>
  )
}

export function Command({
  className,
  onKeyDown,
  onPointerMove,
  onFocus,
  ref,
  label = "Search",
  labels,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & { labels?: Partial<CommandLabels> }) {
  const [nav, setNav] = React.useState<"rest" | "key" | "pointer">("rest")
  const root = React.useRef<HTMLDivElement | null>(null)
  // cmdk keeps the highlighted row in view with scrollIntoView, which also scrolls the page: an inline list further down
  // pulled the whole page to it as it mounted. Here the rows (and group headings) scroll their own list only.
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const scope = () => {
      el.querySelectorAll<HTMLElement>("[cmdk-item], [cmdk-group-heading]").forEach((n) => {
        if (n.dataset.scrollScoped) return
        n.dataset.scrollScoped = ""
        n.scrollIntoView = () => scrollWithinList(n)
      })
      syncActiveDescendant(el)
    }
    scope()
    const mo = new MutationObserver(scope)
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected", "aria-activedescendant"] })
    return () => mo.disconnect()
  }, [])
  return (
    <CommandPrimitive
      ref={(node) => {
        root.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      }}
      data-slot="command"
      data-nav={nav}
      onKeyDown={(e) => {
        setNav("key")
        onKeyDown?.(e)
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") setNav("pointer")
        onPointerMove?.(e)
      }}
      onFocus={(e) => {
        if (getLastInput() === "key") setNav("key")
        onFocus?.(e)
      }}
      label={label}
      className={cn("group/command flex size-full flex-col overflow-hidden bg-popover text-popover-foreground", className)}
      {...props}
    >
      {children}
      <CommandStatus labels={{ ...defaultCommandLabels, ...labels }} />
    </CommandPrimitive>
  )
}

export type CommandDialogLabels = CommandLabels & {
  /** The palette's name for screen readers, and its text box's. */
  title: string
  /** Read after the name: what can be searched. */
  description: string
}

export const defaultCommandDialogLabels: CommandDialogLabels = {
  ...defaultCommandLabels,
  title: "Search",
  description: "Search pages, robots and actions",
}

/**
 * The palette: opens from a search field or ⌘K / Ctrl+K, near the top of the screen so the list grows downwards
 * without the input moving. Appears and leaves like every overlay (--motion-base); Esc closes and returns focus.
 */
export function CommandDialog({
  open,
  onOpenChange,
  title,
  description,
  labels,
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Same as `labels.title`, and wins over it. */
  title?: string
  /** Same as `labels.description`, and wins over it. */
  description?: string
  /** The words it says, to translate them. */
  labels?: Partial<CommandDialogLabels>
}) {
  const l = { ...defaultCommandDialogLabels, ...labels }
  // The palette has no trigger of its own (it opens from ⌘K or a field), so Radix has nowhere to return focus. Remember
  // what had focus while it was closed and go back there on close. The listener stops in the layout cleanup, before an
  // autoFocus inside the palette can be mistaken for the element to return to, and ignores the palette while it leaves.
  const returnTo = React.useRef<Element | null>(null)
  React.useLayoutEffect(() => {
    if (open) return
    returnTo.current ??= document.activeElement
    const remember = (e: FocusEvent) => {
      if (e.target instanceof Element && !e.target.closest("[data-slot=command-dialog]")) returnTo.current = e.target
    }
    document.addEventListener("focusin", remember)
    return () => document.removeEventListener("focusin", remember)
  }, [open])
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-fade-in data-[state=closed]:animate-disappear" />
        <DialogPrimitive.Content
          data-slot="command-dialog"
          onCloseAutoFocus={(e) => {
            const el = returnTo.current
            if (el instanceof HTMLElement && el.isConnected && el !== document.body) {
              e.preventDefault()
              el.focus({ preventScroll: true })
            }
          }}
          className={cn(
            "fixed inset-x-4 top-[12vh] z-50 mx-auto flex max-h-[70vh] max-w-xl flex-col overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-border",
            "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title ?? l.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description ?? l.description}</DialogPrimitive.Description>
          {/* The text box is named after the palette unless a label of its own is given. */}
          <Command label={title ?? l.title} labels={{ results: l.results, empty: l.empty }} className={className} {...props}>
            {children}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** The text box, with a search icon and an optional element at the end (a scope, a shortcut hint). */
export function CommandInput({ className, end, ...props }: React.ComponentProps<typeof CommandPrimitive.Input> & { end?: React.ReactNode }) {
  return (
    <div
      data-slot="command-input"
      // The text box itself has no edge of its own, so on a page its row shows keyboard focus, inset so nothing clips it.
      // In the palette or a picker popover the box always has focus (it opens there and the list is driven from it), so the
      // ring would only frame the top for good: there the caret is the focus.
      className="flex h-(--h-row) shrink-0 items-center gap-2 border-b border-border px-4 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 in-data-[slot=command-dialog]:has-focus-visible:outline-none in-[[data-radix-popper-content-wrapper]]:has-focus-visible:outline-none"
    >
      <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        // focus-ring: its row draws the ring (has-focus-visible on command-input), or the caret in a palette.
        className={cn("h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground", className)}
        {...props}
      />
      {end}
    </div>
  )
}

export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-2", className)} {...props} />
}

/**
 * Say what was searched and what to try instead; also the place for a loading line. Takes a function of the query. It is
 * a disabled option, so the listbox is never empty and screen readers read it.
 */
export function CommandEmpty({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Empty>, "children"> & { children?: React.ReactNode | ((query: string) => React.ReactNode) }) {
  const query = useCommandState((state) => state.search)
  // cmdk forces role="presentation" on Empty itself, so the option is the element inside it.
  return (
    <CommandPrimitive.Empty data-slot="command-empty" {...props}>
      <div role="option" aria-disabled="true" aria-selected="false" className={cn("px-3 py-8 text-center text-sm text-muted-foreground", className)}>
        {typeof children === "function" ? children(query.trim()) : children}
      </div>
    </CommandPrimitive.Empty>
  )
}

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

/**
 * A line between groups. Decorative, not cmdk's role="separator": a listbox allows only options and groups. Hidden while a
 * query filters the list, as cmdk's own is.
 */
export function CommandSeparator({ className, ...props }: React.ComponentProps<"div">) {
  const filtering = useCommandState((state) => state.search !== "")
  if (filtering) return null
  return <div aria-hidden="true" data-slot="command-separator" className={cn("-mx-2 my-2 h-px bg-border", className)} {...props} />
}

/**
 * One result. The highlighted row is the one Enter runs; it follows the keyboard and the pointer. 44 px for touch.
 * In keyboard use it carries a 2 px ring inside the row as well as the fill, which on its own is 1.2:1 and cannot be found.
 */
export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex h-(--h-md) cursor-pointer items-center gap-2 rounded-xs px-3 text-sm select-none",
        "group-data-[nav=key]/command:data-[selected=true]:outline-2 group-data-[nav=key]/command:data-[selected=true]:-outline-offset-2 group-data-[nav=key]/command:data-[selected=true]:outline-ring",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) data-[selected=true]:bg-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:text-disabled",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

/**
 * The check that marks a picked row when several can be picked. It fades and scales in and out (the swap pattern,
 * --motion-fast) instead of blinking, and keeps its space either way so the row's label never moves.
 */
export function CommandCheck({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <Check
      aria-hidden="true"
      data-slot="command-check"
      className={cn(
        "transition-[opacity,scale] duration-(--motion-fast) ease-(--ease-standard)",
        checked ? "scale-100 opacity-100" : "scale-60 opacity-0",
        className,
      )}
    />
  )
}

/** A key hint at the end of a row or a field, e.g. ⌘K. */
export function CommandShortcut({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="command-shortcut"
      className={cn("ml-auto shrink-0 rounded-xs bg-muted px-1 py-0.5 font-mono text-xs whitespace-nowrap text-muted-foreground", className)}
      {...props}
    />
  )
}
