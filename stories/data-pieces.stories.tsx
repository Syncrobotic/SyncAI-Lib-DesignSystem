import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { cn } from "@/lib/utils"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { RestrictedPreview } from "@/registry/syncrobotic/ui/restricted-preview"
import { ShareBar, ShareLegend } from "@/registry/syncrobotic/ui/share-bar"
import { placeholderPhoto } from "./placeholder-photos"

const meta: Meta = { title: "Display/Data pieces" }
export default meta
type S = StoryObj

const uses = [
  { key: "train", label: "Train", value: 18240 },
  { key: "val", label: "Validation", value: 2280 },
  { key: "test", label: "Test", value: 2310 },
]

/** With its label, total and legend: how a dataset's images split by use. */
export const ShareBarLegend: S = {
  render: () => (
    <div className="max-w-md">
      <ShareBar label="Images by use" segments={uses} unit="images" legend />
    </div>
  ),
}

/** Each part links to the catalog filtered to it: the legend entries are the links, the bar stays one picture. */
export const ShareBarLinks: S = {
  render: () => (
    <div className="max-w-md">
      <ShareBar
        label="Items by source"
        unit="items"
        legend
        segments={[
          { key: "fleet", label: "Fleet cameras", value: 5060, href: "#source=fleet" },
          { key: "partner", label: "Partner uploads", value: 3640, href: "#source=partner" },
          { key: "synthetic", label: "Synthetic", value: 1300, href: "#source=synthetic" },
        ]}
      />
    </div>
  ),
}

/** A list of bars, one per task, under one ShareLegend: same segments in the same order, so the colours match. Each bar keeps its own name. */
export const ShareBarSharedLegend: S = {
  render: () => {
    const parts = [
      { key: "manual", label: "Manual" },
      { key: "model", label: "Model" },
      { key: "other", label: "Other", tone: "other" as const },
    ]
    const rows = [
      { id: "det", name: "Detection", values: [600, 400, 0] },
      { id: "seg", name: "Segmentation", values: [220, 760, 120] },
      { id: "pose", name: "Pose", values: [90, 140, 40] },
    ]
    const max = Math.max(...rows.map((r) => r.values.reduce((a, b) => a + b, 0)))
    return (
      <div className="flex max-w-md flex-col gap-3">
        <ShareLegend segments={parts} />
        <ul className="flex flex-col gap-3 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[6rem_1fr] items-center gap-3">
              <span>{r.name}</span>
              <ShareBar label={r.name} total={max} segments={parts.map((p, i) => ({ ...p, value: r.values[i] }))} />
            </li>
          ))}
        </ul>
      </div>
    )
  },
}

/** Thin, in table cells: where each dataset's labels came from. The column header names the parts. */
export const ShareBarInTable: S = {
  render: () => (
    <table className="w-full max-w-lg text-sm">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          <th className="h-10 font-medium">Dataset</th>
          <th className="h-10 font-medium">Labels: human, model, both</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["Forklift aisles", [620, 180, 200]],
          ["Night patrol", [120, 760, 120]],
          ["Dock cameras", [900, 0, 100]],
        ].map(([name, v]) => {
          const [h, m, b] = v as number[]
          return (
            <tr key={name as string} className="border-t border-border">
              <td className="h-12">{name as string}</td>
              <td className="h-12 w-48">
                <ShareBar
                  size="sm"
                  label={`${name}: label sources`}
                  segments={[
                    { key: "h", label: "Human", value: h },
                    { key: "m", label: "Model", value: m },
                    { key: "b", label: "Both", value: b },
                  ]}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  ),
}

function Gallery() {
  const all = Array.from({ length: 53 }, (_, i) => `Recording ${String(i + 1).padStart(2, "0")}`)
  const [shown, setShown] = React.useState(12)
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        {all.slice(0, shown).map((r, i) => (
          <li key={r} className={cn("flex h-(--h-md) items-center truncate rounded-sm bg-card px-3 whitespace-nowrap ring-1 ring-border", i >= 12 && "animate-appear")}>
            {r}
          </li>
        ))}
      </ul>
      <LoadMore shown={shown} total={all.length} step={12} onMore={() => setShown((n) => n + 12)} />
    </div>
  )
}

/** The end of a long list on a phone or in a gallery: how much is shown, and the next batch with how many remain. */
export const LoadMoreList: S = { render: () => <Gallery /> }

/** While the next batch is fetched. */
export const LoadMoreLoading: S = { render: () => <LoadMore shown={40} total={125} step={20} loading onMore={() => {}} /> }

/** The dataset's first four pictures, as a catalog card shows them. */
function Mosaic({ prefix }: { prefix: string }) {
  return (
    <span aria-label="Four sample images" role="img" className="grid aspect-4/3 w-full grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-sm bg-border">
      {[0, 1, 2, 3].map((i) => (
        <img key={i} src={placeholderPhoto(i + 2, `${prefix}-${i + 1}`)} alt="" className="size-full object-cover" />
      ))}
    </span>
  )
}

/** A restricted dataset's pictures stay unloaded until someone asks, card by card. Neutral: restricted is not a fault. */
export const RestrictedPreviewCards: S = {
  render: () => (
    <div className="grid max-w-lg grid-cols-2 gap-4">
      {[
        { name: "Hall B, people", restricted: true, reason: "T2 · faces" },
        { name: "Dock cameras", restricted: false },
      ].map((d) => (
        <figure key={d.name} className="flex flex-col gap-2">
          <RestrictedPreview restricted={d.restricted} reason={d.reason} className="aspect-4/3 w-full">
            <Mosaic prefix={d.name.startsWith("Dock") ? "dock" : "hall-b"} />
          </RestrictedPreview>
          <figcaption className="text-sm">{d.name}</figcaption>
        </figure>
      ))}
    </div>
  ),
}
