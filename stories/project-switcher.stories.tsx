import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { projectSwitcherLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { ProjectSwitcher, type SwitcherProject } from "@/registry/syncrobotic/ui/project-switcher"
import { Sidebar, SidebarHeader, SidebarProvider } from "@/registry/syncrobotic/ui/sidebar"

const meta: Meta = { title: "Navigation/Project switcher" }
export default meta
type S = StoryObj

const projects: SwitcherProject[] = [
  { id: "p1", name: "Taipei DC", detail: "8 devices" },
  { id: "p2", name: "Hsinchu lab", detail: "7 devices" },
  { id: "p3", name: "Kaohsiung port", detail: "3 devices" },
  { id: "p4", name: "Trial: Tainan", detail: "No devices" },
]

function Switcher(props: Partial<React.ComponentProps<typeof ProjectSwitcher>>) {
  const [current, setCurrent] = React.useState(projects[0]!)
  return (
    <div className="w-full max-w-64">
      <ProjectSwitcher projects={projects} current={current} recent={[projects[2]!, projects[1]!]} onSelect={setCurrent} onCreate={() => {}} onViewAll={() => {}} {...props} />
    </div>
  )
}

/** The trigger: the current project's mark and name. Click it, or Tab to it and press Enter. */
export const ProjectSwitcherDefault: S = { render: () => <Switcher /> }

/** Open: recent first, then all, View all and New project. Type to narrow. */
export const ProjectSwitcherOpen: S = {
  render: () => (
    <div className="min-h-96 w-full">
      <Switcher defaultOpen />
    </div>
  ),
}

/** In the sidebar's header slot, where it belongs: on the rail only the mark shows. */
export const ProjectSwitcherInSidebar: S = {
  render: () => (
    <SidebarProvider className="h-96 min-h-0">
      <Sidebar collapsible="none">
        <SidebarHeader>
          <ProjectSwitcher projects={projects} current={projects[0]} onSelect={() => {}} />
        </SidebarHeader>
      </Sidebar>
    </SidebarProvider>
  ),
}

/** Traditional Chinese labels. */
export const ProjectSwitcherZhTw: S = { render: () => <Switcher labels={projectSwitcherLabels} /> }
