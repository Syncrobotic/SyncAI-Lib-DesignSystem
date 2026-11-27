import type * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Plus, SearchX } from "lucide-react"
import { ListGroup, ListRow } from "@/registry/syncrobotic/shell/list"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { dataStateLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DataState } from "@/registry/syncrobotic/ui/data-state"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const meta: Meta = { title: "Feedback/Data state" }
export default meta
type S = StoryObj

const devices = [
  { name: "Line 2 inspection", meta: "Hsinchu plant", status: "normal" as const, word: "Online" },
  { name: "Warehouse gate", meta: "Taoyuan depot", status: "offline" as const, word: "Offline" },
  { name: "Assembly cell 4", meta: "Hsinchu plant", status: "warning" as const, word: "Heartbeat late" },
]

function Devices() {
  return (
    <ListGroup>
      {devices.map((d) => (
        <ListRow key={d.name} title={d.name} meta={d.meta} trailing={<InlineStatus status={d.status}>{d.word}</InlineStatus>} />
      ))}
    </ListGroup>
  )
}

function Panel({ title = "Devices", count, children }: { title?: string; count?: number; children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-md gap-3">
      <SectionHeader variant="surface" title={title} count={count} />
      {children}
    </Card>
  )
}

/** A load that failed: the copy comes from the error's code (here RATE_LIMITED), the code is shown for support, and Try again reloads. */
export const DataStateError: S = {
  render: () => (
    <Panel>
      <DataState state="error" error={{ code: "RATE_LIMITED", message: "ThrottlerException: Too Many Requests" }} onRetry={() => {}} />
    </Panel>
  ),
}

/** A refresh that did not land: the devices stay on screen under a notice that says how old they are, with Try again. */
export const DataStateStale: S = {
  render: () => (
    <Panel count={3}>
      <DataState state="stale" updatedAt="14:02:31" onRetry={() => {}}>
        <Devices />
      </DataState>
    </Panel>
  ),
}

/** Nothing yet: what is missing and the one action that adds it. */
export const DataStateEmpty: S = {
  render: () => (
    <Panel count={0}>
      <DataState
        state="empty"
        empty={{
          title: "No devices in this project",
          description: "A device appears here once it registers and an admin approves it.",
          action: (
            <Button variant="secondary">
              <Plus aria-hidden="true" />
              Register a device
            </Button>
          ),
        }}
      />
    </Panel>
  ),
}

/** Loading: one line says what is on its way, the bones take the rows' shape. */
export const DataStateLoading: S = {
  render: () => (
    <Panel>
      <DataState state="loading" labels={{ loading: "Loading devices…" }} />
    </Panel>
  ),
}

/** The viewer's permissions do not include reading this. Say which permission and who can grant it. */
export const DataStateForbidden: S = {
  render: () => (
    <Panel title="API keys">
      <DataState state="forbidden" forbidden={{ description: "Reading API keys needs the apiKeys:read permission. A project admin or owner can grant it." }} />
    </Panel>
  ),
}

/** Inside a table or a filtered list: `size="inline"`, smaller and closer. A search with no match is empty, not an error. */
export const DataStateInline: S = {
  render: () => (
    <Panel count={0}>
      <DataState
        size="inline"
        state="empty"
        empty={{ icon: SearchX, title: "No devices match “gate 7”", action: <Button variant="ghost" size="sm">Clear search</Button> }}
      />
    </Panel>
  ),
}

/** In Traditional Chinese, through `dataStateLabels`; the error copy is keyed by the same codes. */
export const DataStateZhTw: S = {
  render: () => (
    <Panel title="設備" count={0}>
      <DataState state="error" error={{ code: "NETWORK_ERROR" }} onRetry={() => {}} labels={dataStateLabels} />
    </Panel>
  ),
}
