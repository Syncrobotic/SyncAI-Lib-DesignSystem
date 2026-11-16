import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Bluetooth, Check, CircleAlert, Square, Zap } from "lucide-react"
import { Island, IslandNotice } from "@/registry/syncrobotic/blocks/island"

const meta: Meta<typeof Island> = {
  title: "外殼/動態島",
  component: Island,
  args: { name: "巡邏犬 7F3A", tone: "info", unread: 2, className: "static" },
}
export default meta
type S = StoryObj<typeof Island>

export const 平常: S = {}
export const 其他狗有狀況: S = { args: { attention: true } }
export const 低電量: S = { args: { battery: 18 } }
export const 載入中: S = { args: { loading: true, tone: "neutral", unread: 0 } }
export const 一般通知: S = { args: { children: <IslandNotice tone="success" icon={Check} title="停車場巡檢已儲存" meta="下次 11/16 02:00" onDismiss={fn()} /> } }
export const 可以反悔: S = {
  args: { children: <IslandNotice tone="info" icon={Zap} title="機器狗正在返回充電座" meta="7F3A · 剛剛" action={{ label: "取消", onClick: fn() }} onDismiss={fn()} /> },
}
export const 失敗不自動消失: S = {
  args: { children: <IslandNotice tone="danger" icon={CircleAlert} title="沒有派出：連線中斷" meta="2B10 沒有收到指令" action={{ label: "重試", onClick: fn() }} emphasis onDismiss={fn()} /> },
}
export const 只剩藍牙_持續: S = {
  args: { tone: "neutral", online: false, edge: "warning", children: <IslandNotice tone="warning" icon={Bluetooth} title="只剩藍牙連線" meta="仍可緊急停止與查看設備" action={{ label: "重試", onClick: fn() }} persistent /> },
}
export const 已緊急停止_持續: S = {
  args: { tone: "danger", edge: "danger", children: <IslandNotice tone="danger" icon={Square} title="夜班 · Pixel 8 觸發了緊急停止" meta="7F3A · 21:08" persistent /> },
}
