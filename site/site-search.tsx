"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/registry/syncrobotic/ui/command"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"
import type { SearchEntry } from "./search-index"

const order: SearchEntry["group"][] = ["Pages", "Foundations", "Components", "Blocks", "Icons"]
let cached: Promise<SearchEntry[]> | undefined
const load = () => (cached ??= fetch("/search-index.json").then((r) => r.json() as Promise<SearchEntry[]>))

/**
 * Search across the site: ⌘K, Ctrl+K or / (outside a text box). Pages, foundation sections, components, blocks and the
 * icon set, from an index written at build time and fetched the first time the search opens (or the button is hovered).
 */
export function SiteSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [index, setIndex] = React.useState<SearchEntry[] | null>(null)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  React.useEffect(() => {
    if (open && !index) void load().then(setIndex)
  }, [open, index])

  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }
  // With nothing typed, the pages and foundations to start from; the rest (sections, every component, block and icon)
  // once a word narrows them.
  const shown = (index ?? []).filter((e) => query.trim() || e.group === "Pages" || (e.group === "Foundations" && !e.href.includes("#")))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={() => void load()}
        aria-label="Search the docs"
        className="press flex size-(--h-md) items-center justify-center gap-2 rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground md:h-(--h-sm) md:w-auto md:justify-start md:bg-secondary md:pr-2 md:pl-3 md:text-sm"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden md:inline">Search</span>
        <Kbd className="ml-4 hidden md:inline-flex">⌘K</Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search the docs" description="Components, blocks, foundations and icons">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search components, blocks, rules, icons" />
        <CommandList>
          <CommandEmpty>{index ? "Nothing matches. Try a component, a rule or an icon's meaning." : "Loading…"}</CommandEmpty>
          {order.map((g) => {
            const list = shown.filter((e) => e.group === g)
            if (list.length === 0) return null
            return (
              <CommandGroup key={g} heading={g}>
                {list.map((e) => (
                  <CommandItem key={e.href} value={e.href} keywords={[e.title, e.hint ?? "", e.text ?? ""]} onSelect={() => go(e.href)}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{e.title}</span>
                      {e.hint && <span className="truncate text-xs text-muted-foreground">{e.hint}</span>}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
