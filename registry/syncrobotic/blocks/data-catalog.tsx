// @syncrobotic/data-catalog v0.40.0 · update: npx shadcn add @syncrobotic/data-catalog --overwrite
"use client"

import * as React from "react"
import { ChevronRight, Database, Grid3x3, Plus, ScrollText, Search, SearchX, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-count"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { AppShell, type AppNavGroup, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { TierBadge, tiers, type Tier } from "@/registry/syncrobotic/ui/tier-badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Facets, FacetsDrawer, type Facet, type FacetValue } from "@/registry/syncrobotic/ui/facets"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

/** Navigation shared by the data-tool blocks. */
export const dataNav: AppNavGroup[] = [
  {
    items: [
      { label: "Catalog", href: "#catalog", icon: Database },
      { label: "Classes", href: "#classes", icon: Grid3x3 },
      { label: "Releases", href: "#releases", icon: ScrollText },
      { label: "Governance", href: "#governance", icon: ShieldCheck, count: 3 },
    ],
  },
]

// The tier badge is its own item (tier-badge). Re-exported so code that imported it from here keeps working.
export { TierBadge, tiers, type Tier } from "@/registry/syncrobotic/ui/tier-badge"

/** A label layer made on a source dataset: its own ref, version and page. */
export type LabelLayer = {
  ref: string
  name: string
  version: string
  items: number
}

export type Dataset = {
  ref: string
  name: string
  version: string
  tier: Tier
  task: string
  use: "Product" | "Research" | "Evaluation"
  owner: string
  licence: string
  items: number
  /** The label layers made on this source; its row unfolds them. */
  layers?: LabelLayer[]
}

export const sampleDatasets: Dataset[] = [
  {
    ref: "people/night-parking",
    name: "Night parking lot people",
    version: "v3",
    tier: "T0",
    task: "Detection",
    use: "Product",
    owner: "Data team",
    licence: "First-party",
    items: 48210,
    layers: [
      { ref: "labels/coco", name: "COCO person boxes", version: "v2", items: 48210 },
      { ref: "labels/night-review", name: "Night review corrections", version: "v1", items: 6115 },
      { ref: "labels/pose-auto", name: "Auto pose keypoints", version: "v3", items: 47980 },
    ],
  },
  {
    ref: "smoking/clips",
    name: "Smoking clips",
    version: "v2",
    tier: "T1",
    task: "Classification",
    use: "Research",
    owner: "Vision lab",
    licence: "CC BY-NC 4.0",
    items: 9120,
  },
  {
    ref: "lidar/warehouse",
    name: "Warehouse LiDAR sweeps",
    version: "v1",
    tier: "T2",
    task: "Segmentation",
    use: "Evaluation",
    owner: "Perception",
    licence: "Partner NDA",
    items: 2304,
  },
  {
    ref: "pose/patrol",
    name: "Patrol pose keypoints",
    version: "v5",
    tier: "T0",
    task: "Keypoints",
    use: "Product",
    owner: "Data team",
    licence: "First-party",
    items: 120540,
  },
  {
    ref: "depth/indoor",
    name: "Indoor depth pairs",
    version: "v2",
    tier: "T1",
    task: "Depth",
    use: "Research",
    owner: "Perception",
    licence: "Academic",
    items: 31877,
  },
  {
    ref: "faces/site-a",
    name: "Site A access faces",
    version: "v1",
    tier: "T3",
    task: "Detection",
    use: "Evaluation",
    owner: "Compliance",
    licence: "Customer contract",
    items: 640,
  },
]

type SortKey = "name" | "items"
const facetKeys = ["tier", "use", "task"] as const
type FacetKey = (typeof facetKeys)[number]
const facetOptions: Record<FacetKey, { label: string; values: { value: string; label: string }[] }> = {
  tier: { label: "Tier", values: (["T0", "T1", "T2", "T3"] as Tier[]).map((t) => ({ value: t, label: `${t} · ${tiers[t].label}` })) },
  use: { label: "Use", values: ["Product", "Research", "Evaluation"].map((v) => ({ value: v, label: v })) },
  task: { label: "Task", values: ["Detection", "Segmentation", "Keypoints", "Depth", "Classification"].map((v) => ({ value: v, label: v })) },
}

/** The facets with how many datasets have each value. */
const facetsOf = (data: Dataset[]): Facet[] =>
  facetKeys.map((key) => ({
    key,
    label: facetOptions[key].label,
    options: facetOptions[key].values.map((v) => ({ ...v, count: data.filter((d) => d[key] === v.value).length })),
  }))

// The columns after the name, so a layer's row keeps the dataset row's cells at every width.
const hiddenCells = ["hidden sm:table-cell", "hidden md:table-cell", "hidden md:table-cell", "hidden xl:table-cell"]

