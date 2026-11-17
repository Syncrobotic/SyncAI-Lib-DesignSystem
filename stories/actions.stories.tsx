import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Download, Map, Plus, Trash2, Video } from "lucide-react"
import { Toggle } from "@/registry/syncrobotic/ui/toggle"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"

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

export const ButtonAsLink: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <a href="#routes">Open routes</a>
      </Button>
      <Button variant="link" asChild>
        <a href="#log">View full log</a>
      </Button>
    </div>
  ),
}

export const ButtonInAForm: S = {
  render: () => (
    <div className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
      <p className="text-sm text-muted-foreground">Unsaved changes to “Night patrol”.</p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1">
          Discard
        </Button>
        <Button className="flex-1">Save route</Button>
      </div>
    </div>
  ),
}

export const ButtonFullWidth: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full">
        Start patrol
      </Button>
      <Button size="lg" variant="secondary" className="w-full">
        Schedule for later
      </Button>
    </div>
  ),
}

export const SegmentedControlIconOnly: S = {
  render: () => (
    <SegmentedControl defaultValue="map" aria-label="View" className="w-auto">
      <SegmentedControlItem value="map" aria-label="Map">
        <Map aria-hidden="true" />
      </SegmentedControlItem>
      <SegmentedControlItem value="camera" aria-label="Camera">
        <Video aria-hidden="true" />
      </SegmentedControlItem>
    </SegmentedControl>
  ),
}

export const ToggleLayers: S = {
  render: () => (
    <div role="group" aria-label="Layers" className="flex flex-wrap gap-2">
      <Toggle size="sm" defaultPressed>
        Boxes
      </Toggle>
      <Toggle size="sm">Keypoints</Toggle>
      <Toggle size="sm">Depth</Toggle>
    </div>
  ),
}

/** The icon swaps to a check for 1.5 s; with text, the word changes too. */
export const CopyButtonDefault: S = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <span className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        people/night-parking@v3
        <CopyButton value="people/night-parking@v3" label="Copy reference" />
      </span>
      <CopyButton value="npx shadcn add @syncrobotic/button" variant="outline">
        Copy install command
      </CopyButton>
    </div>
  ),
}
