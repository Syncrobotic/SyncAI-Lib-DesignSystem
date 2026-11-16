import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { SlideToRelease } from "@/registry/syncrobotic/blocks/slide-to-release"

const meta: Meta<typeof SlideToRelease> = {
  title: "外殼/滑動解除",
  component: SlideToRelease,
  args: { tag: "7F3A", onRelease: fn() },
  parameters: { docs: { description: { component: "往右拖：滑過 85% 放開即解除；沒過就回彈。鍵盤：按住 Enter 或空白鍵 2 秒。" } } },
}
export default meta
type S = StoryObj<typeof SlideToRelease>

export const 已停止: S = {}
export const 停止全部之後: S = { args: { label: "滑動解除全部", tag: "已停止 3 隻" } }
export const 檢視者鎖住: S = { args: { locked: true } }
