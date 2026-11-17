import registry from "../registry.json"
import { placement } from "./block-types"
import { AppShellDemo } from "./app-shell-demo"
import { TopBarShellDemo } from "./top-bar-shell-demo"
import { SignIn } from "@/registry/syncrobotic/blocks/sign-in"
import { ErrorPage, LoadingPage, NoAccessPage, NotFoundPage, OfflinePage } from "@/registry/syncrobotic/blocks/status-pages"
import { RecordForm } from "@/registry/syncrobotic/blocks/record-form"
import { SettingsPage } from "@/registry/syncrobotic/blocks/settings-page"
import { UsersRoles } from "@/registry/syncrobotic/blocks/users-roles"
import { DataCatalog } from "@/registry/syncrobotic/blocks/data-catalog"
import { DatasetDetail } from "@/registry/syncrobotic/blocks/dataset-detail"
import { GovernanceTodo } from "@/registry/syncrobotic/blocks/governance-todo"
import { ConsoleOverview } from "@/registry/syncrobotic/blocks/console-overview"
import { EventLog } from "@/registry/syncrobotic/blocks/event-log"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { MapWorkspace } from "@/registry/syncrobotic/blocks/map-workspace"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { MarketingHero } from "@/registry/syncrobotic/blocks/marketing-hero"
import { RobotStatusCard } from "@/registry/syncrobotic/blocks/robot-status-card"
import { StatsCards } from "@/registry/syncrobotic/blocks/stats-cards"

// Blocks are composed sections. Each renders alone at /preview/<name> so the docs can frame it at any width.
type Meta = {
  viewport: "desktop" | "mobile"
  /** Starting height. Sections then grow or shrink to their content; app shells fill this height like a screen. */
  height: number
  render: () => React.ReactNode
}

const meta: Record<string, Meta> = {
  // App shells: whole screens for internal engineering tools. Install one, replace the sample data, and you have a prototype.
  "app-shell": {
    viewport: "desktop",
    height: 720,
    render: () => <AppShellDemo />,
  },
  // Data tools: internal tools for datasets, after DataCore. Same shell, same rules.
  "data-catalog": { viewport: "desktop", height: 760, render: () => <DataCatalog /> },
  "dataset-detail": { viewport: "desktop", height: 820, render: () => <DatasetDetail /> },
  "governance-todo": { viewport: "desktop", height: 600, render: () => <GovernanceTodo /> },
  "settings-page": { viewport: "desktop", height: 820, render: () => <SettingsPage /> },
  "record-form": { viewport: "desktop", height: 820, render: () => <RecordForm /> },
  "users-roles": { viewport: "desktop", height: 620, render: () => <UsersRoles /> },
  "sign-in": { viewport: "desktop", height: 640, render: () => <SignIn /> },
  "status-pages": {
    viewport: "desktop",
    height: 640,
    render: () => (
      // The four states side by side, each in a frame the size of a content panel, then loading across the width.
      <div className="flex flex-col gap-4 bg-background p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[NotFoundPage, NoAccessPage, ErrorPage, OfflinePage].map((Page, i) => (
            <div key={i} className="overflow-hidden rounded-md ring-1 ring-border">
              <Page fill="parent" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-md ring-1 ring-border">
          <LoadingPage fill="parent" />
        </div>
      </div>
    ),
  },
  "top-bar-shell": { viewport: "desktop", height: 720, render: () => <TopBarShellDemo /> },
  "console-overview": { viewport: "desktop", height: 900, render: () => <ConsoleOverview /> },
  "list-detail": { viewport: "desktop", height: 720, render: () => <ListDetail /> },
  "event-log": { viewport: "desktop", height: 720, render: () => <EventLog /> },
  "map-workspace": { viewport: "desktop", height: 720, render: () => <MapWorkspace /> },

  "stats-cards": {
    viewport: "desktop",
    height: 520,
    render: () => (
      <div className="p-6">
        <StatsCards />
      </div>
    ),
  },
  "fleet-table": {
    viewport: "desktop",
    height: 640,
    render: () => (
      <div className="p-6">
        <FleetTable />
      </div>
    ),
  },
  "robot-status-card": {
    viewport: "mobile",
    height: 640,
    render: () => (
      <div className="flex justify-center p-4">
        <RobotStatusCard />
      </div>
    ),
  },
  "marketing-hero": { viewport: "desktop", height: 760, render: () => <MarketingHero /> },
}

export const blocks = Object.keys(placement)
  .map((name) => registry.items.find((i) => i.type === "registry:block" && i.name === name))
  .filter((i): i is NonNullable<typeof i> => !!i && i.name in meta)
  .map((i) => ({ ...i, ...meta[i.name], ...placement[i.name] }))

export const getBlock = (name: string) => blocks.find((b) => b.name === name)
export const blocksOfType = (slug: string) => blocks.filter((b) => b.type === slug)
