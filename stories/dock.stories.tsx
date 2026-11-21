import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { Bot, CircleAlert, House, ListChecks, Pause } from "lucide-react"
import { Dock, DockActions, DockNav, type NavItem } from "@/registry/syncrobotic/shell/dock"
import { StopButton, WakeButton } from "@/registry/syncrobotic/shell/stop-button"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { States } from "./states"

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

/** For the docs: the dock's top tier in each robot state, side by side. */
export const DockRobotStates: S = {
  render: () => (
    <States
      items={[
        ["Standing still", <Dock key="s" className="static" state={<StopButton state="idle" tag="7F3A" onStop={fn()} />} nav={nav("standing still")} />],
        ["Lying down", <Dock key="l" className="static" state={<WakeButton onWake={fn()} />} nav={nav("lying down")} />],
        ["Stopped", <Dock key="t" className="static" state={<SlideToRelease tag="7F3A" onRelease={fn()} />} nav={nav("stopped")} />],
      ]}
    />
  ),
}

/** For the docs: the middle tier, a page's own actions, and a pushed page or a destructive confirm in its place. */
export const DockActionStates: S = {
  render: () => (
    <States
      items={[
        [
          "Three tiers with a page action",
          <Dock
            key="a"
            className="static"
            state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
            action={<DockActions secondary={{ label: "End task", onClick: fn() }} primary={{ label: "Resume task", onClick: fn() }} />}
            nav={nav("three tiers")}
          />,
        ],
        [
          "Pushed page",
          <Dock
            key="p"
            className="static"
            state={<StopButton tag="7F3A" onStop={fn()} onStopAll={fn()} />}
            nav={<DockActions secondary={{ label: "Pause", onClick: fn(), icon: Pause }} primary={{ label: "End task", onClick: fn() }} />}
          />,
        ],
        [
          "Destructive confirm",
          <Dock
            key="d"
            className="static"
            state={<StopButton tag="7F3A" onStop={fn()} />}
            nav={<DockActions secondary={{ label: "Cancel", onClick: fn() }} primary={{ label: "Delete 38 GB of video", onClick: fn() }} destructive />}
          />,
        ],
      ]}
    />
  ),
}
