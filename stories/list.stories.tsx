import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { ListGroup, ListRow } from "@/registry/syncrobotic/blocks/list"
import { InlineStatus, StatusEyebrow } from "@/registry/syncrobotic/blocks/status-eyebrow"
import { StatusGlyph } from "@/registry/syncrobotic/blocks/status-glyph"
import { Bone, LoadingLine } from "@/registry/syncrobotic/blocks/skeleton"

const meta: Meta = { title: "資訊/列表與狀態" }
export default meta
type S = StoryObj

export const 狀態形狀: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">{(["info", "success", "warning", "danger", "neutral"] as const).map((t) => <StatusGlyph key={t} tone={t} />)}</div>
      <StatusEyebrow tone="info">巡邏中</StatusEyebrow>
      <StatusEyebrow tone="success">充電中</StatusEyebrow>
      <StatusEyebrow tone="warning">任務暫停</StatusEyebrow>
      <StatusEyebrow tone="danger">已緊急停止</StatusEyebrow>
      <StatusEyebrow tone="neutral">Wi-Fi 中斷</StatusEyebrow>
    </div>
  ),
}
export const 分組列表: S = {
  render: () => (
    <ListGroup>
      <ListRow title="網路" meta="訊號良好" trailing="SyncAI-Office" chevron onClick={fn()} />
      <ListRow title="授權" meta="專業版 · 到期日 11/19" trailing={<InlineStatus tone="warning">剩 5 天</InlineStatus>} chevron onClick={fn()} />
      <ListRow title="夜班 · Pixel 8" meta="操作員" trailing={<InlineStatus tone="success">在線</InlineStatus>} />
    </ListGroup>
  ),
}
export const 載入骨架: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LoadingLine>正在從 4 隻機器狗取得事件…</LoadingLine>
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
