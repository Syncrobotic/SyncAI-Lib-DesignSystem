"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
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
    <div className="flex gap-8">
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

        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
          {q ? `${count} of ${total} icons` : `${total} icons`}
        </p>

        {shown.length === 0 && (
          <p className="border-y border-border py-8 text-sm text-muted-foreground">
            No icon matches “{query.trim()}”. Try the thing it stands for, or look in All Lucide.
          </p>
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
                    aria-label={i.means ? `${i.name}: ${i.means}` : i.name}
                    onClick={() => setPicked(i)}
                    className="press relative flex aspect-square w-full flex-col items-center justify-center gap-3 p-2 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent aria-pressed:bg-muted"
                  >
                    <span aria-hidden className={cn("flex size-6 items-center justify-center", glyphSize)}>
                      {i.glyph}
                    </span>
                    <span className="w-full truncate text-center font-mono text-xs text-muted-foreground">{i.name}</span>
                    {/* In the full Lucide list, a dot marks the icons the kit has given a meaning. */}
                    {markKit && i.means && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {picked && <Details icon={picked} onClose={() => setPicked(null)} />}
    </div>
  )
}

function Details({ icon, onClose }: { icon: GalleryIcon; onClose: () => void }) {
  const drawing = React.useRef<HTMLDivElement>(null)
  const [svg, setSvg] = React.useState("")
  // The SVG to copy is the drawing as rendered, without the classes the page added.
  React.useEffect(() => {
    const el = drawing.current?.querySelector("svg")?.cloneNode(true) as SVGElement | undefined
    if (!el) return
    el.removeAttribute("class")
    el.removeAttribute("aria-hidden")
    setSvg(el.outerHTML)
  }, [icon])
  const importLine = `import { ${icon.name} } from "${icon.from}"`
  const jsx = `<${icon.name} aria-hidden="true" className="size-5" />`
  return (
    <aside
      aria-label={`${icon.name} details`}
      className={cn(
        "flex animate-appear flex-col gap-4 bg-popover p-4",
        // A sheet from the bottom on a phone; a column beside the grid on a wide screen, staying in view while you scroll.
        "fixed inset-x-0 bottom-0 z-40 max-h-[70dvh] overflow-y-auto rounded-t-xl shadow-overlay ring-1 ring-border",
        "lg:sticky lg:top-20 lg:inset-auto lg:z-auto lg:max-h-none lg:w-72 lg:shrink-0 lg:self-start lg:rounded-xl lg:shadow-none",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate font-mono text-sm font-medium">{icon.name}</h2>
          <p className="text-sm text-muted-foreground">{icon.means ?? "Not in the kit's set yet."}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="press -mt-1 -mr-1 flex size-(--h-md) shrink-0 items-center justify-center rounded-sm hover:bg-accent">
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div ref={drawing} className="flex items-end justify-center gap-6 rounded-md bg-card py-6 ring-1 ring-border">
        <span className="[&_svg]:size-12">{icon.glyph}</span>
        <span className="[&_svg]:size-6">{icon.glyph}</span>
        <span className="[&_svg]:size-5">{icon.glyph}</span>
        <span className="[&_svg]:size-4">{icon.glyph}</span>
      </div>
      {!icon.means && (
        <p className="text-sm text-muted-foreground">
          Lint rejects it until it is in the set: add it to <code className="font-mono text-xs">site/icons.ts</code> with the one thing it means, unless an icon there already means that.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {(
          [
            ["Name", icon.name],
            ["Import", importLine],
            ["JSX", jsx],
            ["SVG", svg],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-sm bg-card py-1 pr-1 pl-3 ring-1 ring-border">
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">{label}</span>
              <code className="truncate font-mono text-xs">{value}</code>
            </span>
            <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
          </div>
        ))}
      </div>
    </aside>
  )
}
