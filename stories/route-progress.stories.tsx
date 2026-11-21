import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@/registry/syncrobotic/ui/button"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"

const meta: Meta = { title: "Feedback/Route progress" }
export default meta
type S = StoryObj

export const RouteProgressSlowPage: S = {
  render: () => {
    function Demo() {
      const [active, setActive] = React.useState(false)
      return (
        <div className="flex flex-col items-start gap-3">
          <RouteProgress active={active} className="absolute" />
          <Button variant="secondary" onClick={() => setActive((a) => !a)}>
            {active ? "Page arrived" : "Open a slow page"}
          </Button>
          <p className="text-sm text-muted-foreground">The bar appears after 300 ms and only while the page is on its way.</p>
        </div>
      )
    }
    return <Demo />
  },
}

/** Shown, for the visual test: the bar at the top of the frame. */
export const RouteProgressShown: S = {
  render: () => (
    <div className="relative h-24 w-full overflow-hidden rounded-md ring-1 ring-border">
      <RouteProgress active delay={0} className="absolute" />
      <p className="p-4 text-sm text-muted-foreground">Loading Catalog…</p>
    </div>
  ),
}
