"use client"

import * as React from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

/** One icon to show: its drawing (already rendered), its name, and, for the kit's set, the one thing it means. */
export type GalleryIcon = {
  name: string
  glyph: React.ReactNode
  /** The kit's meaning; absent for a Lucide icon outside the set. */
  means?: string
  /** Where it imports from. */
  from: "lucide-react" | "@/components/ui/robot-icons"
}
export type GalleryGroup = { title: string; icons: GalleryIcon[]; note?: React.ReactNode }

const sizes = [
  { value: "16", cls: "[&_svg]:size-4" },
  { value: "20", cls: "[&_svg]:size-5" },
  { value: "24", cls: "[&_svg]:size-6" },
] as const

/**
 * Icons as a grid of tiles. Search matches the name and, in the kit's set, the meaning ("dock" finds ChargingDock).
 * Picking a tile opens its details: the drawing at every size, what it means, and what to copy. On wide screens the
 * details sit beside the grid; on a phone they rise from the bottom.
 */
export function IconGallery({ groups, total, placeholder, markKit = false }: { groups: GalleryGroup[]; total: number; placeholder: string; /** Dot the icons the kit has given a meaning (the full Lucide list). */ markKit?: boolean }) {
  const [query, setQuery] = React.useState("")
  const [size, setSize] = React.useState<(typeof sizes)[number]["value"]>("24")
  const [picked, setPicked] = React.useState<GalleryIcon | null>(null)
  React.useEffect(() => {
    if (!picked) return
    const close = (e: KeyboardEvent) => e.key === "Escape" && setPicked(null)
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [picked])

  const q = query.trim().toLowerCase()
  const shown = groups
    .map((g) => ({ ...g, icons: q ? g.icons.filter((i) => i.name.toLowerCase().includes(q) || i.means?.toLowerCase().includes(q)) : g.icons }))
    .filter((g) => g.icons.length > 0)
  const count = shown.reduce((n, g) => n + g.icons.length, 0)
  const glyphSize = sizes.find((s) => s.value === size)!.cls

  return (
    <div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="sm:flex-1">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <Input type="search" aria-label="Search icons" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <SegmentedControl aria-label="Icon size" value={size} onValueChange={(v) => v && setSize(v as typeof size)} className="sm:w-auto">
            {sizes.map((s) => (
              <SegmentedControlItem key={s.value} value={s.value} className="tabular-nums">
                {s.value} px
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        <p aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
          {q ? `${count} of ${total} icons` : `${total} icons`}
          {markKit && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-foreground" /> In the kit, with a meaning
            </span>
          )}
        </p>

        {shown.length === 0 && (
          <div className="flex flex-col items-start gap-3 border-y border-border py-8">
            <p className="text-sm text-muted-foreground">
              No icon matches “{query.trim()}”. Search for the thing it stands for{markKit ? "" : ", or look through every Lucide icon"}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
              {!markKit && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/icons/lucide">All Lucide icons</Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {shown.map((g) => (
          <section key={g.title} aria-label={g.title} className="flex flex-col gap-3">
            {groups.length > 1 && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold">{g.title}</h2>
                {g.note && <p className="text-sm text-muted-foreground">{g.note}</p>}
              </div>
            )}
            {/* Tiles ruled like a sheet: each draws its right and bottom edge, the list its top and left. */}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] border-t border-l border-border">
              {g.icons.map((i) => (
                <li key={i.name} className="border-r border-b border-border" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 6.5rem" }}>
                  <button
                    type="button"
                    aria-pressed={picked?.name === i.name}
                    title={i.name}
                    data-icon={i.name}
                    aria-label={i.means ? `${i.name}: ${i.means}` : i.name}
                    onClick={() => setPicked(i)}
                    className="press relative flex h-full min-h-28 w-full flex-col items-center justify-center gap-2 p-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent aria-pressed:bg-muted"
                  >
                    <span aria-hidden className={cn("flex size-6 items-center justify-center", glyphSize)}>
                      {i.glyph}
                    </span>
                    {/* The whole name, over two lines if it needs them: a touch screen has no tooltip to show the rest. */}
                    <span className="line-clamp-2 w-full text-center font-mono text-xs text-muted-foreground">
                      {/* Breaks only between words of the name: Battery|Charging, never BatteryChar|ging. */}
                      {i.name.split(/(?=[A-Z])/).map((w, k) => (
                        <React.Fragment key={k}>
                          {k > 0 && <wbr />}
                          {w}
                        </React.Fragment>
                      ))}
                    </span>
                    {/* In the kit's set, what it means is on the tile, not only behind a click. */}
                    {!markKit && i.means && <span className="line-clamp-2 w-full text-center text-xs text-muted-foreground">{i.means}</span>}
                    {/* In the full Lucide list, a dot marks the icons the kit has given a meaning. */}
                    {markKit && i.means && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Room under the last row, so it can scroll clear of the details bar. */}
      {picked && <div aria-hidden className="h-72" />}
      {picked && <Details icon={picked} onClose={() => setPicked(null)} />}
    </div>
  )
}

/** The copy fields: shown for an icon in the set, folded under "Copy anyway" for one that is not. */
function CopyFields({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (open) return <>{children}</>
  return (
    <details className="group min-w-0 flex-1">
      <summary className="press flex h-(--h-sm) w-fit cursor-pointer items-center rounded-sm px-3 text-sm text-muted-foreground ring-1 ring-border hover:bg-accent [&::-webkit-details-marker]:hidden">
        Copy anyway
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  )
}

function Details({ icon, onClose }: { icon: GalleryIcon; onClose: () => void }) {
  const drawing = React.useRef<HTMLDivElement>(null)
  const panel = React.useRef<HTMLElement>(null)
  const [svg, setSvg] = React.useState("")
  React.useEffect(() => {
    // The SVG to copy is the drawing as rendered, without the classes the page added.
    const el = drawing.current?.querySelector("svg")?.cloneNode(true) as SVGElement | undefined
    if (el) {
      el.removeAttribute("class")
      el.removeAttribute("aria-hidden")
      setSvg(el.outerHTML)
    }
    // The panel covers the bottom of the screen: if the picked tile is under it, bring the tile up into view.
    const tile = document.querySelector<HTMLElement>(`[data-icon="${CSS.escape(icon.name)}"]`)
    const h = panel.current?.offsetHeight ?? 0
    if (!tile) return
    const over = tile.getBoundingClientRect().bottom - (window.innerHeight - h) + 16
    if (over > 0) window.scrollBy({ top: over, behavior: "smooth" })
  }, [icon])
  const importLine = `import { ${icon.name} } from "${icon.from}"`
  const jsx = `<${icon.name} aria-hidden="true" className="size-5" />`
  return (
    <aside
      ref={panel}
      aria-label={`${icon.name} details`}
      // It floats over the bottom of the page instead of taking a column, so picking an icon never narrows the grid:
      // a sheet on a phone, a bar across the bottom on a wide screen.
      className="fixed inset-x-0 bottom-0 z-40 max-h-[70dvh] animate-sheet-in-bottom overflow-y-auto rounded-t-xl bg-popover shadow-overlay ring-1 ring-border"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 p-4 lg:flex-row lg:items-start lg:gap-6">
        <div ref={drawing} className="flex shrink-0 items-end justify-center gap-6 rounded-md bg-card px-6 py-6 ring-1 ring-border">
          <span className="[&_svg]:size-12">{icon.glyph}</span>
          <span className="[&_svg]:size-6">{icon.glyph}</span>
          <span className="[&_svg]:size-5">{icon.glyph}</span>
          <span className="[&_svg]:size-4">{icon.glyph}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-xs">
          <h2 className="truncate font-mono text-sm font-medium">{icon.name}</h2>
          <p className="text-sm text-muted-foreground">{icon.means ?? "Not in the kit's set yet."}</p>
          {!icon.means && (
            <p className="pt-2 text-sm text-muted-foreground">
              Lint rejects it until it is in the set: add it to <code className="font-mono text-xs">site/icons.ts</code> with the one thing it means, unless an icon there
              already means that.
            </p>
          )}
        </div>
        {/* Not in the set: how to add it comes first, and the code to copy waits behind "Copy anyway". */}
        <CopyFields open={!!icon.means}>
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          {(
            [
              ["Name", icon.name],
              ["Import", importLine],
              ["JSX", jsx],
              ["SVG", svg],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex min-w-0 items-center justify-between gap-2 rounded-sm bg-card py-1 pr-1 pl-3 ring-1 ring-border">
              <span className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <code className="line-clamp-3 font-mono text-xs break-all">{value}</code>
              </span>
              <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
            </div>
          ))}
        </div>
        </CopyFields>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="press order-first flex size-(--h-md) shrink-0 items-center justify-center self-end rounded-sm hover:bg-accent lg:order-last lg:-mt-1 lg:self-start"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </aside>
  )
}
