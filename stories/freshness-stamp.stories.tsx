import type { Meta, StoryObj } from "@storybook/react-vite"
import { freshnessStampLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { FreshnessStamp, type FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const meta: Meta = { title: "Status and values/Freshness stamp" }
export default meta
type S = StoryObj

// A fixed clock, so every render and screenshot reads the same ages.
const NOW = Date.UTC(2026, 10, 27, 6, 2, 0)
const min = 60_000
// The server's liveness: a device beats every minute; two missed beats is lagging, ten is offline.
const thresholds: FreshnessThresholds = { laggingAfterMs: 2 * min, staleAfterMs: 10 * min }
const tz = "Asia/Taipei"

const devices = [
  { name: "lm-hsinchu-01", where: "Hsinchu plant, line 2", lastAt: NOW - 40_000 },
  { name: "lm-taoyuan-03", where: "Taoyuan depot", lastAt: NOW - 6 * min },
  { name: "lm-taichung-02", where: "Taichung lab", lastAt: NOW - 26 * 60 * min },
  { name: "lm-tainan-01", where: "Tainan office, registered today", lastAt: null },
  { name: "lm-kaohsiung-07", where: "Kaohsiung secure site", lastAt: null, airGapped: true },
]

/** Every level on a device list: live, lagging and stale say the age; never reported and air-gapped are quiet, not faults. */
export const FreshnessStampLevels: S = {
  render: () => (
    <Card className="w-full max-w-md gap-3">
      <SectionHeader variant="surface" title="Devices" count={devices.length} />
      <ul className="flex flex-col divide-y divide-border">
        {devices.map((d) => (
          <li key={d.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground">{d.where}</span>
            </span>
            <FreshnessStamp lastAt={d.lastAt} airGapped={d.airGapped} thresholds={thresholds} now={NOW} timeZone={tz} />
          </li>
        ))}
      </ul>
    </Card>
  ),
}

/** Beside what the device reported: the stamp says the numbers are a snapshot, and here an old one. The server's `offline` verdict wins. */
export const FreshnessStampBesideValues: S = {
  render: () => (
    <Card className="w-full max-w-md gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeader variant="surface" title="Reported by lm-taichung-02" />
        <FreshnessStamp lastAt={NOW - 26 * 60 * min} thresholds={thresholds} offline now={NOW} timeZone={tz} />
      </div>
      <DescriptionList
        variant="bare"
        columns={2}
        items={[
          { label: "Modules running", value: "7" },
          { label: "GPU", value: "2 × L40S" },
          { label: "Disk free", value: "412 GB" },
          { label: "Errors", value: "0" },
        ]}
      />
    </Card>
  ),
}

/** Quiet while live with `hideWhenLive`, the icon alone with `variant="icon"` where the age is already said once nearby. */
export const FreshnessStampIconAndHidden: S = {
  render: () => (
    <Card className="w-full max-w-md gap-3">
      <SectionHeader variant="surface" title="Two devices" />
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center justify-between gap-4">
          lm-hsinchu-01, live: nothing shown
          <FreshnessStamp lastAt={NOW - 40_000} thresholds={thresholds} now={NOW} hideWhenLive timeZone={tz} />
        </li>
        <li className="flex items-center justify-between gap-4">
          lm-taoyuan-03, lagging
          <FreshnessStamp lastAt={NOW - 6 * min} thresholds={thresholds} now={NOW} variant="icon" timeZone={tz} />
        </li>
      </ul>
    </Card>
  ),
}

/** A device clock running ahead: a report "from the future" is live, said as this minute, never as a fault. */
export const FreshnessStampClockAhead: S = {
  render: () => <FreshnessStamp lastAt={NOW + 3 * min} thresholds={thresholds} now={NOW} timeZone={tz} />,
}

/** In Traditional Chinese, through `freshnessStampLabels` and `locale="zh-TW"`: Intl writes the age. */
export const FreshnessStampZhTw: S = {
  render: () => (
    <ul className="flex flex-col gap-2">
      {devices.map((d) => (
        <li key={d.name}>
          <FreshnessStamp lastAt={d.lastAt} airGapped={d.airGapped} thresholds={thresholds} now={NOW} locale="zh-TW" timeZone={tz} labels={freshnessStampLabels} />
        </li>
      ))}
    </ul>
  ),
}
