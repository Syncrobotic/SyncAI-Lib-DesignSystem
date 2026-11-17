import type { Meta, StoryObj } from "@storybook/react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/syncrobotic/ui/resizable"

const meta: Meta = { title: "Display/Resizable" }
export default meta
type S = StoryObj

const pane = (label: string, sub?: string) => (
  <div className="flex size-full flex-col items-center justify-center gap-1 p-4 text-center">
    <span className="text-sm font-medium">{label}</span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
  </div>
)
const frame = "h-64 rounded-md bg-card ring-1 ring-border overflow-hidden"

export const ResizableHorizontal: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={25}>
          {pane("Robots", "list")}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          {pane("Map", "the selected robot")}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const ResizableVertical: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={65} minSize={30}>
          {pane("Camera", "live")}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={35} minSize={20}>
          {pane("Event log")}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const ResizableWithGrip: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>{pane("Route editor")}</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>{pane("Preview")}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const ResizableThreePanels: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15}>
          {pane("Sites")}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          {pane("Map")}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25} minSize={15}>
          {pane("Details")}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const ResizableNested: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={20}>
          {pane("Robots")}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60}>{pane("Camera")}</ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>{pane("Telemetry")}</ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}

export const ResizableCollapsible: S = {
  render: () => (
    <div className={frame}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} collapsible collapsedSize={0}>
          {pane("Filters", "drag to the edge to hide")}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>{pane("Results")}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
}
