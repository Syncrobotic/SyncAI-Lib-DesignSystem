import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Bell,
  Camera,
  Columns2,
  Columns3,
  Grid2x2,
  LayoutList,
  Mail,
  Map,
  MessageSquare,
  Radar,
  Rows3,
  Thermometer,
} from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/registry/syncrobotic/ui/toggle-group"

const meta: Meta = { title: "Actions/Toggle group" }
export default meta
type S = StoryObj

export const ToggleGroupSingle: S = {
  render: () => (
    <ToggleGroup type="single" defaultValue="24h" aria-label="Time range">
      {[
        ["1h", "1 h"],
        ["6h", "6 h"],
        ["24h", "24 h"],
        ["7d", "7 days"],
        ["30d", "30 days"],
      ].map(([v, l]) => (
        <ToggleGroupItem key={v} value={v}>
          {l}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
}

export const ToggleGroupMultipleLayers: S = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["map", "lidar"]} aria-label="Map layers">
      <ToggleGroupItem value="map">
        <Map aria-hidden="true" /> Map
      </ToggleGroupItem>
      <ToggleGroupItem value="lidar">
        <Radar aria-hidden="true" /> Lidar
      </ToggleGroupItem>
      <ToggleGroupItem value="camera">
        <Camera aria-hidden="true" /> Camera
      </ToggleGroupItem>
      <ToggleGroupItem value="heat">
        <Thermometer aria-hidden="true" /> Heat
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ToggleGroupIconOnly: S = {
  render: () => (
    <ToggleGroup type="single" defaultValue="list" aria-label="View">
      <ToggleGroupItem value="list" aria-label="List">
        <LayoutList aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid">
        <Grid2x2 aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="map" aria-label="Map">
        <Map aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ToggleGroupGhost: S = {
  render: () => (
    <ToggleGroup type="single" variant="ghost" defaultValue="2" aria-label="Columns">
      <ToggleGroupItem value="1" aria-label="One column">
        <Rows3 aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="2" aria-label="Two columns">
        <Columns2 aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="3" aria-label="Three columns">
        <Columns3 aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ToggleGroupSpaced: S = {
  render: () => (
    <ToggleGroup type="single" joined={false} size="sm" defaultValue="active" aria-label="Status filter">
      {["All", "Active", "Paused", "Archived"].map((s) => (
        <ToggleGroupItem key={s} value={s.toLowerCase()}>
          {s}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
}

export const ToggleGroupChannels: S = {
  render: () => (
    <ToggleGroup type="multiple" joined={false} defaultValue={["push", "email"]} aria-label="Notify by">
      <ToggleGroupItem value="push">
        <Bell aria-hidden="true" /> Push
      </ToggleGroupItem>
      <ToggleGroupItem value="email">
        <Mail aria-hidden="true" /> Email
      </ToggleGroupItem>
      <ToggleGroupItem value="sms">
        <MessageSquare aria-hidden="true" /> SMS
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ToggleGroupSortDirection: S = {
  render: () => (
    <ToggleGroup type="single" size="sm" defaultValue="desc" aria-label="Sort">
      <ToggleGroupItem value="asc">
        <ArrowUpNarrowWide aria-hidden="true" /> Oldest
      </ToggleGroupItem>
      <ToggleGroupItem value="desc">
        <ArrowDownWideNarrow aria-hidden="true" /> Newest
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ToggleGroupVertical: S = {
  render: () => (
    <ToggleGroup type="single" orientation="vertical" defaultValue="floor-2" aria-label="Floor">
      {["Floor 3", "Floor 2", "Floor 1", "Basement"].map((f) => (
        <ToggleGroupItem key={f} value={f.toLowerCase().replace(" ", "-")} className="justify-start">
          {f}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
}
