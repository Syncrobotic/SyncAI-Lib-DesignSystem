"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Search, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
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
/** A group of icons; with a `slug` it is a category the grid can be filtered to (?category=slug). */
export type GalleryGroup = { title: string; slug?: string; icons: GalleryIcon[] }
type GalleryProps = {
  groups: GalleryGroup[]
  total: number
  placeholder: string
  /** Dot the icons the kit has given a meaning (the full Lucide list). */
  markKit?: boolean
  /** Old category addresses and the category each now reads as. */
  aliases?: Record<string, string>
}

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

// A category is a link that changes only the address: the page stays where it is, and the gallery scrolls itself.
function StayLink(props: React.ComponentProps<typeof Link>) {
  return <Link scroll={false} {...props} />
}

/**
 * The gallery, filtered to the category in the address (?category=robots-and-sites). The page is prerendered without
 * one, so the address is read under a Suspense boundary whose fallback is the whole gallery: the HTML holds every icon,
 * and a link to a category narrows it as soon as the page runs.
 */
export function IconGallery(props: GalleryProps) {
  return (
    <React.Suspense fallback={<Gallery {...props} category={null} />}>
      <GalleryInAddress {...props} />
    </React.Suspense>
  )
}

function GalleryInAddress(props: GalleryProps) {
  const category = useSearchParams().get("category")
  return <Gallery {...props} category={category} />
}

/**
 * Icons as a dense grid of square tiles: the drawing at rest, its name on hover or keyboard focus. Categories filter the
 * grid (the sidebar lists them on a wide screen, chips above the grid on a narrow one), and search works within the one
 * picked: it matches the name and, in the kit's set, the meaning ("dock" finds ChargingDock). Picking a tile opens its
 * details in the site's side panel, the one the Code button opens: the drawing at the kit's sizes, what it means, and
 * what to copy. The address names the open icon, so it can be linked; closing the panel puts focus back on the tile.
 */
function Gallery({ groups, total, placeholder, markKit = false, aliases, category: asked }: GalleryProps & { category: string | null }) {
  const category = (asked && aliases?.[asked]) ?? asked
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

  // Picking a category from far down the page: bring the top of the results back into view, under the search.
  const results = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const top = results.current?.getBoundingClientRect().top
    if (top !== undefined && top < 0) results.current?.scrollIntoView({ block: "start" })
    // The row of chips scrolls sideways: keep the picked one in view.
    const chip = document.querySelector<HTMLElement>('[data-slot="chip-group"] [aria-current="page"]')
    const row = chip?.closest("ul")
    if (chip && row) row.scrollLeft = chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2
  }, [category])
  const path = usePathname()

  const categories = groups.filter((g) => g.slug)
  const inCategory = categories.find((g) => g.slug === category)
  const q = query.trim().toLowerCase()
  const shown = (inCategory ? [inCategory] : groups)
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
  const of = inCategory ? inCategory.icons.length : total
  const where = inCategory ? ` in ${inCategory.title}` : ""
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

      {/* On a narrow screen the sidebar is folded away, so the categories sit above the grid as one row that scrolls sideways. */}
      {categories.length > 1 && (
        <ChipGroup
          label="Categories"
          linkAs={StayLink}
          value={inCategory?.slug ?? "all"}
          items={[{ value: "all", label: "All", count: total, href: path }, ...categories.map((g) => ({ value: g.slug!, label: g.title, count: g.icons.length, href: `${path}?category=${g.slug}` }))]}
          className="-mx-4 lg:hidden [&_a]:h-(--h-md) [&_ul]:scroll-row [&_ul]:flex-nowrap [&_ul]:overflow-x-auto [&_ul]:px-4 [&_ul]:py-1"
        />
      )}

      <div ref={results} className="flex scroll-mt-24 flex-col gap-6">
      {/* Only the count is live, so a screen reader hears the new count as you type, not the legend each time. */}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
        <span aria-live="polite">{q ? `${count} of ${of} icons${where}` : `${of} icons${where}`}</span>
        {markKit && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-foreground" /> In the kit, with a meaning
          </span>
        )}
      </p>

      {shown.length === 0 && (
        <div className="flex flex-col items-start gap-3 border-y border-border py-8">
          <p className="text-sm text-muted-foreground">
            No icon matches “{query.trim()}”{where}. Search for the thing it stands for{markKit ? "" : ", or look through every Lucide icon"}.
          </p>
          <div className="flex flex-wrap gap-2">
            {inCategory ? (
              <Button variant="secondary" size="sm" asChild>
                <StayLink href={path}>Search every category</StayLink>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            )}
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
          {groups.length > 1 && !inCategory && (
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold">
                {g.title} <span className="font-normal text-muted-foreground tabular-nums">{g.icons.length}</span>
              </h2>
            </div>
          )}
          {/* Square tiles, the drawing alone at rest; the name shows on hover and keyboard focus, and in the details. A touch screen
              has no hover, so there (a coarse pointer) every tile shows its name. */}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
            {g.icons.map((i) => (
              // A tile's classes are app/globals.css's icon-tile*, written once there instead of on each of a few hundred tiles.
              <li key={i.name} className="icon-tile-cell">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-pressed={open && picked?.name === i.name}
                  data-icon={i.name}
                  aria-label={`${i.means ? `${i.name}: ${i.means}` : i.name}${i.from === "lucide-react" ? "" : " (drawn for the kit, not in Lucide)"}`}
                  onClick={() => pick(i)}
                  className="press group icon-tile"
                >
                  {/* The drawing moves up to make room when the name shows, so the two never overlap. */}
                  <span
                    aria-hidden
                    className={cn("icon-tile-glyph", current.glyph)}
                  >
                    {i.glyph}
                  </span>
                  {/* The name, over two lines if it needs them. The tile's accessible name already says it, so this is for the eye. */}
                  <span aria-hidden className="icon-tile-name">
                    {/* Breaks only between words of the name: Battery|Charging, never BatteryChar|ging. */}
                    {i.name.split(/(?=[A-Z])/).map((w, k) => (
                      <React.Fragment key={k}>
                        {k > 0 && <wbr />}
                        {w}
                      </React.Fragment>
                    ))}
                  </span>
                  {/* An icon the kit draws itself says so on its tile: it installs from robot-icons, not lucide-react. */}
                  {i.from !== "lucide-react" && (
                    <span aria-hidden className="absolute top-1.5 left-1.5 rounded-xs px-1 text-xs leading-4 text-muted-foreground ring-1 ring-border">
                      Kit
                    </span>
                  )}
                  {/* In the full Lucide list, a dot marks the icons the kit has given a meaning. */}
                  {markKit && i.means && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      </div>

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
        <code className={cn("font-mono text-xs wrap-anywhere", block ? "line-clamp-4" : "")}>{value}</code>
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
        {/* The kit's three sizes, each with where it goes. Plain cards, all alike: they are a reference, not a choice, so none
            looks picked (the grid's own size switch is above the grid). */}
        <ul aria-label="Sizes" className="grid gap-2 sm:grid-cols-3">
          {sizes.map((s) => (
            <li
              key={s.value}
              className="grid grid-cols-[1.5rem_1fr] items-center gap-x-4 gap-y-1 rounded-md bg-card px-4 py-3 ring-1 sm:flex sm:flex-col sm:gap-2 sm:px-2 sm:py-4 sm:text-center ring-border"
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
