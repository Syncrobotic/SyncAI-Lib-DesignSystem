import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { heartbeatStripLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { HeartbeatStrip, type HeartbeatBucket, type HeartbeatEvent } from "@/registry/syncrobotic/ui/heartbeat-strip"

const meta: Meta = { title: "Charts/Heartbeat strip" }
export default meta
type S = StoryObj

const NOW = Date.UTC(2026, 10, 27, 6, 0, 0)
const min = 60_000
const tz = "Asia/Taipei"

/**
 * Sample check-ins for lm-hsinchu-01, one beat a minute, oldest first. `silent` and `patchy` are bucket indexes; `levels`
 * marks stretches where the device reported a problem. Deterministic, so screenshots never move.
 */
function sample(count: number, bucketMs: number, { silent = [] as number[], patchy = [] as number[], levels = {} as Record<number, Pick<HeartbeatBucket, "level" | "note">> } = {}) {
  const expected = Math.round(bucketMs / min)
  const start = NOW - count * bucketMs
  return Array.from({ length: count }, (_, i): HeartbeatBucket => ({
    at: start + i * bucketMs,
    expected,
    beats: silent.includes(i) ? 0 : patchy.includes(i) ? Math.round(expected * 0.5) : expected + (i % 10 === 3 ? 1 : 0),
    ...levels[i],
  }))
}

const windows = {
  "1h": { bucketMs: min, buckets: sample(60, min, { silent: [21, 22, 23, 24], patchy: [] }) },
  "24h": {
    bucketMs: 30 * min,
    buckets: sample(48, 30 * min, {
      silent: [18, 19, 20],
      patchy: [17, 21],
      levels: { 33: { level: "warning", note: "Disk 91 % full" }, 34: { level: "warning", note: "Disk 93 % full" } },
    }),
  },
  "7d": {
    bucketMs: 3 * 60 * min,
    buckets: sample(56, 3 * 60 * min, { silent: [12, 13, 40], patchy: [11, 41], levels: { 30: { level: "danger", note: "GPU 1 not responding" } } }),
  },
}
type Window = keyof typeof windows
const options = [
  { value: "1h", label: "1 h" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 d" },
]
const events: HeartbeatEvent[] = [
  { at: NOW - 13 * 60 * min - 20 * min, label: "Restarted" },
  { at: NOW - 13 * 60 * min - 12 * min, label: "Updated to 2.4.1" },
  { at: NOW - 4 * 24 * 60 * min, label: "Restarted" },
  { at: NOW - 30 * min, label: "Licence renewed" },
]

function Demo({ initial = "24h" as Window, defaultView = "chart" as "chart" | "table" }) {
  const [win, setWin] = React.useState<Window>(initial)
  const { buckets, bucketMs } = windows[win]
  return (
    <Card className="w-full max-w-3xl">
      <CardDataHeader title="Check-ins · lm-hsinchu-01" />
      <HeartbeatStrip
        buckets={buckets}
        bucketMs={bucketMs}
        events={events}
        windows={options}
        window={win}
        onWindowChange={(v) => setWin(v as Window)}
        defaultView={defaultView}
        timeZone={tz}
      />
    </Card>
  )
}

/** A day in half hours: a 90-minute gap after a restart and an update, two stretches with the disk nearly full, the rest grey. */
export const HeartbeatStripDay: S = { render: () => <Demo /> }

/** An hour, a minute per cell: one four-minute silence, said in words above the strip. */
export const HeartbeatStripHour: S = { render: () => <Demo initial="1h" /> }

/** A week in three-hour stretches; a GPU fault is the only red. */
export const HeartbeatStripWeek: S = { render: () => <Demo initial="7d" /> }

/** The table view: every stretch with its count, state and events, for reading without the picture. */
export const HeartbeatStripTable: S = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardDataHeader title="Check-ins · last 2 hours" />
      <HeartbeatStrip
        buckets={sample(8, 15 * min, { silent: [3], patchy: [4], levels: { 6: { level: "warning", note: "Degraded: 1 of 2 GPUs" } } })}
        bucketMs={15 * min}
        events={[{ at: NOW - 60 * min + 5 * min, label: "Restarted" }]}
        defaultView="table"
        timeZone={tz}
      />
    </Card>
  ),
}

/** In Traditional Chinese, through `heartbeatStripLabels` and `locale="zh-TW"`. */
export const HeartbeatStripZhTw: S = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardDataHeader title="心跳 · lm-hsinchu-01" />
      <HeartbeatStrip buckets={windows["24h"].buckets} bucketMs={30 * min} events={events} locale="zh-TW" timeZone={tz} labels={heartbeatStripLabels} />
    </Card>
  ),
}
