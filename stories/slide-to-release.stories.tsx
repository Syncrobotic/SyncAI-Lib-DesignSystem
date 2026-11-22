import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { States } from "./states"

const meta: Meta<typeof SlideToRelease> = {
  title: "Shell/Slide to release",
  component: SlideToRelease,
  args: { tag: "7F3A", onRelease: fn() },
  parameters: {
    docs: {
      description: {
        component: "Drag right: let go past 85% to release; short of that it springs back. Keyboard: hold Enter or Space for 2 s.",
      },
    },
  },
}
export default meta
type S = StoryObj<typeof SlideToRelease>

/** Try it: after a release it waits on Releasing… for a moment, as for the robot's reply, then comes back stopped. */
function TryIt(props: React.ComponentProps<typeof SlideToRelease>) {
  const [round, setRound] = React.useState(0)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <SlideToRelease
      key={round}
      {...props}
      onRelease={() => {
        props.onRelease()
        timer.current = window.setTimeout(() => setRound((r) => r + 1), 2000)
      }}
    />
  )
}

export const Stopped: S = { render: (args) => <TryIt {...args} /> }
export const AfterStopAll: S = { args: { label: "Slide to release all", tag: "3 stopped" } }
export const LockedForViewers: S = { args: { locked: true } }
export const Releasing: S = { args: { releasing: true } }
export const NotReleased: S = { args: { failed: true } }

/** For the docs: the other states side by side: after a stop-all, locked for viewers, waiting for the robot, and failed. */
export const ReleaseStates: S = {
  render: () => (
    <States
      items={[
        ["After stop all", <SlideToRelease key="a" onRelease={fn()} label="Slide to release all" tag="3 stopped" />],
        ["Locked for viewers", <SlideToRelease key="l" onRelease={fn()} tag="7F3A" locked />],
        ["Releasing, waiting for the robot", <SlideToRelease key="r" onRelease={fn()} tag="7F3A" releasing />],
        ["Not released", <SlideToRelease key="f" onRelease={fn()} tag="7F3A" failed />],
      ]}
    />
  ),
}
