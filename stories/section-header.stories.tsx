import type { Meta, StoryObj } from "@storybook/react-vite"
import { Plus } from "lucide-react"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const meta: Meta = { title: "Layout/Section header" }
export default meta
type S = StoryObj

/** A section of the page, outside the cards: 20 px bold, the count in full, a line under it and the section's action. */
export const SectionHeaderPage: S = {
  render: () => (
    <section aria-labelledby="robots-title" className="flex flex-col gap-4">
      <SectionHeader
        id="robots-title"
        title="Robots"
        count={1284}
        description="Every robot on the three sites, with its state and battery."
        actions={
          <Button variant="secondary">
            <Plus aria-hidden="true" />
            Add robot
          </Button>
        }
      />
      <ListGroup>
        <ListRow title="Patrol dog 7F3A" meta="North gate" trailing={<InlineStatus status="active">Patrolling</InlineStatus>} />
        <ListRow title="Courier 2B19" meta="Hall B" trailing={<InlineStatus status="warning">Low battery</InlineStatus>} />
      </ListGroup>
    </section>
  ),
}

/** A section inside a card: 14 px medium, never bold, with a small action. The card's sections each take one. */
export const SectionHeaderSurface: S = {
  render: () => (
    <Card className="max-w-md">
      <div className="flex flex-col gap-2">
        <SectionHeader
          variant="surface"
          title="Sensors"
          count={6}
          actions={
            <Button variant="ghost" size="sm">
              Calibrate
            </Button>
          }
        />
        <p className="text-sm text-muted-foreground">Two lidars, three cameras and an IMU, last calibrated on 14 Nov.</p>
      </div>
      <div className="flex flex-col gap-2">
        <SectionHeader variant="surface" title="Recent events" description="The last 24 hours, newest first." />
        <p className="text-sm text-muted-foreground">Docked at 02:41 after a 41-minute patrol.</p>
      </div>
    </Card>
  ),
}

/** Both levels on one page: the page's section (h2) holds a card whose sections are its h3s, so no level is skipped. */
export const SectionHeaderLevels: S = {
  render: () => (
    <section aria-labelledby="site-title" className="flex flex-col gap-4">
      <SectionHeader id="site-title" title="Hall B" count={135287} description="Images captured on this site since March." />
      <Card>
        <SectionHeader variant="surface" title="Night shift" count={48210} />
        <SectionHeader variant="surface" title="Day shift" count={87077} />
      </Card>
    </section>
  ),
}
