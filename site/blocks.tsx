import registry from "../registry.json"
import { placement } from "./block-types"
import type { ThumbView } from "./block-thumb"
import { AppShellDemo } from "./app-shell-demo"
import { TopBarShellDemo } from "./top-bar-shell-demo"
import { ActionRailShellDemo } from "./action-rail-shell-demo"
import { SignIn } from "@/registry/syncrobotic/blocks/sign-in"
import { ErrorPage, LoadingPage, NoAccessPage, NotFoundPage, OfflinePage } from "@/registry/syncrobotic/blocks/status-pages"
import { RecordForm } from "@/registry/syncrobotic/blocks/record-form"
import { SettingsPage } from "@/registry/syncrobotic/blocks/settings-page"
import { UsersRoles } from "@/registry/syncrobotic/blocks/users-roles"
import { DataCatalog } from "@/registry/syncrobotic/blocks/data-catalog"
import { DatasetDetail } from "@/registry/syncrobotic/blocks/dataset-detail"
import { GovernanceTodo } from "@/registry/syncrobotic/blocks/governance-todo"
import { ReviewQueue } from "@/registry/syncrobotic/blocks/review-queue"
import { ConsoleOverview } from "@/registry/syncrobotic/blocks/console-overview"
import { EventLog } from "@/registry/syncrobotic/blocks/event-log"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { MapWorkspace } from "@/registry/syncrobotic/blocks/map-workspace"
import { FleetTable } from "@/registry/syncrobotic/blocks/fleet-table"
import { MarketingHero } from "@/registry/syncrobotic/blocks/marketing-hero"
import { RobotStatusCard } from "@/registry/syncrobotic/blocks/robot-status-card"
import { StatsCards } from "@/registry/syncrobotic/blocks/stats-cards"
import { LineChartTelemetry } from "@/registry/syncrobotic/blocks/line-chart-telemetry"
import { LineChartLimit } from "@/registry/syncrobotic/blocks/line-chart-limit"
import { LineChartCompare } from "@/registry/syncrobotic/blocks/line-chart-compare"
import { AreaChartBattery } from "@/registry/syncrobotic/blocks/area-chart-battery"
import { AreaChartFleetStates } from "@/registry/syncrobotic/blocks/area-chart-fleet-states"
import { AreaChartCumulative } from "@/registry/syncrobotic/blocks/area-chart-cumulative"
import { BarChartMissions } from "@/registry/syncrobotic/blocks/bar-chart-missions"
import { BarChartRanked } from "@/registry/syncrobotic/blocks/bar-chart-ranked"
import { BarChartStacked } from "@/registry/syncrobotic/blocks/bar-chart-stacked"
import { BarChartVariance } from "@/registry/syncrobotic/blocks/bar-chart-variance"
import { SparklineRobotList } from "@/registry/syncrobotic/blocks/sparkline-robot-list"
import { SparklineMetricTiles } from "@/registry/syncrobotic/blocks/sparkline-metric-tiles"
import { SparklineTable } from "@/registry/syncrobotic/blocks/sparkline-table"
import { StatusTrackerUptime } from "@/registry/syncrobotic/blocks/status-tracker-uptime"
import { StatusTrackerRuns } from "@/registry/syncrobotic/blocks/status-tracker-runs"
import { StatusTrackerRollout } from "@/registry/syncrobotic/blocks/status-tracker-rollout"
import { RadialChartBattery } from "@/registry/syncrobotic/blocks/radial-chart-battery"
import { RadialChartGoal } from "@/registry/syncrobotic/blocks/radial-chart-goal"
import { RadialChartCapacity } from "@/registry/syncrobotic/blocks/radial-chart-capacity"
import { HeatmapWeekHours } from "@/registry/syncrobotic/blocks/heatmap-week-hours"
import { HeatmapZones } from "@/registry/syncrobotic/blocks/heatmap-zones"
import { AppShellMobileTabs } from "@/registry/syncrobotic/blocks/app-shell-mobile-tabs"
import { StatsMeters } from "@/registry/syncrobotic/blocks/stats-meters"
import { StatsFiltered } from "@/registry/syncrobotic/blocks/stats-filtered"
import { CardSite } from "@/registry/syncrobotic/blocks/card-site"
import { CardMission } from "@/registry/syncrobotic/blocks/card-mission"
import { AuthPasskey } from "@/registry/syncrobotic/blocks/auth-passkey"
import { AuthInvite } from "@/registry/syncrobotic/blocks/auth-invite"
import { AuthTwoFactor } from "@/registry/syncrobotic/blocks/auth-2fa"
import { SettingsNotifications } from "@/registry/syncrobotic/blocks/settings-notifications"
import { SettingsApiKeys } from "@/registry/syncrobotic/blocks/settings-api-keys"
import { SettingsBilling } from "@/registry/syncrobotic/blocks/settings-billing"
import { NotificationCenterDemo } from "./notification-center-demo"
import { SettingsWebhooks } from "@/registry/syncrobotic/blocks/settings-webhooks"
import { SettingsSessions } from "@/registry/syncrobotic/blocks/settings-sessions"
import { DialogConfirmDestructive } from "@/registry/syncrobotic/blocks/dialog-confirm-destructive"
import { DialogForm } from "@/registry/syncrobotic/blocks/dialog-form"
import { DialogShare } from "@/registry/syncrobotic/blocks/dialog-share"
import { SheetRobotDetail } from "@/registry/syncrobotic/blocks/sheet-robot-detail"
import { SheetFilters } from "@/registry/syncrobotic/blocks/sheet-filters"
import { TimelineActivity } from "@/registry/syncrobotic/blocks/timeline-activity"
import { TimelineAudit } from "@/registry/syncrobotic/blocks/timeline-audit"
import { WizardCommission } from "@/registry/syncrobotic/blocks/wizard-commission"
import { WizardImport } from "@/registry/syncrobotic/blocks/wizard-import"
import { MissionSchedule } from "@/registry/syncrobotic/blocks/mission-schedule"
import { UsersInvitations } from "@/registry/syncrobotic/blocks/users-invitations"
import { UsersAuditLog } from "@/registry/syncrobotic/blocks/users-audit-log"
import { IncidentQueue } from "@/registry/syncrobotic/blocks/incident-queue"
import { IncidentDetail } from "@/registry/syncrobotic/blocks/incident-detail"
import { MaintenanceDue } from "@/registry/syncrobotic/blocks/maintenance-due"
import { MaintenanceWorkOrder } from "@/registry/syncrobotic/blocks/maintenance-work-order"
import { RolloutOverview } from "@/registry/syncrobotic/blocks/rollout-overview"
import { RolloutPlan } from "@/registry/syncrobotic/blocks/rollout-plan"
import { AgentRuns } from "@/registry/syncrobotic/blocks/agent-runs"
import { AgentTrace } from "@/registry/syncrobotic/blocks/agent-trace"
import { AgentApproval } from "@/registry/syncrobotic/blocks/agent-approval"

