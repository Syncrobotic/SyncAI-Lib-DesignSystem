import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { StopButton, WakeButton } from "@/registry/syncrobotic/blocks/stop-button"

const meta: Meta<typeof StopButton> = {
  title: "外殼/緊急停止",
  component: StopButton,
  args: { tag: "7F3A", onStop: fn(), onStopAll: fn() },
}
export default meta
type S = StoryObj<typeof StopButton>

export const 待命: S = { args: { state: "ready" } }
export const 站著沒動: S = { args: { state: "idle" } }
export const 送出中: S = { args: { state: "sending" } }
export const 未確認: S = { args: { state: "unconfirmed" } }
export const 只剩藍牙: S = { args: { state: "bluetooth" } }
export const 藍牙已送達: S = { args: { state: "bluetooth-sent" } }
export const 無法連線: S = { args: { state: "dead" } }
export const 單隻狗沒有停止全部: S = { args: { state: "ready", tag: undefined, onStopAll: undefined } }

export const 趴著時換成喚醒: StoryObj<typeof WakeButton> = { render: () => <WakeButton onWake={fn()} /> }
export const 電量不足不能喚醒: StoryObj<typeof WakeButton> = { render: () => <WakeButton onWake={fn()} disabled /> }
