"use client"

import dynamic from "next/dynamic"

// One chunk per block: a preview loads only its own block, not all of them (and recharts). The server renders it, and
// hydration keeps that HTML until the chunk arrives, so the framed height never flashes.
const AppShellDemo = dynamic(() => import("./app-shell-demo").then((m) => m.AppShellDemo))
const TopBarShellDemo = dynamic(() => import("./top-bar-shell-demo").then((m) => m.TopBarShellDemo))
const ActionRailShellDemo = dynamic(() => import("./action-rail-shell-demo").then((m) => m.ActionRailShellDemo))
const SignIn = dynamic(() => import("@/registry/syncrobotic/blocks/sign-in").then((m) => m.SignIn))
const RecordForm = dynamic(() => import("@/registry/syncrobotic/blocks/record-form").then((m) => m.RecordForm))
const SettingsPage = dynamic(() => import("@/registry/syncrobotic/blocks/settings-page").then((m) => m.SettingsPage))
const UsersRoles = dynamic(() => import("@/registry/syncrobotic/blocks/users-roles").then((m) => m.UsersRoles))
const DataCatalog = dynamic(() => import("@/registry/syncrobotic/blocks/data-catalog").then((m) => m.DataCatalog))
const DatasetDetail = dynamic(() => import("@/registry/syncrobotic/blocks/dataset-detail").then((m) => m.DatasetDetail))
const GovernanceTodo = dynamic(() => import("@/registry/syncrobotic/blocks/governance-todo").then((m) => m.GovernanceTodo))
const ReviewQueue = dynamic(() => import("@/registry/syncrobotic/blocks/review-queue").then((m) => m.ReviewQueue))
const ConsoleOverview = dynamic(() => import("@/registry/syncrobotic/blocks/console-overview").then((m) => m.ConsoleOverview))
const EventLog = dynamic(() => import("@/registry/syncrobotic/blocks/event-log").then((m) => m.EventLog))
const ListDetail = dynamic(() => import("@/registry/syncrobotic/blocks/list-detail").then((m) => m.ListDetail))
const MapWorkspace = dynamic(() => import("@/registry/syncrobotic/blocks/map-workspace").then((m) => m.MapWorkspace))
const FleetTable = dynamic(() => import("@/registry/syncrobotic/blocks/fleet-table").then((m) => m.FleetTable))
const MarketingHero = dynamic(() => import("@/registry/syncrobotic/blocks/marketing-hero").then((m) => m.MarketingHero))
const RobotStatusCard = dynamic(() => import("@/registry/syncrobotic/blocks/robot-status-card").then((m) => m.RobotStatusCard))
const StatsCards = dynamic(() => import("@/registry/syncrobotic/blocks/stats-cards").then((m) => m.StatsCards))
const LineChartTelemetry = dynamic(() => import("@/registry/syncrobotic/blocks/line-chart-telemetry").then((m) => m.LineChartTelemetry))
const LineChartLimit = dynamic(() => import("@/registry/syncrobotic/blocks/line-chart-limit").then((m) => m.LineChartLimit))
const HistogramBattery = dynamic(() => import("@/registry/syncrobotic/blocks/histogram-battery").then((m) => m.HistogramBattery))
const LineChartCompare = dynamic(() => import("@/registry/syncrobotic/blocks/line-chart-compare").then((m) => m.LineChartCompare))
const AreaChartBattery = dynamic(() => import("@/registry/syncrobotic/blocks/area-chart-battery").then((m) => m.AreaChartBattery))
const AreaChartFleetStates = dynamic(() => import("@/registry/syncrobotic/blocks/area-chart-fleet-states").then((m) => m.AreaChartFleetStates))
const AreaChartCumulative = dynamic(() => import("@/registry/syncrobotic/blocks/area-chart-cumulative").then((m) => m.AreaChartCumulative))
const BarChartMissions = dynamic(() => import("@/registry/syncrobotic/blocks/bar-chart-missions").then((m) => m.BarChartMissions))
const BarChartRanked = dynamic(() => import("@/registry/syncrobotic/blocks/bar-chart-ranked").then((m) => m.BarChartRanked))
const BarChartStacked = dynamic(() => import("@/registry/syncrobotic/blocks/bar-chart-stacked").then((m) => m.BarChartStacked))
const BarChartVariance = dynamic(() => import("@/registry/syncrobotic/blocks/bar-chart-variance").then((m) => m.BarChartVariance))
const SparklineRobotList = dynamic(() => import("@/registry/syncrobotic/blocks/sparkline-robot-list").then((m) => m.SparklineRobotList))
const SparklineTable = dynamic(() => import("@/registry/syncrobotic/blocks/sparkline-table").then((m) => m.SparklineTable))
const StatusTrackerUptime = dynamic(() => import("@/registry/syncrobotic/blocks/status-tracker-uptime").then((m) => m.StatusTrackerUptime))
const StatusTrackerRuns = dynamic(() => import("@/registry/syncrobotic/blocks/status-tracker-runs").then((m) => m.StatusTrackerRuns))
const StatusTrackerRollout = dynamic(() => import("@/registry/syncrobotic/blocks/status-tracker-rollout").then((m) => m.StatusTrackerRollout))
const RadialChartBattery = dynamic(() => import("@/registry/syncrobotic/blocks/radial-chart-battery").then((m) => m.RadialChartBattery))
const RadialChartGoal = dynamic(() => import("@/registry/syncrobotic/blocks/radial-chart-goal").then((m) => m.RadialChartGoal))
const RadialChartCapacity = dynamic(() => import("@/registry/syncrobotic/blocks/radial-chart-capacity").then((m) => m.RadialChartCapacity))
const HeatmapWeekHours = dynamic(() => import("@/registry/syncrobotic/blocks/heatmap-week-hours").then((m) => m.HeatmapWeekHours))
const HeatmapZones = dynamic(() => import("@/registry/syncrobotic/blocks/heatmap-zones").then((m) => m.HeatmapZones))
const AppShellMobileTabs = dynamic(() => import("@/registry/syncrobotic/blocks/app-shell-mobile-tabs").then((m) => m.AppShellMobileTabs))
const AppShellControl = dynamic(() => import("@/registry/syncrobotic/blocks/app-shell-control").then((m) => m.AppShellControl))
const StatsMeters = dynamic(() => import("@/registry/syncrobotic/blocks/stats-meters").then((m) => m.StatsMeters))
const StatsFiltered = dynamic(() => import("@/registry/syncrobotic/blocks/stats-filtered").then((m) => m.StatsFiltered))
const CardSite = dynamic(() => import("@/registry/syncrobotic/blocks/card-site").then((m) => m.CardSite))
const CardMission = dynamic(() => import("@/registry/syncrobotic/blocks/card-mission").then((m) => m.CardMission))
const AuthPasskey = dynamic(() => import("@/registry/syncrobotic/blocks/auth-passkey").then((m) => m.AuthPasskey))
const AuthInvite = dynamic(() => import("@/registry/syncrobotic/blocks/auth-invite").then((m) => m.AuthInvite))
const AuthTwoFactor = dynamic(() => import("@/registry/syncrobotic/blocks/auth-2fa").then((m) => m.AuthTwoFactor))
const SettingsNotifications = dynamic(() => import("@/registry/syncrobotic/blocks/settings-notifications").then((m) => m.SettingsNotifications))
const SettingsApiKeys = dynamic(() => import("@/registry/syncrobotic/blocks/settings-api-keys").then((m) => m.SettingsApiKeys))
const SettingsBilling = dynamic(() => import("@/registry/syncrobotic/blocks/settings-billing").then((m) => m.SettingsBilling))
const NotificationCenterDemo = dynamic(() => import("./notification-center-demo").then((m) => m.NotificationCenterDemo))
const SettingsWebhooks = dynamic(() => import("@/registry/syncrobotic/blocks/settings-webhooks").then((m) => m.SettingsWebhooks))
const SettingsSessions = dynamic(() => import("@/registry/syncrobotic/blocks/settings-sessions").then((m) => m.SettingsSessions))
const DialogConfirmDestructive = dynamic(() => import("@/registry/syncrobotic/blocks/dialog-confirm-destructive").then((m) => m.DialogConfirmDestructive))
const DialogForm = dynamic(() => import("@/registry/syncrobotic/blocks/dialog-form").then((m) => m.DialogForm))
const DialogShare = dynamic(() => import("@/registry/syncrobotic/blocks/dialog-share").then((m) => m.DialogShare))
const SheetRobotDetail = dynamic(() => import("@/registry/syncrobotic/blocks/sheet-robot-detail").then((m) => m.SheetRobotDetail))
const SheetFilters = dynamic(() => import("@/registry/syncrobotic/blocks/sheet-filters").then((m) => m.SheetFilters))
const TimelineActivity = dynamic(() => import("@/registry/syncrobotic/blocks/timeline-activity").then((m) => m.TimelineActivity))
const TimelineAudit = dynamic(() => import("@/registry/syncrobotic/blocks/timeline-audit").then((m) => m.TimelineAudit))
const WizardCommission = dynamic(() => import("@/registry/syncrobotic/blocks/wizard-commission").then((m) => m.WizardCommission))
const WizardImport = dynamic(() => import("@/registry/syncrobotic/blocks/wizard-import").then((m) => m.WizardImport))
const MissionSchedule = dynamic(() => import("@/registry/syncrobotic/blocks/mission-schedule").then((m) => m.MissionSchedule))
const UsersInvitations = dynamic(() => import("@/registry/syncrobotic/blocks/users-invitations").then((m) => m.UsersInvitations))
const UsersAuditLog = dynamic(() => import("@/registry/syncrobotic/blocks/users-audit-log").then((m) => m.UsersAuditLog))
const DeviceEnrolment = dynamic(() => import("@/registry/syncrobotic/blocks/device-enrolment").then((m) => m.DeviceEnrolment))
const DeviceDetail = dynamic(() => import("@/registry/syncrobotic/blocks/device-detail").then((m) => m.DeviceDetail))
const OfflineLicence = dynamic(() => import("@/registry/syncrobotic/blocks/offline-licence").then((m) => m.OfflineLicence))
const ProjectMembers = dynamic(() => import("@/registry/syncrobotic/blocks/project-members").then((m) => m.ProjectMembers))
const PermissionMatrix = dynamic(() => import("@/registry/syncrobotic/blocks/permission-matrix").then((m) => m.PermissionMatrix))
const WebhookDeliveries = dynamic(() => import("@/registry/syncrobotic/blocks/webhook-deliveries").then((m) => m.WebhookDeliveries))
const TenantAdmin = dynamic(() => import("@/registry/syncrobotic/blocks/tenant-admin").then((m) => m.TenantAdmin))
const PlatformHealth = dynamic(() => import("@/registry/syncrobotic/blocks/platform-health").then((m) => m.PlatformHealth))
const IncidentQueue = dynamic(() => import("@/registry/syncrobotic/blocks/incident-queue").then((m) => m.IncidentQueue))
const IncidentDetail = dynamic(() => import("@/registry/syncrobotic/blocks/incident-detail").then((m) => m.IncidentDetail))
const MaintenanceDue = dynamic(() => import("@/registry/syncrobotic/blocks/maintenance-due").then((m) => m.MaintenanceDue))
const MaintenanceWorkOrder = dynamic(() => import("@/registry/syncrobotic/blocks/maintenance-work-order").then((m) => m.MaintenanceWorkOrder))
const RolloutOverview = dynamic(() => import("@/registry/syncrobotic/blocks/rollout-overview").then((m) => m.RolloutOverview))
const RolloutPlan = dynamic(() => import("@/registry/syncrobotic/blocks/rollout-plan").then((m) => m.RolloutPlan))
const AgentRuns = dynamic(() => import("@/registry/syncrobotic/blocks/agent-runs").then((m) => m.AgentRuns))
const AgentTrace = dynamic(() => import("@/registry/syncrobotic/blocks/agent-trace").then((m) => m.AgentTrace))
const AgentApproval = dynamic(() => import("@/registry/syncrobotic/blocks/agent-approval").then((m) => m.AgentApproval))
const AgentChatDemo = dynamic(() => import("./agent-chat-demo").then((m) => m.AgentChatDemo))
const AgentRunGate = dynamic(() => import("@/registry/syncrobotic/blocks/agent-run-gate").then((m) => m.AgentRunGate))
const AgentRunOutcome = dynamic(() => import("@/registry/syncrobotic/blocks/agent-run-outcome").then((m) => m.AgentRunOutcome))
const AgentToolPermissions = dynamic(() => import("@/registry/syncrobotic/blocks/agent-tool-permissions").then((m) => m.AgentToolPermissions))
const ErrorPage = dynamic(() => import("@/registry/syncrobotic/blocks/status-pages").then((m) => m.ErrorPage))
const LoadingPage = dynamic(() => import("@/registry/syncrobotic/blocks/status-pages").then((m) => m.LoadingPage))
const NoAccessPage = dynamic(() => import("@/registry/syncrobotic/blocks/status-pages").then((m) => m.NoAccessPage))
const NotFoundPage = dynamic(() => import("@/registry/syncrobotic/blocks/status-pages").then((m) => m.NotFoundPage))
const OfflinePage = dynamic(() => import("@/registry/syncrobotic/blocks/status-pages").then((m) => m.OfflinePage))

