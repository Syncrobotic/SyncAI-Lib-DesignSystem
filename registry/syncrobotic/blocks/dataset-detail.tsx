// @syncrobotic/dataset-detail v0.6.0 · update: npx shadcn add @syncrobotic/dataset-detail --overwrite
"use client"

import * as React from "react"
import { ArrowRight, ChevronRight, Copy, TriangleAlert } from "lucide-react"
import { dataNav, TierBadge, type Tier } from "@/registry/syncrobotic/blocks/data-catalog"
import { AppShell } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Separator } from "@/registry/syncrobotic/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { Toggle } from "@/registry/syncrobotic/ui/toggle"

type Box = { x: number; y: number; w: number; h: number; label: string }
type Sample = { id: string; split: "train" | "val" | "test"; boxes: Box[] }

const samples: Sample[] = Array.from({ length: 8 }, (_, i) => ({
  id: `frame-${String(1024 + i * 37).padStart(6, "0")}`,
  split: i % 5 === 4 ? "test" : i % 4 === 3 ? "val" : "train",
  boxes: [
    { x: 12 + ((i * 11) % 40), y: 30, w: 14, h: 38, label: "person" },
    ...(i % 2 ? [{ x: 60, y: 44, w: 26, h: 22, label: "car" }] : []),
  ],
}))

const splits = [
  { name: "train", share: 80 },
  { name: "val", share: 10 },
  { name: "test", share: 10 },
]

const lineage = [
  { ref: "people/sources/site-cams@v2", kind: "Source" },
  { ref: "people/labels/night-boxes@v4", kind: "Labels" },
  { ref: "people/night-parking@v3", kind: "This dataset" },
  { ref: "releases/patrol-detector@2026.11", kind: "Release" },
]

const reviews = [
  { check: "Licence recorded", state: "passed" },
  { check: "People blurred where required", state: "passed" },
  { check: "Consent for site B", state: "open" },
] as const

/** A picture placeholder with its boxes. Swap in your image component. */
function Frame({ s, boxes, labels }: { s: Sample; boxes: boolean; labels: boolean }) {
  return (
    <figure className="flex flex-col gap-1">
      <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full">
          <rect x="0" y="70" width="100" height="30" className="fill-secondary" />
          {boxes &&
            s.boxes.map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} className="fill-none stroke-foreground" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
            ))}
        </svg>
        {boxes && labels && (
          <div className="absolute inset-0">
            {s.boxes.map((b, i) => (
              <span key={i} className="absolute -translate-y-full rounded-xs bg-foreground px-1 text-xs text-background" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <figcaption className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>{s.id}</span>
        <span>{s.split}</span>
      </figcaption>
    </figure>
  )
}

/**
 * One dataset: what it is, whether it may enter a release and why, what is in it, where it came from and where it goes.
 * Browse shows the items with their annotations; layers toggle on and off.
 */
export function DatasetDetail({ name = "Night parking lot people", reference = "people/night-parking@v3", tier = "T0" as Tier }) {
  const [boxes, setBoxes] = React.useState(true)
  const [labels, setLabels] = React.useState(true)

  return (
    <AppShell product="DataCore" nav={dataNav} current="#catalog" title="Catalog" user={{ name: "Mei Lin", initials: "ML" }}>
      <div className="flex max-w-5xl flex-col gap-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
          <a href="#catalog" className="hover:text-foreground hover:underline">
            Catalog
          </a>
          <ChevronRight aria-hidden="true" className="size-4" />
          <a href="#people" className="hover:text-foreground hover:underline">
            people
          </a>
          <ChevronRight aria-hidden="true" className="size-4" />
          <span aria-current="page" className="text-foreground">
            night-parking@v3
          </span>
        </nav>

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold">{name}</h2>
            <TierBadge tier={tier} />
          </div>
          <p className="flex flex-wrap items-center gap-2 font-mono text-sm text-muted-foreground">
            {reference}
            <Button variant="ghost" size="icon-sm" aria-label="Copy reference">
              <Copy aria-hidden="true" />
            </Button>
          </p>
          <InlineStatus tone="success">May enter product releases</InlineStatus>
        </header>

        <Tabs defaultValue="overview">
          <TabsList aria-label="Dataset">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-6">
            <Alert tone="warning">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>1 open issue</AlertTitle>
              <AlertDescription>Consent for site B is not recorded. Items from site B are held back until it is.</AlertDescription>
            </Alert>
            <dl className="grid gap-4 rounded-md bg-card p-4 ring-1 ring-border sm:grid-cols-4">
              {[
                ["Items", "48,210"],
                ["Classes", "2"],
                ["Owner", "Data team"],
                ["Updated", "2026-11-14"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <section aria-labelledby="splits" className="flex flex-col gap-2">
              <h3 id="splits" className="text-sm font-bold">
                Splits
              </h3>
              <div className="flex h-2 overflow-hidden rounded-xs bg-muted" role="img" aria-label="train 80 %, val 10 %, test 10 %">
                <span className="bg-foreground" style={{ width: "80%" }} />
                <span className="bg-muted-foreground" style={{ width: "10%" }} />
              </div>
              <ul className="flex gap-4 text-xs text-muted-foreground">
                {splits.map((s) => (
                  <li key={s.name} className="tabular-nums">
                    {s.name} {s.share} %
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>

          <TabsContent value="browse" className="flex flex-col gap-4">
            <div role="group" aria-label="Layers" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Toggle size="sm" pressed={boxes} onPressedChange={setBoxes}>
                Boxes
              </Toggle>
              <Toggle size="sm" pressed={labels} onPressedChange={setLabels} disabled={!boxes}>
                Labels
              </Toggle>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {samples.map((s) => (
                <Frame key={s.id} s={s} boxes={boxes} labels={labels} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lineage">
            <ol className="flex flex-col rounded-md bg-card ring-1 ring-border">
              {lineage.map((l, i) => (
                <li key={l.ref}>
                  {i > 0 && <Separator />}
                  <div className="flex min-h-(--h-row) items-center gap-3 px-4">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{l.kind}</span>
                    <span className={l.kind === "This dataset" ? "font-mono text-sm font-bold" : "font-mono text-sm"}>{l.ref}</span>
                    {i < lineage.length - 1 && <ArrowRight aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />}
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="compliance">
            <ul className="flex flex-col rounded-md bg-card ring-1 ring-border">
              {reviews.map((r, i) => (
                <li key={r.check}>
                  {i > 0 && <Separator />}
                  <div className="flex min-h-(--h-row) items-center justify-between gap-3 px-4 text-sm">
                    {r.check}
                    <InlineStatus tone={r.state === "passed" ? "success" : "warning"}>{r.state === "passed" ? "Passed" : "Open"}</InlineStatus>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
