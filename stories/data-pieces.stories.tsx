import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { cn } from "@/lib/utils"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { RestrictedPreview } from "@/registry/syncrobotic/ui/restricted-preview"
import { ShareBar } from "@/registry/syncrobotic/ui/share-bar"
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
      <ul className="grid grid-cols-3 gap-2 text-sm">
        {all.slice(0, shown).map((r, i) => (
          <li key={r} className={cn("flex h-(--h-md) items-center rounded-sm bg-card px-3 ring-1 ring-border", i >= 12 && "animate-appear")}>
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
        // eslint-disable-next-line @next/next/no-img-element -- a drawn placeholder, not a page image
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
