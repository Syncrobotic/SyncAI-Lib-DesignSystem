import type { Meta, StoryObj } from "@storybook/react-vite"
import type * as React from "react"
import { Crosshair, Pause, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ButtonGroup } from "@/registry/syncrobotic/ui/button-group"
import { ViewportOverlay, ViewportPanel } from "@/registry/syncrobotic/ui/viewport-overlay"

const meta: Meta = { title: "Robotics/Viewport overlay" }
export default meta
type S = StoryObj

// A stand-in for a map or a canvas: the map surface. The overlays are the subject, not the picture.
function View({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-md bg-map ring-1 ring-border ${className}`}
    >
      {children}
    </div>
  )
}

/** Over a map: what the view says about itself at the top, the zoom group bottom left (the stop keeps the bottom right). */
export const ViewportOverlayOnMap: S = {
  render: () => (
    <View>
      <ViewportOverlay position="top">
        <ViewportPanel as="p">Pick the goal on the map</ViewportPanel>
        <ViewportPanel as="p" className="flex items-center gap-2">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
          <span>
            <span className="font-medium">Stale</span> · last scan 14:02:31
          </span>
        </ViewportPanel>
      </ViewportOverlay>
      <ViewportOverlay position="bottom-left">
        <ButtonGroup className="pointer-events-auto rounded-sm shadow-float">
          <Button variant="secondary" size="icon" aria-label="Zoom in" title="Zoom in">
            <ZoomIn aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Zoom out" title="Zoom out">
            <ZoomOut aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Fit" title="Fit">
            <Crosshair aria-hidden="true" />
          </Button>
        </ButtonGroup>
      </ViewportOverlay>
    </View>
  ),
}

/** A message over the whole view, on the scrim: the view is there but not to be trusted until it comes back. */
export const ViewportOverlayMessage: S = {
  render: () => (
    <View>
      <ViewportOverlay position="center" className="bg-scrim">
        <ViewportPanel as="p">Reconnecting to the 3D view…</ViewportPanel>
      </ViewportOverlay>
    </View>
  ),
}

/** Words straight over a picture (a paused video): the scrim variant, light words in any theme. */
export const ViewportOverlayOverPicture: S = {
  render: () => (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-letterbox ring-1 ring-border">
      <img src="/media/patrol-clip-poster.webp" alt="Front camera of Patrol dog 7F3A, aisle 4" className="size-full object-contain" />
      <ViewportOverlay position="top-left">
        <ViewportPanel as="p" variant="scrim" className="flex items-center gap-2 px-2 py-1">
          <Pause aria-hidden="true" className="size-4" />
          Paused
        </ViewportPanel>
      </ViewportOverlay>
    </div>
  ),
}
