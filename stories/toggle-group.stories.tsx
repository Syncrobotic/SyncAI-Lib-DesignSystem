import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bell, Camera, Mail, Map, MapPin, MessageSquare, Radar, Route, Thermometer } from "lucide-react"
import { SafetyZone } from "@/registry/syncrobotic/ui/robot-icons"
import { ToggleGroup, ToggleGroupItem } from "@/registry/syncrobotic/ui/toggle-group"

const meta: Meta = { title: "Actions/Toggle group" }
export default meta
type S = StoryObj

/**
 * Single: a tool or a mode, what a tap on the map does next. A view of the data or a time window is a Segmented control,
 * not a toggle group.
 */
export const ToggleGroupSingle: S = {
  render: () => (
    <ToggleGroup type="single" defaultValue="route" aria-label="Map tool">
      <ToggleGroupItem value="goal">
        <MapPin aria-hidden="true" /> Goal
      </ToggleGroupItem>
      <ToggleGroupItem value="route">
        <Route aria-hidden="true" /> Route
      </ToggleGroupItem>
      <ToggleGroupItem value="zone">
        <SafetyZone aria-hidden="true" /> Zone
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

/** Multiple: layers or channels, any mix on. */
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

/** Icon only: each item names its tool in an aria-label. */
export const ToggleGroupIconOnly: S = {
  render: () => (
    <ToggleGroup type="single" defaultValue="goal" aria-label="Map tool">
      <ToggleGroupItem value="goal" aria-label="Goal">
        <MapPin aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="route" aria-label="Route">
        <Route aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="zone" aria-label="Zone">
        <SafetyZone aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

/** Ghost: a tool palette over a map, no frame of its own. */
export const ToggleGroupGhost: S = {
  render: () => (
    <ToggleGroup type="multiple" variant="ghost" defaultValue={["lidar"]} aria-label="Map layers">
      <ToggleGroupItem value="lidar" aria-label="Lidar">
        <Radar aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="camera" aria-label="Camera">
        <Camera aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="heat" aria-label="Heat">
        <Thermometer aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

/** Spaced: filter chips that read as separate options; any mix on. */
export const ToggleGroupSpaced: S = {
  render: () => (
    <ToggleGroup type="multiple" joined={false} size="sm" defaultValue={["active", "paused"]} aria-label="Show missions">
      {["Active", "Paused", "Archived"].map((s) => (
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

/** Vertical: a tool palette at a map's edge. */
export const ToggleGroupVertical: S = {
  render: () => (
    <ToggleGroup type="single" orientation="vertical" defaultValue="route" aria-label="Map tool">
      <ToggleGroupItem value="goal" className="justify-start">
        <MapPin aria-hidden="true" /> Goal
      </ToggleGroupItem>
      <ToggleGroupItem value="route" className="justify-start">
        <Route aria-hidden="true" /> Route
      </ToggleGroupItem>
      <ToggleGroupItem value="zone" className="justify-start">
        <SafetyZone aria-hidden="true" /> Zone
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}
