// @syncrobotic/tree v0.18.1 · update: npx shadcn add @syncrobotic/tree --overwrite
"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** One node of a hierarchy. Branches have `children`; an empty array is a branch with nothing in it yet. */
export type TreeNode = {
  id: string
  label: React.ReactNode
  /** The node's name as plain text, when `label` is not a string: type-ahead, the full-text title and the accessible name. */
  textValue?: string
  icon?: LucideIcon
  /** Right-aligned muted text or a badge: a count, a version, "(listed above)". It never wraps under the label. */
  meta?: React.ReactNode
  /** list mode: the label is a link (through `linkAs`). Ignored in select mode, where choosing calls onSelectedChange. */
  href?: string
  disabled?: boolean
  children?: TreeNode[]
}

export type TreeLabels = {
  /** The disclosure button's name in list mode; aria-expanded says whether it is open. */
  toggle: (name: string) => string
}

const defaultLabels: TreeLabels = { toggle: (name) => `Items under ${name}` }

export type TreeProps = {
  items: TreeNode[]
  /** Names the tree or list for screen readers: "Lineage", "Dataset files". */
  label: string
  /**
   * list (default): a nested list whose links and disclosure buttons are ordinary Tab stops.
   * select: a tree widget (role="tree"), one Tab stop, arrow keys, and one selected node.
   */
  mode?: "list" | "select"
  /** Branches open at first (uncontrolled). */
  defaultExpanded?: string[]
  /** Open branches, controlled; pair with onExpandedChange. */
  expanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** Every branch open at first (uncontrolled), for short trees people read whole. */
  expandAll?: boolean
  /** select mode: the selected node, controlled; pair with onSelectedChange. */
  selectedId?: string
  /** select mode: the node selected at first (uncontrolled). */
  defaultSelectedId?: string
  onSelectedChange?: (id: string, node: TreeNode) => void
  /** Shown instead of the tree when items is empty. */
  empty?: React.ReactNode
  /** Your router's link (e.g. next/link), for nodes with href in list mode. */
  linkAs?: React.ElementType
  labels?: Partial<TreeLabels>
  className?: string
}

const textOf = (n: TreeNode) => n.textValue ?? (typeof n.label === "string" ? n.label : "")
const isBranch = (n: TreeNode) => Array.isArray(n.children)

function branchIds(nodes: TreeNode[], out: string[] = []) {
  for (const n of nodes) {
    if (!isBranch(n)) continue
    out.push(n.id)
    branchIds(n.children!, out)
  }
  return out
}

// How the tree was last used: keys or a pointer, the last one anywhere on the page, as in select and dropdown-menu.
// Tabbing in shows the ring at once; a click shows none until a key moves in the tree.
let lastInput: "key" | "pointer" = "pointer"
if (typeof document !== "undefined") {
  document.addEventListener("keydown", () => (lastInput = "key"), true)
  document.addEventListener("pointerdown", () => (lastInput = "pointer"), true)
}

// A level's children hang from a 1 px guide line under their parent's chevron (half the --h-sm box in), then 8 px.
// The step follows --h-sm, so it widens with the rows on touch and in gloves.
const group = "ms-[calc(var(--h-sm)/2)] border-s border-border ps-2"
const row = "flex h-(--h-sm) min-w-0 items-center gap-2 rounded-xs text-sm"
const chevron = (open: boolean) =>
  cn("size-4 shrink-0 text-muted-foreground transition-transform duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none", !open && "-rotate-90")
const content = "overflow-hidden data-[state=open]:animate-expand data-[state=closed]:animate-collapse"

