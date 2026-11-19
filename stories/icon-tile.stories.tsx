import type { Meta, StoryObj } from "@storybook/react"
import { Battery, Bot, Camera, CircleCheck, Cpu, FolderOpen, Map, OctagonAlert, Radar, Router, TriangleAlert, Wifi } from "lucide-react"
import { IconTile, IconTileDot } from "@/registry/syncrobotic/ui/icon-tile"

const meta: Meta = { title: "Display/Icon tile" }
export default meta
type S = StoryObj

export const IconTileDefault: S = {
  render: () => (
    <IconTile>
      <Bot aria-hidden="true" />
    </IconTile>
  ),
}

export const IconTileVariants: S = {
  render: () => (
    <div className="flex w-fit items-center gap-3">
      {(["outline", "muted", "raised", "soft", "solid"] as const).map((v) => (
        <div key={v} className="flex flex-col items-center gap-2">
          <IconTile variant={v}>
            <Radar aria-hidden="true" />
          </IconTile>
          <span className="text-xs text-muted-foreground">{v}</span>
        </div>
      ))}
    </div>
  ),
}

export const IconTileSizes: S = {
  render: () => (
    <div className="flex w-fit items-end gap-3">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <IconTile size={s} variant="raised">
            <Cpu aria-hidden="true" />
          </IconTile>
          <span className="text-xs text-muted-foreground">{s}</span>
        </div>
      ))}
    </div>
  ),
}

export const IconTileCircle: S = {
  render: () => (
    <div className="flex w-fit items-center gap-3">
      <IconTile shape="circle" size="lg">
        <Camera aria-hidden="true" />
      </IconTile>
      <IconTile shape="circle" size="lg" variant="raised">
        <Map aria-hidden="true" />
      </IconTile>
      <IconTile shape="circle" size="lg" variant="muted">
        <Router aria-hidden="true" />
      </IconTile>
    </div>
  ),
}

export const IconTileStatusTones: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <IconTile variant="soft" tone="success">
          <CircleCheck aria-hidden="true" />
        </IconTile>
        <IconTile variant="soft" tone="warning">
          <TriangleAlert aria-hidden="true" />
        </IconTile>
        <IconTile variant="soft" tone="danger">
          <OctagonAlert aria-hidden="true" />
        </IconTile>
        <IconTile variant="soft" tone="neutral">
          <Bot aria-hidden="true" />
        </IconTile>
      </div>
      <div className="flex items-center gap-3">
        <IconTile variant="solid" tone="success">
          <CircleCheck aria-hidden="true" />
        </IconTile>
        <IconTile variant="solid" tone="warning">
          <TriangleAlert aria-hidden="true" />
        </IconTile>
        <IconTile variant="solid">
          <Bot aria-hidden="true" />
        </IconTile>
      </div>
    </div>
  ),
}

export const IconTileWithDot: S = {
  render: () => (
    <div className="flex w-fit items-center gap-4">
      <IconTile variant="raised" size="lg">
        <Wifi aria-hidden="true" />
        <IconTileDot label="Online" />
      </IconTile>
      <IconTile variant="raised" size="lg">
        <Battery aria-hidden="true" />
        <IconTileDot tone="warning" label="Low battery" />
      </IconTile>
    </div>
  ),
}

export const IconTileText: S = {
  render: () => (
    <div className="flex w-fit items-center gap-3">
      <IconTile variant="raised" className="text-sm font-bold">
        7F
      </IconTile>
      <IconTile shape="circle" className="text-sm font-medium text-muted-foreground tabular-nums">
        +3
      </IconTile>
    </div>
  ),
}

export const IconTileInARow: S = {
  render: () => (
    <div className="flex items-center gap-3 rounded-sm px-3 py-2 ring-1 ring-border ring-inset">
      <IconTile size="sm" variant="muted">
        <FolderOpen aria-hidden="true" />
      </IconTile>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">Site maps</span>
        <span className="text-xs text-muted-foreground">12 files · Mei Lin</span>
      </div>
    </div>
  ),
}

export const IconTileFeature: S = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
      <IconTile size="lg" variant="raised">
        <Radar aria-hidden="true" />
      </IconTile>
      <div className="flex flex-col gap-1">
        <span className="font-bold">Obstacle radar</span>
        <span className="text-sm text-muted-foreground">Sees people and pallets 12 m ahead, day or night.</span>
      </div>
    </div>
  ),
}

export const IconTileAsLink: S = {
  render: () => (
    <IconTile asChild variant="raised" size="lg">
      <a href="#map" aria-label="Open site map">
        <Map aria-hidden="true" />
      </a>
    </IconTile>
  ),
}
