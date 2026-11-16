import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Bot, CircleAlert, House, ListChecks, Pause } from "lucide-react"
import { Dock, DockActions, DockNav, type NavItem } from "@/registry/syncrobotic/blocks/dock"
import { StopButton, WakeButton } from "@/registry/syncrobotic/blocks/stop-button"
import { SlideToRelease } from "@/registry/syncrobotic/blocks/slide-to-release"

const items: NavItem[] = [
  { key: "home", label: "現況", icon: House },
  { key: "events", label: "事件", icon: CircleAlert, badge: 2 },
  { key: "tasks", label: "任務", icon: ListChecks },
  { key: "device", label: "設備", icon: Bot },
]
const nav = <DockNav items={items} active="home" onSelect={fn()} />

const meta: Meta = { title: "外殼/底座" }
export default meta
type S = StoryObj

export const 會動: S = { render: () => <Dock className="static" state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />} nav={nav} /> }
export const 站著沒動: S = { render: () => <Dock className="static" state={<StopButton state="idle" tag="7F3A" onStop={fn()} />} nav={nav} /> }
export const 趴著: S = { render: () => <Dock className="static" state={<WakeButton onWake={fn()} />} nav={nav} /> }
export const 已停止: S = { render: () => <Dock className="static" state={<SlideToRelease tag="7F3A" onRelease={fn()} />} nav={nav} /> }
export const 三層_這頁的主要動作: S = {
  render: () => (
    <Dock
      className="static"
      state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
      action={<DockActions secondary={{ label: "結束任務", onClick: fn() }} primary={{ label: "繼續任務", onClick: fn() }} />}
      nav={nav}
    />
  ),
}
export const 下一層頁面: S = {
  render: () => (
    <Dock
      className="static"
      state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
      nav={<DockActions secondary={{ label: "暫停", onClick: fn(), icon: Pause }} primary={{ label: "結束任務", onClick: fn() }} />}
    />
  ),
}
export const 破壞性確認: S = {
  render: () => (
    <Dock className="static" state={<StopButton tag="7F3A" onStop={fn()} />} nav={<DockActions secondary={{ label: "取消", onClick: fn() }} primary={{ label: "清除 38 GB 影像", onClick: fn() }} destructive />} />
  ),
}
