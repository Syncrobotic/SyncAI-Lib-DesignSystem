"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/registry/syncrobotic/ui/command"
import { Kbd } from "@/registry/syncrobotic/ui/kbd"
import type { SearchEntry } from "./search-index"

const order: SearchEntry["group"][] = ["Pages", "Foundations", "Components", "Blocks", "Icons"]
let cached: Promise<SearchEntry[]> | undefined
const fold = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/**
 * Every word must appear (fuzzy letter-skipping found "Accessibility" for "fleet table"). The title outranks the text:
 * exact, then starting with the query, then containing every word; a match only in the description comes last.
 */
function score(e: SearchEntry, q: string) {
  const words = q.split(" ")
  const title = fold(e.title)
  const squashed = title.replace(/ /g, "")
  const rest = fold(`${e.hint ?? ""} ${e.text ?? ""} ${e.href}`)
  if (!words.every((w) => title.includes(w) || squashed.includes(w) || rest.includes(w))) return 0
  if (title === q || squashed === q.replace(/ /g, "")) return 100
  if (title.startsWith(q) || squashed.startsWith(q.replace(/ /g, ""))) return 80
  if (words.every((w) => title.includes(w))) return 60
  if (words.some((w) => title.includes(w))) return 40
  return 20
}

// Most of the index is icons; cap each group so a broad word does not bury the rest.
const cap: Record<SearchEntry["group"], number> = { Pages: 5, Foundations: 6, Components: 8, Blocks: 6, Icons: 8 }
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
  const q = fold(query)
  const shown = q
    ? (index ?? [])
        .map((e) => ({ e, s: score(e, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.e)
    : (index ?? []).filter((e) => e.group === "Pages" || (e.group === "Foundations" && !e.href.includes("#")))
  // Groups in the order of their best hit, so the best match is first whatever kind it is.
  const groupOrder = q ? [...new Set(shown.map((e) => e.group))] : order

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
      <CommandDialog open={open} onOpenChange={setOpen} title="Search the docs" description="Components, blocks, foundations and icons" shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search components, blocks, rules, icons" />
        <CommandList>
          <CommandEmpty>{index ? "Nothing matches. Try a component, a rule or an icon's meaning." : "Loading…"}</CommandEmpty>
          {groupOrder.map((g) => {
            const list = shown.filter((e) => e.group === g).slice(0, cap[g])
            if (list.length === 0) return null
            return (
              <CommandGroup key={g} heading={g}>
                {list.map((e) => (
                  <CommandItem key={e.href} value={e.href} onSelect={() => go(e.href)}>
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
