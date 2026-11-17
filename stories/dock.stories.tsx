import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Bot, CircleAlert, House, ListChecks, Pause } from "lucide-react"
import { Dock, DockActions, DockNav, type NavItem } from "@/registry/syncrobotic/shell/dock"
import { StopButton, WakeButton } from "@/registry/syncrobotic/shell/stop-button"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"

const items: NavItem[] = [
  { key: "home", label: "Now", icon: House },
  { key: "events", label: "Events", icon: CircleAlert, badge: 2 },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "device", label: "Device", icon: Bot },
]
// Each example names its nav so a page showing several docks has unique landmarks.
const nav = (example: string) => <DockNav items={items} active="home" onSelect={fn()} label={`Primary, ${example}`} />

const meta: Meta = { title: "Shell/Dock" }
export default meta
type S = StoryObj

export const Moving: S = { render: () => <Dock className="static" state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />} nav={nav("moving")} /> }
export const StandingStill: S = {
  render: () => <Dock className="static" state={<StopButton state="idle" tag="7F3A" onStop={fn()} />} nav={nav("standing still")} />,
}
export const LyingDown: S = { render: () => <Dock className="static" state={<WakeButton onWake={fn()} />} nav={nav("lying down")} /> }
export const Stopped: S = { render: () => <Dock className="static" state={<SlideToRelease tag="7F3A" onRelease={fn()} />} nav={nav("stopped")} /> }
export const ThreeTiersWithPageAction: S = {
  render: () => (
    <Dock
      className="static"
      state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
      action={<DockActions secondary={{ label: "End task", onClick: fn() }} primary={{ label: "Resume task", onClick: fn() }} />}
      nav={nav("three tiers")}
    />
  ),
}
export const PushedPage: S = {
  render: () => (
    <Dock
      className="static"
      state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
      nav={<DockActions secondary={{ label: "Pause", onClick: fn(), icon: Pause }} primary={{ label: "End task", onClick: fn() }} />}
    />
  ),
}
export const DestructiveConfirm: S = {
  render: () => (
    <Dock
      className="static"
      state={<StopButton tag="7F3A" onStop={fn()} />}
      nav={<DockActions secondary={{ label: "Cancel", onClick: fn() }} primary={{ label: "Delete 38 GB of video", onClick: fn() }} destructive />}
    />
  ),
}
