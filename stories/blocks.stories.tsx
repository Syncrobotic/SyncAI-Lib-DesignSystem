import type { Meta, StoryObj } from "@storybook/react"
import { FleetTable } from "@/registry/syncrobotic/sections/fleet-table"
import { MarketingHero } from "@/registry/syncrobotic/sections/marketing-hero"
import { RobotStatusCard } from "@/registry/syncrobotic/sections/robot-status-card"
import { StatsCards } from "@/registry/syncrobotic/sections/stats-cards"

// Blocks render at phone width here, like every story; the docs site shows them at all widths.
const meta: Meta = { title: "Blocks" }
export default meta
type S = StoryObj

export const KpiCards: S = { render: () => <StatsCards /> }
export const FleetTableDefault: S = { render: () => <FleetTable /> }
export const RobotStatus: S = { render: () => <RobotStatusCard /> }
export const RobotStatusLowBattery: S = {
  render: () => (
    <RobotStatusCard
      robot={{
        name: "Patrol dog 9C44",
        state: { tone: "warning", label: "Low battery" },
        battery: 18,
        online: true,
        signal: "Weak",
        location: "Parking lot · 340 m from dock",
      }}
    />
  ),
}
export const Hero: S = { render: () => <MarketingHero /> }
