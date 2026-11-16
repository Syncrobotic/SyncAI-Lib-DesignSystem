import registry from "../registry.json"
import { FleetTable } from "@/registry/syncrobotic/sections/fleet-table"
import { MarketingHero } from "@/registry/syncrobotic/sections/marketing-hero"
import { RobotStatusCard } from "@/registry/syncrobotic/sections/robot-status-card"
import { StatsCards } from "@/registry/syncrobotic/sections/stats-cards"

// Blocks are composed sections. Each renders alone at /preview/<name> so the docs can frame it at any width.
type Meta = { product: "Dashboard" | "Control app" | "Marketing"; viewport: "desktop" | "mobile"; height: number; render: () => React.ReactNode }

const meta: Record<string, Meta> = {
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
