import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"

const meta: Meta = { title: "Data/List and status" }
export default meta
type S = StoryObj

export const StatusShapes: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">{(["info", "success", "warning", "danger", "neutral"] as const).map((t) => <StatusGlyph key={t} tone={t} />)}</div>
      <StatusEyebrow tone="info">Patrolling</StatusEyebrow>
      <StatusEyebrow tone="success">Charging</StatusEyebrow>
      <StatusEyebrow tone="warning">Task paused</StatusEyebrow>
      <StatusEyebrow tone="danger">Emergency stopped</StatusEyebrow>
      <StatusEyebrow tone="neutral">Wi-Fi lost</StatusEyebrow>
    </div>
  ),
}
export const GroupedList: S = {
  render: () => (
    <ListGroup>
      <ListRow title="Network" meta="Good signal" trailing="SyncAI-Office" chevron onClick={fn()} />
      <ListRow title="License" meta="Pro · expires 11/19" trailing={<InlineStatus tone="warning">5 days left</InlineStatus>} chevron onClick={fn()} />
      <ListRow title="Night shift · Pixel 8" meta="Operator" trailing={<InlineStatus tone="success">Online</InlineStatus>} />
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
            <Bone onCard className="size-14 rounded-sm" />
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
