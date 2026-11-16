import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"

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

export const Stopped: S = {}
export const AfterStopAll: S = { args: { label: "Slide to release all", tag: "3 stopped" } }
export const LockedForViewers: S = { args: { locked: true } }
