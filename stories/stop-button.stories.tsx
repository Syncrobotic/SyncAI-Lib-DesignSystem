import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { StopButton, WakeButton } from "@/registry/syncrobotic/shell/stop-button"

const meta: Meta<typeof StopButton> = {
  title: "Shell/Emergency stop",
  component: StopButton,
  args: { tag: "7F3A", onStop: fn(), onStopAll: fn() },
}
export default meta
type S = StoryObj<typeof StopButton>

export const Ready: S = { args: { state: "ready" } }
export const StandingStill: S = { args: { state: "idle" } }
export const Sending: S = { args: { state: "sending" } }
export const Unconfirmed: S = { args: { state: "unconfirmed" } }
export const BluetoothOnly: S = { args: { state: "bluetooth" } }
export const DeliveredOverBluetooth: S = { args: { state: "bluetooth-sent" } }
export const NoConnection: S = { args: { state: "dead" } }
export const OneRobotOnly: S = { args: { state: "ready", tag: undefined, onStopAll: undefined } }

export const WakeWhileLyingDown: StoryObj<typeof WakeButton> = { render: () => <WakeButton onWake={fn()} /> }
export const BatteryTooLowToWake: StoryObj<typeof WakeButton> = { render: () => <WakeButton onWake={fn()} disabled /> }