function Label({ node, id }: { node: TreeNode; id?: string }) {
  const Icon = node.icon
  const text = textOf(node)
  return (
    <>
      {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
      {/* Long names end in an ellipsis; the whole name is in the title. */}
      <span id={id} title={text || undefined} className="min-w-0 flex-1 truncate">
        {node.label}
      </span>
    </>
  )
}

function Meta({ node, id }: { node: TreeNode; id?: string }) {
  if (node.meta === undefined || node.meta === null) return null
  return (
    <span id={id} className="flex shrink-0 items-center whitespace-nowrap text-xs text-muted-foreground tabular-nums">
      {node.meta}
    </span>
  )
}

/**
 * A hierarchy: data lineage, sites › zones › robots, the folders of a dataset. Two modes, because WAI-ARIA keeps
 * role="tree" for a widget people move and select in. list (default) is a nested list with a guide line per level, a
 * disclosure button per branch and links that are ordinary Tab stops. select is a tree: one Tab stop, the arrow keys of
 * the WAI-ARIA tree view pattern, type-ahead and one selected node.
 */
export function Tree({
  items,
  label,
  mode = "list",
  defaultExpanded,
  expanded: expandedProp,
  onExpandedChange,
  expandAll,
  selectedId: selectedProp,
  defaultSelectedId,
  onSelectedChange,
  empty = "Nothing here yet.",
  linkAs = "a",
  labels: given,
  className,
}: TreeProps) {
  const labels = { ...defaultLabels, ...given }
  const [expandedState, setExpandedState] = React.useState<string[]>(() => (expandAll ? branchIds(items) : (defaultExpanded ?? [])))
  const expanded = expandedProp ?? expandedState
  const open = new Set(expanded)
  const setOpen = (id: string, value: boolean) => {
    const next = value ? [...expanded.filter((x) => x !== id), id] : expanded.filter((x) => x !== id)
    if (expandedProp === undefined) setExpandedState(next)
    onExpandedChange?.(next)
  }

  if (items.length === 0) {
    return (
      <p data-slot="tree" data-empty="" className={cn("py-2 text-sm text-muted-foreground", className)}>
        {empty}
      </p>
    )
  }

  if (mode === "select") {
    return (
      <SelectTree
        items={items}
        label={label}
        open={open}
        expanded={expanded}
        setExpanded={(next) => {
          if (expandedProp === undefined) setExpandedState(next)
          onExpandedChange?.(next)
        }}
        setOpen={setOpen}
        selectedProp={selectedProp}
        defaultSelectedId={defaultSelectedId}
        onSelectedChange={onSelectedChange}
        className={className}
      />
    )
  }

  const Link = linkAs
  const renderList = (nodes: TreeNode[]): React.ReactNode =>
    nodes.map((n) => {
      const text = textOf(n)
      const body = (
        <div className="flex min-w-0 items-center gap-2 pe-2">
          {n.href && !n.disabled ? (
            <Link
              href={n.href}
              className={cn(
                row,
                "flex-1 px-2 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                "transition-colors duration-(--motion-fast) ease-(--ease-standard)",
              )}
            >
              <Label node={n} />
            </Link>
          ) : (
            <span className={cn(row, "flex-1 px-2", n.disabled && "text-disabled [&_svg]:text-disabled")}>
              <Label node={n} />
            </span>
          )}
          <Meta node={n} />
        </div>
      )
      if (!isBranch(n)) {
        return (
          <li key={n.id} className="flex">
            {/* Leaves keep the chevron's place, so names line up with their siblings'. */}
            <span aria-hidden="true" className="w-(--h-sm) shrink-0" />
            <div className="min-w-0 flex-1">{body}</div>
          </li>
        )
      }
      const isOpen = open.has(n.id)
      return (
        <CollapsiblePrimitive.Root key={n.id} asChild open={isOpen} onOpenChange={(v) => setOpen(n.id, v)} disabled={n.disabled}>
          <li>
            <div className="flex">
              <CollapsiblePrimitive.Trigger
                aria-label={labels.toggle(text)}
                className={cn(
                  "press grid size-(--h-sm) shrink-0 place-items-center rounded-xs hover:bg-accent",
                  "transition-colors duration-(--motion-fast) ease-(--ease-standard) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  "disabled:pointer-events-none disabled:[&>svg]:text-disabled",
                )}
              >
                <ChevronDown aria-hidden="true" className={chevron(isOpen)} />
              </CollapsiblePrimitive.Trigger>
              <div className="min-w-0 flex-1">{body}</div>
            </div>
            <CollapsiblePrimitive.Content className={content}>
              <ul className={group}>{renderList(n.children!)}</ul>
            </CollapsiblePrimitive.Content>
          </li>
        </CollapsiblePrimitive.Root>
      )
    })

  return (
    <ul data-slot="tree" data-mode="list" aria-label={label} className={cn("flex min-w-0 flex-col", className)}>
      {renderList(items)}
    </ul>
  )
}

type Visible = { node: TreeNode; parent?: string; siblings: TreeNode[] }

function SelectTree({
  items,
  label,
  open,
  expanded,
  setExpanded,
  setOpen,
  selectedProp,
  defaultSelectedId,
  onSelectedChange,
  className,
}: {
  items: TreeNode[]
  label: string
  open: Set<string>
  expanded: string[]
  setExpanded: (next: string[]) => void
  setOpen: (id: string, value: boolean) => void
  selectedProp?: string
  defaultSelectedId?: string
  onSelectedChange?: (id: string, node: TreeNode) => void
  className?: string
}) {
  const uid = React.useId()
  const [selectedState, setSelectedState] = React.useState(defaultSelectedId)
  const selected = selectedProp ?? selectedState
  const [focused, setFocused] = React.useState<string>()
  const [nav, setNav] = React.useState<"key" | "pointer">(() => lastInput)
  const refs = React.useRef(new Map<string, HTMLLIElement>())
  const typed = React.useRef({ text: "", at: 0 })

  // The nodes on screen, in reading order: the ones the keys move between.
  const visible: Visible[] = []
  const walk = (nodes: TreeNode[], parent?: string) => {
    for (const n of nodes) {
      visible.push({ node: n, parent, siblings: nodes })
      if (isBranch(n) && open.has(n.id)) walk(n.children!, n.id)
    }
  }
  walk(items)
  const enabled = visible.filter((v) => !v.node.disabled)
  const byId = new Map(visible.map((v) => [v.node.id, v]))

  // One Tab stop: the focused node while it is on screen, else the selected one, else the first that can be used.
  // When a branch closes over the focused node, its nearest open ancestor takes the stop.
  const ancestorOnScreen = (id?: string): string | undefined => {
    if (!id) return undefined
    if (byId.has(id)) return id
    const parentOf = (target: string, nodes: TreeNode[], parent?: string): string | undefined | null => {
      for (const n of nodes) {
        if (n.id === target) return parent ?? null
        if (n.children) {
          const p = parentOf(target, n.children, n.id)
          if (p !== undefined) return p
        }
      }
      return undefined
    }
    const p = parentOf(id, items)
    return p ? ancestorOnScreen(p) : undefined
  }
  const stopCandidate = ancestorOnScreen(focused) ?? ancestorOnScreen(selected)
  const tabStop = stopCandidate && !byId.get(stopCandidate)?.node.disabled ? stopCandidate : enabled[0]?.node.id

  const moveTo = (id?: string) => {
    if (!id) return
    setFocused(id)
    refs.current.get(id)?.focus()
  }
  const select = (n: TreeNode) => {
    if (n.disabled) return
    if (selectedProp === undefined) setSelectedState(n.id)
    onSelectedChange?.(n.id, n)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    setNav("key")
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-tree-id]")?.dataset.treeId
    const here = id ? byId.get(id) : undefined
    if (!here || e.altKey || e.ctrlKey || e.metaKey) return
    const n = here.node
    const at = enabled.findIndex((v) => v.node.id === n.id)
    const branch = isBranch(n)
    let handled = true
    switch (e.key) {
      case "ArrowDown":
        moveTo(enabled[at + 1]?.node.id)
        break
      case "ArrowUp":
        moveTo(enabled[at - 1]?.node.id)
        break
      case "Home":
        moveTo(enabled[0]?.node.id)
        break
      case "End":
        moveTo(enabled[enabled.length - 1]?.node.id)
        break
      case "ArrowRight":
        if (branch && !open.has(n.id)) setOpen(n.id, true)
        else if (branch) moveTo(n.children!.find((c) => !c.disabled)?.id)
        break
      case "ArrowLeft":
        if (branch && open.has(n.id)) setOpen(n.id, false)
        else if (here.parent && !byId.get(here.parent)?.node.disabled) moveTo(here.parent)
        break
      case "Enter":
      case " ":
        select(n)
        break
      case "*": {
        const more = here.siblings.filter((s) => isBranch(s) && !s.disabled && !open.has(s.id)).map((s) => s.id)
        if (more.length) setExpanded([...expanded, ...more])
        break
      }
      default:
        handled = false
        // Type-ahead: letters typed within half a second build a prefix; the same letter again goes to the next match.
        if (e.key.length === 1 && e.key.trim()) {
          // The key event's own time, not a clock read: it is the moment the letter was typed, and keeps the handler
          // pure for the React Compiler. The first letter starts afresh either way, since the prefix begins empty.
          const now = e.timeStamp
          const t = typed.current
          t.text = now - t.at > 500 ? e.key : t.text + e.key
          t.at = now
          const prefix = t.text.length > 1 && [...t.text].every((c) => c === t.text[0]) ? t.text.charAt(0) : t.text
          const lower = prefix.toLocaleLowerCase()
          const from = prefix.length === 1 ? at + 1 : at
          const order = [...enabled.slice(from), ...enabled.slice(0, from)]
          moveTo(order.find((v) => textOf(v.node).toLocaleLowerCase().startsWith(lower))?.node.id)
          handled = true
        }
    }
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const level = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((n, i) => {
      const branch = isBranch(n)
      const isOpen = branch && open.has(n.id)
      const isSelected = n.id === selected
      const labelId = `${uid}-${n.id}-label`
      const metaId = n.meta !== undefined && n.meta !== null ? `${uid}-${n.id}-meta` : undefined
      const item = (
        <li
          ref={(el) => {
            if (el) refs.current.set(n.id, el)
            else refs.current.delete(n.id)
          }}
          role="treeitem"
          data-tree-id={n.id}
          aria-level={depth}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-expanded={branch ? isOpen : undefined}
          aria-selected={isSelected}
          aria-disabled={n.disabled || undefined}
          // The name is what the row shows, label then meta ("dock-03_0412.jpg 2.4 MB"), so speech matches the visible words.
          aria-label={n.textValue}
          aria-labelledby={n.textValue ? undefined : metaId ? `${labelId} ${metaId}` : labelId}
          aria-describedby={n.textValue ? metaId : undefined}
          tabIndex={n.id === tabStop ? 0 : -1}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocused(n.id)
          }}
          // focus-ring: the item's own row draws it, a 2 px ring inside the row after keyboard use (data-nav="key").
          className="outline-none"
        >
          <div
            onClick={() => select(n)}
            className={cn(
              row,
              "cursor-default select-none pe-2 transition-colors duration-(--motion-fast) ease-(--ease-standard)",
              // Selected: the kit's current look, a muted fill and weight. Hover is the lighter accent, so the two never look alike.
              isSelected ? "bg-muted font-medium text-foreground" : "hover:bg-accent",
              n.disabled && "pointer-events-none text-disabled [&_svg]:text-disabled",
              // The keyboard position: a 2 px ring inside the row of the focused item, only in keyboard use.
              "[[data-nav=key]_:focus>&]:outline-2 [[data-nav=key]_:focus>&]:-outline-offset-2 [[data-nav=key]_:focus>&]:outline-ring [[data-nav=key]_:focus>&]:outline-solid",
            )}
          >
            {branch ? (
              <span
                aria-hidden="true"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!n.disabled) setOpen(n.id, !isOpen)
                }}
                className="grid size-(--h-sm) shrink-0 place-items-center"
              >
                <ChevronDown className={chevron(isOpen)} />
              </span>
            ) : (
              <span aria-hidden="true" className="w-(--h-sm) shrink-0" />
            )}
            <Label node={n} id={labelId} />
            {/* A space between the two, so text read from the row is "name meta", not "namemeta". */}
            {metaId && " "}
            <Meta node={n} id={metaId} />
          </div>
          {branch && (
            <CollapsiblePrimitive.Content className={content}>
              <ul role="group" className={group}>
                {level(n.children!, depth + 1)}
              </ul>
            </CollapsiblePrimitive.Content>
          )}
        </li>
      )
      return branch ? (
        <CollapsiblePrimitive.Root key={n.id} asChild open={isOpen}>
          {item}
        </CollapsiblePrimitive.Root>
      ) : (
        <React.Fragment key={n.id}>{item}</React.Fragment>
      )
    })

  return (
    <ul
      role="tree"
      aria-label={label}
      data-slot="tree"
      data-mode="select"
      data-nav={nav}
      onKeyDown={onKeyDown}
      onFocus={() => setNav(lastInput)}
      onPointerDown={() => setNav("pointer")}
      className={cn("flex min-w-0 flex-col", className)}
    >
      {level(items, 1)}
    </ul>
  )
}
