import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCw,
  Search,
  SkipBack,
  SkipForward,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/syncrobotic/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Input } from "@/registry/syncrobotic/ui/input"

const meta: Meta = { title: "Actions/Button group" }
export default meta
type S = StoryObj

export const ButtonGroupBasic: S = {
  render: () => (
    <ButtonGroup aria-label="Route">
      <Button variant="outline">Edit</Button>
      <Button variant="outline">Duplicate</Button>
      <Button variant="outline">Export</Button>
    </ButtonGroup>
  ),
}

export const ButtonGroupIconTools: S = {
  render: () => (
    <ButtonGroup aria-label="Camera image">
      <Button variant="outline" size="icon" aria-label="Flip horizontally">
        <FlipHorizontal aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Flip vertically">
        <FlipVertical aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Rotate 90°">
        <RotateCw aria-hidden="true" />
      </Button>
    </ButtonGroup>
  ),
}

export const ButtonGroupSplitButton: S = {
  render: () => (
    <ButtonGroup aria-label="Deploy map">
      <Button onClick={fn()}>Deploy map</Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="More deploy options">
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Deploy to</DropdownMenuLabel>
          <DropdownMenuItem>All robots on site</DropdownMenuItem>
          <DropdownMenuItem>Robots in Hall B</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Save as draft</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
}

export const ButtonGroupStepper: S = {
  render: function Stepper() {
    const [speed, setSpeed] = React.useState(1.2)
    const step = (d: number) => setSpeed((s) => Math.min(2, Math.max(0.2, Math.round((s + d) * 10) / 10)))
    return (
      <ButtonGroup aria-label="Max speed">
        <Button variant="outline" size="icon" aria-label="Slower" onClick={() => step(-0.2)} disabled={speed <= 0.2}>
          <Minus aria-hidden="true" />
        </Button>
        <ButtonGroupText className="w-24 justify-center bg-card text-foreground" aria-live="polite">
          {speed.toFixed(1)} m/s
        </ButtonGroupText>
        <Button variant="outline" size="icon" aria-label="Faster" onClick={() => step(0.2)} disabled={speed >= 2}>
          <Plus aria-hidden="true" />
        </Button>
      </ButtonGroup>
    )
  },
}

export const ButtonGroupPagination: S = {
  render: () => (
    <ButtonGroup aria-label="Pages">
      <Button variant="outline" size="icon" aria-label="Previous page">
        <ChevronLeft aria-hidden="true" />
      </Button>
      {[1, 2, 3].map((n) => (
        <Button key={n} variant={n === 2 ? "secondary" : "outline"} size="icon" aria-current={n === 2 ? "page" : undefined}>
          {n}
        </Button>
      ))}
      <Button variant="outline" size="icon" aria-label="Next page">
        <ChevronRight aria-hidden="true" />
      </Button>
    </ButtonGroup>
  ),
}

export const ButtonGroupWithInput: S = {
  render: () => (
    <ButtonGroup aria-label="Search events" className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            All robots <ChevronDown aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>All robots</DropdownMenuItem>
          <DropdownMenuItem>Patrol dogs</DropdownMenuItem>
          <DropdownMenuItem>Couriers</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Input type="search" aria-label="Search events" placeholder="Search events" />
      <Button variant="outline" size="icon" aria-label="Search">
        <Search aria-hidden="true" />
      </Button>
    </ButtonGroup>
  ),
}

export const ButtonGroupCount: S = {
  render: () => (
    <ButtonGroup aria-label="Watch robot">
      <Button variant="outline" onClick={fn()}>
        Watch
      </Button>
      <ButtonGroupText>12</ButtonGroupText>
    </ButtonGroup>
  ),
}

export const ButtonGroupPlayback: S = {
  render: function Playback() {
    const [playing, setPlaying] = React.useState(false)
    return (
      <ButtonGroup aria-label="Recording playback">
        <Button variant="outline" size="icon" aria-label="Back 10 seconds">
          <SkipBack aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <Button variant="outline" size="icon" aria-label="Forward 10 seconds">
          <SkipForward aria-hidden="true" />
        </Button>
      </ButtonGroup>
    )
  },
}

export const ButtonGroupZoom: S = {
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Map zoom">
      <Button variant="outline" size="icon" aria-label="Zoom in">
        <ZoomIn aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Zoom out">
        <ZoomOut aria-hidden="true" />
      </Button>
    </ButtonGroup>
  ),
}

export const ButtonGroupSeparateDanger: S = {
  render: () => (
    <div className="flex items-center gap-2">
      <ButtonGroup aria-label="Selected waypoints">
        <Button variant="outline" size="sm">
          <Copy aria-hidden="true" /> Copy
        </Button>
        <Button variant="outline" size="sm">
          <X aria-hidden="true" /> Clear
        </Button>
      </ButtonGroup>
      <Button variant="destructive" size="sm">
        <Trash2 aria-hidden="true" /> Delete
      </Button>
    </div>
  ),
}
