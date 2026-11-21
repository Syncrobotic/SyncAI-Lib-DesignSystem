"use client"

import * as React from "react"
import Link from "next/link"
import { Search, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Sheet } from "@/registry/syncrobotic/ui/sheet"
import { SidePanelContent } from "./code-sheet"

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

// The kit's three icon sizes (Iconography), each tied to the controls it sits in.
const sizes = [
  { value: "16", cls: "size-4", glyph: "[&_svg]:size-4", use: "Inside 36 px controls, menus, inline" },
  { value: "20", cls: "size-5", glyph: "[&_svg]:size-5", use: "Inside 44–56 px controls, dock tabs" },
  { value: "24", cls: "size-6", glyph: "[&_svg]:size-6", use: "Standalone, empty states" },
] as const
type Size = (typeof sizes)[number]["value"]

// Whether this is the client never changes once it is, so there is nothing to subscribe to.
const subscribeNothing = () => () => {}

/** Puts the open icon in the address (?icon=Battery), or takes it out, without a navigation. */
function linkTo(name: string | null) {
  const url = new URL(window.location.href)
  if (name) url.searchParams.set("icon", name)
  else url.searchParams.delete("icon")
  window.history.replaceState(window.history.state, "", url)
}

const tileFor = (name: string) => document.querySelector<HTMLElement>(`[data-icon="${CSS.escape(name)}"]`)

/**
 * Icons as a dense grid of square tiles, drawing and name only. Search matches the name and, in the kit's set, the
 * meaning ("dock" finds ChargingDock). Picking a tile opens its details in the site's side panel, the one the Code button
 * opens: the drawing at the kit's sizes, what it means, and what to copy. The address names the open icon, so it can be
 * linked; closing the panel puts focus back on the tile.
 */
export function IconGallery({ groups, total, placeholder, markKit = false }: { groups: GalleryGroup[]; total: number; placeholder: string; /** Dot the icons the kit has given a meaning (the full Lucide list). */ markKit?: boolean }) {
  const [query, setQuery] = React.useState("")
  const [size, setSize] = React.useState<Size>("24")
  // The icon stays picked while the panel animates shut, so its content does not blank mid-exit.
  const [picked, setPicked] = React.useState<GalleryIcon | null>(null)
  const [open, setOpen] = React.useState(false)
  // Arriving with ?icon=Battery (a shared link, the site search): open that icon's details. Done once per groups, on the
  // client after hydration, during render rather than in an effect that renders twice.
  const client = React.useSyncExternalStore(subscribeNothing, () => true, () => false)
  const [seeded, setSeeded] = React.useState<GalleryGroup[] | null>(null)
  if (client && seeded !== groups) {
    setSeeded(groups)
    const name = new URLSearchParams(window.location.search).get("icon")
    const hit = name ? groups.flatMap((g) => g.icons).find((i) => i.name === name) : undefined
    if (hit) {
      setPicked(hit)
      setOpen(true)
    }
  }
  // Opened from a link, the tile can be far down the page: bring it into view behind the panel, so closing lands on it.
  React.useEffect(() => {
    if (seeded && picked) tileFor(picked.name)?.scrollIntoView({ block: "center" })
    // Only on arrival: later picks are clicks on a tile already in view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded])

  const pick = (icon: GalleryIcon) => {
    setPicked(icon)
    setOpen(true)
    linkTo(icon.name)
  }
  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) linkTo(null)
  }

  const q = query.trim().toLowerCase()
  const shown = groups
    .map((g) => ({
      ...g,
      // Best match first: the exact name, then names that start with the query, then the rest (Battery before BatteryWarning).
      icons: q
        ? g.icons
            .filter((i) => i.name.toLowerCase().includes(q) || i.means?.toLowerCase().includes(q))
            .map((i, n) => ({ i, n, rank: i.name.toLowerCase() === q ? 0 : i.name.toLowerCase().startsWith(q) ? 1 : 2 }))
            .sort((a, b) => a.rank - b.rank || a.i.name.length - b.i.name.length || a.n - b.n)
            .map((x) => x.i)
        : g.icons,
    }))
    .filter((g) => g.icons.length > 0)
  const count = shown.reduce((n, g) => n + g.icons.length, 0)
  const current = sizes.find((s) => s.value === size)!

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <Input type="search" aria-label="Search icons" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>
        <SegmentedControl aria-label="Icon size" value={size} onValueChange={(v) => v && setSize(v as Size)} className="sm:w-auto">
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
              <h2 className="text-sm font-bold">
                {g.title} <span className="font-normal text-muted-foreground tabular-nums">{g.icons.length}</span>
              </h2>
              {g.note && <p className="text-sm text-muted-foreground">{g.note}</p>}
            </div>
          )}
          {/* Square tiles, drawing and name only: the meaning is one tap away in the details, and search still finds it. */}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
            {g.icons.map((i) => (
              <li key={i.name} style={{ contentVisibility: "auto", containIntrinsicSize: "auto 5rem auto 5rem" }}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-pressed={open && picked?.name === i.name}
                  title={i.means ? `${i.name}: ${i.means}` : i.name}
                  data-icon={i.name}
                  aria-label={i.means ? `${i.name}: ${i.means}` : i.name}
                  onClick={() => pick(i)}
                  className="press group relative flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-md bg-card p-2 ring-1 ring-border transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent aria-pressed:ring-2 aria-pressed:ring-foreground"
                >
                  <span aria-hidden className={cn("flex size-6 items-center justify-center", current.glyph)}>
                    {i.glyph}
                  </span>
                  {/* The whole name, over two lines if it needs them: a touch screen has no tooltip to show the rest. */}
                  <span className="line-clamp-2 w-full text-center font-mono text-xs text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) group-hover:text-foreground">
                    {/* Breaks only between words of the name: Battery|Charging, never BatteryChar|ging. */}
                    {i.name.split(/(?=[A-Z])/).map((w, k) => (
                      <React.Fragment key={k}>
                        {k > 0 && <wbr />}
                        {w}
                      </React.Fragment>
                    ))}
                  </span>
                  {/* In the full Lucide list, a dot marks the icons the kit has given a meaning. */}
                  {markKit && i.means && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Sheet open={open} onOpenChange={onOpenChange}>
        {picked && (
          <SidePanelContent
            title={picked.name}
            description={`What ${picked.name} means, its drawing at the kit's sizes, and the code to use it.`}
            // The panel has no trigger of its own: hand focus back to the tile it was opened from.
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              tileFor(picked.name)?.focus()
            }}
          >
            <Details icon={picked} size={current} />
          </SidePanelContent>
        )}
      </Sheet>
    </div>
  )
}

