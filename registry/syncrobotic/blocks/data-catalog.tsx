// @syncrobotic/data-catalog v0.10.0 · update: npx shadcn add @syncrobotic/data-catalog --overwrite
"use client"

import * as React from "react"
import { Database, Grid3x3, SlidersHorizontal, Plus, ScrollText, Search, SearchX, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChoiceField, FieldSet } from "@/registry/syncrobotic/ui/choice-field"
import { AppShell, type AppNavGroup } from "@/registry/syncrobotic/blocks/app-shell"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Checkbox } from "@/registry/syncrobotic/ui/checkbox"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
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

export type Tier = "T0" | "T1" | "T2" | "T3"
/** Licence tiers. Only the restricted ones carry colour: they are the ones that change what you may do. */
export const tiers: Record<Tier, { label: string; tone: "neutral" | "outline" | "warning" | "danger" }> = {
  T0: { label: "Commercial", tone: "neutral" },
  T1: { label: "Non-commercial", tone: "outline" },
  T2: { label: "Restricted", tone: "outline" },
  T3: { label: "On-premises only", tone: "outline" },
}

export function TierBadge({ tier, compact }: { tier: Tier; compact?: boolean }) {
  return (
    <Badge tone={tiers[tier].tone}>
      <span className="font-mono">{tier}</span>
      {!compact && <span> · {tiers[tier].label}</span>}
    </Badge>
  )
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
const facets = [
  { key: "tier", label: "Tier", values: (["T0", "T1", "T2", "T3"] as Tier[]).map((t) => ({ value: t, label: `${t} · ${tiers[t].label}` })) },
  { key: "use", label: "Use", values: ["Product", "Research", "Evaluation"].map((v) => ({ value: v, label: v })) },
  { key: "task", label: "Task", values: ["Detection", "Segmentation", "Keypoints", "Depth", "Classification"].map((v) => ({ value: v, label: v })) },
] as const

type Picks = Record<(typeof facets)[number]["key"], string[]>

function Facets({ data, picks, onPick }: { data: Dataset[]; picks: Picks; onPick: (key: keyof Picks, value: string, on: boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      {facets.map((f) => (
        <FieldSet key={f.key} legend={f.label}>
          {f.values.map((v) => (
            <ChoiceField
              key={v.value}
              label={v.label}
              trailing={data.filter((d) => d[f.key] === v.value).length}
              control={<Checkbox checked={picks[f.key].includes(v.value)} onCheckedChange={(c) => onPick(f.key, v.value, c === true)} />}
            />
          ))}
        </FieldSet>
      ))}
    </div>
  )
}

/** Data catalog: filter by tier, use and task, search, sort, read one row per dataset. On phones the filters open in a drawer. */
export function DataCatalog({ datasets = sampleDatasets }: { datasets?: Dataset[] }) {
  const [query, setQuery] = React.useState("")
  const [picks, setPicks] = React.useState<Picks>({ tier: [], use: [], task: [] })
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 })

  const pick = (key: keyof Picks, value: string, on: boolean) => setPicks((p) => ({ ...p, [key]: on ? [...p[key], value] : p[key].filter((v) => v !== value) }))
  const active = Object.values(picks).flat().length
  const rows = datasets
    .filter((d) => (Object.keys(picks) as (keyof Picks)[]).every((k) => picks[k].length === 0 || picks[k].includes(d[k])))
    .filter((d) => `${d.name} ${d.ref} ${d.owner}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort.key === "items" ? a.items - b.items : a.name.localeCompare(b.name)) * sort.dir)

  const sortProps = (k: SortKey) => ({
    sort: sort.key === k ? (sort.dir === 1 ? ("asc" as const) : ("desc" as const)) : (false as const),
    onSort: () => setSort({ key: k, dir: sort.key === k ? (sort.dir === 1 ? -1 : 1) : 1 }),
  })

  return (
    <AppShell
      product="DataCore"
      nav={dataNav}
      current="#catalog"
      title="Catalog"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" /> New dataset
        </Button>
      }
    >
      <div className="flex gap-8">
        <aside aria-label="Filters" className="hidden w-56 shrink-0 lg:block">
          <Facets data={datasets} picks={picks} onPick={pick} />
        </aside>
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="lg:hidden">
                  <SlidersHorizontal aria-hidden="true" /> Filters{active ? ` · ${active}` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetTitle className="pb-4">Filters</SheetTitle>
                <Facets data={datasets} picks={picks} onPick={pick} />
              </SheetContent>
            </Sheet>
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
                  <TableHead>Tier</TableHead>
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
                  <TableRow key={d.ref}>
                    <TableCell>
                      <a href={`#${d.ref}`} className="flex flex-col hover:underline">
                        <span className="font-medium">{d.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {d.ref}@{d.version}
                        </span>
                      </a>
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={d.tier} compact />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{d.task}</TableCell>
                    <TableCell className="hidden md:table-cell">{d.use}</TableCell>
                    <TableCell className={cn("hidden text-muted-foreground xl:table-cell")}>{d.owner}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.items.toLocaleString("en-US")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
