import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Download, Map, Plus, Trash2, Video } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

const meta: Meta = { title: "Actions" }
export default meta
type S = StoryObj

export const ButtonVariants: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button onClick={fn()}>Start patrol</Button>
      <Button variant="secondary">Schedule</Button>
      <Button variant="outline">Export</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="destructive">Delete route</Button>
      <Button variant="link">View log</Button>
    </div>
  ),
}

export const ButtonSizes: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small 36</Button>
      <Button size="md">Default 44</Button>
      <Button size="lg">Large 48</Button>
    </div>
  ),
}

export const ButtonWithIcon: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus aria-hidden="true" /> New task
      </Button>
      <Button variant="secondary">
        <Download aria-hidden="true" /> Download
      </Button>
      <Button variant="outline" size="icon" aria-label="Delete">
        <Trash2 aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Add">
        <Plus aria-hidden="true" />
      </Button>
    </div>
  ),
}

export const ButtonStates: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      {/* The spinner appears 300 ms after loading starts */}
      <Button loading>Saving</Button>
    </div>
  ),
}

export const SegmentedControlDefault: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SegmentedControl defaultValue="map" aria-label="View">
        <SegmentedControlItem value="map">
          <Map aria-hidden="true" /> Map
        </SegmentedControlItem>
        <SegmentedControlItem value="camera">
          <Video aria-hidden="true" /> Camera
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl defaultValue="24h" aria-label="Range">
        <SegmentedControlItem value="1h">1 h</SegmentedControlItem>
        <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
        <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
        <SegmentedControlItem value="30d" disabled>
          30 days
        </SegmentedControlItem>
      </SegmentedControl>
    </div>
  ),
}
