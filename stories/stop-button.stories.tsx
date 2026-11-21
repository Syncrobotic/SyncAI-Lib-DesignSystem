import type * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { StopButton, WakeButton } from "@/registry/syncrobotic/shell/stop-button"
import { States } from "./states"

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

// For the docs: the states above grouped by what they are about, so the page is four examples instead of ten.
const stop = (props: Partial<React.ComponentProps<typeof StopButton>>) => <StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} {...props} />

/** Ready, standing still, and a single robot (no tag, no stop-all). */
export const StopStates: S = {
  render: () => (
    <States
      items={[
        ["Standing still", stop({ state: "idle" })],
        ["One robot only", stop({ state: "ready", tag: undefined, onStopAll: undefined })],
      ]}
    />
  ),
}

/** What the stop says while the command travels: sending, unconfirmed, the Bluetooth fallback and no connection. */
export const ConnectionStates: S = {
  render: () => (
    <States
      items={[
        ["Sending", stop({ state: "sending" })],
        ["Unconfirmed", stop({ state: "unconfirmed" })],
        ["Bluetooth only", stop({ state: "bluetooth" })],
        ["Delivered over Bluetooth", stop({ state: "bluetooth-sent" })],
        ["No connection", stop({ state: "dead" })],
      ]}
    />
  ),
}

/** Lying down the stop becomes wake and stand up; a battery too low to stand says so. */
export const WakeStates: S = {
  render: () => (
    <States
      items={[
        ["Wake while lying down", <WakeButton key="w" onWake={fn()} />],
        ["Battery too low to wake", <WakeButton key="b" onWake={fn()} disabled />],
      ]}
    />
  ),
}