/** One thing to copy: a label, the value in mono, and the kit's copy button. */
function CopyRow({ label, value, block = false }: { label: string; value: string; block?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2 rounded-sm bg-card py-1 pr-1 pl-3 ring-1 ring-border">
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <code className={cn("font-mono text-xs break-all", block ? "line-clamp-4" : "")}>{value}</code>
      </div>
      <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  )
}

function Details({ icon, size }: { icon: GalleryIcon; size: (typeof sizes)[number] }) {
  const drawing = React.useRef<HTMLDivElement>(null)
  const [svg, setSvg] = React.useState("")
  React.useEffect(() => {
    // The SVG to copy is the drawing as rendered, without the classes the page added.
    const el = drawing.current?.querySelector("svg")?.cloneNode(true) as SVGElement | undefined
    if (!el) return
    el.removeAttribute("class")
    el.removeAttribute("aria-hidden")
    setSvg(el.outerHTML)
  }, [icon])
  const kitDrawn = icon.from !== "lucide-react"
  const importLine = `import { ${icon.name} } from "${icon.from}"`
  const jsx = `<${icon.name} aria-hidden="true" className="${size.cls}" />`
  return (
    <div className="flex flex-col gap-6 p-6">
      <section aria-label="Preview" className="flex flex-col gap-2">
        <div ref={drawing} className="specimen flex h-40 items-center sm:h-48 justify-center rounded-md ring-1 ring-border [&_svg]:size-16">
          {icon.glyph}
        </div>
        {/* The kit's three sizes, each with where it goes: the size picked above the grid is outlined. */}
        <ul aria-label="Sizes" className="grid gap-2 sm:grid-cols-3">
          {sizes.map((s) => (
            <li
              key={s.value}
              aria-current={s.value === size.value ? "true" : undefined}
              className="grid grid-cols-[1.5rem_1fr] items-center gap-x-4 gap-y-1 rounded-md bg-card px-4 py-3 ring-1 sm:flex sm:flex-col sm:gap-2 sm:px-2 sm:py-4 sm:text-center ring-border aria-[current]:ring-2 aria-[current]:ring-foreground"
            >
              <span aria-hidden className={cn("row-span-2 flex size-6 items-center justify-center", s.glyph)}>
                {icon.glyph}
              </span>
              <span className="font-mono text-xs whitespace-nowrap tabular-nums">
                {s.cls} · {s.value} px
              </span>
              <span className="text-xs text-muted-foreground">{s.use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="When to use" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">When to use</h3>
        {icon.means ? (
          <p className="text-sm">{icon.means}</p>
        ) : (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              Not in the kit&apos;s set yet, so lint rejects it. Add it to <code className="font-mono text-xs">site/icons.ts</code> with the one thing it means, unless an
              icon there already means that.
            </span>
          </p>
        )}
      </section>

      {kitDrawn && (
        <section aria-label="Install" className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Install</h3>
          <p className="text-sm text-muted-foreground">Drawn for the kit, not in Lucide. It takes Lucide&apos;s props.</p>
          <CopyRow label="Command" value="npx shadcn add @syncrobotic/robot-icons" />
        </section>
      )}

      <section aria-label="Code" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Code</h3>
        <CopyRow label="Import" value={importLine} />
        <CopyRow label="JSX" value={jsx} />
        <CopyRow label="Name" value={icon.name} />
        <CopyRow label="SVG" value={svg} block />
      </section>

      <p className="text-sm text-muted-foreground">
        Sizes, labels and naming:{" "}
        <Link href="/docs/foundations/iconography" className="text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          Iconography
        </Link>
        .
      </p>
    </div>
  )
}