/** Each block's preview; tests/unit/block-previews.test.ts checks every block has one. */
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
              ["Not found", <NotFoundPage key="p" fill="parent" />],
              ["No access", <NoAccessPage key="p" fill="parent" permission="audit-logs:read" />],
              ["Error", <ErrorPage key="p" fill="parent" reference="a7f3-22c1" />],
              ["Offline", <OfflinePage key="p" fill="parent" />],
            ] as const
          ).map(([name, page]) => (
            <figure key={name} className="flex flex-col gap-2">
              <figcaption className="text-xs font-medium text-muted-foreground">{name}</figcaption>
              <div className="overflow-hidden rounded-md ring-1 ring-border">{page}</div>
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
  "device-enrolment": () => <DeviceEnrolment />,
  "device-detail": () => <DeviceDetail />,
  "offline-licence": () => <OfflineLicence />,
  "project-members": () => <ProjectMembers />,
  "permission-matrix": () => <PermissionMatrix />,
  "webhook-deliveries": () => <WebhookDeliveries />,
  "tenant-admin": () => <TenantAdmin />,
  "platform-health": () => <PlatformHealth />,
  "incident-queue": () => <IncidentQueue />,
  "incident-detail": () => <IncidentDetail />,
  "maintenance-due": () => <MaintenanceDue />,
  "maintenance-work-order": () => <MaintenanceWorkOrder />,
  "rollout-overview": () => <RolloutOverview />,
  "rollout-plan": () => <RolloutPlan />,
  "agent-runs": () => <AgentRuns />,
  "agent-trace": () => <AgentTrace />,
  "agent-approval": () => <AgentApproval />,
  "agent-chat": () => <AgentChatDemo />,
  "agent-run-gate": () => <AgentRunGate />,
  "agent-run-outcome": () => <AgentRunOutcome />,
  "agent-tool-permissions": () => <AgentToolPermissions />,
  "app-shell-mobile-tabs": () => <AppShellMobileTabs />,
  "app-shell-control": () => <AppShellControl />,
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
  "sheet-filters": () => <SheetFilters defaultOpen focusOnOpen={false} />,
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

/** One block's preview, for /preview/<name>. */
export function BlockPreview({ name }: { name: string }) {
  return blockRenders[name]()
}
