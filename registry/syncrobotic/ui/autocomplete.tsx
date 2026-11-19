// @syncrobotic/autocomplete v0.15.0 · update: npx shadcn add @syncrobotic/autocomplete --overwrite
"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useField } from "@/registry/syncrobotic/ui/field"
import { Popover, PopoverAnchor, PopoverContent } from "@/registry/syncrobotic/ui/popover"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

export type AutocompleteOption = { value: string; label: string; description?: string; group?: string; disabled?: boolean }

/**
 * A text field that suggests as you type (the WAI-ARIA combobox pattern): type to filter, arrows to move, Enter to pick,
 * Escape to close. For picking one of many known values (a robot, a site, a user) when a Select would be too long.
 * Filtering is built in; pass `onQueryChange` and `filter={false}` to search a server instead, with `loading`.
 */
export function Autocomplete({
  options,
  value,
  onValueChange,
  onQueryChange,
  filter = true,
  loading,
  placeholder = "Search",
  emptyText = "No matches",
  clearable = true,
  showTrigger = true,
  size = "md",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string | undefined) => void
  onQueryChange?: (query: string) => void
  /** Filter options by the typed text. Turn off when the server filters. */
  filter?: boolean
  loading?: boolean
  placeholder?: string
  emptyText?: string
  clearable?: boolean
  /** A chevron that opens the full list. */
  showTrigger?: boolean
  size?: "sm" | "md"
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}) {
  const f = useField()
  const listId = React.useId()
  const selected = options.find((o) => o.value === value)
  const [query, setQuery] = React.useState(selected?.label ?? "")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => setQuery(selected?.label ?? ""), [selected?.label])

  const typed = query !== (selected?.label ?? "")
  const shown = filter && typed ? options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(query.toLowerCase())) : options
  const enabled = shown.filter((o) => !o.disabled)
  const groups = [...new Set(shown.map((o) => o.group ?? ""))]

  const pick = (o: AutocompleteOption) => {
    onValueChange?.(o.value)
    setQuery(o.label)
    setOpen(false)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) return setOpen(true)
      const d = e.key === "ArrowDown" ? 1 : -1
      setActive((i) => (i + d + enabled.length) % Math.max(enabled.length, 1))
    } else if (e.key === "Enter" && open && enabled[active]) {
      e.preventDefault()
      pick(enabled[active])
    } else if (e.key === "Escape") {
      setOpen(false)
      setQuery(selected?.label ?? "")
    }
  }
  const optionId = (o: AutocompleteOption) => `${listId}-${o.value}`

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex w-full min-w-0 items-center rounded-sm bg-card ring-1 ring-input ring-inset transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
            "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring",
            f?.invalid && "ring-2 ring-danger",
            disabled && "bg-muted text-muted-foreground",
            size === "sm" ? "h-(--h-sm)" : "h-(--h-md)",
            className,
          )}
        >
          <input
            ref={inputRef}
            id={id ?? f?.id}
            role="combobox"
            aria-label={ariaLabel}
            aria-describedby={f?.describedBy}
            aria-invalid={f?.invalid || undefined}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && enabled[active] ? optionId(enabled[active]) : undefined}
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              setOpen(true)
              onQueryChange?.(e.target.value)
            }}
            onKeyDown={onKey}
            onBlur={() => !open && setQuery(selected?.label ?? "")}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          {loading && <Spinner delay={0} className="mr-2 size-4" label="Searching" />}
          {clearable && !disabled && (
            <button
              type="button"
              className={cn(
                "press flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-[opacity,visibility,background-color,color,scale] hover:bg-accent hover:text-foreground",
                query ? "visible opacity-100" : "invisible opacity-0",
              )}
              aria-label="Clear"
              // Always rendered, so it can fade in and out with the query instead of popping; hidden, it is out of the
              // tab order and the accessibility tree.
              aria-hidden={!query || undefined}
              tabIndex={query ? undefined : -1}
              onClick={() => {
                setQuery("")
                onValueChange?.(undefined)
                onQueryChange?.("")
                inputRef.current?.focus()
              }}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
          {showTrigger && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Show all"
              disabled={disabled}
              onClick={() => {
                setOpen((o) => !o)
                inputRef.current?.focus()
              }}
              className="press mr-1 flex size-(--h-sm) shrink-0 items-center justify-center rounded-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn("size-4 transition-transform duration-(--motion-base) ease-(--ease-standard)", open && !disabled && "rotate-180")}
              />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.target instanceof Node && inputRef.current?.parentElement?.contains(e.target) && e.preventDefault()}
        className="w-(--radix-popover-trigger-width) min-w-56 p-1"
      >
        <div id={listId} role="listbox" aria-label={ariaLabel ?? "Suggestions"} className="flex max-h-72 flex-col overflow-y-auto">
          {shown.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">{loading ? "Searching…" : emptyText}</p>}
          {groups.map((g) => (
            <div key={g} role={g ? "group" : undefined} aria-label={g || undefined} className="flex flex-col">
              {g && <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">{g}</div>}
              {shown
                .filter((o) => (o.group ?? "") === g)
                .map((o) => {
                  const isActive = enabled[active]?.value === o.value
                  return (
                    <div
                      key={o.value}
                      id={optionId(o)}
                      role="option"
                      aria-selected={o.value === value}
                      aria-disabled={o.disabled || undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => !o.disabled && pick(o)}
                      onMouseEnter={() => !o.disabled && setActive(enabled.indexOf(o))}
                      className={cn(
                        "flex min-h-(--h-sm) cursor-default items-center gap-2 rounded-sm px-3 py-1 text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                        isActive && "bg-accent",
                        o.disabled && "text-disabled",
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{o.label}</span>
                        {o.description && <span className="truncate text-xs text-muted-foreground">{o.description}</span>}
                      </span>
                      {o.value === value && <Check aria-hidden="true" className="size-4 shrink-0 animate-fade-in" />}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