// Blocks are composed sections. Each renders alone at /preview/<name> so the docs can frame it at any width.
type Meta = {
  viewport: "desktop" | "mobile"
  /** Width the overview thumbnail renders at. Charts are dashboard cards, so they render at a card's width, not a screen's. */
  thumbWidth?: number
  /** The region the /blocks card shows, when the default (a desktop screen's top-left 480 px; a section whole) is not the telling part. */
  thumb?: ThumbView
  /** Shown on /blocks for its type instead of the type's first block (when the first is a bare frame with nothing in it). */
  cover?: boolean
  /** Starting height. Sections then grow or shrink to their content; app shells fill this height like a screen. */
  height: number
  render: () => React.ReactNode
}

const meta: Record<string, Meta> = {
  // Charts: one card each, shown at a dashboard card's width.
  "line-chart-telemetry": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartTelemetry />
      </div>
    ),
  },
  "line-chart-limit": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartLimit />
      </div>
    ),
  },
  "line-chart-compare": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartCompare />
      </div>
    ),
  },
  "area-chart-battery": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartBattery />
      </div>
    ),
  },
  "area-chart-fleet-states": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartFleetStates />
      </div>
    ),
  },
  "area-chart-cumulative": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartCumulative />
      </div>
    ),
  },
  "bar-chart-missions": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartMissions />
      </div>
    ),
  },
  "bar-chart-ranked": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartRanked />
      </div>
    ),
  },
  "bar-chart-stacked": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartStacked />
      </div>
    ),
  },
  "bar-chart-variance": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartVariance />
      </div>
    ),
  },
  "sparkline-robot-list": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SparklineRobotList />
      </div>
    ),
  },
  "sparkline-metric-tiles": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SparklineMetricTiles />
      </div>
    ),
  },
  "sparkline-table": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SparklineTable />
      </div>
    ),
  },
  "status-tracker-uptime": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerUptime />
      </div>
    ),
  },
  "status-tracker-runs": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerRuns />
      </div>
    ),
  },
  "status-tracker-rollout": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerRollout />
      </div>
    ),
  },
  "radial-chart-battery": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartBattery />
      </div>
    ),
  },
  "radial-chart-goal": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartGoal />
      </div>
    ),
  },
  "radial-chart-capacity": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartCapacity />
      </div>
    ),
  },
  "heatmap-week-hours": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <HeatmapWeekHours />
      </div>
    ),
  },
  "heatmap-zones": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <HeatmapZones />
      </div>
    ),
  },
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
  // Keyboard review: a focused screen of its own, without the shell, so nothing competes with the item.
  "review-queue": { viewport: "desktop", thumbWidth: 960, height: 820, render: () => <ReviewQueue /> },
  "settings-page": { viewport: "desktop", height: 820, render: () => <SettingsPage /> },
  "record-form": { viewport: "desktop", height: 820, render: () => <RecordForm /> },
  "users-roles": { viewport: "desktop", height: 620, render: () => <UsersRoles /> },
  "sign-in": { viewport: "desktop", height: 640, thumb: { x: 400, y: 112, width: 480 }, render: () => <SignIn /> },
  "status-pages": {
    viewport: "desktop",
    height: 640,
    thumb: { x: 84, y: 72, width: 480 },
    render: () => (
      // Five states, each named above its frame: the loading one is a state on show, not the preview still loading.
      <div className="flex flex-col gap-4 bg-background p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              [NotFoundPage, "Not found"],
              [NoAccessPage, "No access"],
              [ErrorPage, "Error"],
              [OfflinePage, "Offline"],
            ] as const
          ).map(([Page, name]) => (
            <figure key={name} className="flex flex-col gap-2">
              <figcaption className="text-xs font-medium text-muted-foreground">{name}</figcaption>
              <div className="overflow-hidden rounded-md ring-1 ring-border">
                <Page fill="parent" />
              </div>
            </figure>
          ))}
        </div>
        <figure className="flex flex-col gap-2">
          <figcaption className="text-xs font-medium text-muted-foreground">Loading</figcaption>
          <div className="overflow-hidden rounded-md ring-1 ring-border">
            <LoadingPage fill="parent" />
          </div>
        </figure>
      </div>
    ),
  },
  "top-bar-shell": { viewport: "desktop", height: 720, render: () => <TopBarShellDemo /> },
  // The bare shells hold an empty page; this one holds frames and its next step, so it stands for the type on /blocks.
  "action-rail-shell": { viewport: "desktop", height: 720, cover: true, thumb: { x: 704, width: 576 }, render: () => <ActionRailShellDemo /> },
  "console-overview": { viewport: "desktop", height: 900, render: () => <ConsoleOverview /> },
  "list-detail": { viewport: "desktop", height: 720, render: () => <ListDetail /> },
  "event-log": { viewport: "desktop", height: 720, render: () => <EventLog /> },
  "map-workspace": { viewport: "desktop", height: 720, render: () => <MapWorkspace /> },

  "stats-cards": {
    viewport: "desktop",
    height: 520,
    thumb: { x: 8, y: -36, width: 400 },
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
  "marketing-hero": { viewport: "desktop", height: 760, thumb: { x: 56, y: 104, width: 600 }, render: () => <MarketingHero /> },
  // Solutions, batch 4: whole screens in the app shell.
  "mission-schedule": { viewport: "desktop", height: 720, render: () => <MissionSchedule /> },
  "users-invitations": { viewport: "desktop", height: 680, render: () => <UsersInvitations /> },
  "users-audit-log": { viewport: "desktop", height: 680, render: () => <UsersAuditLog /> },
  "incident-queue": { viewport: "desktop", height: 620, render: () => <IncidentQueue /> },
  "incident-detail": { viewport: "desktop", height: 900, render: () => <IncidentDetail /> },
  "maintenance-due": { viewport: "desktop", height: 600, render: () => <MaintenanceDue /> },
  "maintenance-work-order": { viewport: "desktop", height: 1000, render: () => <MaintenanceWorkOrder /> },
  "rollout-overview": { viewport: "desktop", height: 900, render: () => <RolloutOverview /> },
  "rollout-plan": { viewport: "desktop", height: 960, render: () => <RolloutPlan /> },
  "agent-runs": { viewport: "desktop", height: 620, render: () => <AgentRuns /> },
  "agent-trace": { viewport: "desktop", height: 820, render: () => <AgentTrace /> },
  "agent-approval": { viewport: "desktop", height: 880, render: () => <AgentApproval /> },
  // Application, batch 3. Dialogs and sheets open on load in the preview without taking the page's focus.
  "app-shell-mobile-tabs": { viewport: "mobile", height: 720, render: () => <AppShellMobileTabs /> },
  "stats-meters": {
    viewport: "desktop",
    height: 320,
    render: () => (
      <div className="p-6">
        <StatsMeters />
      </div>
    ),
  },
  "stats-filtered": {
    viewport: "desktop",
    height: 360,
    render: () => (
      <div className="p-6">
        <StatsFiltered />
      </div>
    ),
  },
  "card-site": {
    viewport: "desktop",
    height: 400,
    render: () => (
      <div className="p-6">
        <CardSite />
      </div>
    ),
  },
  "card-mission": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-4xl p-6">
        <CardMission />
      </div>
    ),
  },
  "auth-passkey": { viewport: "desktop", height: 640, render: () => <AuthPasskey /> },
  "auth-invite": { viewport: "desktop", height: 760, render: () => <AuthInvite /> },
  "auth-2fa": { viewport: "desktop", height: 720, render: () => <AuthTwoFactor /> },
  "settings-notifications": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 640,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsNotifications />
      </div>
    ),
  },
  "settings-api-keys": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 480,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsApiKeys />
      </div>
    ),
  },
  "settings-billing": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 1200,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsBilling />
      </div>
    ),
  },
  // The bell in a real top bar, its popover open on load so the card shows the list, not a closed bell.
  "notification-center": { viewport: "desktop", height: 720, thumb: { x: 760, y: 0, width: 520 }, render: () => <NotificationCenterDemo /> },
  "settings-webhooks": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 960,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsWebhooks />
      </div>
    ),
  },
  "settings-sessions": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 720,
    render: () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsSessions />
      </div>
    ),
  },
  "dialog-confirm-destructive": {
    viewport: "desktop",
    thumbWidth: 960,
    height: 640,
    render: () => <DialogConfirmDestructive defaultOpen focusOnOpen={false} />,
  },
  "dialog-form": { viewport: "desktop", thumbWidth: 960, height: 600, render: () => <DialogForm defaultOpen focusOnOpen={false} /> },
  "dialog-share": { viewport: "desktop", thumbWidth: 960, height: 680, render: () => <DialogShare defaultOpen focusOnOpen={false} /> },
  "sheet-robot-detail": { viewport: "desktop", thumbWidth: 960, height: 760, render: () => <SheetRobotDetail defaultOpen focusOnOpen={false} /> },
  "sheet-filters": { viewport: "mobile", height: 760, render: () => <SheetFilters defaultOpen focusOnOpen={false} /> },
  "timeline-activity": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 560,
    render: () => (
      <div className="p-6">
        <TimelineActivity className="mx-auto" />
      </div>
    ),
  },
  "timeline-audit": {
    viewport: "desktop",
    thumbWidth: 720,
    height: 520,
    render: () => (
      <div className="p-6">
        <TimelineAudit className="mx-auto" />
      </div>
    ),
  },
  "wizard-commission": { viewport: "desktop", height: 520, thumb: { x: 296, width: 560 }, render: () => <WizardCommission /> },
  "wizard-import": { viewport: "desktop", thumbWidth: 960, height: 760, render: () => <WizardImport /> },
}

// Screens in the app shell: their /blocks card skips the sidebar (the same on every one) for the page's title and first panel.
const shellView: ThumbView = { x: 248, width: 480 }
const inShell = new Set([
  "agent-approval",
  "agent-runs",
  "agent-trace",
  "console-overview",
  "data-catalog",
  "dataset-detail",
  "event-log",
  "governance-todo",
  "incident-detail",
  "incident-queue",
  "list-detail",
  "maintenance-due",
  "maintenance-work-order",
  "map-workspace",
  "mission-schedule",
  "record-form",
  "rollout-overview",
  "rollout-plan",
  "settings-page",
  "users-audit-log",
  "users-invitations",
  "users-roles",
])

export const blocks = Object.keys(placement)
  .map((name) => registry.items.find((i) => i.type === "registry:block" && i.name === name))
  .filter((i): i is NonNullable<typeof i> => !!i && i.name in meta)
  .map((i) => ({ ...i, thumb: inShell.has(i.name) ? shellView : undefined, ...meta[i.name], ...placement[i.name] }))

export const getBlock = (name: string) => blocks.find((b) => b.name === name)
export const blocksOfType = (slug: string) => blocks.filter((b) => b.type === slug)
