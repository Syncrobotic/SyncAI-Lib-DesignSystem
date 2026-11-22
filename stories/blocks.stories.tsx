import type { Meta, StoryObj } from "@storybook/react-vite"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { MarketingHero } from "@/registry/syncrobotic/blocks/marketing-hero"
import { NotificationCenter, NotificationPanel, sampleNotifications, sampleNow } from "@/registry/syncrobotic/blocks/notification-center"
import { RobotStatusCard } from "@/registry/syncrobotic/blocks/robot-status-card"
import { SettingsBilling, sampleBilling, sampleBillingTwd } from "@/registry/syncrobotic/blocks/settings-billing"
import { StatsCards } from "@/registry/syncrobotic/blocks/stats-cards"

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
        battery: 14,
        online: true,
        signal: "Weak",
        location: "Parking lot · 340 m from dock",
      }}
    />
  ),
}
export const Hero: S = { render: () => <MarketingHero /> }

// Notification center: the bell (click to open), the open panel for visual tests, then the panel's states on their own.
const clock = { now: sampleNow, timeZone: "Asia/Taipei" }
const panelFrame = (panel: React.ReactNode) => <div className="m-4 flex max-w-96 flex-col rounded-md bg-popover p-4 shadow-overlay ring-1 ring-border">{panel}</div>
const noop = () => {}
export const NotificationCenterBell: S = {
  render: () => (
    <div className="flex justify-end p-4">
      <NotificationCenter {...clock} settingsHref="#settings/notifications" />
    </div>
  ),
}
export const NotificationCenterOpen: S = {
  render: () => (
    <div className="flex justify-end p-4">
      <NotificationCenter {...clock} defaultOpen focusOnOpen={false} settingsHref="#settings/notifications" />
    </div>
  ),
}
export const NotificationCenterAllCaughtUp: S = {
  render: () => panelFrame(<NotificationPanel {...clock} notifications={sampleNotifications.map((n) => ({ ...n, read: true }))} onMarkRead={noop} />),
}
export const NotificationCenterEmpty: S = { render: () => panelFrame(<NotificationPanel {...clock} notifications={[]} onMarkRead={noop} />) }
export const NotificationCenterLoading: S = { render: () => panelFrame(<NotificationPanel {...clock} notifications={[]} onMarkRead={noop} status="loading" />) }
export const NotificationCenterError: S = {
  render: () => panelFrame(<NotificationPanel {...clock} notifications={[]} onMarkRead={noop} status="error" onRetry={noop} />),
}

// Plan and billing: the same account in US and New Taiwan dollars, then its states.
export const SettingsBillingDefault: S = { render: () => <SettingsBilling /> }
export const SettingsBillingTwd: S = { render: () => <SettingsBilling account={sampleBillingTwd} currency="TWD" /> }
export const SettingsBillingNoInvoices: S = {
  render: () => <SettingsBilling account={{ ...sampleBilling, payment: undefined, invoices: [] }} />,
}
export const SettingsBillingLoading: S = { render: () => <SettingsBilling status="loading" /> }
export const SettingsBillingError: S = { render: () => <SettingsBilling status="error" onRetry={() => {}} /> }
