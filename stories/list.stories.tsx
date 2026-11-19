import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"

const meta: Meta = { title: "Data/List and status" }
export default meta
type S = StoryObj

export const StatusShapes: S = {
  render: () => (
    // Each shape with its word: a glyph alone is documented under Status glyph.
    <div className="flex flex-col gap-3">
      <StatusEyebrow status="active">Patrolling</StatusEyebrow>
      <StatusEyebrow status="normal">Charging</StatusEyebrow>
      <StatusEyebrow status="warning">Task paused</StatusEyebrow>
      <StatusEyebrow status="danger">Emergency stopped</StatusEyebrow>
      <StatusEyebrow status="offline">Wi-Fi lost</StatusEyebrow>
    </div>
  ),
}
export const GroupedList: S = {
  render: () => (
    <ListGroup>
      <ListRow title="Network" meta="Good signal" trailing="SyncAI-Office" chevron onClick={fn()} />
      <ListRow title="License" meta="Pro · expires 11/19" trailing={<InlineStatus status="warning">5 days left</InlineStatus>} chevron onClick={fn()} />
      <ListRow title="Night shift · Pixel 8" meta="Operator" trailing={<InlineStatus status="normal">Online</InlineStatus>} />
    </ListGroup>
  ),
}
export const LoadingSkeleton: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LoadingLine>Fetching events from 4 dogs…</LoadingLine>
      <ListGroup>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-h-(--h-row) items-center gap-3 border-b border-border py-2 last:border-b-0" style={{ opacity: i === 2 ? 0.5 : 1 }}>
            <Bone onCard className="size-10 rounded-xs" />
            <div className="flex flex-1 flex-col gap-2">
              <Bone onCard className="h-4 w-3/5" />
              <Bone onCard className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </ListGroup>
    </div>
  ),
}

export const SkeletonCard: S = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-md bg-card p-4 ring-1 ring-border">
      <span className="text-sm font-medium">Patrol dog 7F3A</span>
      <div className="grid grid-cols-2 gap-3">
        {["Battery", "Signal"].map((l) => (
          <div key={l} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{l}</span>
            <Bone onCard className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  ),
}

export const SkeletonTableRows: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LoadingLine>Loading events…</LoadingLine>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Bone className="h-4 w-16" />
          <Bone className="h-4 flex-1" />
          <Bone className="h-4 w-12" />
        </div>
      ))}
    </div>
  ),
}

export const StatusEyebrowOverTitle: S = {
  render: () => (
    <div className="flex flex-col gap-1">
      <StatusEyebrow status="warning">Task paused</StatusEyebrow>
      <h2 className="text-2xl font-bold">Patrol dog 7F3A</h2>
      <p className="text-sm text-muted-foreground">Waiting at door 3 for 2 min.</p>
    </div>
  ),
}

export const StatusInlineInRows: S = {
  render: () => (
    <ListGroup>
      <ListRow title="Patrol dog 7F3A" meta="North gate" trailing={<InlineStatus status="active">Patrolling</InlineStatus>} />
      <ListRow title="Courier 2B19" meta="Hall B" trailing={<InlineStatus status="warning">Low battery</InlineStatus>} />
      <ListRow title="Courier 4D21" meta="Floor 3" trailing={<InlineStatus status="danger">Stopped</InlineStatus>} />
    </ListGroup>
  ),
}
