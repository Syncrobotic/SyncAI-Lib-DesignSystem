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
import { HistogramBattery } from "@/registry/syncrobotic/blocks/histogram-battery"
import { LineChartCompare } from "@/registry/syncrobotic/blocks/line-chart-compare"
import { AreaChartBattery } from "@/registry/syncrobotic/blocks/area-chart-battery"
import { AreaChartFleetStates } from "@/registry/syncrobotic/blocks/area-chart-fleet-states"
import { AreaChartCumulative } from "@/registry/syncrobotic/blocks/area-chart-cumulative"
import { BarChartMissions } from "@/registry/syncrobotic/blocks/bar-chart-missions"
import { BarChartRanked } from "@/registry/syncrobotic/blocks/bar-chart-ranked"
import { BarChartStacked } from "@/registry/syncrobotic/blocks/bar-chart-stacked"
import { BarChartVariance } from "@/registry/syncrobotic/blocks/bar-chart-variance"
import { SparklineRobotList } from "@/registry/syncrobotic/blocks/sparkline-robot-list"
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
import { blocks } from "./blocks"

/** Each block's preview, for /preview/<name> only: importing this file loads every block. */
export const blockRenders: Record<string, () => React.ReactNode> = {
  "line-chart-telemetry": () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartTelemetry />
      </div>
    ),
  "histogram-battery": () => (
      <div className="mx-auto max-w-3xl p-6">
        <HistogramBattery />
      </div>
    ),
  "line-chart-limit": () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartLimit />
      </div>
    ),
  "line-chart-compare": () => (
      <div className="mx-auto max-w-3xl p-6">
        <LineChartCompare />
      </div>
    ),
  "area-chart-battery": () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartBattery />
      </div>
    ),
  "area-chart-fleet-states": () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartFleetStates />
      </div>
    ),
  "area-chart-cumulative": () => (
      <div className="mx-auto max-w-3xl p-6">
        <AreaChartCumulative />
      </div>
    ),
  "bar-chart-missions": () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartMissions />
      </div>
    ),
  "bar-chart-ranked": () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartRanked />
      </div>
    ),
  "bar-chart-stacked": () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartStacked />
      </div>
    ),
  "bar-chart-variance": () => (
      <div className="mx-auto max-w-3xl p-6">
        <BarChartVariance />
      </div>
    ),
  "sparkline-robot-list": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SparklineRobotList />
      </div>
    ),
  "sparkline-table": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SparklineTable />
      </div>
    ),
  "status-tracker-uptime": () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerUptime />
      </div>
    ),
  "status-tracker-runs": () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerRuns />
      </div>
    ),
  "status-tracker-rollout": () => (
      <div className="mx-auto max-w-3xl p-6">
        <StatusTrackerRollout />
      </div>
    ),
  "radial-chart-battery": () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartBattery />
      </div>
    ),
  "radial-chart-goal": () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartGoal />
      </div>
    ),
  "radial-chart-capacity": () => (
      <div className="mx-auto max-w-3xl p-6">
        <RadialChartCapacity />
      </div>
    ),
  "heatmap-week-hours": () => (
      <div className="mx-auto max-w-3xl p-6">
        <HeatmapWeekHours />
      </div>
    ),
  "heatmap-zones": () => (
      <div className="mx-auto max-w-3xl p-6">
        <HeatmapZones />
      </div>
    ),
  "app-shell": () => <AppShellDemo />,
  "data-catalog": () => <DataCatalog />,
  "dataset-detail": () => <DatasetDetail />,
  "governance-todo": () => <GovernanceTodo />,
  "review-queue": () => <ReviewQueue />,
  "settings-page": () => <SettingsPage />,
  "record-form": () => <RecordForm />,
  "users-roles": () => <UsersRoles />,
  "sign-in": () => <SignIn />,
  "status-pages": () => (
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
  "top-bar-shell": () => <TopBarShellDemo />,
  "action-rail-shell": () => <ActionRailShellDemo />,
  "console-overview": () => <ConsoleOverview />,
  "list-detail": () => <ListDetail />,
  "event-log": () => <EventLog />,
  "map-workspace": () => <MapWorkspace />,
  "stats-cards": () => (
      <div className="p-6">
        <StatsCards />
      </div>
    ),
  "fleet-table": () => (
      <div className="p-6">
        <FleetTable />
      </div>
    ),
  "robot-status-card": () => (
      <div className="flex justify-center p-4">
        <RobotStatusCard />
      </div>
    ),
  "marketing-hero": () => <MarketingHero />,
  "mission-schedule": () => <MissionSchedule />,
  "users-invitations": () => <UsersInvitations />,
  "users-audit-log": () => <UsersAuditLog />,
  "incident-queue": () => <IncidentQueue />,
  "incident-detail": () => <IncidentDetail />,
  "maintenance-due": () => <MaintenanceDue />,
  "maintenance-work-order": () => <MaintenanceWorkOrder />,
  "rollout-overview": () => <RolloutOverview />,
  "rollout-plan": () => <RolloutPlan />,
  "agent-runs": () => <AgentRuns />,
  "agent-trace": () => <AgentTrace />,
  "agent-approval": () => <AgentApproval />,
  "app-shell-mobile-tabs": () => <AppShellMobileTabs />,
  "stats-meters": () => (
      <div className="p-6">
        <StatsMeters />
      </div>
    ),
  "stats-filtered": () => (
      <div className="p-6">
        <StatsFiltered />
      </div>
    ),
  "card-site": () => (
      <div className="p-6">
        <CardSite />
      </div>
    ),
  "card-mission": () => (
      <div className="mx-auto max-w-4xl p-6">
        <CardMission />
      </div>
    ),
  "auth-passkey": () => <AuthPasskey />,
  "auth-invite": () => <AuthInvite />,
  "auth-2fa": () => <AuthTwoFactor />,
  "settings-notifications": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsNotifications />
      </div>
    ),
  "settings-api-keys": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsApiKeys />
      </div>
    ),
  "settings-billing": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsBilling />
      </div>
    ),
  "notification-center": () => <NotificationCenterDemo />,
  "settings-webhooks": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsWebhooks />
      </div>
    ),
  "settings-sessions": () => (
      <div className="mx-auto max-w-3xl p-6">
        <SettingsSessions />
      </div>
    ),
  "dialog-confirm-destructive": () => <DialogConfirmDestructive defaultOpen focusOnOpen={false} />,
  "dialog-form": () => <DialogForm defaultOpen focusOnOpen={false} />,
  "dialog-share": () => <DialogShare defaultOpen focusOnOpen={false} />,
  "sheet-robot-detail": () => <SheetRobotDetail defaultOpen focusOnOpen={false} />,
  // Closed: an open sheet would take the focus from the docs page around the preview (FacetsDrawer has no way to keep it).
  "sheet-filters": () => <SheetFilters />,
  "timeline-activity": () => (
      <div className="p-6">
        <TimelineActivity className="mx-auto" />
      </div>
    ),
  "timeline-audit": () => (
      <div className="p-6">
        <TimelineAudit className="mx-auto" />
      </div>
    ),
  "wizard-commission": () => <WizardCommission />,
  "wizard-import": () => <WizardImport />,
}

for (const b of blocks) if (!(b.name in blockRenders)) throw new Error(`Block ${b.name} has no preview in site/block-renders.tsx`)
