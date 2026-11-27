import type { Meta, StoryObj } from "@storybook/react-vite"
import { desiredStateLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DesiredState } from "@/registry/syncrobotic/ui/desired-state"
import type { FreshnessThresholds } from "@/registry/syncrobotic/ui/freshness-stamp"

const meta: Meta = { title: "Status and values/Desired state" }
export default meta
type S = StoryObj

const NOW = Date.UTC(2026, 10, 27, 6, 2, 0)
const min = 60_000
const thresholds: FreshnessThresholds = { laggingAfterMs: 2 * min, staleAfterMs: 10 * min }
const tz = "Asia/Taipei"
const common = { thresholds, now: NOW, timeZone: tz, overdueAfterMs: 15 * min }

/** Revoking is not revoked: the order is signed, the device last reported its modules running, and it checks in every minute. */
export const DesiredStatePending: S = {
  render: () => (
    <div className="w-full max-w-xl">
      <DesiredState {...common} desired="Revoked: every module off" reported="Running 4 licensed modules" orderedAt={NOW - 1 * min} lastCheckInAt={NOW - 30_000} />
    </div>
  ),
}

/** Past `overdueAfterMs` and still not confirmed, while check-ins arrive: the one case that takes colour, with a way out. */
export const DesiredStateOverdue: S = {
  render: () => (
    <div className="w-full max-w-xl">
      <DesiredState {...common} desired="Removed from the project" reported="Enrolled, running 4 modules" orderedAt={NOW - 3 * 60 * min} lastCheckInAt={NOW - 40_000}>
        <Button variant="secondary">Cancel removal</Button>
      </DesiredState>
    </div>
  ),
}

/** No check-in can carry it: the device stopped reporting (past the stale threshold), or `blocked` with the product's reason. */
export const DesiredStateBlocked: S = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <DesiredState {...common} desired="Revoked: every module off" reported="Running 4 licensed modules" orderedAt={NOW - 20 * min} lastCheckInAt={NOW - 2 * 60 * min} />
      <DesiredState
        {...common}
        desired="Revoked: every module off"
        reported="Running 4 licensed modules"
        orderedAt={NOW - 5 * min}
        lastCheckInAt={NOW - 3 * min}
        blocked
        blockedReason="Check-ins from this device are refused while it is suspended, and the revocation travels on one. Resume the device to let it arrive."
      />
    </div>
  ),
}

/** Air-gapped: it never checks in, so the order waits for the signed file to be applied by hand. Not a fault, never coloured. */
export const DesiredStateAirGapped: S = {
  render: () => (
    <div className="w-full max-w-xl">
      <DesiredState {...common} overdueAfterMs={undefined} airGapped desired="Licence renewed to Dec 31, 2027" reported="Licence until Dec 31, 2026" orderedAt={NOW - 2 * 24 * 60 * min} />
    </div>
  ),
}

/** The device reported it: the order is in effect, and the believed side is gone. */
export const DesiredStateInEffect: S = {
  render: () => (
    <div className="w-full max-w-xl">
      <DesiredState {...common} inEffect desired="Revoked: every module off" reported="No modules running" orderedAt={NOW - 3 * min} lastCheckInAt={NOW - 20_000} />
    </div>
  ),
}

/** In Traditional Chinese, through `desiredStateLabels` and `locale="zh-TW"`. */
export const DesiredStateZhTw: S = {
  render: () => (
    <div className="w-full max-w-xl">
      <DesiredState {...common} locale="zh-TW" labels={desiredStateLabels} desired="撤銷：關閉所有模組" reported="正在執行 4 個授權模組" orderedAt={NOW - 1 * min} lastCheckInAt={NOW - 30_000} />
    </div>
  ),
}
