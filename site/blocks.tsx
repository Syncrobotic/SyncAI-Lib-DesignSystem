import registry from "../registry.json"
import { AppShellDemo } from "./app-shell-demo"
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
export const products = ["App shells", "Data tools", "Dashboard", "Control app", "Marketing"] as const
type Meta = {
  product: (typeof products)[number]
  viewport: "desktop" | "mobile"
  /** Starting height. Sections then grow or shrink to their content; app shells fill this height like a screen. */
  height: number
  render: () => React.ReactNode
}

const meta: Record<string, Meta> = {
  // App shells: whole screens for internal engineering tools. Install one, replace the sample data, and you have a prototype.
  "app-shell": {
    product: "App shells",
    viewport: "desktop",
    height: 720,
    render: () => <AppShellDemo />,
  },
  // Data tools: internal tools for datasets, after DataCore. Same shell, same rules.
  "data-catalog": { product: "Data tools", viewport: "desktop", height: 760, render: () => <DataCatalog /> },
  "dataset-detail": { product: "Data tools", viewport: "desktop", height: 820, render: () => <DatasetDetail /> },
  "governance-todo": { product: "Data tools", viewport: "desktop", height: 600, render: () => <GovernanceTodo /> },
  "console-overview": { product: "App shells", viewport: "desktop", height: 900, render: () => <ConsoleOverview /> },
  "list-detail": { product: "App shells", viewport: "desktop", height: 720, render: () => <ListDetail /> },
  "event-log": { product: "App shells", viewport: "desktop", height: 720, render: () => <EventLog /> },
  "map-workspace": { product: "App shells", viewport: "desktop", height: 720, render: () => <MapWorkspace /> },

  "stats-cards": {
    product: "Dashboard",
    viewport: "desktop",
    height: 520,
    render: () => (
      <div className="p-6">
        <StatsCards />
      </div>
    ),
  },
  "fleet-table": {
    product: "Dashboard",
    viewport: "desktop",
    height: 640,
    render: () => (
      <div className="p-6">
        <FleetTable />
      </div>
    ),
  },
  "robot-status-card": {
    product: "Control app",
    viewport: "mobile",
    height: 640,
    render: () => (
      <div className="flex justify-center p-4">
        <RobotStatusCard />
      </div>
    ),
  },
  "marketing-hero": { product: "Marketing", viewport: "desktop", height: 760, render: () => <MarketingHero /> },
}

export const blocks = registry.items
  .filter((i) => i.type === "registry:block" && i.name in meta)
  .map((i) => ({ ...i, ...meta[i.name] }))

export const getBlock = (name: string) => blocks.find((b) => b.name === name)
