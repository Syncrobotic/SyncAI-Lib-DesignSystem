import type { Meta, StoryObj } from "@storybook/react-vite"
import { thumbnailLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Thumbnail } from "@/registry/syncrobotic/ui/thumbnail"
import { TierBadge } from "@/registry/syncrobotic/ui/tier-badge"
import { brokenPhoto, placeholderPhoto } from "./placeholder-photos"

const meta: Meta = { title: "Display/Thumbnail" }
export default meta
type S = StoryObj

const rows = [
  { id: "aisles", name: "Forklift aisles v3", items: "12,480", tier: "T1" as const, src: placeholderPhoto(1, "aisles") },
  { id: "hall-b", name: "Hall B people", items: "3,912", tier: "T2" as const, restricted: "Restricted · faces" },
  { id: "docks", name: "Dock cameras v2", items: "8,200", tier: "T0" as const, src: placeholderPhoto(4, "docks") },
  { id: "night", name: "Night patrol v1", items: "1,104", tier: "T0" as const, src: brokenPhoto },
]

/** The first column of a table of datasets: a restricted row shows the placeholder and fetches nothing; a failed picture the fallback. */
export const ThumbnailInTable: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0">
            <span className="sr-only">Picture</span>
          </TableHead>
          <TableHead>Dataset</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead>Tier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              {r.restricted ? <Thumbnail restricted reason={r.restricted} /> : <Thumbnail src={r.src} alt="" />}
            </TableCell>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="text-right tabular-nums">{r.items}</TableCell>
            <TableCell>
              <TierBadge tier={r.tier} compact />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

/** The three sizes, from the control scale: sm (--h-sm, 36 px, 44 on touch), md (--h-md, 44) and lg (--h-lg, 48). */
export const ThumbnailSizes: S = {
  render: () => (
    <div className="flex items-end gap-4">
      {(["sm", "md", "lg"] as const).map((size, i) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Thumbnail size={size} src={placeholderPhoto(i + 2, size)} alt={`Warehouse aisle, ${size}`} />
          <span className="font-mono text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** Restricted and failed, at each size: the same neutral tiles as RestrictedPreview and ImageGrid, never a warning colour. */
export const ThumbnailStates: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <Thumbnail size={size} restricted reason="Restricted · faces" />
          <Thumbnail size={size} src={brokenPhoto} alt="Night patrol, frame 12" />
          <span className="font-mono text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** The words from the zh-TW pack: a restricted thumbnail with no reason, and a failed picture's name. */
export const ThumbnailZhTw: S = {
  render: () => (
    <div className="flex items-center gap-4">
      <Thumbnail restricted labels={thumbnailLabels} />
      <Thumbnail src={brokenPhoto} alt="夜間巡邏，第 12 張" labels={thumbnailLabels} />
    </div>
  ),
}