/** One dataset's row, and its label layers under it once unfolded. */
function DatasetRows({ dataset: d }: { dataset: Dataset }) {
  const [open, setOpen] = React.useState(false)
  const { mounted, leaving, done } = usePresence(open)
  const id = React.useId()
  const layers = d.layers ?? []
  const ids = layers.map((_, i) => `${id}-layer-${i}`).join(" ")
  return (
    <>
      <TableRow>
        <TableCell className="py-2 max-sm:whitespace-normal">
          {/* At least the control height (44, 48 in gloves): two short lines alone are a 36 px target. */}
          <a data-slot="data-catalog-link" href={`#${d.ref}`} className="flex min-h-(--h-md) flex-col justify-center hover:underline">
            <span className="font-medium">{d.name}</span>
            <span className="font-mono text-xs break-all text-muted-foreground">
              {d.ref}@{d.version}
            </span>
          </a>
          {/* On a phone the tier sits under the name; it is a column from 640 px, so the items count never clips. */}
          <span className={cn("flex flex-wrap items-center gap-2", layers.length > 0 ? "mt-1" : "mt-1 sm:hidden")}>
            <span className="flex sm:hidden">
              <TierBadge tier={d.tier} compact />
            </span>
            {layers.length > 0 && (
              // From 640 px it starts the line: it leans into the cell's padding so its chevron sits near the name's edge,
              // with room left for the focus ring. On a phone it follows the tier badge.
              <Button
                data-slot="data-catalog-layers"
                variant="ghost"
                size="sm"
                aria-expanded={open}
                aria-controls={open ? ids : undefined}
                onClick={() => setOpen((o) => !o)}
                className="text-muted-foreground hover:text-foreground sm:-ml-2"
              >
                <ChevronRight aria-hidden="true" className={cn("transition-transform duration-(--motion-fast) ease-(--ease-standard)", open && "rotate-90")} />
                {layers.length} label {layers.length === 1 ? "layer" : "layers"}
                <span className="sr-only"> of {d.name}</span>
              </Button>
            )}
          </span>
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <TierBadge tier={d.tier} compact />
        </TableCell>
        <TableCell className="hidden md:table-cell">{d.task}</TableCell>
        <TableCell className="hidden md:table-cell">{d.use}</TableCell>
        <TableCell className={cn("hidden text-muted-foreground xl:table-cell")}>{d.owner}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCount(d.items)}</TableCell>
      </TableRow>
      {mounted &&
        layers.map((l, i) => (
          <TableRow
            key={l.ref}
            id={`${id}-layer-${i}`}
            inert={leaving || undefined}
            onAnimationEnd={(e) => i === layers.length - 1 && e.target === e.currentTarget && done()}
            className={leaving ? "animate-disappear" : "animate-appear"}
          >
            {/* Indented under the source by 16 px more than its cell, behind a guide line. */}
            <TableCell className="py-2 pl-8 max-sm:whitespace-normal">
              <a data-slot="data-catalog-layer-link" href={`#${l.ref}@${l.version}`} className="flex min-h-(--h-md) flex-col justify-center border-l border-border pl-3 hover:underline">
                <span>{l.name}</span>
                <span className="font-mono text-xs break-all text-muted-foreground">
                  {l.ref}@{l.version}
                </span>
              </a>
            </TableCell>
            {hiddenCells.map((c, j) => (
              <TableCell key={j} className={c} />
            ))}
            <TableCell className="text-right text-muted-foreground tabular-nums">{formatCount(l.items)}</TableCell>
          </TableRow>
        ))}
    </>
  )
}

export type DataCatalogProps = { datasets?: Dataset[] }

/**
 * The catalog without a frame: filters, search, the table. Put it in your own shell (top-bar-shell, app-shell) with the
 * page's title and its New dataset action there.
 */
export function DataCatalogContent({ datasets = sampleDatasets }: DataCatalogProps) {
  const [query, setQuery] = React.useState("")
  const [picks, setPicks] = React.useState<FacetValue>({})
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 })

  const facets = facetsOf(datasets)
  const rows = datasets
    .filter((d) => facetKeys.every((k) => !picks[k]?.length || picks[k].includes(d[k])))
    .filter((d) => [d.name, d.ref, d.owner, ...(d.layers ?? []).flatMap((l) => [l.name, l.ref])].join(" ").toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort.key === "items" ? a.items - b.items : a.name.localeCompare(b.name)) * sort.dir)

  const sortProps = (k: SortKey) => ({
    sort: sort.key === k ? (sort.dir === 1 ? ("asc" as const) : ("desc" as const)) : (false as const),
    onSort: () => setSort({ key: k, dir: sort.key === k ? (sort.dir === 1 ? -1 : 1) : 1 }),
  })

  return (
    <div className="flex gap-8">
      <Facets facets={facets} value={picks} onValueChange={setPicks} locale="en-US" />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex gap-2">
          <InputGroup>
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <Input
              type="search"
              aria-label="Search datasets"
              placeholder="Search datasets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <FacetsDrawer facets={facets} value={picks} onValueChange={setPicks} locale="en-US" />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} of {datasets.length} datasets
        </p>
        {rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No datasets match" description="Clear a filter or search for something broader." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead {...sortProps("name")}>Dataset</TableHead>
                <TableHead className="hidden sm:table-cell">Tier</TableHead>
                <TableHead className="hidden md:table-cell">Task</TableHead>
                <TableHead className="hidden md:table-cell">Use</TableHead>
                <TableHead className="hidden xl:table-cell">Owner</TableHead>
                <TableHead {...sortProps("items")} className="text-right">
                  Items
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <DatasetRows key={d.ref} dataset={d} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

/** Data catalog: filter by tier, use and task, search, sort, read one row per dataset. On phones the filters open in a drawer. */
export function DataCatalog(props: DataCatalogProps) {
  return (
    <AppShell
      product="DataCore"
      nav={dataNav}
      current="#catalog"
      title="Catalog"
      user={sampleUser}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" /> New dataset
        </Button>
      }
    >
      <DataCatalogContent {...props} />
    </AppShell>
  )
}
