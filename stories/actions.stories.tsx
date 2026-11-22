import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
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

/** Delete is destructive with or without its word. The two icon buttons wrap as a pair, so neither is left alone on a line. */
export const ButtonWithIcon: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus aria-hidden="true" /> New task
      </Button>
      <Button variant="secondary">
        <Download aria-hidden="true" /> Download
      </Button>
      <div className="flex items-center gap-3">
        <Button variant="destructive" size="icon" aria-label="Delete task">
          <Trash2 aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Add a step">
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  ),
}

/** Disabled says why, next to it, and the button points at the reason so a screen reader reads it too. */
export const ButtonStates: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled aria-describedby="dispatch-why">
          Dispatch
        </Button>
        <span id="dispatch-why" className="text-sm text-muted-foreground">
          Robot is offline
        </span>
      </div>
      {/* The spinner appears 300 ms after loading starts */}
      <div>
        <Button loading>Saving</Button>
      </div>
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
      <div className="flex flex-col gap-1">
        <SegmentedControl defaultValue="24h" aria-label="Range" aria-describedby="range-why">
          <SegmentedControlItem value="1h">1 h</SegmentedControlItem>
          <SegmentedControlItem value="24h">24 h</SegmentedControlItem>
          <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
          <SegmentedControlItem value="30d" disabled>
            30 days
          </SegmentedControlItem>
        </SegmentedControl>
        <p id="range-why" className="text-xs text-muted-foreground">
          30 days: this robot has 12 days of history.
        </p>
      </div>
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

/** Full width of a phone-sized column: the column has a width of its own, which the buttons fill. */
export const ButtonFullWidth: S = {
  render: () => (
    <div className="flex w-sm max-w-full flex-col gap-2">
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

export const ToggleSizes: S = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle size="sm">Small 36</Toggle>
      <Toggle>Default 44</Toggle>
    </div>
  ),
}

export const ToggleIconOnly: S = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Show camera" defaultPressed className="w-(--h-md) px-0">
        <Video aria-hidden="true" />
      </Toggle>
      <Toggle aria-label="Show map" className="w-(--h-md) px-0">
        <Map aria-hidden="true" />
      </Toggle>
    </div>
  ),
}

export const ToggleWithIcon: S = {
  render: () => (
    <Toggle defaultPressed>
      <Video aria-hidden="true" /> Follow robot
    </Toggle>
  ),
}

/** Off and on, both disabled: on keeps a grey fill, like a disabled checked switch. Each points at the reason. */
export const ToggleDisabled: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Toggle disabled aria-describedby="layers-why">
          Heat map
        </Toggle>
        <Toggle disabled defaultPressed aria-describedby="layers-why">
          Lidar
        </Toggle>
      </div>
      <p id="layers-why" className="text-xs text-muted-foreground">
        Layers are fixed while a mission replays. Lidar stays on.
      </p>
    </div>
  ),
}

export const SegmentedControlThreeViews: S = {
  render: () => (
    <SegmentedControl defaultValue="live" aria-label="Camera">
      <SegmentedControlItem value="live">Live</SegmentedControlItem>
      <SegmentedControlItem value="replay">Replay</SegmentedControlItem>
      <SegmentedControlItem value="snapshots">Snapshots</SegmentedControlItem>
    </SegmentedControl>
  ),
}

export const SegmentedControlDisabledItem: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      <SegmentedControl defaultValue="day" aria-label="Range" aria-describedby="year-why">
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="year" disabled>
          Year
        </SegmentedControlItem>
      </SegmentedControl>
      <p id="year-why" className="text-xs text-muted-foreground">
        Year: reports keep 90 days.
      </p>
    </div>
  ),
}

export const CopyButtonVariants: S = {
  render: () => (
    <div className="flex items-center gap-2">
      <CopyButton value="7F3A" label="Copy robot ID" />
      <CopyButton value="7F3A" label="Copy robot ID" variant="outline" />
      <CopyButton value="7F3A" label="Copy robot ID" variant="secondary" />
    </div>
  ),
}

export const CopyButtonInField: S = {
  render: () => (
    <div className="flex h-(--h-md) items-center gap-2 rounded-sm bg-card pr-1 pl-3 ring-1 ring-input ring-inset">
      <span className="flex-1 truncate font-mono text-sm">sk_live_7f3a••••••••2b19</span>
      <CopyButton value="sk_live_7f3a2b19" label="Copy API key" />
    </div>
  ),
}
